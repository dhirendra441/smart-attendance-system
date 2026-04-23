const formatDateTime = (value) =>
  new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  }).format(new Date(value));

export const AttendanceTable = ({ attendance }) => {
  return (
    <section className="modern-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Attendance Records</p>
          <h2>Present Students</h2>
        </div>
      </div>

      {!attendance.length ? (
        <p className="subtle-text">No student has marked attendance for this session yet.</p>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Student</th>
                <th>Roll Number</th>
                <th>Time</th>
                <th>Device</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {attendance.map((record) => (
                <tr key={record._id}>
                  <td><strong>{record.student?.name || record.studentName || "Not provided"}</strong></td>
                  <td>{record.student?.rollNumber || record.rollNumber || "Not provided"}</td>
                  <td>{formatDateTime(record.submittedAt)}</td>
                  <td>
                    <strong style={{ display: 'block', fontSize: '13px' }}>{record.device?.ipAddress || "Unknown IP"}</strong>
                    <div className="subtle-text" style={{ fontSize: '12px' }}>{record.device?.clientMeta?.platform || "Unknown device"}</div>
                  </td>
                  <td>
                    <span className={`status-badge ${record.suspicious ? "danger" : "ok"}`}>
                      {record.suspicious ? "Proxy Suspected" : "Accepted"}
                    </span>
                    {record.suspiciousReason && <p style={{ fontSize: '12px', color: '#FCA5A5', marginTop: '4px', marginBottom: 0 }}>{record.suspiciousReason}</p>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};