document.addEventListener('DOMContentLoaded', () => {
  loadNotes();
  setupEventListeners();
});

function setupEventListeners() {
  // Add event listener for the Add New Note button
  const addNoteButton = document.getElementById('addNoteButton');
  addNoteButton.addEventListener('click', () => {
    let newNoteText = prompt('Enter your note:');
    if (newNoteText) {
      let createdAt = new Date().toISOString();
      chrome.storage.sync.get({ notes: [] }, (result) => {
        let notes = result.notes;
        notes.push({
          title: '',
          note: newNoteText,
          url: '',
          dueDate: '',
          completed: false,
          createdAt: createdAt
        });
        chrome.storage.sync.set({ notes: notes }, () => {
          loadNotes();
        });
      });
    }
  });

  // Add event listener for the Open in New Tab link
  const openInTabLink = document.getElementById('openInTabLink');
  if (openInTabLink) {
    openInTabLink.addEventListener('click', (e) => {
      e.preventDefault();
      chrome.tabs.create({ url: chrome.runtime.getURL('page.html') });
    });
  }

  // Add event listeners for tab buttons
  const tabButtons = document.querySelectorAll('.tab-button');
  tabButtons.forEach((button) => {
    button.addEventListener('click', () => {
      document.querySelector('.tab-button.active').classList.remove('active');
      button.classList.add('active');
      loadNotes();
    });
  });

  // Add event listener for search input
  const searchInput = document.getElementById('searchInput');
  searchInput.addEventListener('input', () => {
    loadNotes();
  });
}

function loadNotes() {
  let notesList = document.getElementById('notesList');
  notesList.innerHTML = ''; // Clear existing notes

  const activeTab = document.querySelector('.tab-button.active').dataset.tab;
  const searchQuery = document.getElementById('searchInput').value.toLowerCase();

  chrome.storage.sync.get({ notes: [] }, (result) => {
    let allNotes = result.notes;

    // Map notes with their original index
    let mappedNotes = allNotes.map((note, idx) => ({ note, idx }));

    // Filter notes based on active tab and search query
    let filteredNotes = mappedNotes.filter(({ note }) => {
      const matchesSearch =
        note.title.toLowerCase().includes(searchQuery) ||
        note.note.toLowerCase().includes(searchQuery);
      if (activeTab === 'notes') {
        return !note.completed && matchesSearch;
      } else if (activeTab === 'done') {
        return note.completed && matchesSearch;
      }
      return matchesSearch;
    });

    filteredNotes.forEach(({ note, idx }) => {
      let listItem = document.createElement('li');

      let noteContainer = document.createElement('div');
      noteContainer.className = 'note-container';

      let noteHeader = document.createElement('div');
      noteHeader.className = 'note-header';

      // Creation date icon
      let creationDateIcon = document.createElement('i');
      creationDateIcon.className = 'fas fa-clock creation-date-icon';
      let createdAt = note.createdAt ? new Date(note.createdAt) : new Date();
      creationDateIcon.title = 'Created on: ' + createdAt.toLocaleString();

      let checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = note.completed;
      checkbox.className = 'checkbox';
      checkbox.addEventListener('change', () => {
        note.completed = checkbox.checked;
        allNotes[idx] = note;
        chrome.storage.sync.set({ notes: allNotes }, () => {
          loadNotes(); // Reload to update overdue indicator and tabs
        });
      });

      let noteTitle = document.createElement('input');
      noteTitle.type = 'text';
      noteTitle.placeholder = 'Title (optional)';
      noteTitle.value = note.title;
      noteTitle.className = 'note-title';
      noteTitle.addEventListener('input', () => {
        note.title = noteTitle.value;
        allNotes[idx] = note;
        chrome.storage.sync.set({ notes: allNotes });
      });

      // Note header arrangement
      let leftContainer = document.createElement('div');
      leftContainer.className = 'left-container';
      leftContainer.appendChild(creationDateIcon); // Moved clock icon here
      leftContainer.appendChild(checkbox);
      leftContainer.appendChild(noteTitle);

      noteHeader.appendChild(leftContainer);
      // Removed appending creationDateIcon to noteHeader

      let noteText = document.createElement('div');
      noteText.className = 'note-text';
      noteText.textContent = note.note;

      let noteUrl = document.createElement('a');
      noteUrl.className = 'note-url';
      noteUrl.href = note.url;
      noteUrl.target = '_blank';
      noteUrl.textContent = note.url ? new URL(note.url).hostname : '';

      // Due date container
      let dueDateContainer = document.createElement('div');
      dueDateContainer.className = 'due-date-container';

      // Overdue indicator next to date
      let overdueIndicatorDate = document.createElement('div');
      overdueIndicatorDate.className = 'overdue-indicator';

      // Calculate isOverdue
      let isOverdue =
        note.dueDate && new Date(note.dueDate) < new Date() && !note.completed;
      if (isOverdue) {
        overdueIndicatorDate.style.visibility = 'visible';
      } else {
        overdueIndicatorDate.style.visibility = 'hidden';
      }

      let dueDateInput = document.createElement('input');
      dueDateInput.type = 'date';
      dueDateInput.value = note.dueDate;
      dueDateInput.className = 'due-date';
      dueDateInput.addEventListener('change', () => {
        note.dueDate = dueDateInput.value;
        allNotes[idx] = note;
        chrome.storage.sync.set({ notes: allNotes }, () => {
          loadNotes(); // Reload notes to update overdue indicator
        });
      });

      dueDateContainer.appendChild(overdueIndicatorDate);
      dueDateContainer.appendChild(dueDateInput);

      // Create delete button
      let deleteButton = document.createElement('button');
      deleteButton.className = 'delete-button';
      deleteButton.innerHTML = '<i class="fas fa-trash-alt"></i>';
      deleteButton.addEventListener('click', () => {
        if (confirm('Are you sure you want to delete this note?')) {
          // Remove the note from the array
          allNotes.splice(idx, 1);
          // Update storage
          chrome.storage.sync.set({ notes: allNotes }, () => {
            // Reload the notes list
            loadNotes();
          });
        }
      });

      // Append delete button to the list item
      listItem.appendChild(deleteButton);

      noteContainer.appendChild(noteHeader);
      noteContainer.appendChild(noteText);
      if (note.url) {
        noteContainer.appendChild(noteUrl);
      }
      noteContainer.appendChild(dueDateContainer);

      listItem.appendChild(noteContainer);
      notesList.appendChild(listItem);
    });
  });
}
