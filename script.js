class TodoApp {
    constructor() {
        this.todos = [];
        this.notes = [];
        this.currentFilter = 'all';
        this.showDeleted = false;
        this.currentView = 'todo';
        this.selectedTodoForFocus = null;
        this.clickTimeouts = {};
        this.timer = {
            minutes: 25,
            seconds: 0,
            isRunning: false,
            interval: null
        };
        this.pomodoro = {
            minutes: 25,
            seconds: 0,
            isRunning: false,
            interval: null
        };
        this.init();
    }

    init() {
        this.loadTodos();
        this.loadNotes();
        this.bindEvents();
        this.bindDragAndDropEvents();
        this.setDefaultDate();
        this.loadTheme();
        this.renderTodos();
        this.updateStats();
        // Initialize default view
        this.switchView('todo');
    }

    bindEvents() {
        // Hamburger menu
        const hamburgerBtn = document.getElementById('hamburgerBtn');
        const sidebar = document.getElementById('sidebar');
        const sidebarOverlay = document.getElementById('sidebarOverlay');
        const closeSidebar = document.getElementById('closeSidebar');

        hamburgerBtn.addEventListener('click', () => {
            sidebar.classList.add('open');
            sidebarOverlay.classList.add('active');
            hamburgerBtn.classList.add('active');
        });

        const closeSidebarFunc = () => {
            sidebar.classList.remove('open');
            sidebarOverlay.classList.remove('active');
            hamburgerBtn.classList.remove('active');
        };

        // Tornar a função acessível globalmente na instância
        this.closeSidebarFunc = closeSidebarFunc;

        closeSidebar.addEventListener('click', closeSidebarFunc);
        sidebarOverlay.addEventListener('click', closeSidebarFunc);

        // Add todo
        document.getElementById('addBtn').addEventListener('click', () => this.addTodo());
        document.getElementById('todoInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTodo();
        });

        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.setFilter(e.target.dataset.filter));
        });
        
        // Settings modal
        // document.getElementById('settingsBtn').addEventListener('click', () => this.openSettings());
        document.getElementById('closeSettings').addEventListener('click', () => this.closeSettings());
        document.getElementById('settingsModal').addEventListener('click', (e) => {
            if (e.target.id === 'settingsModal') this.closeSettings();
        });
        
        // Theme toggle
        document.getElementById('themeToggle').addEventListener('change', (e) => this.toggleTheme(e.target.checked));
        
        // Show deleted toggle
        document.getElementById('showDeleted').addEventListener('change', (e) => this.toggleShowDeleted(e.target.checked));

        // Navigation events
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const view = e.target.closest('.nav-btn').dataset.view;
                this.switchView(view);
                this.closeSidebarFunc(); // Fechar sidebar ao navegar
            });
        });

        // Notes events
        document.getElementById('addNoteBtn')?.addEventListener('click', () => this.addNote());
        document.getElementById('noteTitle')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addNote();
        });
        document.getElementById('exportNotesBtn')?.addEventListener('click', () => this.exportNotes());

        // Export todos button
        const exportTodosBtn = document.getElementById('exportTodosBtn');
        if (exportTodosBtn) {
            exportTodosBtn.addEventListener('click', () => {
                this.exportTodos();
            });
        }

        // Timer events
        document.getElementById('startTimerBtn')?.addEventListener('click', () => this.startTimer());
        document.getElementById('pauseTimerBtn')?.addEventListener('click', () => this.pauseTimer());
        document.getElementById('resetTimerBtn')?.addEventListener('click', () => this.resetTimer());

        // Pomodoro events
        document.getElementById('startPomodoroBtn')?.addEventListener('click', () => this.startPomodoro());
        document.getElementById('pausePomodoroBtn')?.addEventListener('click', () => this.pausePomodoro());
        document.getElementById('resetPomodoroBtn')?.addEventListener('click', () => this.resetPomodoro());

        // Event Delegation for Todos
        const todosContainer = document.getElementById('todosContainer');
        if (todosContainer) {
            todosContainer.addEventListener('click', this.handleTodoActions.bind(this));
            todosContainer.addEventListener('keydown', this.handleTodoActions.bind(this));
            todosContainer.addEventListener('blur', this.handleTodoActions.bind(this), true);
        }

        // Event Delegation for Notes - handled by bindNoteEvents method
    }

    bindDragAndDropEvents() {
        const todosContainer = document.getElementById('todosContainer');
        if (!todosContainer) return;

        let draggedElement = null;

        todosContainer.addEventListener('dragstart', (e) => {
            // Only allow dragging from the handle
            // The event target is now the handle itself, which has draggable="true"
            if (e.target && e.target.classList.contains('drag-handle')) {
                draggedElement = e.target.closest('.todo-item');
                // Use a timeout to allow the browser to create the drag image
                setTimeout(() => {
                    if (draggedElement) {
                        draggedElement.classList.add('dragging');
                    }
                }, 0);
            }
        });

        todosContainer.addEventListener('dragend', () => {
            if (draggedElement) {
                draggedElement.classList.remove('dragging');
                draggedElement = null;
                document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
            }
        });

        todosContainer.addEventListener('dragover', (e) => {
            e.preventDefault();
            const afterElement = this.getDragAfterElement(todosContainer, e.clientY);
            document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
            if (afterElement) {
                afterElement.classList.add('drag-over');
            }
        });

        todosContainer.addEventListener('drop', (e) => {
            e.preventDefault();
            const afterElement = document.querySelector('.drag-over');
            if (draggedElement) {
                const draggedId = draggedElement.dataset.id;
                const targetId = afterElement ? afterElement.dataset.id : null;
                this.reorderTodos(draggedId, targetId);
                draggedElement.classList.remove('dragging');
                draggedElement = null;
                document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
            }
        });
    }

    getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.todo-item:not(.dragging)')];

        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;

            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    reorderTodos(draggedId, targetId) {
        const draggedIndex = this.todos.findIndex(t => t.id === draggedId);
        if (draggedIndex === -1) return;

        // Remove the dragged todo from its original position
        const [draggedTodo] = this.todos.splice(draggedIndex, 1);

        if (targetId === null) {
            // Dropped at the end of the list
            this.todos.push(draggedTodo);
        } else {
            // Dropped before a target element
            const targetIndex = this.todos.findIndex(t => t.id === targetId);
            if (targetIndex !== -1) {
                this.todos.splice(targetIndex, 0, draggedTodo);
            } else {
                // Fallback: if target not found, add to end
                this.todos.push(draggedTodo);
            }
        }

        this.saveTodos();
        this.renderTodos();
    }

    handleTodoActions(e) {
        const target = e.target;
        const todoItem = target.closest('.todo-item');
        if (!todoItem) return;

        const todoId = todoItem.dataset.id;

        // Handle clicks
        if (e.type === 'click') {
            if (target.classList.contains('todo-checkbox')) {
                this.toggleTodo(todoId);
            } else if (target.classList.contains('delete-btn')) {
                this.deleteTodo(todoId);
            } else if (target.classList.contains('restore-btn')) {
                this.restoreTodo(todoId);
            } else if (target.classList.contains('todo-text')) {
                const textElementId = target.dataset.id;
                if (this.clickTimeouts[textElementId]) {
                    clearTimeout(this.clickTimeouts[textElementId]);
                    delete this.clickTimeouts[textElementId];
                    this.goToFocusModeWithTodo(textElementId);
                } else {
                    this.clickTimeouts[textElementId] = setTimeout(() => {
                        this.startEditTodo(textElementId);
                        delete this.clickTimeouts[textElementId];
                    }, 300);
                }
            }
        }

        // Handle input events
        if (target.classList.contains('todo-edit-input')) {
            const inputId = target.dataset.id;
            if (e.type === 'keydown') {
                if (e.key === 'Enter') {
                    this.finishEditTodo(inputId, target.value);
                } else if (e.key === 'Escape') {
                    this.cancelEditTodo(inputId);
                }
            } else if (e.type === 'blur') {
                this.finishEditTodo(inputId, target.value);
            }
        }
    }

    _getLocalISODate(date = new Date()) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    setDefaultDate() {
        const today = this._getLocalISODate();
        const dateInput = document.getElementById('todoDate');
        if (dateInput) {
            dateInput.value = today;
        }
        // Definir filtro padrão como 'today' e mostrar tarefas do dia
        // this.setFilter('today'); // Comentado para permitir ver todas as tarefas
    }

    addTodo() {
        const input = document.getElementById('todoInput');
        const categoryInput = document.getElementById('todoCategory');
        const dateInput = document.getElementById('todoDate');
        const text = input.value.trim();
        const category = categoryInput.value.trim();
        const date = dateInput.value;

        if (!text) {
            input.focus();
            return;
        }

        const todo = {
            id: Date.now().toString(),
            text: text,
            date: date || this._getLocalISODate(),
            completed: false,
            createdAt: new Date().toISOString(),
            category: category || null
        };

        this.todos.unshift(todo);
        this.saveTodos();
        this.renderTodos();
        this.updateStats();

        input.value = '';
        categoryInput.value = '';
        input.focus();
    }

    toggleTodo(id) {
        const todo = this.todos.find(t => t.id === id);
        if (todo) {
            todo.completed = !todo.completed;
            this.saveTodos();
            this.renderTodos();
            this.updateStats();
            
            // Update focus and photo views if active
            if (this.currentView === 'focus') {
                this.renderFocusTodos(); // This will automatically update the progress bar
            } else if (this.currentView === 'photo') {
                this.renderPhotoTodos();
            }
        }
    }

    deleteTodo(id) {
        const todo = this.todos.find(todo => todo.id === id);
        if (todo) {
            todo.deleted = true;
            todo.deletedAt = new Date().toISOString();
            this.saveTodos();
            this.renderTodos();
            this.updateStats();
        }
    }
    
    restoreTodo(id) {
        const todo = this.todos.find(todo => todo.id === id.toString());
        if (todo && todo.deleted) {
            todo.deleted = false;
            delete todo.deletedAt;
            this.saveTodos();
            this.renderTodos();
            this.updateStats();
        }
    }
    
    toggleShowDeleted(show) {
        this.showDeleted = show;
        this.renderTodos();
        this.updateStats();
    }

    // Navigation methods
    switchView(view) {
        // Hide all views
        document.querySelectorAll('.view').forEach(v => v.style.display = 'none');
        
        // Remove active class from all nav buttons
        document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
        
        // Show selected view
        const viewElement = document.getElementById(`${view}View`);
        if (viewElement) {
            viewElement.style.display = 'block';
            viewElement.classList.add('fadeIn');
        }
        
        // Add active class to selected nav button
        const activeBtn = document.querySelector(`[data-view="${view}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
        }
        
        this.currentView = view;
        
        // Initialize view-specific content
        if (view === 'notes') {
            this.renderNotes();
        } else if (view === 'focus') {
            this.renderFocusMode();
        } else if (view === 'photo') {
            this.renderPhotoMode();
        }
    }

    // Notes methods
    addNote() {
        const noteInput = document.getElementById('noteTitle');
        const noteText = noteInput.value.trim();
        if (noteText) {
            const note = {
                id: Date.now(),
                text: noteText,
                createdAt: new Date().toISOString()
            };
            
            this.notes.push(note);
            this.saveNotes();
            this.renderNotes();
            noteInput.value = '';
            noteInput.focus(); // Manter foco no input para adição rápida
        } else {
            noteInput.focus(); // Focar no input se estiver vazio
        }
    }

    editNote(id, newText) {
        const note = this.notes.find(n => n.id === Number(id));
        if (note) {
            note.text = newText;
            note.updatedAt = new Date().toISOString();
            this.saveNotes();
            this.renderNotes();
        }
    }

    deleteNote(id) {
        this.notes = this.notes.filter(n => n.id !== Number(id));
        this.saveNotes();
        this.renderNotes();
    }

    renderNotes() {
        const notesList = document.getElementById('notesList');
        if (!notesList) return;
        
        notesList.innerHTML = this.notes.map(note => `
            <div class="note-item" data-id="${note.id}">
                <div class="note-text" data-note-id="${note.id}">${note.text}</div>
                <input type="text" class="note-edit-input" value="${note.text}" style="display: none;" data-note-id="${note.id}">
                <div class="note-actions">
                    <button class="delete-btn" data-note-id="${note.id}">
                        🗑️
                    </button>
                </div>
                <div class="note-date">${new Date(note.createdAt).toLocaleDateString()}</div>
            </div>
        `).join('');
        
        // Bind events after rendering
        this.bindNoteEvents();
    }

    bindNoteEvents() {
        // Note text click events for editing
        document.querySelectorAll('.note-text').forEach(text => {
            text.addEventListener('click', (e) => {
                const noteId = e.target.dataset.noteId;
                this.startEditNote(noteId);
            });
        });

        // Use event delegation for all note events
        const notesList = document.getElementById('notesList');
        if (notesList) {
            // Remove event listeners anteriores para evitar duplicação
            notesList.removeEventListener('click', this.handleNoteClick);
            notesList.removeEventListener('keydown', this.handleNoteKeydown);
            notesList.removeEventListener('blur', this.handleNoteBlur);
            
            // Criar funções bound para poder remover depois
            this.handleNoteClick = (e) => {
                if (e.target.classList.contains('delete-btn') && e.target.dataset.noteId) {
                    e.preventDefault();
                    e.stopPropagation();
                    const noteId = e.target.dataset.noteId;
                    this.deleteNote(noteId);
                }
            };
            
            this.handleNoteKeydown = (e) => {
                if (e.target.classList.contains('note-edit-input') && e.target.dataset.noteId) {
                    const noteId = e.target.dataset.noteId;
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        this.finishEditNote(noteId, e.target.value);
                    } else if (e.key === 'Escape') {
                        e.preventDefault();
                        this.cancelEditNote(noteId);
                    }
                }
            };
            
            this.handleNoteBlur = (e) => {
                if (e.target.classList.contains('note-edit-input') && e.target.dataset.noteId) {
                    const noteId = e.target.dataset.noteId;
                    this.finishEditNote(noteId, e.target.value);
                }
            };
            
            notesList.addEventListener('click', this.handleNoteClick);
            notesList.addEventListener('keydown', this.handleNoteKeydown);
            notesList.addEventListener('blur', this.handleNoteBlur, true);
        }
    }

    startEditNote(id) {
        const noteItem = document.querySelector(`[data-id="${id}"]`);
        if (!noteItem) return;
        
        const textElement = noteItem.querySelector('.note-text');
        const inputElement = noteItem.querySelector('.note-edit-input');
        
        if (textElement && inputElement) {
            textElement.style.display = 'none';
            inputElement.style.display = 'block';
            inputElement.focus();
            inputElement.select();
        }
    }

    finishEditNote(id, newText) {
        const noteItem = document.querySelector(`[data-id="${id}"]`);
        if (!noteItem) return;
        
        const textElement = noteItem.querySelector('.note-text');
        const inputElement = noteItem.querySelector('.note-edit-input');
        
        if (!textElement || !inputElement) return;
        
        if (newText.trim()) {
            if (newText.trim() !== textElement.textContent) {
                this.editNote(id, newText.trim());
            } else {
                // Even if text is the same, hide input and show text
                textElement.style.display = 'block';
                inputElement.style.display = 'none';
            }
        } else {
            // If empty, cancel edit
            this.cancelEditNote(id);
        }
    }

    cancelEditNote(id) {
        const noteItem = document.querySelector(`[data-id="${id}"]`);
        if (!noteItem) return;
        
        const textElement = noteItem.querySelector('.note-text');
        const inputElement = noteItem.querySelector('.note-edit-input');
        
        if (textElement && inputElement) {
            textElement.style.display = 'block';
            inputElement.style.display = 'none';
            inputElement.value = textElement.textContent;
        }
    }

    exportNotes() {
        if (this.notes.length === 0) {
            alert('Não há notas para exportar!');
            return;
        }
        
        const content = this.notes.map(note => {
            const date = new Date(note.createdAt).toLocaleDateString('pt-BR');
            return `${date} - ${note.text}`;
        }).join('\n\n');
        
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `notas_${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    exportTodos() {
        const filteredTodos = this.getFilteredTodos();
        
        if (filteredTodos.length === 0) {
            alert('Não há tarefas para exportar no filtro selecionado!');
            return;
        }
        
        // Get filter name for filename
        const filterNames = {
            'all': 'todas',
            'today': 'hoje',
            'yesterday': 'ontem',
            'week': 'semana',
            'month': 'mes',
            'year': 'ano'
        };
        
        const filterName = filterNames[this.currentFilter] || 'filtradas';
        
        // Group todos by status
        const activeTodos = filteredTodos.filter(todo => !todo.deleted && !todo.completed);
        const completedTodos = filteredTodos.filter(todo => !todo.deleted && todo.completed);
        const deletedTodos = filteredTodos.filter(todo => todo.deleted);
        
        let content = `TAREFAS - ${filterName.toUpperCase()}\n`;
        content += `Exportado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}\n\n`;
        
        // Active todos
        if (activeTodos.length > 0) {
            content += `PENDENTES (${activeTodos.length}):\n`;
            content += '=' + '='.repeat(20) + '\n';
            activeTodos.forEach(todo => {
                content += `□ ${todo.text}\n`;
                if (todo.category) {
                    content += `  Categoria: ${todo.category}\n`;
                }
                content += `  Data: ${this.formatDate(todo.date)}\n\n`;
            });
        }
        
        // Completed todos
        if (completedTodos.length > 0) {
            content += `CONCLUÍDAS (${completedTodos.length}):\n`;
            content += '=' + '='.repeat(20) + '\n';
            completedTodos.forEach(todo => {
                content += `☑ ${todo.text}\n`;
                if (todo.category) {
                    content += `  Categoria: ${todo.category}\n`;
                }
                content += `  Data: ${this.formatDate(todo.date)}\n\n`;
            });
        }
        
        // Deleted todos (only if showing deleted)
        if (deletedTodos.length > 0 && this.showDeleted) {
            content += `EXCLUÍDAS (${deletedTodos.length}):\n`;
            content += '=' + '='.repeat(20) + '\n';
            deletedTodos.forEach(todo => {
                content += `✗ ${todo.text}\n`;
                if (todo.category) {
                    content += `  Categoria: ${todo.category}\n`;
                }
                content += `  Data: ${this.formatDate(todo.date)}\n`;
                if (todo.deletedAt) {
                    content += `  Excluída em: ${this.formatDate(todo.deletedAt.split('T')[0])}\n`;
                }
                content += '\n';
            });
        }
        
        // Summary
        content += '\nRESUMO:\n';
        content += '=' + '='.repeat(10) + '\n';
        content += `Total de tarefas: ${filteredTodos.length}\n`;
        content += `Pendentes: ${activeTodos.length}\n`;
        content += `Concluídas: ${completedTodos.length}\n`;
        if (this.showDeleted) {
            content += `Excluídas: ${deletedTodos.length}\n`;
        }
        
        const blob = new Blob([content], { type: 'text/plain; charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `tarefas_${filterName}_${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    saveNotes() {
        chrome.storage.local.set({ notes: this.notes });
    }

    loadNotes() {
        chrome.storage.local.get(['notes'], (result) => {
            this.notes = result.notes || [];
            if (this.currentView === 'notes') {
                this.renderNotes();
            }
        });
    }

    // Timer methods
    startTimer() {
        if (!this.timer.isRunning) {
            this.timer.isRunning = true;
            this.timer.interval = setInterval(() => {
                if (this.timer.seconds > 0) {
                    this.timer.seconds--;
                } else if (this.timer.minutes > 0) {
                    this.timer.minutes--;
                    this.timer.seconds = 59;
                } else {
                    this.resetTimer();
                    alert('Tempo esgotado!');
                    return;
                }
                this.updateTimerDisplay();
            }, 1000);
            this.updateTimerButtons();
        }
    }

    pauseTimer() {
        this.timer.isRunning = false;
        clearInterval(this.timer.interval);
        this.updateTimerButtons();
    }

    resetTimer() {
        this.timer.isRunning = false;
        this.timer.minutes = 25;
        this.timer.seconds = 0;
        clearInterval(this.timer.interval);
        this.updateTimerDisplay();
        this.updateTimerButtons();
        // Clear selected todo when timer is reset
        this.selectedTodoForFocus = null;
        if (this.currentView === 'focus') {
            this.renderFocusTodos();
        }
    }

    updateTimerDisplay() {
        const display = document.getElementById('timerDisplay');
        if (display) {
            const mins = this.timer.minutes.toString().padStart(2, '0');
            const secs = this.timer.seconds.toString().padStart(2, '0');
            display.textContent = `${mins}:${secs}`;
        }
    }

    updateTimerButtons() {
        const startBtn = document.getElementById('startTimerBtn');
        const pauseBtn = document.getElementById('pauseTimerBtn');
        
        if (startBtn && pauseBtn) {
            startBtn.style.display = this.timer.isRunning ? 'none' : 'inline-block';
            pauseBtn.style.display = this.timer.isRunning ? 'inline-block' : 'none';
        }
    }

    renderFocusMode() {
        this.updateTimerDisplay();
        this.updateTimerButtons();
        // Render todos in focus mode
        this.renderFocusTodos();
    }

    renderFocusTodos() {
        const focusTodosList = document.getElementById('focusTodosList');
        if (!focusTodosList) return;
        
        let todosToShow;
        
        // If a specific todo is selected for focus, show only that todo
        if (this.selectedTodoForFocus) {
            todosToShow = [this.selectedTodoForFocus];
        } else {
            // Otherwise, show today's todos (including completed ones - soft delete)
            todosToShow = this.todos.filter(todo => {
                if (todo.deleted) return false; // Only filter hard deleted todos
                const todoDate = todo.date;
                const today = this._getLocalISODate();
                return todoDate === today;
                // Note: We keep completed todos visible (soft delete behavior)
            });
        }

        if (todosToShow.length === 0) {
            focusTodosList.innerHTML = '<p class="empty-message">Nenhuma tarefa para hoje!</p>';
            this.updateProgressBar(0, 0);
            return;
        }

        focusTodosList.innerHTML = todosToShow.map(todo => `
            <div class="focus-todo-item ${todo.completed ? 'completed' : ''}" data-id="${todo.id}">
                <div class="todo-checkbox ${todo.completed ? 'completed' : ''}" 
                     data-todo-id="${todo.id}"></div>
                <span class="todo-text ${todo.completed ? 'completed' : ''}">${this.escapeHtml(todo.text)}</span>
            </div>
        `).join('');
        
        // Bind click events for focus mode checkboxes
        const focusCheckboxes = focusTodosList.querySelectorAll('.todo-checkbox');
        focusCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('click', (e) => {
                const todoId = e.target.getAttribute('data-todo-id');
                this.toggleTodo(todoId);
            });
        });
        
        // Update progress bar
        const completedCount = todosToShow.filter(todo => todo.completed).length;
        this.updateProgressBar(completedCount, todosToShow.length);
    }

    // Pomodoro methods
    startPomodoro() {
        if (!this.pomodoro.isRunning) {
            this.pomodoro.isRunning = true;
            this.pomodoro.interval = setInterval(() => {
                if (this.pomodoro.seconds > 0) {
                    this.pomodoro.seconds--;
                } else if (this.pomodoro.minutes > 0) {
                    this.pomodoro.minutes--;
                    this.pomodoro.seconds = 59;
                } else {
                    this.resetPomodoro();
                    alert('Pomodoro concluído!');
                    return;
                }
                this.updatePomodoroDisplay();
            }, 1000);
            this.updatePomodoroButtons();
        }
    }

    pausePomodoro() {
        this.pomodoro.isRunning = false;
        clearInterval(this.pomodoro.interval);
        this.updatePomodoroButtons();
    }

    resetPomodoro() {
        this.pomodoro.isRunning = false;
        clearInterval(this.pomodoro.interval);
        this.pomodoro.minutes = 25;
        this.pomodoro.seconds = 0;
        this.updatePomodoroDisplay();
        this.updatePomodoroButtons();
    }

    updatePomodoroDisplay() {
        const display = document.getElementById('pomodoroDisplay');
        if (display) {
            const mins = this.pomodoro.minutes.toString().padStart(2, '0');
            const secs = this.pomodoro.seconds.toString().padStart(2, '0');
            display.textContent = `${mins}:${secs}`;
        }
    }

    updatePomodoroButtons() {
        const startBtn = document.getElementById('startPomodoroBtn');
        const pauseBtn = document.getElementById('pausePomodoroBtn');
        
        if (startBtn && pauseBtn) {
            startBtn.style.display = this.pomodoro.isRunning ? 'none' : 'inline-block';
            pauseBtn.style.display = this.pomodoro.isRunning ? 'inline-block' : 'none';
        }
    }

    updateClock() {
        const clockDisplay = document.getElementById('clockDisplay');
        if (clockDisplay) {
            const now = new Date();
            const timeString = now.toLocaleTimeString('pt-BR');
            clockDisplay.textContent = timeString;
        }
    }

    renderPhotoMode() {
        this.updatePomodoroDisplay();
        this.updatePomodoroButtons();
        this.updateClock();
        // Render todos in photo mode
        this.renderPhotoTodos();
        
        // Update clock every second (only set once)
        if (!this.clockInterval) {
            this.clockInterval = setInterval(() => this.updateClock(), 1000);
        }
    }

    renderPhotoTodos() {
        const photoTodosList = document.getElementById('photoTodosList');
        if (!photoTodosList) return;
        
        const todayTodos = this.todos.filter(todo => {
            if (todo.deleted) return false;
            const todoDate = todo.date;
            const today = this._getLocalISODate();
            return todoDate === today;
        });

        if (todayTodos.length === 0) {
            photoTodosList.innerHTML = '<p class="empty-message">Nenhuma tarefa para hoje!</p>';
            return;
        }

        photoTodosList.innerHTML = todayTodos.map(todo => `
            <div class="photo-todo-item ${todo.completed ? 'completed' : ''}" data-id="${todo.id}">
                <div class="todo-checkbox ${todo.completed ? 'completed' : ''}" 
                     data-todo-id="${todo.id}"></div>
                <span class="todo-text ${todo.completed ? 'completed' : ''}">${this.escapeHtml(todo.text)}</span>
            </div>
        `).join('');
        
        // Bind click events for photo mode checkboxes
        const photoCheckboxes = photoTodosList.querySelectorAll('.todo-checkbox');
        photoCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('click', (e) => {
                const todoId = e.target.getAttribute('data-todo-id');
                this.toggleTodo(todoId);
            });
        });
    }

    startEditTodo(id) {
        const todo = this.todos.find(t => t.id === id);
        if (!todo || todo.deleted) return;

        const textElement = document.querySelector(`.todo-text[data-id="${id}"]`);
        const inputElement = document.querySelector(`.todo-edit-input[data-id="${id}"]`);
        
        if (textElement && inputElement) {
            textElement.style.display = 'none';
            inputElement.style.display = 'block';
            inputElement.focus();
            inputElement.select();
        }
    }

    finishEditTodo(id, newText) {
        const trimmedText = newText.trim();
        if (!trimmedText) {
            this.cancelEditTodo(id);
            return;
        }

        const todo = this.todos.find(t => t.id === id);
        if (todo && !todo.deleted) {
            todo.text = trimmedText;
            this.saveTodos();
            this.renderTodos();
        }
    }

    cancelEditTodo(id) {
        const textElement = document.querySelector(`.todo-text[data-id="${id}"]`);
        const inputElement = document.querySelector(`.todo-edit-input[data-id="${id}"]`);
        
        if (textElement && inputElement) {
            textElement.style.display = 'block';
            inputElement.style.display = 'none';
            
            // Reset input value to original
            const todo = this.todos.find(t => t.id === id);
            if (todo) {
                inputElement.value = todo.text;
            }
        }
    }

    updateProgressBar(completedCount, totalCount) {
        const progressFill = document.getElementById('progressFill');
        const progressPercentage = document.getElementById('progressPercentage');
        
        if (!progressFill || !progressPercentage) return;
        
        const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
        
        progressFill.style.width = `${percentage}%`;
        progressPercentage.textContent = `${percentage}%`;
    }

    goToFocusModeWithTodo(todoId) {
        // Find the todo
        const todo = this.todos.find(t => t.id === todoId.toString());
        if (!todo || todo.deleted || todo.completed) {
            return;
        }
        
        // Set the selected todo for focus mode
        this.selectedTodoForFocus = todo;
        
        // Switch to focus view
        this.switchView('focus');
        
        // Reset and start the timer
        this.resetTimer();
        setTimeout(() => {
            this.startTimer();
        }, 100);
    }

    setFilter(filter) {
        this.currentFilter = filter;
        
        // Update active button
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-filter="${filter}"]`).classList.add('active');

        // Update period title
        const periodTexts = {
            'all': 'Todas as Tarefas',
            'yesterday': 'Ontem',
            'today': 'Hoje',
            'week': 'Esta Semana',
            'month': 'Este Mês',
            'year': 'Este Ano'
        };
        // document.getElementById('periodTitle').textContent = titles[filter];

        this.renderTodos();
        this.updateStats();
    }

    getFilteredTodos() {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        

        return this.todos.filter(todo => {
            // Filtrar tarefas deletadas (exceto se showDeleted estiver ativo)
            if (todo.deleted && !this.showDeleted) return false;
            // Se showDeleted estiver ativo, mostrar apenas deletadas
            if (this.showDeleted && !todo.deleted) return false;
            
            // Criar data a partir da string no formato YYYY-MM-DD
            const [year, month, day] = todo.date.split('-').map(Number);
            const todoDateOnly = new Date(year, month - 1, day);
            
            switch (this.currentFilter) {
                case 'today':
                    return todoDateOnly.getTime() === today.getTime();
                    
                case 'yesterday':
                    const yesterday = new Date(today);
                    yesterday.setDate(today.getDate() - 1);
                    return todoDateOnly.getTime() === yesterday.getTime();
                    
                case 'week':
                    const weekStart = new Date(today);
                    weekStart.setDate(today.getDate() - today.getDay());
                    const weekEnd = new Date(weekStart);
                    weekEnd.setDate(weekStart.getDate() + 6);
                    return todoDateOnly >= weekStart && todoDateOnly <= weekEnd;
                    
                case 'month':
                    return todoDateOnly.getMonth() === today.getMonth() && 
                           todoDateOnly.getFullYear() === today.getFullYear();
                    
                case 'year':
                    return todoDateOnly.getFullYear() === today.getFullYear();
                    
                default:
                    return true;
            }
        });
    }

    renderTodos() {
        const todosList = document.getElementById('todosContainer');
        const emptyState = document.getElementById('emptyState');
        
        // Check if elements exist (they might not be visible in current view)
        if (!todosList || !emptyState) {
            return;
        }
        
        const filteredTodos = this.getFilteredTodos();

        if (filteredTodos.length === 0) {
            todosList.innerHTML = '';
            emptyState.style.display = 'block';
            return;
        }

        emptyState.style.display = 'none';
        
        todosList.innerHTML = filteredTodos.map(todo => `
            <div class="todo-item ${todo.deleted ? 'deleted' : ''}" data-id="${todo.id}">
                ${!todo.deleted ? '<div class="drag-handle" title="Arrastar para reordenar" draggable="true">⋮⋮</div>' : ''}
                <div class="todo-checkbox ${todo.completed ? 'completed' : ''}" 
                     data-todo-id="${todo.id}" ${todo.deleted ? 'style="pointer-events: none;"' : ''}></div>
                <div class="todo-content">
                    <div class="todo-text ${todo.completed ? 'completed' : ''}" data-id="${todo.id}" style="cursor: pointer;">${this.escapeHtml(todo.text)}</div>
                    <input type="text" class="todo-edit-input" data-id="${todo.id}" value="${this.escapeHtml(todo.text)}" style="display: none;">
                    ${todo.category ? `<div class="todo-category">${this.escapeHtml(todo.category)}</div>` : ''}
                    <div class="todo-date">${this.formatDate(todo.date)}</div>
                    ${todo.deleted ? `<div class="deleted-info">Excluída em: ${this.formatDate(todo.deletedAt.split('T')[0])}</div>` : ''}
                </div>
                <div class="todo-actions">
                    ${todo.deleted ? 
                        `<button class="restore-btn" data-todo-id="${todo.id}" title="Restaurar">↩️</button>` :
                        `<button class="delete-btn" data-todo-id="${todo.id}" title="Excluir">🗑️</button>`
                    }
                </div>
            </div>
        `).join('');

        // Event binding is now handled by delegation in bindEvents
    }

    updateStats() {
        const activeTodos = this.todos.filter(todo => !todo.deleted);
        const total = activeTodos.length;
        const completed = activeTodos.filter(todo => todo.completed).length;
        const pending = total - completed;

        document.getElementById('totalTodos').textContent = total;
        document.getElementById('completedTodos').textContent = completed;
        document.getElementById('pendingTodos').textContent = pending;
    }

    formatDate(dateString) {
        // Criar data a partir da string no formato YYYY-MM-DD
        const [year, month, day] = dateString.split('-').map(Number);
        const date = new Date(year, month - 1, day);
        
        // Obter data atual no fuso horário local
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);

        if (date.getTime() === today.getTime()) {
            return 'Hoje';
        } else if (date.getTime() === yesterday.getTime()) {
            return 'Ontem';
        } else if (date.getTime() === tomorrow.getTime()) {
            return 'Amanhã';
        } else {
            return date.toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    openSettings() {
        document.getElementById('settingsModal').style.display = 'block';
    }
    
    closeSettings() {
        document.getElementById('settingsModal').style.display = 'none';
    }
    
    toggleTheme(isDark) {
        if (isDark) {
            document.documentElement.setAttribute('data-theme', 'dark');
        } else {
            document.documentElement.removeAttribute('data-theme');
        }
        this.saveTheme(isDark);
    }
    
    saveTheme(isDark) {
        if (typeof chrome !== 'undefined' && chrome.storage) {
            chrome.storage.local.set({ darkMode: isDark });
        } else {
            localStorage.setItem('darkMode', isDark.toString());
        }
    }
    
    loadTheme() {
        if (typeof chrome !== 'undefined' && chrome.storage) {
            chrome.storage.local.get(['darkMode'], (result) => {
                const isDark = result.darkMode || false;
                document.getElementById('themeToggle').checked = isDark;
                this.toggleTheme(isDark);
            });
        } else {
            const isDark = localStorage.getItem('darkMode') === 'true';
            document.getElementById('themeToggle').checked = isDark;
            this.toggleTheme(isDark);
        }
    }

    saveTodos() {
        chrome.storage.local.set({ todos: this.todos });
    }

    loadTodos() {
        chrome.storage.local.get(['todos'], (result) => {
            this.todos = result.todos || [];
            
            // Adicionar tarefas de teste se não houver nenhuma
            if (this.todos.length === 0) {
                this.createTestTodos();
            }
            
            this.renderTodos();
            this.updateStats();
        });
    }
    
    createTestTodos() {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        const nextWeek = new Date(today);
        nextWeek.setDate(today.getDate() + 7);
        const nextMonth = new Date(today);
        nextMonth.setMonth(today.getMonth() + 1);
        
        const testTodos = [
            {
                id: Date.now().toString() + '1',
                text: 'Tarefa de hoje',
                date: this._getLocalISODate(today),
                completed: false,
                deleted: false,
                category: 'Teste'
            },
            {
                id: Date.now().toString() + '2',
                text: 'Tarefa de ontem',
                date: this._getLocalISODate(yesterday),
                completed: false,
                deleted: false,
                category: 'Teste'
            },
            {
                id: Date.now().toString() + '3',
                text: 'Tarefa de amanhã',
                date: this._getLocalISODate(tomorrow),
                completed: false,
                deleted: false,
                category: 'Teste'
            },
            {
                id: Date.now().toString() + '4',
                text: 'Tarefa da próxima semana',
                date: this._getLocalISODate(nextWeek),
                completed: false,
                deleted: false,
                category: 'Teste'
            },
            {
                id: Date.now().toString() + '5',
                text: 'Tarefa do próximo mês',
                date: this._getLocalISODate(nextMonth),
                completed: false,
                deleted: false,
                category: 'Teste'
            }
        ];
        
        this.todos = testTodos;
        this.saveTodos();
    }
}

// Initialize app when DOM is loaded
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new TodoApp();
    
    // Keep service worker alive
    setInterval(() => {
        if (typeof chrome !== 'undefined' && chrome.runtime) {
            chrome.runtime.sendMessage({ type: 'keepAlive' }, (response) => {
                if (chrome.runtime.lastError) {
                    console.log('Service worker inactive');
                } else {
                    console.log('Service worker active:', response);
                }
            });
        }
    }, 25000); // Send keep-alive every 25 seconds
});

// Handle extension context
if (typeof chrome !== 'undefined' && chrome.storage) {
    // Extension context - storage API available
} else {
    // Fallback for testing outside extension
    window.chrome = {
        storage: {
            local: {
                set: (data) => {
                    localStorage.setItem('todos', JSON.stringify(data.todos));
                },
                get: (keys, callback) => {
                    const result = {};
                    if (Array.isArray(keys)) {
                        keys.forEach(key => {
                            const data = localStorage.getItem(key);
                            if (data && data !== 'undefined') {
                                try {
                                    result[key] = JSON.parse(data);
                                } catch (e) {
                                    result[key] = key === 'todos' ? [] : null;
                                }
                            } else {
                                result[key] = key === 'todos' ? [] : null;
                            }
                        });
                    } else {
                        const data = localStorage.getItem(keys);
                        if (data && data !== 'undefined') {
                            try {
                                result[keys] = JSON.parse(data);
                            } catch (e) {
                                result[keys] = keys === 'todos' ? [] : null;
                            }
                        } else {
                            result[keys] = keys === 'todos' ? [] : null;
                        }
                    }
                    callback(result);
                }
            }
        }
    };
}