import './style.css';

// A single key to keep all tasks in localStorage.
const STORAGE_KEY = 'vibe-todo.tasks';

const form = document.querySelector('#todo-form');
const input = document.querySelector('#new-task');
const list = document.querySelector('#todo-list');
const emptyState = document.querySelector('#empty-state');
const filterButtons = document.querySelectorAll('[data-filter]');

// We keep state in plain JavaScript objects for beginner readability.
let tasks = loadTasks();
let currentFilter = 'all';

render();

form.addEventListener('submit', (event) => {
  event.preventDefault();

  const text = input.value.trim();
  if (!text) return;

  tasks.unshift({
    id: crypto.randomUUID(),
    text,
    completed: false,
  });

  saveTasks();
  render();
  form.reset();
  input.focus();
});

filterButtons.forEach((button) => {
  button.addEventListener('click', () => {
    currentFilter = button.dataset.filter;

    // Update active button styles.
    filterButtons.forEach((item) => {
      item.classList.toggle('is-active', item === button);
    });

    render();
  });
});

function render() {
  const visibleTasks = tasks.filter((task) => {
    if (currentFilter === 'active') return !task.completed;
    if (currentFilter === 'completed') return task.completed;
    return true;
  });

  list.innerHTML = '';

  visibleTasks.forEach((task) => {
    const item = document.createElement('li');
    item.className = 'todo-item';

    const label = document.createElement('label');
    label.className = 'todo-label';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = task.completed;
    checkbox.addEventListener('change', () => toggleTask(task.id));

    const text = document.createElement('span');
    text.textContent = task.text;
    text.className = task.completed ? 'is-complete' : '';

    label.append(checkbox, text);

    const removeButton = document.createElement('button');
    removeButton.textContent = 'Delete';
    removeButton.className = 'delete-button';
    removeButton.type = 'button';
    removeButton.addEventListener('click', () => deleteTask(task.id));

    item.append(label, removeButton);
    list.append(item);
  });

  emptyState.hidden = visibleTasks.length !== 0;
}

function toggleTask(taskId) {
  tasks = tasks.map((task) =>
    task.id === taskId ? { ...task, completed: !task.completed } : task,
  );

  saveTasks();
  render();
}

function deleteTask(taskId) {
  tasks = tasks.filter((task) => task.id !== taskId);
  saveTasks();
  render();
}

function loadTasks() {
  const saved = localStorage.getItem(STORAGE_KEY);

  if (!saved) return [];

  try {
    const parsed = JSON.parse(saved);

    // Validate shape so bad local data does not break the app.
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(
      (item) =>
        typeof item?.id === 'string' &&
        typeof item?.text === 'string' &&
        typeof item?.completed === 'boolean',
    );
  } catch {
    return [];
  }
}

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}
