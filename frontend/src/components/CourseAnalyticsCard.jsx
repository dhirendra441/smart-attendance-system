export const CourseAnalyticsCard = ({ analytics }) => {
  return (
    <section className="modern-panel" style={{ height: '100%' }}>
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Analytics</p>
          <h2>Attendance by Course</h2>
        </div>
      </div>

      {!analytics.length ? (
        <p className="subtle-text">Course-level attendance analytics will appear here after records are added.</p>
      ) : (
        <div className="course-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {analytics.map((course) => (
            <article className="course-item" key={course.courseName} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--card-border)', borderRadius: '12px' }}>
              <div>
                <strong style={{ fontSize: '15px', color: 'var(--text-primary)' }}>{course.courseName}</strong>
                <p className="subtle-text" style={{ margin: 0, fontSize: '13px' }}>Marked sessions</p>
              </div>
              <span className="status-badge neutral">{course.count}</span>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};