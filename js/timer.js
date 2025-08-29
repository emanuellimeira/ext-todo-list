// Timer and Pomodoro functionality
class Timer {
    constructor(app) {
        this.app = app;
    }

    startTimer() {
        if (!this.app.timer.isRunning) {
            this.app.timer.isRunning = true;
            this.app.timer.interval = setInterval(() => {
                if (this.app.timer.seconds > 0) {
                    this.app.timer.seconds--;
                } else if (this.app.timer.minutes > 0) {
                    this.app.timer.minutes--;
                    this.app.timer.seconds = 59;
                } else {
                    this.resetTimer();
                    alert('Tempo esgotado!');
                }
                this.updateTimerDisplay();
            }, 1000);
            this.updateTimerButtons();
        }
    }

    pauseTimer() {
        this.app.timer.isRunning = false;
        clearInterval(this.app.timer.interval);
        this.updateTimerButtons();
    }

    resetTimer() {
        this.app.timer.isRunning = false;
        clearInterval(this.app.timer.interval);
        this.app.timer.minutes = 25;
        this.app.timer.seconds = 0;
        this.updateTimerDisplay();
        this.updateTimerButtons();
        
        // Update progress bar if in focus mode
        if (this.app.currentView === 'focus' && this.app.selectedTodoForFocus) {
            const focusTodo = this.app.todos.find(t => t.id == this.app.selectedTodoForFocus);
            if (focusTodo) {
                this.app.renderFocusMode();
            }
        }
    }

    updateTimerDisplay() {
        const display = document.getElementById('timerDisplay');
        if (display) {
            const minutes = String(this.app.timer.minutes).padStart(2, '0');
            const seconds = String(this.app.timer.seconds).padStart(2, '0');
            display.textContent = `${minutes}:${seconds}`;
        }
    }

    updateTimerButtons() {
        const startBtn = document.getElementById('startTimer');
        const pauseBtn = document.getElementById('pauseTimer');
        
        if (startBtn && pauseBtn) {
            startBtn.style.display = this.app.timer.isRunning ? 'none' : 'inline-block';
            pauseBtn.style.display = this.app.timer.isRunning ? 'inline-block' : 'none';
        }
    }

    // Pomodoro functionality
    startPomodoro() {
        if (!this.app.pomodoro.isRunning) {
            this.app.pomodoro.isRunning = true;
            this.app.pomodoro.interval = setInterval(() => {
                if (this.app.pomodoro.seconds > 0) {
                    this.app.pomodoro.seconds--;
                } else if (this.app.pomodoro.minutes > 0) {
                    this.app.pomodoro.minutes--;
                    this.app.pomodoro.seconds = 59;
                } else {
                    this.resetPomodoro();
                    alert('Pomodoro concluído! Hora do intervalo.');
                }
                this.updatePomodoroDisplay();
            }, 1000);
            this.updatePomodoroButtons();
        }
    }

    pausePomodoro() {
        this.app.pomodoro.isRunning = false;
        clearInterval(this.app.pomodoro.interval);
        this.updatePomodoroButtons();
    }

    resetPomodoro() {
        this.app.pomodoro.isRunning = false;
        clearInterval(this.app.pomodoro.interval);
        this.app.pomodoro.minutes = 25;
        this.app.pomodoro.seconds = 0;
        this.updatePomodoroDisplay();
        this.updatePomodoroButtons();
    }

    updatePomodoroDisplay() {
        const display = document.getElementById('pomodoroDisplay');
        if (display) {
            const minutes = String(this.app.pomodoro.minutes).padStart(2, '0');
            const seconds = String(this.app.pomodoro.seconds).padStart(2, '0');
            display.textContent = `${minutes}:${seconds}`;
        }
    }

    updatePomodoroButtons() {
        const startBtn = document.getElementById('startPomodoro');
        const pauseBtn = document.getElementById('pausePomodoro');
        
        if (startBtn && pauseBtn) {
            startBtn.style.display = this.app.pomodoro.isRunning ? 'none' : 'inline-block';
            pauseBtn.style.display = this.app.pomodoro.isRunning ? 'inline-block' : 'none';
        }
    }

    updateClock() {
        const clockElement = document.getElementById('currentTime');
        if (clockElement) {
            const now = new Date();
            const timeString = now.toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit'
            });
            clockElement.textContent = timeString;
        }
    }

    initClock() {
        this.updateClock();
        setInterval(() => this.updateClock(), 1000);
    }
}