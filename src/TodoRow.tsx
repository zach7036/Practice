import React, { useState, useRef, useEffect } from 'react';
import type { TodoItem, Priority, SubTask } from './types';
import { formatDueDate, isOverdue, isDueToday, generateSubtaskId } from './utils';
import './TodoRow.css';

type Props = {
  item: TodoItem;
  index: number;
  isDraggable: boolean;
  isDragOver: boolean;
  onToggle: (id: string) => void;
  onEdit: (id: string, text: string) => void;
  onPriorityChange: (id: string, priority: Priority) => void;
  onDueDateChange: (id: string, dueDate: number | null) => void;
  onNoteChange: (id: string, note: string) => void;
  onSubtasksChange: (id: string, subtasks: SubTask[]) => void;
  onTagChange: (id: string, tag: string) => void;
  onDelete: (id: string) => void;
  onDragStart?: (index: number) => void;
  onDragOver?: (e: React.DragEvent, index: number) => void;
  onDrop?: (e: React.DragEvent, index: number) => void;
  onDragEnd?: () => void;
  onMoveUp?: (id: string) => void;
  onMoveDown?: (id: string) => void;
};

const PRIORITY_LABELS: Record<Priority, string> = { low: 'Low', medium: 'Medium', high: 'High' };

export const TodoRow: React.FC<Props> = ({
  item,
  index,
  isDraggable,
  isDragOver,
  onToggle,
  onEdit,
  onPriorityChange,
  onDueDateChange,
  onNoteChange,
  onSubtasksChange,
  onTagChange,
  onDelete,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  onMoveUp,
  onMoveDown,
}) => {
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(item.text);
  const [showNote, setShowNote] = useState(false);
  const [noteInput, setNoteInput] = useState(item.note);
  const [showSubtasks, setShowSubtasks] = useState(false);
  const [subtaskInput, setSubtaskInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const subtaskInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  useEffect(() => {
    if (showSubtasks && subtaskInputRef.current) {
      subtaskInputRef.current.focus();
    }
  }, [showSubtasks]);

  const commitEdit = () => {
    const t = editText.trim();
    if (t && t !== item.text) onEdit(item.id, t);
    setEditing(false);
  };

  const commitNote = () => {
    if (noteInput !== item.note) onNoteChange(item.id, noteInput);
    setShowNote(false);
  };

  const addSubtask = () => {
    const t = subtaskInput.trim();
    if (!t) return;
    onSubtasksChange(item.id, [
      ...item.subtasks,
      { id: generateSubtaskId(), text: t, done: false },
    ]);
    setSubtaskInput('');
  };

  const toggleSubtask = (subId: string) => {
    onSubtasksChange(
      item.id,
      item.subtasks.map((s) => (s.id === subId ? { ...s, done: !s.done } : s))
    );
  };

  const removeSubtask = (subId: string) => {
    onSubtasksChange(item.id, item.subtasks.filter((s) => s.id !== subId));
  };

  const dueLabel = item.dueDate ? formatDueDate(item.dueDate) : null;
  const overdue = item.dueDate ? isOverdue(item.dueDate) : false;
  const dueToday = item.dueDate ? isDueToday(item.dueDate) : false;
  const subtaskDoneCount = item.subtasks.filter((s) => s.done).length;
  const subtaskTotal = item.subtasks.length;

  return (
    <li
      className={`todo-row ${item.completed ? 'completed' : ''} ${editing ? 'editing' : ''} ${isDragOver ? 'drag-over' : ''}`}
      data-priority={item.priority}
      draggable={isDraggable}
      onDragStart={() => onDragStart?.(index)}
      onDragOver={(e) => onDragOver?.(e, index)}
      onDrop={(e) => onDrop?.(e, index)}
      onDragEnd={() => onDragEnd?.()}
    >
      {isDraggable && (
        <span className="todo-row-drag" aria-hidden title="Drag to reorder">
          ⋮⋮
        </span>
      )}
      <button
        type="button"
        className="todo-row-check"
        onClick={() => onToggle(item.id)}
        aria-label={item.completed ? 'Mark incomplete' : 'Mark complete'}
        aria-pressed={item.completed}
      >
        {item.completed && <span className="todo-row-check-mark" aria-hidden>✓</span>}
      </button>

      <div className="todo-row-main">
        {editing ? (
          <input
            ref={inputRef}
            type="text"
            className="todo-row-edit-input"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitEdit();
              if (e.key === 'Escape') {
                setEditText(item.text);
                setEditing(false);
              }
            }}
            aria-label="Edit task"
          />
        ) : (
          <button
            type="button"
            className="todo-row-text-wrap"
            onClick={() => setEditing(true)}
          >
            <span className="todo-row-text">{item.text}</span>
          </button>
        )}

        <div className="todo-row-meta">
          <select
            className="todo-row-priority"
            value={item.priority}
            onChange={(e) => onPriorityChange(item.id, e.target.value as Priority)}
            onClick={(e) => e.stopPropagation()}
            aria-label="Priority"
          >
            {(['low', 'medium', 'high'] as const).map((p) => (
              <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>
            ))}
          </select>

          <select
            className="todo-row-tag-select"
            value={item.tag}
            onChange={(e) => onTagChange(item.id, e.target.value)}
            onClick={(e) => e.stopPropagation()}
            aria-label="Tag"
            title="Tag"
          >
            <option value="">No tag</option>
            <option value="Work">Work</option>
            <option value="Personal">Personal</option>
            <option value="Shopping">Shopping</option>
            <option value="Health">Health</option>
            <option value="Other">Other</option>
          </select>

          {item.dueDate && (
            <span className={`todo-row-due ${overdue ? 'overdue' : ''} ${dueToday ? 'today' : ''}`}>
              {dueLabel}
            </span>
          )}

          {!showNote && (
            <button
              type="button"
              className="todo-row-note-btn"
              onClick={() => setShowNote(true)}
              title={item.note ? 'View or edit note' : 'Add note'}
            >
              {item.note ? '📝' : '+ Note'}
            </button>
          )}

          <button
            type="button"
            className="todo-row-subtasks-btn"
            onClick={() => setShowSubtasks(!showSubtasks)}
            title="Checklist"
          >
            ✓ {subtaskTotal > 0 ? `${subtaskDoneCount}/${subtaskTotal}` : 'List'}
          </button>
        </div>

        {showNote && (
          <div className="todo-row-note-panel" onClick={(e) => e.stopPropagation()}>
            <textarea
              className="todo-row-note-input"
              placeholder="Add a note..."
              value={noteInput}
              onChange={(e) => setNoteInput(e.target.value)}
              onBlur={commitNote}
              rows={2}
            />
            <button type="button" className="todo-row-note-close" onClick={commitNote}>
              Done
            </button>
          </div>
        )}

        {showSubtasks && (
          <div className="todo-row-subtasks-panel" onClick={(e) => e.stopPropagation()}>
            <div className="todo-row-subtasks-list">
              {item.subtasks.map((s) => (
                <div key={s.id} className="todo-row-subtask">
                  <button
                    type="button"
                    className={`todo-row-subtask-check ${s.done ? 'done' : ''}`}
                    onClick={() => toggleSubtask(s.id)}
                  >
                    {s.done && '✓'}
                  </button>
                  <span className={s.done ? 'todo-row-subtask-text done' : 'todo-row-subtask-text'}>{s.text}</span>
                  <button type="button" className="todo-row-subtask-remove" onClick={() => removeSubtask(s.id)} aria-label="Remove">×</button>
                </div>
              ))}
            </div>
            <div className="todo-row-subtask-add">
              <input
                ref={subtaskInputRef}
                type="text"
                placeholder="Add step..."
                value={subtaskInput}
                onChange={(e) => setSubtaskInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addSubtask()}
              />
              <button type="button" onClick={addSubtask}>Add</button>
            </div>
          </div>
        )}
      </div>

      <div className="todo-row-actions">
        {onMoveUp != null && (
          <button type="button" className="todo-row-move" onClick={() => onMoveUp(item.id)} aria-label="Move up">↑</button>
        )}
        {onMoveDown != null && (
          <button type="button" className="todo-row-move" onClick={() => onMoveDown(item.id)} aria-label="Move down">↓</button>
        )}
        <input
          type="date"
          className="todo-row-date-input"
          value={item.dueDate ? new Date(item.dueDate).toISOString().slice(0, 10) : ''}
          onChange={(e) => {
            const v = e.target.value;
            onDueDateChange(item.id, v ? new Date(v).getTime() : null);
          }}
          onClick={(e) => e.stopPropagation()}
          aria-label="Due date"
          title="Set due date"
        />
        <button
          type="button"
          className="todo-row-delete"
          onClick={() => onDelete(item.id)}
          aria-label="Delete"
        >
          ×
        </button>
      </div>
    </li>
  );
};
