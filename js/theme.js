// Theme and Settings functionality
class Theme {
    constructor(app) {
        this.app = app;
    }

    toggleTheme(isDark) {
        document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
        this.saveTheme(isDark);
        
        // Update toggle state
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.checked = isDark;
        }
    }

    saveTheme(isDark) {
        chrome.storage.local.set({ 
            theme: isDark ? 'dark' : 'light' 
        });
    }

    loadTheme() {
        chrome.storage.local.get(['theme'], (result) => {
            const isDark = result.theme === 'dark';
            document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
            
            const themeToggle = document.getElementById('themeToggle');
            if (themeToggle) {
                themeToggle.checked = isDark;
            }
        });
    }

    openSettings() {
        const modal = document.getElementById('settingsModal');
        if (modal) {
            modal.style.display = 'flex';
        }
    }

    closeSettings() {
        const modal = document.getElementById('settingsModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    toggleShowDeleted(show) {
        this.app.showDeleted = show;
        this.app.renderTodos();
    }

    setDefaultDate() {
        const dateInput = document.getElementById('todoDate');
        if (dateInput && !dateInput.value) {
            dateInput.value = new Date().toISOString().split('T')[0];
        }
    }
}