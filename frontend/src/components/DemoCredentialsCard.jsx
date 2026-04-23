const demoAccounts = {
  teachers: [
    { phoneNumber: "9000000001", password: "teacher123", name: "Prof. Ananya Sharma" },
    { phoneNumber: "9000000002", password: "teacher123", name: "Prof. Rakesh Verma" }
  ],
  students: [
    { phoneNumber: "9111111101", rollNumber: "23CSE101", password: "student123", name: "Aarav Singh" },
    { phoneNumber: "9111111102", rollNumber: "23CSE102", password: "student123", name: "Diya Patel" },
    { phoneNumber: "9111111103", rollNumber: "23CSE103", password: "student123", name: "Kabir Mehta" }
  ]
};

export const DemoCredentialsCard = () => {
  const renderGroup = (title, accounts) => (
    <div className="demo-group" style={{ flex: 1, minWidth: '200px' }}>
      <p className="eyebrow" style={{ marginBottom: '12px' }}>{title}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {accounts.map((account) => (
          <article className="demo-account" key={account.phoneNumber} style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '16px', borderRadius: '12px', border: '1px solid var(--card-border)' }}>
            <strong style={{ display: 'block', marginBottom: '4px', fontSize: '14px', color: 'var(--text-primary)' }}>{account.name}</strong>
            {account.rollNumber && <p className="subtle-text" style={{ margin: '2px 0', fontSize: '12px' }}>Roll: {account.rollNumber}</p>}
            <p className="subtle-text" style={{ margin: '2px 0', fontSize: '12px' }}>Phone: {account.phoneNumber}</p>
            <p className="subtle-text" style={{ margin: '2px 0', fontSize: '12px' }}>Password: {account.password}</p>
          </article>
        ))}
      </div>
    </div>
  );

  return (
    <section className="modern-panel" style={{ marginTop: '24px' }}>
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Demo Logins</p>
          <h2>Test Accounts</h2>
        </div>
      </div>

      <div className="demo-grid" style={{ display: 'flex', flexWrap: 'wrap', gap: '24px' }}>
        {renderGroup("Teachers", demoAccounts.teachers)}
        {renderGroup("Students", demoAccounts.students)}
      </div>
    </section>
  );
};