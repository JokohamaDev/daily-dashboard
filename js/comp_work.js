// Notes Initialization
function initNotes() {
    const notesTextarea = document.querySelector('.notes-content textarea');
    
    // Load saved notes
    const savedNotes = localStorage.getItem('notes');
    if (savedNotes && notesTextarea) {
        notesTextarea.value = savedNotes;
    }
    
    // Save notes when user types
    if (notesTextarea) {
        notesTextarea.addEventListener('input', function() {
            localStorage.setItem('notes', this.value);
        });
    }
}

// Task Management Functions
function createTaskElement(task, index) {
    // Create task list item
    const li = document.createElement('li');
    li.className = 'task-item';

    // Create checkbox
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'task-checkbox';
    checkbox.checked = task.completed;
    checkbox.addEventListener('change', () => toggleTaskCompletion(index));

    // Create task text
    const taskText = document.createElement('span');
    taskText.textContent = task.text;
    taskText.className = `task-text ${task.completed ? 'completed' : ''}`;

    // Create remove button
    const removeBtn = document.createElement('button');
    removeBtn.textContent = '✕';
    removeBtn.className = 'task-remove-btn';
    removeBtn.addEventListener('click', () => removeTask(index));

    // Assemble task item
    li.appendChild(checkbox);
    li.appendChild(taskText);
    li.appendChild(removeBtn);

    return li;
}

function loadTasks() {
    const taskList = document.getElementById('task-list');
    if (!taskList) return;

    // Retrieve tasks from localStorage
    const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');

    // Clear existing tasks
    taskList.innerHTML = '';

    // Render tasks
    tasks.forEach((task, index) => {
        const taskItem = createTaskElement(task, index);
        taskList.appendChild(taskItem);
    });
}

function addTask() {
    const taskInput = document.getElementById('task-input');
    if (!taskInput) return;

    // Validate input
    const taskText = taskInput.value.trim();
    if (!taskText) return;

    // Retrieve existing tasks
    const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');

    // Add new task at the beginning of the array
    tasks.unshift({ 
        text: taskText, 
        completed: false,
        timestamp: Date.now() // Add timestamp for potential future sorting
    });

    // Save to localStorage
    localStorage.setItem('tasks', JSON.stringify(tasks));

    // Clear input
    taskInput.value = '';

    // Reload tasks
    loadTasks();
}

function removeTask(index) {
    // Retrieve tasks
    const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');

    // Remove task at index
    tasks.splice(index, 1);

    // Save updated tasks
    localStorage.setItem('tasks', JSON.stringify(tasks));

    // Reload tasks
    loadTasks();
}

function toggleTaskCompletion(index) {
    // Retrieve tasks
    const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');

    // Toggle task completion
    tasks[index].completed = !tasks[index].completed;

    // Save updated tasks
    localStorage.setItem('tasks', JSON.stringify(tasks));

    // Reload tasks
    loadTasks();
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    const addTaskBtn = document.getElementById('add-task-btn');
    const taskInput = document.getElementById('task-input');

    // Add task on button click
    if (addTaskBtn) {
        addTaskBtn.addEventListener('click', addTask);
    }

    // Add task on Enter key
    if (taskInput) {
        taskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                addTask();
            }
        });
    }
});
