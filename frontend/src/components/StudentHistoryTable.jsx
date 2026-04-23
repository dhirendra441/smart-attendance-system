const formatDateTime = (value) =>
  new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));

export const StudentHistoryTable = ({ records }) => {
  return (
    <section className="modern-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">My History</p>
          <h2>Attendance Timeline</h2>
        </div>
      </div>

      {!records.length ? (
        <p className="subtle-text">No attendance has been marked yet for this student account.</p>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Course</th>
                <th>Section</th>
                <th>Room</th>
                <th>Marked At</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <tr key={record.id}>
                  <td><strong>{record.session?.courseName || "Unknown course"}</strong></td>
                  <td>{record.session?.section || "Not provided"}</td>
                  <td>{record.session?.room || "Not provided"}</td>
                  <td>{formatDateTime(record.submittedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};