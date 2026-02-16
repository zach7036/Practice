import type { TodoItem, Priority, SortBy } from './types';

export function generateId(): string {
  return `todo-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function generateSubtaskId(): string {
  return `st-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function formatDueDate(ts: number): string {
  const d = new Date(ts);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(d);
  due.setHours(0, 0, 0, 0);
  const diff = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  if (diff > 0 && diff <= 7) return `In ${diff} days`;
  if (diff < 0 && diff >= -7) return `${Math.abs(diff)} days ago`;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: d.getFullYear() !== today.getFullYear() ? 'numeric' : undefined });
}

export function isOverdue(ts: number): boolean {
  const due = new Date(ts);
  due.setHours(23, 59, 59, 999);
  return Date.now() > due.getTime();
}

export function isDueToday(ts: number): boolean {
  const d = new Date(ts);
  const t = new Date();
  return d.getDate() === t.getDate() && d.getMonth() === t.getMonth() && d.getFullYear() === t.getFullYear();
}

const priorityOrder: Record<Priority, number> = { high: 3, medium: 2, low: 1 };

export function sortItems(items: TodoItem[], sortBy: SortBy): TodoItem[] {
  const copy = [...items];
  switch (sortBy) {
    case 'priority':
      copy.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);
      break;
    case 'dueDate':
      copy.sort((a, b) => {
        const ad = a.dueDate ?? Infinity;
        const bd = b.dueDate ?? Infinity;
        return ad - bd;
      });
      break;
    case 'createdAt':
      copy.sort((a, b) => a.createdAt - b.createdAt);
      break;
    default:
      copy.sort((a, b) => a.order - b.order);
  }
  return copy;
}

export function reorderItems(items: TodoItem[], fromIndex: number, toIndex: number): TodoItem[] {
  if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0 || fromIndex >= items.length || toIndex >= items.length) {
    return items;
  }
  const reordered = [...items];
  const [removed] = reordered.splice(fromIndex, 1);
  reordered.splice(toIndex, 0, removed);
  return reordered.map((item, i) => ({ ...item, order: i }));
}

export function moveItemInList(items: TodoItem[], id: string, direction: 'up' | 'down'): TodoItem[] {
  const idx = items.findIndex((i) => i.id === id);
  if (idx < 0) return items;
  const toIdx = direction === 'up' ? idx - 1 : idx + 1;
  if (toIdx < 0 || toIdx >= items.length) return items;
  return reorderItems(items, idx, toIdx);
}
