export type Priority = 'low' | 'medium' | 'high';

export type SubTask = {
  id: string;
  text: string;
  done: boolean;
};

export type TodoItem = {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
  priority: Priority;
  dueDate: number | null;
  note: string;
  order: number;
  tag: string;
  subtasks: SubTask[];
};

export type Filter = 'all' | 'active' | 'completed';

export type SortBy = 'order' | 'priority' | 'dueDate' | 'createdAt';

export type Theme = 'dark' | 'light';

export const TAGS = ['', 'Work', 'Personal', 'Shopping', 'Health', 'Other'] as const;
export type Tag = (typeof TAGS)[number];
