// Notes functionality
class Notes {
    constructor(app) {
        this.app = app;
    }

    addNote() {
        const titleInput = document.getElementById('noteTitle');
        const contentInput = document.getElementById('noteContent');
        const title = titleInput.value.trim();
        const content = contentInput.value.trim();
        
        if (title || content) {
            const note = {
                id: Date.now(),
                title: title || 'Nota sem título',
                content: content,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            
            this.app.notes.push(note);
            this.saveNotes();
            this.renderNotes();
            titleInput.value = '';
            contentInput.value = '';
        }
    }

    editNote(id, newText) {
        const note = this.app.notes.find(n => n.id == id);
        if (note) {
            note.content = newText;
            note.updatedAt = new Date().toISOString();
            this.saveNotes();
            this.renderNotes();
        }
    }

    deleteNote(id) {
        this.app.notes = this.app.notes.filter(n => n.id != id);
        this.saveNotes();
        this.renderNotes();
    }

    renderNotes() {
        const notesList = document.getElementById('notesList');
        if (!notesList) return;
        
        if (this.app.notes.length === 0) {
            notesList.innerHTML = '<div class="empty-state">📝 Nenhuma nota ainda. Adicione sua primeira nota!</div>';
            return;
        }
        
        notesList.innerHTML = this.app.notes.map(note => `
            <div class="note-item" data-id="${note.id}">
                <div class="note-header">
                    <h4 class="note-title">${this.app.escapeHtml(note.title)}</h4>
                    <button class="note-delete-btn" data-id="${note.id}">🗑️</button>
                </div>
                <div class="note-content">${this.app.escapeHtml(note.content).replace(/\n/g, '<br>')}</div>
                <div class="note-date">${this.app.formatDate(note.createdAt)}</div>
            </div>
        `).join('');
        
        this.bindNoteEvents();
    }

    bindNoteEvents() {
        const notesList = document.getElementById('notesList');
        if (notesList) {
            // Remove existing event listeners by cloning the element
            const newNotesList = notesList.cloneNode(true);
            notesList.parentNode.replaceChild(newNotesList, notesList);
            
            // Add event delegation for all note interactions
            newNotesList.addEventListener('click', (e) => this.handleNoteClick(e));
            newNotesList.addEventListener('keydown', (e) => this.handleNoteKeydown(e));
            newNotesList.addEventListener('blur', (e) => this.handleNoteBlur(e), true);
        }
    }

    handleNoteClick(e) {
        const noteItem = e.target.closest('.note-item');
        if (!noteItem) return;
        
        const id = noteItem.dataset.id;
        
        if (e.target.classList.contains('note-delete-btn')) {
            this.deleteNote(id);
        } else if (e.target.classList.contains('note-content') && !e.target.querySelector('input')) {
            this.startEditNote(id);
        }
    }

    handleNoteKeydown(e) {
        if (e.target.classList.contains('note-edit-input')) {
            const noteItem = e.target.closest('.note-item');
            const id = noteItem.dataset.id;
            
            if (e.key === 'Enter') {
                this.finishEditNote(id, e.target.value);
            } else if (e.key === 'Escape') {
                this.cancelEditNote(id);
            }
        }
    }

    handleNoteBlur(e) {
        if (e.target.classList.contains('note-edit-input')) {
            const noteItem = e.target.closest('.note-item');
            const id = noteItem.dataset.id;
            this.finishEditNote(id, e.target.value);
        }
    }

    startEditNote(id) {
        const noteItem = document.querySelector(`[data-id="${id}"]`);
        if (noteItem) {
            const contentElement = noteItem.querySelector('.note-content');
            const note = this.app.notes.find(n => n.id == id);
            
            if (note) {
                contentElement.innerHTML = `<input type="text" class="note-edit-input" value="${this.app.escapeHtml(note.content)}" data-id="${id}">`;
                const input = contentElement.querySelector('.note-edit-input');
                input.focus();
                input.select();
            }
        }
    }

    finishEditNote(id, newText) {
        const note = this.app.notes.find(n => n.id == id);
        if (note && newText.trim()) {
            note.content = newText.trim();
            note.updatedAt = new Date().toISOString();
            this.saveNotes();
            this.renderNotes();
        } else {
            this.cancelEditNote(id);
        }
    }

    cancelEditNote(id) {
        const noteItem = document.querySelector(`[data-id="${id}"]`);
        if (noteItem) {
            const note = this.app.notes.find(n => n.id == id);
            if (note) {
                const contentElement = noteItem.querySelector('.note-content');
                contentElement.innerHTML = this.app.escapeHtml(note.content).replace(/\n/g, '<br>');
            }
        }
    }

    exportNotes() {
        if (this.app.notes.length === 0) {
            alert('Não há notas para exportar.');
            return;
        }
        
        const notesText = this.app.notes.map(note => {
            return `${note.title}\n${'-'.repeat(note.title.length)}\n${note.content}\n\nCriado em: ${this.app.formatDate(note.createdAt)}\n${'='.repeat(50)}\n\n`;
        }).join('');
        
        const blob = new Blob([notesText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `notas_${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    saveNotes() {
        chrome.storage.local.set({ notes: this.app.notes });
    }

    loadNotes() {
        chrome.storage.local.get(['notes'], (result) => {
            if (result.notes) {
                this.app.notes = result.notes;
            }
        });
    }
}