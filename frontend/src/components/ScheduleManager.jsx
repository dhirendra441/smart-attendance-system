import { useMemo, useState } from "react";

const DAY_OPTIONS = [
  { value: "MON", label: "Mon" },
  { value: "TUE", label: "Tue" },
  { value: "WED", label: "Wed" },
  { value: "THU", label: "Thu" },
  { value: "FRI", label: "Fri" },
  { value: "SAT", label: "Sat" },
  { value: "SUN", label: "Sun" }
];

const buildInitialState = () => ({
  courseName: "",
  section: "",
  room: "",
  days: ["MON", "TUE", "WED", "THU", "FRI"],
  startTime: "09:00",
  classDurationMinutes: 60,
  qrValidityMinutes: 2,
  isActive: true
});

export const ScheduleManager = ({ schedules, onCreate, onUpdate, onDelete, isSubmitting }) => {
  const [formState, setFormState] = useState(buildInitialState);
  const [editingScheduleId, setEditingScheduleId] = useState("");

  const submitLabel = useMemo(
    () => (editingScheduleId ? "Update Schedule" : "Create Schedule"),
    [editingScheduleId]
  );

  const handleInputChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormState((current) => ({
      ...current,
      [name]: type === "checkbox" && name === "isActive" ? checked : value
    }));
  };

  const handleDayToggle = (dayValue) => {
    setFormState((current) => {
      const hasDay = current.days.includes(dayValue);
      const nextDays = hasDay
        ? current.days.filter((day) => day !== dayValue)
        : [...current.days, dayValue];
      return { ...current, days: nextDays };
    });
  };

  const resetForm = () => {
    setEditingScheduleId("");
    setFormState(buildInitialState());
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const payload = {
      ...formState,
      classDurationMinutes: Number(formState.classDurationMinutes),
      qrValidityMinutes: Number(formState.qrValidityMinutes)
    };

    const wasSuccessful = editingScheduleId
      ? await onUpdate(editingScheduleId, payload)
      : await onCreate(payload);

    if (wasSuccessful) resetForm();
  };

  const handleEdit = (schedule) => {
    setEditingScheduleId(schedule._id);
    setFormState({
      courseName: schedule.courseName,
      section: schedule.section,
      room: schedule.room,
      days: schedule.days,
      startTime: schedule.startTime,
      classDurationMinutes: schedule.classDurationMinutes,
      qrValidityMinutes: schedule.qrValidityMinutes,
      isActive: schedule.isActive
    });
  };

  return (
    <section className="modern-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">My Schedule</p>
          <h2>Recurring Classes</h2>
        </div>
        {editingScheduleId && (
          <button type="button" className="ghost-button" onClick={resetForm}>
            Cancel Edit
          </button>
        )}
      </div>

      <form className="session-form" onSubmit={handleSubmit} style={{ marginBottom: '32px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
          <label>Course Name <input name="courseName" value={formState.courseName} onChange={handleInputChange} required /></label>
          <label>Section <input name="section" value={formState.section} onChange={handleInputChange} /></label>
          <label>Room <input name="room" value={formState.room} onChange={handleInputChange} /></label>
        </div>

        <div className="day-picker" style={{ marginTop: '8px' }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '8px' }}>Days</span>
          <div className="chip-row" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {DAY_OPTIONS.map((day) => {
              const isSelected = formState.days.includes(day.value);
              return (
                <button
                  key={day.value}
                  type="button"
                  style={{
                    padding: '8px 16px',
                    borderRadius: '99px',
                    border: '1px solid var(--card-border)',
                    background: isSelected ? 'var(--gradient-ai)' : 'rgba(255, 255, 255, 0.05)',
                    color: isSelected ? '#FFFFFF' : '#A1A1AA',
                    fontWeight: 600,
                    fontSize: '13px',
                    cursor: 'pointer',
                    boxShadow: isSelected ? '0 4px 12px rgba(168, 85, 247, 0.3)' : 'none',
                    transition: 'all 0.2s'
                  }}
                  onClick={() => handleDayToggle(day.value)}
                >
                  {day.label}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '20px', marginTop: '8px' }}>
          <label>Start Time <input name="startTime" type="time" value={formState.startTime} onChange={handleInputChange} required /></label>
          <label>Duration (mins) <input name="classDurationMinutes" type="number" min="1" max="240" value={formState.classDurationMinutes} onChange={handleInputChange} required /></label>
          <label>QR Validity (mins) <input name="qrValidityMinutes" type="number" min="1" max="10" value={formState.qrValidityMinutes} onChange={handleInputChange} required /></label>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '16px' }}>
          <label style={{ flexDirection: 'row', alignItems: 'center', gap: '8px', cursor: 'pointer', textTransform: 'none' }}>
            <input name="isActive" type="checkbox" checked={formState.isActive} onChange={handleInputChange} style={{ width: '18px', height: '18px' }} />
            Active Schedule
          </label>

          <button type="submit" className="primary-button" disabled={isSubmitting || !formState.days.length} style={{ marginTop: 0, width: 'auto' }}>
            {isSubmitting ? "Saving..." : submitLabel}
          </button>
        </div>
      </form>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Course</th>
              <th>Days</th>
              <th>Start</th>
              <th>Class</th>
              <th>QR</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {!schedules.length ? (
              <tr><td colSpan="7" style={{ textAlign: 'center' }}>No schedules created yet.</td></tr>
            ) : (
              schedules.map((schedule) => (
                <tr key={schedule._id}>
                  <td>
                    <strong>{schedule.courseName}</strong>
                    <div className="subtle-text" style={{ fontSize: '13px' }}>{schedule.section || "No section"}</div>
                  </td>
                  <td>{(schedule.dayLabels || schedule.days).join(", ")}</td>
                  <td>{schedule.startTime}</td>
                  <td>{schedule.classDurationMinutes}m</td>
                  <td>{schedule.qrValidityMinutes}m</td>
                  <td>
                    <span className={`status-badge ${schedule.isActive ? "ok" : "danger"}`}>
                      {schedule.isActive ? "Active" : "Paused"}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button type="button" className="ghost-button" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => handleEdit(schedule)}>Edit</button>
                      <button type="button" className="ghost-button" style={{ padding: '6px 12px', fontSize: '12px', color: '#FCA5A5' }} onClick={() => onDelete(schedule._id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};