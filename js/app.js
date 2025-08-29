// Main App class that coordinates all modules
class TodoApp {
    constructor() {
        this.todos = [];
        this.notes = [];
        this.currentFilter = 'all';
        this.showDeleted = false;
        this.currentView = 'todo';
        this.selectedTodoForFocus = null;
        this.timer = {
            minutes: 25,
            seconds: 0,
            isRunning: false,
            interval: null
        }
    
        this.pomodoro = {
            minutes: 25,
            seconds: 0,
            isRunning: false,
            interval: null
        };
        
        // Initialize modules
        this.todoList = new TodoList(this);
        this.notesModule = new Notes(this);
        this.timerModule = new Timer(this);
        this.themeModule = new Theme(this);
        
        this.init();
    }

    init() {
        this.loadTodos();
        this.notesModule.loadNotes();
        this.bindEvents();
        this.themeModule.setDefaultDate();
        this.themeModule.loadTheme();
        this.renderTodos();
        this.updateStats();
        this.timerModule.initClock();
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

        // Make the function accessible globally on the instance
        this.closeSidebarFunc = closeSidebarFunc;

        closeSidebar.addEventListener('click', closeSidebarFunc);
        sidebarOverlay.addEventListener('click', closeSidebarFunc);

        // Add todo
        document.getElementById('addBtn').addEventListener('click', () => this.todoList.addTodo());
        document.getElementById('todoInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.todoList.addTodo();
        });

        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.setFilter(e.target.dataset.filter));
        });
        
        // Settings modal
        document.getElementById('closeSettings').addEventListener('click', () => this.themeModule.closeSettings());
        document.getElementById('settingsModal').addEventListener('click', (e) => {
            if (e.target.id === 'settingsModal') this.themeModule.closeSettings();
        });
        
        // Theme toggle
        document.getElementById('themeToggle').addEventListener('change', (e) => this.themeModule.toggleTheme(e.target.checked));
        
        // Show deleted toggle
        document.getElementById('showDeleted').addEventListener('change', (e) => this.themeModule.toggleShowDeleted(e.target.checked));

        // Navigation events
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const view = e.target.closest('.nav-btn').dataset.view;
                this.switchView(view);
                this.closeSidebarFunc(); // Close sidebar when navigating
            });
        });
        
        // Drag and drop events
        this.bindDragAndDropEvents();

        // Notes events
        document.getElementById('addNoteBtn')?.addEventListener('click', () => this.notesModule.addNote());
        document.getElementById('noteTitleInput')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.notesModule.addNote();
        });
        document.getElementById('exportNotesBtn')?.addEventListener('click', () => this.notesModule.exportNotes());

        // Timer events
        document.getElementById('startTimer')?.addEventListener('click', () => this.timerModule.startTimer());
        document.getElementById('pauseTimer')?.addEventListener('click', () => this.timerModule.pauseTimer());
        document.getElementById('resetTimer')?.addEventListener('click', () => this.timerModule.resetTimer());
        
        // Pomodoro events
        document.getElementById('startPomodoro')?.addEventListener('click', () => this.timerModule.startPomodoro());
        document.getElementById('pausePomodoro')?.addEventListener('click', () => this.timerModule.pausePomodoro());
        document.getElementById('resetPomodoro')?.addEventListener('click', () => this.timerModule.resetPomodoro());
    }
    
    bindDragAndDropEvents() {
        let draggedElement = null;
        let draggedIndex = -1;
        
        // Use event delegation for drag events
        document.addEventListener('dragstart', (e) => {
            if (e.target.classList.contains('todo-item')) {
                draggedElement = e.target;
                draggedIndex = this.getDraggedTodoIndex(e.target.dataset.id);
                e.target.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/html', e.target.outerHTML);
            }
        });
        
        document.addEventListener('dragend', (e) => {
            if (e.target.classList.contains('todo-item')) {
                e.target.classList.remove('dragging');
                draggedElement = null;
                draggedIndex = -1;
                // Remove all drag-over classes
                document.querySelectorAll('.todo-item').forEach(item => {
                    item.classList.remove('drag-over');
                });
            }
        });
        
        document.addEventListener('dragover', (e) => {
            e.preventDefault();
            const todoItem = e.target.closest('.todo-item');
            if (todoItem && todoItem !== draggedElement) {
                e.dataTransfer.dropEffect = 'move';
                // Remove drag-over from all items
                document.querySelectorAll('.todo-item').forEach(item => {
                    item.classList.remove('drag-over');
                });
                // Add drag-over to current item
                todoItem.classList.add('drag-over');
            }
        });
        
        document.addEventListener('drop', (e) => {
            e.preventDefault();
            const dropTarget = e.target.closest('.todo-item');
            
            if (dropTarget && draggedElement && dropTarget !== draggedElement) {
                const dropIndex = this.getDraggedTodoIndex(dropTarget.dataset.id);
                this.reorderTodos(draggedIndex, dropIndex);
            }
            
            // Clean up
            document.querySelectorAll('.todo-item').forEach(item => {
                item.classList.remove('drag-over');
            });
        });
    }
    
    getDraggedTodoIndex(todoId) {
        const filteredTodos = this.getFilteredTodos();
        return filteredTodos.findIndex(todo => todo.id == todoId);
    }
    
    reorderTodos(fromIndex, toIndex) {
        const filteredTodos = this.getFilteredTodos();
        const draggedTodo = filteredTodos[fromIndex];
        const targetTodo = filteredTodos[toIndex];
        
        // Find the actual indices in the main todos array
        const draggedActualIndex = this.todos.findIndex(todo => todo.id === draggedTodo.id);
        const targetActualIndex = this.todos.findIndex(todo => todo.id === targetTodo.id);
        
        // Remove the dragged todo from its current position
        const [movedTodo] = this.todos.splice(draggedActualIndex, 1);
        
        // Insert it at the new position
        const newTargetIndex = draggedActualIndex < targetActualIndex ? targetActualIndex - 1 : targetActualIndex;
        this.todos.splice(newTargetIndex, 0, movedTodo);
        
        // Save and re-render
        this.saveTodos();
        this.renderTodos();
    }

    switchView(view) {
        this.currentView = view;
        
        // Hide all views
        document.querySelectorAll('.view').forEach(v => v.style.display = 'none');
        
        // Show selected view
        const targetView = document.getElementById(`${view}View`);
        if (targetView) {
            targetView.style.display = 'block';
        }
        
        // Update navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.view === view) {
                btn.classList.add('active');
            }
        });
        
        // Render view-specific content
        if (view === 'todo') {
            this.renderTodos();
        } else if (view === 'notes') {
            this.notesModule.renderNotes();
        } else if (view === 'focus') {
            this.renderFocusMode();
        } else if (view === 'photo') {
            this.renderPhotoMode();
        } else if (view === 'pomodoro') {
            this.timerModule.updatePomodoroDisplay();
            this.timerModule.updatePomodoroButtons();
        }
    }

    setFilter(filter) {
        this.currentFilter = filter;
        
        // Update filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.filter === filter) {
                btn.classList.add('active');
            }
        });
        
        this.renderTodos();
    }

    getFilteredTodos() {
        let filtered = this.todos.filter(todo => {
            if (this.showDeleted) {
                return todo.deleted;
            } else {
                return !todo.deleted;
            }
        });
        
        switch (this.currentFilter) {
            case 'pending':
                return filtered.filter(todo => !todo.completed);
            case 'completed':
                return filtered.filter(todo => todo.completed);
            case 'today':
                const today = new Date().toISOString().split('T')[0];
                return filtered.filter(todo => todo.date === today);
            case 'week':
                const weekStart = new Date();
                weekStart.setDate(weekStart.getDate() - weekStart.getDay());
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekStart.getDate() + 6);
                
                return filtered.filter(todo => {
                    const todoDate = new Date(todo.date);
                    return todoDate >= weekStart && todoDate <= weekEnd;
                });
            default:
                return filtered;
        }
    }

    renderTodos() {
        const todoList = document.getElementById('todoList');
        if (!todoList) return;
        
        const filteredTodos = this.getFilteredTodos();
        
        if (filteredTodos.length === 0) {
            const emptyMessage = this.showDeleted ? 
                '🗑️ Nenhuma tarefa excluída.' : 
                '✨ Nenhuma tarefa encontrada. Adicione uma nova!';
            todoList.innerHTML = `<div class="empty-state">${emptyMessage}</div>`;
            return;
        }
        
        todoList.innerHTML = filteredTodos.map(todo => `
            <div class="todo-item ${todo.completed ? 'completed' : ''}" data-id="${todo.id}" draggable="true">
                <div class="drag-handle" title="Arrastar para reordenar">⋮⋮</div>
                <div class="todo-checkbox" data-todo-id="${todo.id}">
                    <span class="checkbox-icon">${todo.completed ? '✓' : ''}</span>
                </div>
                <div class="todo-content">
                    <div class="todo-text">${this.escapeHtml(todo.text)}</div>
                    <div class="todo-date">${this.formatDate(todo.date)}</div>
                </div>
                <div class="todo-actions">
                    ${!this.showDeleted ? `
                        <button class="edit-btn" title="Editar">✏️</button>
                        <button class="focus-btn" title="Modo Foco">🎯</button>
                        <button class="delete-btn" title="Excluir">🗑️</button>
                    ` : `
                        <button class="restore-btn" title="Restaurar">↩️</button>
                    `}
                </div>
            </div>
        `).join('');
        
        this.todoList.bindTodoEvents();
    }

    renderFocusMode() {
        const focusContent = document.getElementById('focusContent');
        if (!focusContent) return;
        
        if (!this.selectedTodoForFocus) {
            focusContent.innerHTML = `
                <div class="focus-empty">
                    <h3>🎯 Modo Foco</h3>
                    <p>Selecione uma tarefa para focar</p>
                    <button onclick="app.switchView('todo')" class="btn btn-primary">Escolher Tarefa</button>
                </div>
            `;
            return;
        }
        
        const focusTodo = this.todos.find(t => t.id == this.selectedTodoForFocus);
        if (!focusTodo) {
            this.selectedTodoForFocus = null;
            this.renderFocusMode();
            return;
        }
        
        focusContent.innerHTML = `
            <div class="focus-todo">
                <h3>🎯 Focando em:</h3>
                <div class="focus-todo-text">${this.escapeHtml(focusTodo.text)}</div>
                <div class="focus-todo-date">📅 ${this.formatDate(focusTodo.date)}</div>
                
                <div class="timer-section">
                    <div class="timer-display" id="timerDisplay">25:00</div>
                    <div class="timer-controls">
                        <button id="startTimer" class="btn btn-success">▶️ Iniciar</button>
                        <button id="pauseTimer" class="btn btn-warning" style="display: none;">⏸️ Pausar</button>
                        <button id="resetTimer" class="btn btn-secondary">🔄 Resetar</button>
                    </div>
                </div>
                
                ${this.renderFocusTodos()}
            </div>
        `;
        
        this.timerModule.updateTimerDisplay();
        this.timerModule.updateTimerButtons();
        
        // Re-bind timer events
        document.getElementById('startTimer')?.addEventListener('click', () => this.timerModule.startTimer());
        document.getElementById('pauseTimer')?.addEventListener('click', () => this.timerModule.pauseTimer());
        document.getElementById('resetTimer')?.addEventListener('click', () => this.timerModule.resetTimer());
    }

    renderFocusTodos() {
        const relatedTodos = this.todos.filter(todo => 
            !todo.deleted && 
            todo.date === this.todos.find(t => t.id == this.selectedTodoForFocus)?.date
        );
        
        const completedCount = relatedTodos.filter(todo => todo.completed).length;
        const totalCount = relatedTodos.length;
        
        return `
            <div class="focus-progress">
                <h4>📊 Progresso do Dia</h4>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%"></div>
                </div>
                <div class="progress-text">${completedCount}/${totalCount} (${totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0}%)</div>
            </div>
            
            <div class="focus-todos">
                <h4>📝 Tarefas do Dia</h4>
                ${relatedTodos.map(todo => `
                    <div class="focus-todo-item ${todo.completed ? 'completed' : ''}" data-id="${todo.id}">
                        <div class="todo-checkbox" data-todo-id="${todo.id}">
                            <span class="checkbox-icon">${todo.completed ? '✓' : ''}</span>
                        </div>
                        <span class="focus-todo-text">${this.escapeHtml(todo.text)}</span>
                    </div>
                `).join('')}
            </div>
        `;
    }

    renderPhotoMode() {
        const photoContent = document.getElementById('photoContent');
        if (!photoContent) return;
        
        photoContent.innerHTML = `
            <div class="photo-header">
                <div class="current-time" id="currentTime"></div>
                <h2>📸 Modo Foto</h2>
            </div>
            ${this.renderPhotoTodos()}
        `;
        
        this.timerModule.updateClock();
    }

    renderPhotoTodos() {
        const todayTodos = this.todos.filter(todo => {
            const today = new Date().toISOString().split('T')[0];
            return !todo.deleted && todo.date === today;
        });
        
        const completedCount = todayTodos.filter(todo => todo.completed).length;
        const totalCount = todayTodos.length;
        
        return `
            <div class="photo-progress">
                <div class="progress-circle">
                    <div class="progress-text">${completedCount}/${totalCount}</div>
                </div>
            </div>
            
            <div class="photo-todos">
                ${todayTodos.map(todo => `
                    <div class="photo-todo-item ${todo.completed ? 'completed' : ''}" data-id="${todo.id}">
                        <div class="todo-checkbox" data-todo-id="${todo.id}">
                            <span class="checkbox-icon">${todo.completed ? '✓' : ''}</span>
                        </div>
                        <span class="photo-todo-text">${this.escapeHtml(todo.text)}</span>
                    </div>
                `).join('')}
            </div>
        `;
    }

    updateStats() {
        const activeTodos = this.todos.filter(todo => !todo.deleted);
        const completedTodos = activeTodos.filter(todo => todo.completed);
        const pendingTodos = activeTodos.filter(todo => !todo.completed);
        
        const totalElement = document.getElementById('totalTodos');
        const completedElement = document.getElementById('completedTodos');
        const pendingElement = document.getElementById('pendingTodos');
        
        if (totalElement) totalElement.textContent = activeTodos.length;
        if (completedElement) completedElement.textContent = completedTodos.length;
        if (pendingElement) pendingElement.textContent = pendingTodos.length;
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const dateStr = date.toISOString().split('T')[0];
        const todayStr = today.toISOString().split('T')[0];
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        const tomorrowStr = tomorrow.toISOString().split('T')[0];
        
        if (dateStr === todayStr) {
            return 'Hoje';
        } else if (dateStr === yesterdayStr) {
            return 'Ontem';
        } else if (dateStr === tomorrowStr) {
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

    saveTodos() {
        chrome.storage.local.set({ todos: this.todos });
    }

    loadTodos() {
        chrome.storage.local.get(['todos'], (result) => {
            if (result.todos) {
                this.todos = result.todos;
            } else {
                // Create some test todos for demonstration
                this.createTestTodos();
            }
        });
    }

    createTestTodos() {
        const today = new Date().toISOString().split('T')[0];
        this.todos = [
            {
                id: 1,
                text: 'Revisar código do projeto',
                completed: false,
                deleted: false,
                date: today,
                createdAt: new Date().toISOString()
            },
            {
                id: 2,
                text: 'Fazer exercícios matinais',
                completed: true,
                deleted: false,
                date: today,
                createdAt: new Date().toISOString()
            },
            {
                id: 3,
                text: 'Ler 30 páginas do livro',
                completed: false,
                deleted: false,
                date: today,
                createdAt: new Date().toISOString()
            }
        ];
        this.saveTodos();
    }
}

// Initialize app when DOM is loaded
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new TodoApp();
});

// Chrome extension storage polyfill for local development
if (typeof chrome !== 'undefined' && chrome.storage) {
    // Chrome extension environment
} else {
    // Local development environment
    window.chrome = {
        storage: {
            local: {
                set: (data) => {
                    Object.keys(data).forEach(key => {
                        localStorage.setItem(key, JSON.stringify(data[key]));
                    });
                },
                get: (keys, callback) => {
                    const result = {};
                    if (Array.isArray(keys)) {
                        keys.forEach(key => {
                            const item = localStorage.getItem(key);
                            if (item) {
                                result[key] = JSON.parse(item);
                            }
                        });
                    } else if (typeof keys === 'string') {
                        const item = localStorage.getItem(keys);
                        if (item) {
                            result[keys] = JSON.parse(item);
                        }
                    } else if (typeof keys === 'object') {
                        Object.keys(keys).forEach(key => {
                            const item = localStorage.getItem(key);
                            result[key] = item ? JSON.parse(item) : keys[key];
                        });
                    }
                    callback(result);
                }
            }
        }
    };
}