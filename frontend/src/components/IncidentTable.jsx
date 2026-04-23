const formatDateTime = (value) =>
  new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));

export const IncidentTable = ({ incidents, title = "Security Incidents" }) => {
  return (
    <section className="modern-panel" style={{ height: '100%' }}>
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Review Queue</p>
          <h2>{title}</h2>
        </div>
      </div>

      {!incidents.length ? (
        <p className="subtle-text">No suspicious or blocked attempts have been recorded yet.</p>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Student</th>
                <th>Type</th>
                <th>Reason</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {incidents.map((incident) => (
                <tr key={incident._id || incident.id}>
                  <td><strong>{incident.student?.name || incident.studentName || "Unknown student"}</strong></td>
                  <td>
                    <span className="status-badge danger">{incident.attemptType}</span>
                  </td>
                  <td>{incident.reason}</td>
                  <td>{formatDateTime(incident.createdAt || incident.timestamp)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};