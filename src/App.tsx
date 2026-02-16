import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { loadItems, saveItems, loadTheme, saveTheme } from './storage';
import { generateId, sortItems, reorderItems, moveItemInList } from './utils';
import type { TodoItem, Filter, SortBy, Priority, Theme } from './types';
import { isDueToday, isOverdue } from './utils';
import { TodoRow } from './TodoRow';
import './index.css';

const UNDO_DURATION_MS = 5000;
const CELEBRATION_DURATION_MS = 3000;

function getNextOrder(items: TodoItem[]): number {
  if (items.length === 0) return 0;
  return Math.max(...items.map((i) => i.order), 0) + 1;
}

const App: React.FC = () => {
  const [items, setItems] = useState<TodoItem[]>(loadItems);
  const [input, setInput] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [sortBy, setSortBy] = useState<SortBy>('order');
  const [search, setSearch] = useState('');
  const [tagFilter, setTagFilter] = useState<string>('');
  const [quickFilter, setQuickFilter] = useState<'none' | 'dueToday' | 'overdue'>('none');
  const [theme, setThemeState] = useState<Theme>(loadTheme);
  const [undoItem, setUndoItem] = useState<TodoItem | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const undoTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const celebrationRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevActiveCountRef = useRef<number>(items.filter((i) => !i.completed).length);

  useEffect(() => {
    saveItems(items);
  }, [items]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    saveTheme(theme);
  }, [theme]);

  const activeCount = items.filter((i) => !i.completed).length;
  const completedCount = items.filter((i) => i.completed).length;

  useEffect(() => {
    if (prevActiveCountRef.current > 0 && activeCount === 0 && completedCount > 0) {
      setShowCelebration(true);
      if (celebrationRef.current) clearTimeout(celebrationRef.current);
      celebrationRef.current = setTimeout(() => {
        setShowCelebration(false);
        celebrationRef.current = null;
      }, CELEBRATION_DURATION_MS);
    }
    prevActiveCountRef.current = activeCount;
  }, [activeCount, completedCount]);

  const setTheme = useCallback((t: Theme) => setThemeState(t), []);

  const addTodo = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed) return;
    const order = getNextOrder(items);
    setItems((prev) => [
      ...prev,
      {
        id: generateId(),
        text: trimmed,
        completed: false,
        createdAt: Date.now(),
        priority: 'medium',
        dueDate: null,
        note: '',
        order,
        tag: '',
        subtasks: [],
      },
    ]);
    setInput('');
  }, [input, items]);

  const toggleTodo = useCallback((id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  }, []);

  const editTodo = useCallback((id: string, text: string) => {
    const t = text.trim();
    if (!t) return;
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, text: t } : item))
    );
  }, []);

  const setPriority = useCallback((id: string, priority: Priority) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, priority } : item))
    );
  }, []);

  const setDueDate = useCallback((id: string, dueDate: number | null) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, dueDate } : item))
    );
  }, []);

  const setNote = useCallback((id: string, note: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, note } : item))
    );
  }, []);

  const setSubtasks = useCallback((id: string, subtasks: TodoItem['subtasks']) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, subtasks } : item))
    );
  }, []);

  const setTag = useCallback((id: string, tag: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, tag } : item))
    );
  }, []);

  const deleteTodo = useCallback((id: string) => {
    const item = items.find((i) => i.id === id);
    if (item) {
      setItems((prev) => prev.filter((i) => i.id !== id));
      setUndoItem(item);
      if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
      undoTimeoutRef.current = setTimeout(() => {
        setUndoItem(null);
        undoTimeoutRef.current = null;
      }, UNDO_DURATION_MS);
    }
  }, [items]);

  const undoDelete = useCallback(() => {
    if (undoItem) {
      setItems((prev) => [...prev, undoItem].sort((a, b) => a.order - b.order));
      setUndoItem(null);
      if (undoTimeoutRef.current) {
        clearTimeout(undoTimeoutRef.current);
        undoTimeoutRef.current = null;
      }
    }
  }, [undoItem]);

  const clearCompleted = useCallback(() => {
    setItems((prev) => prev.filter((item) => !item.completed));
  }, []);

  const filteredByStatus =
    filter === 'active'
      ? items.filter((i) => !i.completed)
      : filter === 'completed'
      ? items.filter((i) => i.completed)
      : items;

  const filteredByTag =
    tagFilter === ''
      ? filteredByStatus
      : filteredByStatus.filter((i) => i.tag === tagFilter);

  const filteredByQuick =
    quickFilter === 'none'
      ? filteredByTag
      : quickFilter === 'dueToday'
      ? filteredByTag.filter((i) => i.dueDate != null && isDueToday(i.dueDate))
      : filteredByTag.filter((i) => i.dueDate != null && isOverdue(i.dueDate));

  const searchLower = search.trim().toLowerCase();
  const filtered =
    searchLower === ''
      ? filteredByQuick
      : filteredByQuick.filter((i) =>
          i.text.toLowerCase().includes(searchLower)
        );

  const sorted = useMemo(() => sortItems(filtered, sortBy), [filtered, sortBy]);

  const applyReorder = useCallback((reordered: TodoItem[]) => {
    const byId = new Map(reordered.map((item, i) => [item.id, { ...item, order: i }]));
    setItems((prev) =>
      prev.map((item) => (byId.has(item.id) ? byId.get(item.id)! : item))
    );
  }, []);

  const handleDragStart = useCallback((index: number) => setDragIndex(index), []);
  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  }, []);
  const handleDrop = useCallback(
    (e: React.DragEvent, toIndex: number) => {
      e.preventDefault();
      setDragOverIndex(null);
      if (dragIndex == null || dragIndex === toIndex) {
        setDragIndex(null);
        return;
      }
      const reordered = reorderItems(sorted, dragIndex, toIndex);
      applyReorder(reordered);
      setDragIndex(null);
    },
    [dragIndex, sorted, applyReorder]
  );
  const handleDragEnd = useCallback(() => {
    setDragIndex(null);
    setDragOverIndex(null);
  }, []);

  const handleMoveUp = useCallback(
    (id: string) => {
      const idx = sorted.findIndex((i) => i.id === id);
      if (idx <= 0) return;
      const reordered = moveItemInList(sorted, id, 'up');
      applyReorder(reordered);
    },
    [sorted, applyReorder]
  );
  const handleMoveDown = useCallback(
    (id: string) => {
      const idx = sorted.findIndex((i) => i.id === id);
      if (idx < 0 || idx >= sorted.length - 1) return;
      const reordered = moveItemInList(sorted, id, 'down');
      applyReorder(reordered);
    },
    [sorted, applyReorder]
  );

  const handleExport = useCallback(() => {
    const blob = new Blob([JSON.stringify(items, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `todo-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [items]);

  const handleImport = useCallback(() => {
    const inputEl = document.createElement('input');
    inputEl.type = 'file';
    inputEl.accept = 'application/json';
    inputEl.onchange = () => {
      const file = inputEl.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const raw = reader.result as string;
          const parsed = JSON.parse(raw);
          const next = Array.isArray(parsed) ? parsed : [];
          if (next.length === 0) return;
          if (window.confirm(`Import ${next.length} task(s)? This will replace your current list.`)) {
            setItems(next.map((item: TodoItem) => ({ ...item, subtasks: item.subtasks ?? [], tag: item.tag ?? '' })));
          }
        } catch {
          window.alert('Invalid file.');
        }
      };
      reader.readAsText(file);
    };
    inputEl.click();
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('main-todo-input')?.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const emptyMessage =
    filter === 'all' && items.length === 0
      ? 'Nothing on your list yet. Add a task above to get started.'
      : filter === 'all' && search
      ? 'No tasks match your search.'
      : filter === 'active'
      ? 'No active tasks. Mark some complete or add new ones.'
      : filter === 'completed'
      ? 'No completed tasks yet.'
      : quickFilter === 'dueToday'
      ? 'No tasks due today.'
      : quickFilter === 'overdue'
      ? 'No overdue tasks.'
      : 'No tasks match.';

  const isOrderSort = sortBy === 'order';
  const tagsForFilter = useMemo(() => {
    const set = new Set<string>();
    items.forEach((i) => i.tag && set.add(i.tag));
    return ['', ...Array.from(set)];
  }, [items]);

  return (
    <div className="todo-app">
      <div className="todo-card">
        <header className="todo-header">
          <div>
            <h1 className="todo-title">Tasks</h1>
            <p className="todo-subtitle">
              Add tasks, set priorities and due dates. Click a task to edit. Use the checklist for steps.
            </p>
          </div>
          <button
            type="button"
            className="todo-theme-toggle"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </header>

        <div className="todo-input-wrap">
          <input
            id="main-todo-input"
            type="text"
            className="todo-input"
            placeholder="What needs doing? (Enter to add)"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addTodo()}
            aria-label="New task"
          />
          <button type="button" className="todo-add" onClick={addTodo} aria-label="Add task">
            Add
          </button>
        </div>

        <div className="todo-toolbar">
          <div className="todo-search-wrap">
            <span className="todo-search-icon" aria-hidden>🔍</span>
            <input
              type="search"
              className="todo-search"
              placeholder="Search tasks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search tasks"
            />
          </div>
          <select
            className="todo-sort"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortBy)}
            aria-label="Sort by"
          >
            <option value="order">Order</option>
            <option value="priority">Priority</option>
            <option value="dueDate">Due date</option>
            <option value="createdAt">Date added</option>
          </select>
        </div>

        <div className="todo-filters">
          {(['all', 'active', 'completed'] as const).map((f) => (
            <button
              key={f}
              type="button"
              className={`todo-filter ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? 'All' : f === 'active' ? 'To do' : 'Done'}
            </button>
          ))}
        </div>

        <div className="todo-quick-filters">
          <button
            type="button"
            className={`todo-quick-filter ${quickFilter === 'dueToday' ? 'active' : ''}`}
            onClick={() => setQuickFilter(quickFilter === 'dueToday' ? 'none' : 'dueToday')}
          >
            Due today
          </button>
          <button
            type="button"
            className={`todo-quick-filter ${quickFilter === 'overdue' ? 'active' : ''}`}
            onClick={() => setQuickFilter(quickFilter === 'overdue' ? 'none' : 'overdue')}
          >
            Overdue
          </button>
          <select
            className="todo-tag-filter"
            value={tagFilter}
            onChange={(e) => setTagFilter(e.target.value)}
            aria-label="Filter by tag"
          >
            <option value="">All tags</option>
            {tagsForFilter.filter(Boolean).map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <ul className="todo-list" aria-label="Task list">
          {sorted.length === 0 ? (
            <li className="todo-empty">
              <span className="todo-empty-icon">📋</span>
              <p>{emptyMessage}</p>
              {items.length === 0 && (
                <p className="todo-empty-hint">
                  Tip: Press <kbd>Ctrl</kbd>+<kbd>K</kbd> (or <kbd>⌘</kbd>+<kbd>K</kbd> on Mac) to focus the input anytime.
                </p>
              )}
            </li>
          ) : (
            sorted.map((item, index) => (
              <TodoRow
                key={item.id}
                item={item}
                index={index}
                isDraggable={isOrderSort}
                isDragOver={dragOverIndex === index}
                onToggle={toggleTodo}
                onEdit={editTodo}
                onPriorityChange={setPriority}
                onDueDateChange={setDueDate}
                onNoteChange={setNote}
                onSubtasksChange={setSubtasks}
                onTagChange={setTag}
                onDelete={deleteTodo}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onDragEnd={handleDragEnd}
                onMoveUp={isOrderSort ? handleMoveUp : undefined}
                onMoveDown={isOrderSort ? handleMoveDown : undefined}
              />
            ))
          )}
        </ul>

        <footer className="todo-footer">
          <span className="todo-count">
            <strong>{activeCount}</strong> {activeCount === 1 ? 'task' : 'tasks'} left
            {completedCount > 0 && (
              <> · <strong>{completedCount}</strong> done</>
            )}
          </span>
          <div className="todo-footer-actions">
            <button type="button" className="todo-export-btn" onClick={handleExport}>
              Export
            </button>
            <button type="button" className="todo-import-btn" onClick={handleImport}>
              Import
            </button>
            {completedCount > 0 && (
              <button type="button" className="todo-clear" onClick={clearCompleted}>
                Clear completed
              </button>
            )}
          </div>
        </footer>
      </div>

      {undoItem && (
        <div className="todo-toast" role="status">
          <span>Task removed</span>
          <button type="button" className="todo-toast-undo" onClick={undoDelete}>
            Undo
          </button>
        </div>
      )}

      {showCelebration && (
        <div className="todo-celebration" role="status">
          <span className="todo-celebration-emoji">🎉</span>
          <span>All tasks complete!</span>
        </div>
      )}
    </div>
  );
};

export default App;
