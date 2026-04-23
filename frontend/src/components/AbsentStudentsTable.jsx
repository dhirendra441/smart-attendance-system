export const AbsentStudentsTable = ({ absentStudents }) => {
  return (
    <section className="modern-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Absent Students</p>
          <h2>Did Not Attend</h2>
        </div>
      </div>

      {!absentStudents.length ? (
        <p className="subtle-text">No absentees were found for this session roster.</p>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Student</th>
                <th>Roll Number</th>
                <th>Section</th>
              </tr>
            </thead>
            <tbody>
              {absentStudents.map((student) => (
                <tr key={student.id}>
                  <td><strong>{student.name || "Not provided"}</strong></td>
                  <td>{student.rollNumber || "Not provided"}</td>
                  <td>{student.section || "Not provided"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};