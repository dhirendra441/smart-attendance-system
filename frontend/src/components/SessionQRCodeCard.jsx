import { useEffect, useState } from "react";

const formatDateTime = (value) =>
  new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));

export const SessionQRCodeCard = ({ session, attendanceCount, incidentCount, onClose }) => {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!session || session.status !== "ACTIVE") return undefined;
    const intervalId = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(intervalId);
  }, [session]);

  const countdown = session && session.status === "ACTIVE"
      ? Math.max(0, Math.floor((new Date(session.expiresAt).getTime() - now) / 1000)) : 0;

  if (!session) {
    return (
      <section className="modern-panel" style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', minHeight: '300px' }}>
        <p className="eyebrow">Session Details</p>
        <h2 style={{ marginBottom: '8px' }}>Select a Session</h2>
        <p className="subtle-text">Pick any session from the list to view the QR code and attendance.</p>
      </section>
    );
  }

  return (
    <section className="modern-panel" style={{ height: '100%' }}>
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Live QR</p>
          <h2>{session.courseName}</h2>
        </div>
        <span className={`status-badge ${session.status === "ACTIVE" ? "ok" : "danger"}`}>
          {session.status}
        </span>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '32px', marginTop: '16px' }}>
        <div style={{ background: '#FFFFFF', padding: '16px', borderRadius: '16px', border: '1px solid var(--card-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img src={session.qrCodeDataUrl} alt="QR code" style={{ width: '200px', height: '200px', borderRadius: '8px' }} />
        </div>

        <div style={{ flex: 1, minWidth: '250px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px', color: 'var(--text-secondary)' }}>
          <p style={{ margin: 0 }}><strong>Session ID:</strong> {session.publicSessionId}</p>
          <p style={{ margin: 0 }}><strong>Teacher:</strong> {session.teacher?.name || session.teacherName}</p>
          <p style={{ margin: 0 }}><strong>Section:</strong> {session.section || "Not provided"}</p>
          <p style={{ margin: 0 }}><strong>Room:</strong> {session.room || "Not provided"}</p>
          
          <p style={{ margin: 0 }}><strong>Created:</strong> {formatDateTime(session.startedAt)}</p>
          <p style={{ margin: 0 }}><strong>Expires:</strong> {formatDateTime(session.expiresAt)}</p>
          
          <div style={{ display: 'flex', gap: '16px', marginTop: '8px', padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', border: '1px solid var(--card-border)' }}>
            <p style={{ margin: 0 }}><strong>Present:</strong> <span style={{ color: '#4ADE80' }}>{attendanceCount}</span></p>
            <p style={{ margin: 0 }}><strong>Incidents:</strong> <span style={{ color: '#F87171' }}>{incidentCount}</span></p>
            <p style={{ margin: 0 }}><strong>Timer:</strong> {session.status === "ACTIVE" ? `${countdown}s left` : "Ended"}</p>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: 'auto', paddingTop: '16px' }}>
            <a className="secondary-button" href={session.attendanceLink} target="_blank" rel="noreferrer" style={{ textAlign: 'center', flex: 1 }}>
              Open Link
            </a>
            <button type="button" className="ghost-button" onClick={() => { navigator.clipboard.writeText(session.attendanceLink); alert("Copied!"); }} style={{ flex: 1, border: '1px solid var(--card-border)' }}>
              Copy Link
            </button>
            {session.status === "ACTIVE" && (
              <button type="button" className="ghost-button" onClick={onClose} style={{ color: '#FCA5A5', border: '1px solid rgba(220, 38, 38, 0.3)' }}>
                Close Session
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};