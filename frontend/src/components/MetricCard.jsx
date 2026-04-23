export const MetricCard = ({ label, value, hint }) => (
  <article className="metric-card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
    <p className="metric-label" style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
      {label}
    </p>
    <strong className="metric-value" style={{ fontSize: '48px', fontWeight: 800, color: 'var(--text-primary)', margin: '8px 0 12px 0', letterSpacing: '-1.5px' }}>
      {value}
    </strong>
    <p className="metric-hint" style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5', marginTop: 'auto' }}>
      {hint}
    </p>
  </article>
);