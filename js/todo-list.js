// Todo List functionality
class TodoList {
    constructor(app) {
        this.app = app;
    }

    addTodo() {
        const input = document.getElementById('todoInput');
        const dateInput = document.getElementById('todoDate');
        const text = input.value.trim();
        const date = dateInput.value;
        
        if (text) {
            const todo = {
                id: Date.now(),
                text: text,
                completed: false,
                deleted: false,
                date: date || new Date().toISOString().split('T')[0],
                createdAt: new Date().toISOString()
            };
            
            this.app.todos.push(todo);
            this.app.saveTodos();
            this.app.renderTodos();
            this.app.updateStats();
            input.value = '';
        }
    }

    toggleTodo(id) {
        const todo = this.app.todos.find(t => t.id == id);
        if (todo) {
            todo.completed = !todo.completed;
            this.app.saveTodos();
            this.app.renderTodos();
            this.app.updateStats();
            
            // Update progress bar if in focus mode
            if (this.app.currentView === 'focus' && this.app.selectedTodoForFocus) {
                const focusTodo = this.app.todos.find(t => t.id == this.app.selectedTodoForFocus);
                if (focusTodo) {
                    this.app.renderFocusMode();
                }
            }
        }
    }

    deleteTodo(id) {
        const todo = this.app.todos.find(t => t.id == id);
        if (todo) {
            todo.deleted = true;
            this.app.saveTodos();
            this.app.renderTodos();
            this.app.updateStats();
        }
    }

    restoreTodo(id) {
        const todo = this.app.todos.find(t => t.id == id);
        if (todo) {
            todo.deleted = false;
            this.app.saveTodos();
            this.app.renderTodos();
            this.app.updateStats();
        }
    }

    startEditTodo(id) {
        const todoElement = document.querySelector(`[data-id="${id}"]`);
        if (todoElement) {
            const textElement = todoElement.querySelector('.todo-text');
            const currentText = textElement.textContent;
            
            textElement.innerHTML = `<input type="text" class="edit-input" value="${this.app.escapeHtml(currentText)}" data-id="${id}">`;
            const input = textElement.querySelector('.edit-input');
            input.focus();
            input.select();
            
            // Add event listeners for save/cancel
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    this.finishEditTodo(id, input.value);
                } else if (e.key === 'Escape') {
                    this.cancelEditTodo(id);
                }
            });
            
            input.addEventListener('blur', () => {
                this.finishEditTodo(id, input.value);
            });
        }
    }

    finishEditTodo(id, newText) {
        const todo = this.app.todos.find(t => t.id == id);
        if (todo && newText.trim()) {
            todo.text = newText.trim();
            this.app.saveTodos();
            this.app.renderTodos();
        } else {
            this.cancelEditTodo(id);
        }
    }

    cancelEditTodo(id) {
        const todoElement = document.querySelector(`[data-id="${id}"]`);
        if (todoElement) {
            const todo = this.app.todos.find(t => t.id == id);
            if (todo) {
                const textElement = todoElement.querySelector('.todo-text');
                textElement.textContent = todo.text;
            }
        }
    }

    bindTodoEvents() {
        const todoList = document.getElementById('todoList');
        if (todoList) {
            // Remove existing event listeners by cloning the element
            const newTodoList = todoList.cloneNode(true);
            todoList.parentNode.replaceChild(newTodoList, todoList);
            
            // Add event delegation for all todo interactions
            newTodoList.addEventListener('click', (e) => this.handleTodoClick(e));
        }
    }

    handleTodoClick(e) {
        const todoItem = e.target.closest('.todo-item');
        if (!todoItem) return;
        
        const id = todoItem.dataset.id;
        
        if (e.target.classList.contains('todo-checkbox') || e.target.closest('.todo-checkbox')) {
            this.toggleTodo(id);
        } else if (e.target.classList.contains('delete-btn')) {
            this.deleteTodo(id);
        } else if (e.target.classList.contains('restore-btn')) {
            this.restoreTodo(id);
        } else if (e.target.classList.contains('edit-btn')) {
            this.startEditTodo(id);
        } else if (e.target.classList.contains('focus-btn')) {
            this.app.goToFocusModeWithTodo(id);
        }
    }

    goToFocusModeWithTodo(todoId) {
        this.app.selectedTodoForFocus = todoId;
        this.app.switchView('focus');
        
        // Close sidebar if open
        if (this.app.closeSidebarFunc) {
            this.app.closeSidebarFunc();
        }
        
        // Reset timer when switching to focus mode
        this.app.timer.minutes = 25;
        this.app.timer.seconds = 0;
        this.app.timer.isRunning = false;
        if (this.app.timer.interval) {
            clearInterval(this.app.timer.interval);
            this.app.timer.interval = null;
        }
        
        this.app.renderFocusMode();
    }

    updateProgressBar(completedCount, totalCount) {
        const progressBar = document.querySelector('.progress-fill');
        const progressText = document.querySelector('.progress-text');
        
        if (progressBar && progressText) {
            const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
            progressBar.style.width = `${percentage}%`;
            progressText.textContent = `${completedCount}/${totalCount} (${percentage}%)`;
        }
    }
}