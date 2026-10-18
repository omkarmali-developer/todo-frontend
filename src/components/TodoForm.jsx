import { useEffect, useRef, useState } from 'react'

function toLocalDateValue(date = new Date()) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function toLocalTimeValue(date = new Date()) {
  const h = String(date.getHours()).padStart(2, '0')
  const min = String(date.getMinutes()).padStart(2, '0')
  return `${h}:${min}`
}

function splitCreatedFor(value) {
  if (!value) {
    const now = new Date()
    return { date: toLocalDateValue(now), time: toLocalTimeValue(now) }
  }
  if (Array.isArray(value) && value.length >= 3) {
    const [y, m, d, h = 0, min = 0] = value
    const parsed = new Date(y, m - 1, d, h, min)
    return { date: toLocalDateValue(parsed), time: toLocalTimeValue(parsed) }
  }
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    const [datePart, timePart = '00:00:00'] = String(value).split('T')
    return { date: datePart, time: timePart.slice(0, 5) }
  }
  return { date: toLocalDateValue(parsed), time: toLocalTimeValue(parsed) }
}

function combineCreatedFor(date, time) {
  if (!date) return null
  const safeTime = time && time.length >= 4 ? time : '00:00'
  return `${date}T${safeTime.length === 5 ? `${safeTime}:00` : safeTime}`
}

function formatScheduleHint(date, time) {
  if (!date) return 'Pick date & time'
  try {
    const value = combineCreatedFor(date, time)
    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) return `${date} ${time || ''}`.trim()
    return parsed.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  } catch {
    return `${date} ${time || ''}`.trim()
  }
}

function defaultForm() {
  const now = new Date()
  return {
    title: '',
    description: '',
    priority: 'MEDIUM',
    completed: false,
    date: toLocalDateValue(now),
    time: toLocalTimeValue(now),
  }
}

function CalendarIcon() {
  return (
    <svg className="tf-cal-svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <path d="M8 3.5v3.5M16 3.5v3.5M3.5 9.5h17" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <rect x="14.2" y="13.2" width="2.6" height="2.6" rx="0.6" fill="currentColor" />
    </svg>
  )
}

/** Compact quick-add bar (Taskify style) or expanded edit form. */
export default function TodoForm({
  initial,
  onSubmit,
  onCancel,
  submitting,
  disabled = false,
  variant = 'quick',
}) {
  const [form, setForm] = useState(defaultForm)
  const [pickerOpen, setPickerOpen] = useState(false)
  const pickerRef = useRef(null)
  const locked = disabled || submitting
  const isEdit = Boolean(initial)
  const isQuick = variant === 'quick' && !isEdit

  useEffect(() => {
    if (initial) {
      const { date, time } = splitCreatedFor(initial.createdFor)
      setForm({
        title: initial.title || '',
        description: initial.description || '',
        priority: initial.priority || 'MEDIUM',
        completed: Boolean(initial.completed),
        date,
        time,
      })
    } else {
      setForm(defaultForm())
    }
    setPickerOpen(false)
  }, [initial])

  useEffect(() => {
    if (!pickerOpen) return undefined
    const onDocClick = (e) => {
      if (!pickerRef.current?.contains(e.target)) setPickerOpen(false)
    }
    const onKey = (e) => {
      if (e.key === 'Escape') setPickerOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [pickerOpen])

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }))

  const handleSubmit = (e) => {
    e.preventDefault()
    if (disabled) return
    const title = form.title.trim()
    if (!title) return
    if (!form.date) return
    const description = (form.description || '').trim() || title
    onSubmit({
      title,
      description,
      priority: form.priority,
      completed: form.completed,
      createdFor: combineCreatedFor(form.date, form.time),
    })
    if (!isEdit) {
      setForm(defaultForm())
      setPickerOpen(false)
    }
  }

  if (isQuick) {
    return (
      <form className={`tf-quick-add ${pickerOpen ? 'is-picking' : ''}`} onSubmit={handleSubmit}>
        <span className="tf-quick-check" aria-hidden />
        <input
          required
          disabled={locked}
          value={form.title}
          onChange={(e) => setField('title', e.target.value)}
          placeholder="Add a new task..."
          aria-label="New task title"
        />
        <select
          className="tf-quick-priority"
          disabled={locked}
          value={form.priority}
          onChange={(e) => setField('priority', e.target.value)}
          aria-label="Priority"
        >
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>

        <div className="tf-cal-wrap" ref={pickerRef}>
          <button
            type="button"
            className={`tf-cal-btn ${pickerOpen ? 'is-open' : ''}`}
            disabled={locked}
            aria-label={`Schedule: ${formatScheduleHint(form.date, form.time)}`}
            title={formatScheduleHint(form.date, form.time)}
            onClick={() => setPickerOpen((v) => !v)}
          >
            <CalendarIcon />
          </button>
          {pickerOpen ? (
            <div className="tf-cal-pop" role="dialog" aria-label="Pick date and time">
              <label>
                Date
                <input
                  type="date"
                  required
                  disabled={locked}
                  value={form.date}
                  onChange={(e) => setField('date', e.target.value)}
                />
              </label>
              <label>
                Time
                <input
                  type="time"
                  required
                  disabled={locked}
                  value={form.time}
                  onChange={(e) => setField('time', e.target.value)}
                />
              </label>
              <button type="button" className="tf-cal-done" onClick={() => setPickerOpen(false)}>
                Done
              </button>
            </div>
          ) : null}
        </div>

        <button className="tf-btn-add" type="submit" disabled={locked}>
          {submitting ? '…' : 'Add'}
        </button>
      </form>
    )
  }

  return (
    <form className="tf-edit-form" onSubmit={handleSubmit}>
      <label>
        Title
        <input
          required
          disabled={locked}
          value={form.title}
          onChange={(e) => setField('title', e.target.value)}
        />
      </label>
      <label>
        Description
        <textarea
          disabled={locked}
          rows={2}
          value={form.description}
          onChange={(e) => setField('description', e.target.value)}
        />
      </label>
      <div className="tf-edit-datetime">
        <label>
          Date
          <input
            type="date"
            required
            disabled={locked}
            value={form.date}
            onChange={(e) => setField('date', e.target.value)}
          />
        </label>
        <label>
          Time
          <input
            type="time"
            required
            disabled={locked}
            value={form.time}
            onChange={(e) => setField('time', e.target.value)}
          />
        </label>
      </div>
      <label>
        Priority
        <select
          disabled={locked}
          value={form.priority}
          onChange={(e) => setField('priority', e.target.value)}
        >
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>
      </label>
      <div className="tf-edit-actions">
        <button className="tf-btn-add" type="submit" disabled={locked}>
          {submitting ? 'Saving…' : 'Save changes'}
        </button>
        <button className="tf-btn-ghost" type="button" onClick={onCancel} disabled={locked}>
          Cancel
        </button>
      </div>
    </form>
  )
}
