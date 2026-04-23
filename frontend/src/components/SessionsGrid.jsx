const formatDateTime = (value) =>
  new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));

export const SessionsGrid = ({
  sessions, selectedSessionId, onSelect, eyebrow = "Recent Sessions", title = "Attendance Timeline", emptyTitle = "No Sessions Yet", emptyMessage = "Create your first class session to generate a QR code and begin collecting attendance."
}) => {
  if (!sessions.length) {
    return (
      <section className="modern-panel" style={{ height: '100%' }}>
        <div className="panel-heading">
          <div><p className="eyebrow">{eyebrow}</p><h2>{emptyTitle}</h2></div>
        </div>
        <p className="subtle-text">{emptyMessage}</p>
      </section>
    );
  }

  return (
    <section className="modern-panel" style={{ height: '100%' }}>
      <div className="panel-heading">
        <div><p className="eyebrow">{eyebrow}</p><h2>{title}</h2></div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {sessions.map((session) => {
          const isSelected = session.publicSessionId === selectedSessionId;

          return (
            <button
              key={session.publicSessionId}
              type="button"
              onClick={() => onSelect(session.publicSessionId)}
              style={{
                textAlign: 'left',
                background: isSelected ? 'rgba(139, 92, 246, 0.05)' : 'rgba(255, 255, 255, 0.02)',
                border: isSelected ? '1px solid #A855F7' : '1px solid var(--card-border)',
                boxShadow: isSelected ? '0 0 20px rgba(168, 85, 247, 0.15)' : 'none',
                borderRadius: '16px',
                padding: '20px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                outline: 'none',
                color: 'var(--text-primary)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div>
                  <h3 style={{ margin: '0 0 4px 0', fontSize: '16px' }}>{session.courseName}</h3>
                  <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>{session.section || "No section specified"}</p>
                </div>
                <span className={`status-badge ${session.status === "ACTIVE" ? "ok" : "danger"}`}>
                  {session.status}
                </span>
              </div>

              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '16px' }}>
                <p style={{ margin: 0 }}>Teacher: {session.teacherName}</p>
                <p style={{ margin: 0 }}>Started: {formatDateTime(session.startedAt)}</p>
              </div>

              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', fontSize: '12px', fontWeight: 600, background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px', border: '1px solid var(--card-border)' }}>
                <span style={{ color: '#E4E4E7' }}>Total: {session.totalStudents ?? 0}</span>
                <span style={{ color: '#4ADE80' }}>Present: {session.presentCount ?? session.attendanceCount ?? 0}</span>
                <span style={{ color: '#FCA5A5' }}>Absent: {session.absentCount ?? 0}</span>
                <span style={{ color: '#FCD34D' }}>Susp: {session.suspiciousCount ?? session.incidentCount ?? 0}</span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
};