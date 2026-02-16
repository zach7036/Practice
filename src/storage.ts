import type { TodoItem } from './types';

const STORAGE_KEY = 'todo-app-items';
const THEME_KEY = 'todo-app-theme';

const VALID_TAGS = ['', 'Work', 'Personal', 'Shopping', 'Health', 'Other'];

function migrateItem(raw: unknown): TodoItem {
  if (raw && typeof raw === 'object' && 'id' in raw && 'text' in raw) {
    const o = raw as Record<string, unknown>;
    const rawSubtasks = o.subtasks;
    const subtasks: TodoItem['subtasks'] = Array.isArray(rawSubtasks)
      ? rawSubtasks
        .filter((s): s is Record<string, unknown> => s && typeof s === 'object' && 'id' in s && 'text' in s)
        .map((s) => ({
          id: String(s.id),
          text: String(s.text),
          done: Boolean(s.done),
        }))
      : [];
    const tag = typeof o.tag === 'string' && VALID_TAGS.includes(o.tag) ? o.tag : '';
    return {
      id: String(o.id),
      text: String(o.text),
      completed: Boolean(o.completed),
      createdAt: Number(o.createdAt) || Date.now(),
      priority: (o.priority as TodoItem['priority']) || 'medium',
      dueDate: typeof o.dueDate === 'number' ? o.dueDate : null,
      note: typeof o.note === 'string' ? o.note : '',
      order: typeof o.order === 'number' ? o.order : (o.createdAt ? Number(o.createdAt) : Date.now()),
      tag,
      subtasks,
    };
  }
  return null as unknown as TodoItem;
}

export function loadItems(): TodoItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(migrateItem).filter(Boolean);
  } catch {
    return [];
  }
}

export function saveItems(items: TodoItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function loadTheme(): 'dark' | 'light' {
  try {
    const t = localStorage.getItem(THEME_KEY);
    if (t === 'light' || t === 'dark') return t;
  } catch {}
  return 'dark';
}

export function saveTheme(theme: 'dark' | 'light') {
  localStorage.setItem(THEME_KEY, theme);
}
