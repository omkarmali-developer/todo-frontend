import { useEffect, useRef, useState } from 'react'

function priorityLabel(priority) {
  const p = (priority || 'MEDIUM').toUpperCase()
  if (p === 'HIGH') return 'High'
  if (p === 'LOW') return 'Low'
  return 'Medium'
}

export default function TodoItem({ todo, busyId, onToggle, onEdit, onDelete, whenLabel }) {
  const busy = busyId === todo.id
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)
  const priority = (todo.priority || 'MEDIUM').toUpperCase()
  const priorityClass =
    priority === 'HIGH' ? 'is-high' : priority === 'LOW' ? 'is-low' : 'is-medium'

  useEffect(() => {
    if (!menuOpen) return undefined
    const onDocClick = (e) => {
      if (!menuRef.current?.contains(e.target)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [menuOpen])

  return (
    <article className={`tf-task ${todo.completed ? 'is-done' : ''} ${menuOpen ? 'is-menu-open' : ''}`}>
      <button
        type="button"
        className={`tf-check ${todo.completed ? 'is-checked' : ''}`}
        disabled={busy}
        onClick={() => onToggle(todo)}
        aria-label={todo.completed ? 'Mark incomplete' : 'Mark complete'}
      />
      <div className="tf-task-body">
        <h3 className="tf-task-title">{todo.title}</h3>
        {whenLabel ? (
          <p className="tf-task-when">
            <span className="tf-clock" aria-hidden />
            {whenLabel}
          </p>
        ) : null}
      </div>
      <span className={`tf-priority ${priorityClass}`}>{priorityLabel(priority)}</span>
      <div className="tf-task-menu" ref={menuRef}>
        <button
          type="button"
          className="tf-icon-btn"
          aria-label="Task menu"
          aria-expanded={menuOpen}
          disabled={busy}
          onClick={() => setMenuOpen((v) => !v)}
        >
          ⋮
        </button>
        {menuOpen ? (
          <div className="tf-menu-pop" role="menu">
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setMenuOpen(false)
                onEdit(todo)
              }}
            >
              Edit
            </button>
            <button
              type="button"
              role="menuitem"
              className="is-danger"
              onClick={() => {
                setMenuOpen(false)
                onDelete(todo.id)
              }}
            >
              Delete
            </button>
          </div>
        ) : null}
      </div>
    </article>
  )
}
