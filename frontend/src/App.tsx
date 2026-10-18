
import { FormEvent, useEffect, useState } from 'react';

type Employee = {
  id: number;
  name: string;
  email: string;
  department: string;
  jobTitle: string;
};

type LeaveRequest = {
  id: number;
  employeeName: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: string;
};

type AttendanceRecord = {
  id: number;
  employeeId: number;
  employeeName: string;
  attendanceDate: string;
  status: string;
};

function getLocalDateString() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

type LoginResponse = {
  token: string;
  email: string;
  role: string;
};

const API = 'http://localhost:8080/api';

export default function App() {
  const [token, setToken] = useState(
    () => sessionStorage.getItem('nexushr_token') || ''
  );
  const [email, setEmail] = useState(
    () => sessionStorage.getItem('nexushr_email') || ''
  );
  const [role, setRole] = useState(
    () => sessionStorage.getItem('nexushr_role') || ''
  );

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [activeTab, setActiveTab] = useState<
    'employees' | 'leaves' | 'attendance' | 'ai' | 'chatbot' | 'payroll' | 'performance'
  >('employees');

  // Attendance records are loaded from and saved to the backend database.
  const [attendance, setAttendance] = useState<Record<string, string>>({});
  const [attendanceDate, setAttendanceDate] = useState(getLocalDateString);
  const [aiDate, setAiDate] = useState(getLocalDateString);
  const [aiInsights, setAiInsights] = useState('');
  const [aiStatistics, setAiStatistics] = useState<Record<string, unknown> | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [chatQuestion, setChatQuestion] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState('');
  const [payrollPaid, setPayrollPaid] = useState<Record<string, boolean>>({});
  const [reviews, setReviews] = useState<Array<{ id: number; employee: string; rating: number; feedback: string; date: string }>>([
    { id: 1, employee: 'Aditi Sharma', rating: 4, feedback: 'Consistently delivers work on time.', date: '2026-10-01' },
    { id: 2, employee: 'Rahul Verma', rating: 5, feedback: 'Excellent teamwork and communication.', date: '2026-10-05' }
  ]);
  const [reviewMessage, setReviewMessage] = useState('');
  const [error, setError] = useState('');
  const [loginEmail, setLoginEmail] = useState('admin@nexushr.local');
  const [loginPassword, setLoginPassword] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  const isAdmin = role === 'HR_ADMIN';

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setLoggingIn(true);

    try {
      const response = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: loginEmail,
          password: loginPassword
        })
      });

      if (!response.ok) {
        setError('Login failed. Check your email and password.');
        return;
      }

      const result: LoginResponse = await response.json();

      sessionStorage.setItem('nexushr_token', result.token);
      sessionStorage.setItem('nexushr_email', result.email);
      sessionStorage.setItem('nexushr_role', result.role);

      setToken(result.token);
      setEmail(result.email);
      setRole(result.role);
      setLoginPassword('');
    } catch {
      setError('Cannot connect to the backend. Check that Spring Boot is running.');
    } finally {
      setLoggingIn(false);
    }
  }

  function logout() {
    sessionStorage.removeItem('nexushr_token');
    sessionStorage.removeItem('nexushr_email');
    sessionStorage.removeItem('nexushr_role');

    setToken('');
    setEmail('');
    setRole('');
    setEmployees([]);
    setLeaves([]);
    setError('');
    setLoginPassword('');
  }

  async function apiFetch(path: string, options: RequestInit = {}) {
    const headers = new Headers(options.headers);
    headers.set('Authorization', `Bearer ${token}`);

    if (options.body && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    const response = await fetch(`${API}${path}`, {
      ...options,
      headers
    });

    if (response.status === 401 || response.status === 403) {
      setError('Your session is invalid or expired. Please log in again.');
      logout();
    }

    return response;
  }

  async function loadAttendance(date = attendanceDate) {
    if (!token || !isAdmin) return;
    try {
      const response = await apiFetch(`/attendance?date=${encodeURIComponent(date)}`);
      if (!response.ok) throw new Error('Could not load attendance records.');
      const records: AttendanceRecord[] = await response.json();
      const byEmployee: Record<string, string> = {};
      records.forEach(record => {
        byEmployee[String(record.employeeId)] = record.status;
      });
      setAttendance(byEmployee);
    } catch {
      setError('Could not load attendance. Check the backend connection.');
    }
  }

  async function loadData() {
    try {
      const [employeeResponse, leaveResponse] = await Promise.all([
        apiFetch('/employees'),
        apiFetch('/leaves')
      ]);
      if (!employeeResponse.ok || !leaveResponse.ok) {
        throw new Error('Could not load dashboard data.');
      }
      setEmployees(await employeeResponse.json());
      setLeaves(await leaveResponse.json());
      setError('');
      if (isAdmin) await loadAttendance(attendanceDate);
    } catch {
      setError('Could not load dashboard data. Check the backend connection.');
    }
  }

  useEffect(() => {
    if (token) loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    if (token && isAdmin) loadAttendance(attendanceDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attendanceDate, token, role]);

  async function generateAIInsights() {
    setAiLoading(true);
    setAiError('');
    setAiInsights('');
    setAiStatistics(null);

    try {
      const response = await apiFetch(
        `/ai/workforce-insights?date=${encodeURIComponent(aiDate)}`
      );

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || `AI insights request failed (${response.status}).`);
      }

      const result: {
        date: string;
        statistics: Record<string, unknown>;
        insights: string;
      } = await response.json();

      setAiStatistics(result.statistics);
      setAiInsights(result.insights);
    } catch (err) {
      setAiError(
        err instanceof Error
          ? err.message
          : 'Could not generate AI insights. Check that Spring Boot and Ollama are running.'
      );
    } finally {
      setAiLoading(false);
    }
  }

  async function sendChatMessage(questionOverride?: string) {
    const question = (questionOverride ?? chatQuestion).trim();
    if (!question || chatLoading) return;

    setChatQuestion('');
    setChatError('');
    setChatMessages(current => [...current, { role: 'user', content: question }]);
    setChatLoading(true);

    try {
      const response = await apiFetch('/ai/chat', {
        method: 'POST',
        body: JSON.stringify({ question })
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || `Chat request failed (${response.status}).`);
      }

      const result: { answer: string } = await response.json();
      setChatMessages(current => [
        ...current,
        { role: 'assistant', content: result.answer || 'The AI did not return an answer.' }
      ]);
    } catch (err) {
      setChatError(
        err instanceof Error
          ? err.message
          : 'Could not contact the AI assistant. Check that Spring Boot and Ollama are running.'
      );
    } finally {
      setChatLoading(false);
    }
  }

  async function markAttendance(employee: Employee, status: string) {
    setError('');
    try {
      const response = await apiFetch('/attendance', {
        method: 'POST',
        body: JSON.stringify({
          employeeId: employee.id,
          employeeName: employee.name,
          attendanceDate,
          status
        })
      });
      if (response.ok) {
        setAttendance(current => ({ ...current, [String(employee.id)]: status }));
      } else {
        const message = await response.text();
        setError(message || 'Attendance could not be saved.');
        await loadAttendance(attendanceDate);
      }
    } catch {
      setError('Could not save attendance. Check the backend connection.');
    }
  }

  async function addEmployee(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);

    const employee = {
      name: String(data.get('name')),
      email: String(data.get('email')),
      department: String(data.get('department')),
      jobTitle: String(data.get('jobTitle'))
    };

    try {
      const response = await apiFetch('/employees', {
        method: 'POST',
        body: JSON.stringify(employee)
      });

      if (response.ok) {
        form.reset();
        await loadData();
      } else {
        setError('Employee could not be added.');
      }
    } catch {
      setError('Could not connect to the backend.');
    }
  }

  async function deleteEmployee(id: number) {
    if (!window.confirm('Delete this employee?')) return;

    try {
      const response = await apiFetch(`/employees/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) await loadData();
      else setError('Employee could not be deleted.');
    } catch {
      setError('Could not connect to the backend.');
    }
  }

  async function addLeave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);

    const leave = {
      employeeName: String(data.get('employeeName')),
      startDate: String(data.get('startDate')),
      endDate: String(data.get('endDate')),
      reason: String(data.get('reason'))
    };

    try {
      const response = await apiFetch('/leaves', {
        method: 'POST',
        body: JSON.stringify(leave)
      });

      if (response.ok) {
        form.reset();
        await loadData();
      } else {
        setError('Leave request could not be created.');
      }
    } catch {
      setError('Could not connect to the backend.');
    }
  }

  async function updateLeaveStatus(id: number, status: string) {
    try {
      const response = await apiFetch(
        `/leaves/${id}/status?status=${encodeURIComponent(status)}`,
        { method: 'PUT' }
      );

      if (response.ok) await loadData();
      else setError('Leave status could not be updated.');
    } catch {
      setError('Could not connect to the backend.');
    }
  }

  if (!token) {
    return (
      <main style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        background: '#f4f5fb',
        fontFamily: 'Arial, sans-serif',
        padding: 20
      }}>
        <form onSubmit={login} style={{
          width: '100%',
          maxWidth: 400,
          boxSizing: 'border-box',
          background: '#fff',
          padding: 32,
          borderRadius: 16,
          boxShadow: '0 8px 32px rgba(30, 35, 90, 0.10)'
        }}>
          <h1 style={{ marginTop: 0, color: '#4035a8' }}>NexusHR</h1>
          <h2>Welcome back</h2>
          <p>Sign in to access your HR workspace.</p>

          {error && (
            <p role="alert" style={{ color: '#b42318' }}>{error}</p>
          )}

          <label style={{ display: 'block', marginBottom: 16 }}>
            Email address
            <input
              type="email"
              value={loginEmail}
              onChange={event => setLoginEmail(event.target.value)}
              required
              autoComplete="username"
              style={{
                display: 'block',
                boxSizing: 'border-box',
                width: '100%',
                padding: 12,
                marginTop: 6,
                border: '1px solid #d5d7e2',
                borderRadius: 8
              }}
            />
          </label>

          <label style={{ display: 'block', marginBottom: 20 }}>
            Password
            <input
              type="password"
              value={loginPassword}
              onChange={event => setLoginPassword(event.target.value)}
              required
              autoComplete="current-password"
              style={{
                display: 'block',
                boxSizing: 'border-box',
                width: '100%',
                padding: 12,
                marginTop: 6,
                border: '1px solid #d5d7e2',
                borderRadius: 8
              }}
            />
          </label>

          <button
            type="submit"
            disabled={loggingIn}
            style={{
              width: '100%',
              padding: 13,
              border: 0,
              borderRadius: 8,
              background: '#4b3fbd',
              color: '#fff',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            {loggingIn ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-icon">N</span>
          <span>NexusHR</span>
        </div>

        <p className="side-label">WORKSPACE</p>

        <button
          className={activeTab === 'employees' ? 'nav-item active' : 'nav-item'}
          onClick={() => setActiveTab('employees')}
        >
          ♙ Employees
        </button>

        <button
          className={activeTab === 'leaves' ? 'nav-item active' : 'nav-item'}
          onClick={() => setActiveTab('leaves')}
        >
          ▣ Leave requests
        </button>

        {isAdmin && (
          <>
            <p className="side-label">ADMIN TOOLS</p>
            <button className={activeTab === 'attendance' ? 'nav-item active' : 'nav-item'} onClick={() => setActiveTab('attendance')}>◷ Attendance</button>
            <button className={activeTab === 'ai' ? 'nav-item active' : 'nav-item'} onClick={() => setActiveTab('ai')}>✦ AI Insights</button>
            <button className={activeTab === 'chatbot' ? 'nav-item active' : 'nav-item'} onClick={() => setActiveTab('chatbot')}>✧ AI HR Chatbot</button>
            <button className={activeTab === 'payroll' ? 'nav-item active' : 'nav-item'} onClick={() => setActiveTab('payroll')}>＄ Payroll</button>
            <button className={activeTab === 'performance' ? 'nav-item active' : 'nav-item'} onClick={() => setActiveTab('performance')}>☆ Performance</button>
          </>
        )}

        <div className="sidebar-bottom">
          HR Management<br />
          <span>Beginner project edition</span>
        </div>
      </aside>

      <section className="main-area">
        <header className="topbar">
          <div>
            <p className="eyebrow">HUMAN RESOURCES</p>
            <h1>
              {{
                employees: 'Employee overview',
                leaves: 'Leave management',
                attendance: 'Attendance tracking',
                ai: 'AI Workforce Insights',
                chatbot: 'AI HR Chatbot',
                payroll: 'Payroll processing',
                performance: 'Performance management'
              }[activeTab]}
            </h1>
          </div>

          <div className="profile">
            <span className="avatar">
              {isAdmin ? 'HR' : email.slice(0, 2).toUpperCase()}
            </span>
            <span>
              <b>{email}</b>
              <small>{role.replace('_', ' ')}</small>
            </span>
            <button type="button" onClick={logout}>Log out</button>
          </div>
        </header>

        {error && <div className="error-message">{error}</div>}

        <section className="stats">
          <article className="stat-card">
            <span className="stat-icon purple">♙</span>
            <div><p>Total employees</p><strong>{employees.length}</strong></div>
          </article>
          <article className="stat-card">
            <span className="stat-icon orange">◷</span>
            <div>
              <p>Pending leaves</p>
              <strong>{leaves.filter(l => l.status === 'Pending').length}</strong>
            </div>
          </article>
          <article className="stat-card">
            <span className="stat-icon green">✓</span>
            <div>
              <p>Approved leaves</p>
              <strong>{leaves.filter(l => l.status === 'Approved').length}</strong>
            </div>
          </article>
        </section>

        {activeTab === 'employees' ? (
          <>
            {isAdmin && (
              <section className="panel">
                <div className="panel-heading">
                  <div>
                    <h2>Add an employee</h2>
                    <p>Enter basic employee details below.</p>
                  </div>
                </div>

                <form className="employee-form" onSubmit={addEmployee}>
                  <label>Full name
                    <input name="name" placeholder="e.g. Aditi Sharma" required />
                  </label>
                  <label>Email address
                    <input name="email" type="email" placeholder="aditi@example.com" required />
                  </label>
                  <label>Department
                    <input name="department" placeholder="Engineering" required />
                  </label>
                  <label>Job title
                    <input name="jobTitle" placeholder="Software Developer" required />
                  </label>
                  <button className="primary-button" type="submit">
                    + Add employee
                  </button>
                </form>
              </section>
            )}

            <section className="panel">
              <div className="panel-heading">
                <div><h2>Employees</h2><p>Your employee directory</p></div>
                <span className="count-pill">{employees.length} records</span>
              </div>

              <div className="table-wrap">
                <table>
                  <thead>
                    <tr><th>EMPLOYEE</th><th>DEPARTMENT</th><th>JOB TITLE</th>
                      {isAdmin && <th>ACTION</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {employees.map(employee => (
                      <tr key={employee.id}>
                        <td>
                          <div className="employee-cell">
                            <span className="employee-avatar">
                              {employee.name.slice(0, 1).toUpperCase()}
                            </span>
                            <span><b>{employee.name}</b><small>{employee.email}</small></span>
                          </div>
                        </td>
                        <td>{employee.department}</td>
                        <td>{employee.jobTitle}</td>
                        {isAdmin && (
                          <td>
                            <button className="delete-button"
                              onClick={() => deleteEmployee(employee.id)}>
                              Delete
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                    {employees.length === 0 && (
                      <tr><td colSpan={isAdmin ? 4 : 3} className="empty-state">
                        No employees found.
                      </td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        ) : activeTab === 'leaves' ? (
          <>
            <section className="panel">
              <div className="panel-heading">
                <div>
                  <h2>Create a leave request</h2>
                  <p>Submit a request for an employee.</p>
                </div>
              </div>

              <form className="employee-form leave-form" onSubmit={addLeave}>
                <label>Employee name
                  <input name="employeeName" placeholder="Employee full name" required />
                </label>
                <label>Start date
                  <input name="startDate" type="date" required />
                </label>
                <label>End date
                  <input name="endDate" type="date" required />
                </label>
                <label>Reason
                  <input name="reason" placeholder="Personal leave" required />
                </label>
                <button className="primary-button" type="submit">
                  + Submit request
                </button>
              </form>
            </section>

            <section className="panel">
              <div className="panel-heading">
                <div>
                  <h2>Leave requests</h2>
                  <p>Review and update request status.</p>
                </div>
              </div>

              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>EMPLOYEE</th><th>DATES</th><th>REASON</th>
                      <th>STATUS</th>{isAdmin && <th>ACTION</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {leaves.map(leave => (
                      <tr key={leave.id}>
                        <td><b>{leave.employeeName}</b></td>
                        <td>{leave.startDate} – {leave.endDate}</td>
                        <td>{leave.reason}</td>
                        <td>
                          <span className={`status ${leave.status.toLowerCase()}`}>
                            {leave.status}
                          </span>
                        </td>
                        {isAdmin && (
                          <td>
                            {leave.status === 'Pending' ? (
                              <div className="actions">
                                <button className="approve"
                                  onClick={() => updateLeaveStatus(leave.id, 'Approved')}>
                                  Approve
                                </button>
                                <button className="reject"
                                  onClick={() => updateLeaveStatus(leave.id, 'Rejected')}>
                                  Reject
                                </button>
                              </div>
                            ) : '—'}
                          </td>
                        )}
                      </tr>
                    ))}
                    {leaves.length === 0 && (
                      <tr><td colSpan={isAdmin ? 5 : 4} className="empty-state">
                        No leave requests yet.
                      </td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        ) : activeTab === 'attendance' && isAdmin ? (
          <>
            <section className="stats">
              <article className="stat-card"><span className="stat-icon purple">♙</span><div><p>Employees listed</p><strong>{employees.length}</strong></div></article>
              <article className="stat-card"><span className="stat-icon green">✓</span><div><p>Present</p><strong>{Object.values(attendance).filter(v => v === 'Present').length}</strong></div></article>
              <article className="stat-card"><span className="stat-icon orange">◷</span><div><p>Not marked</p><strong>{Math.max(0, employees.length - Object.keys(attendance).length)}</strong></div></article>
            </section>
            <section className="panel">
              <div className="panel-heading"><div><h2>Daily attendance</h2><p>Attendance records are saved in the NexusHR database.</p></div><span className="count-pill">Database connected</span></div>
              <label style={{ display: 'block', marginBottom: 16 }}>Attendance date
                <input type="date" value={attendanceDate} onChange={event => setAttendanceDate(event.target.value)} style={{ display: 'block', marginTop: 6, padding: 8, border: '1px solid #d5d7e2', borderRadius: 8 }} />
              </label>
              <p style={{ color: '#667085' }}>Choose Present or Absent. Each employee can have one attendance record per date.</p>
              <div className="table-wrap"><table><thead><tr><th>EMPLOYEE</th><th>DEPARTMENT</th><th>STATUS</th><th>MARK ATTENDANCE</th></tr></thead><tbody>
                {employees.map(employee => <tr key={employee.id}><td><b>{employee.name}</b><br /><small>{employee.email}</small></td><td>{employee.department}</td><td><span className={`status ${(attendance[String(employee.id)] || 'Not marked').toLowerCase().replace(' ', '-')}`}>{attendance[String(employee.id)] || 'Not marked'}</span></td><td>
  <div className="actions">
    {attendance[String(employee.id)] === 'Present' ? (
      <button className="approve" type="button">
        Present
      </button>
    ) : attendance[String(employee.id)] === 'Absent' ? (
      <button className="reject" type="button">
        Absent
      </button>
    ) : (
      <>
        <button
          className="approve"
          type="button"
          onClick={() => markAttendance(employee, 'Present')}
        >
          Present
        </button>
        <button
          className="reject"
          type="button"
          onClick={() => markAttendance(employee, 'Absent')}
        >
          Absent
        </button>
      </>
    )}
  </div>
</td></tr>)}
                {employees.length === 0 && <tr><td colSpan={4} className="empty-state">Add employees first to track attendance.</td></tr>}</tbody></table></div>
            </section>
          </>
        ) : activeTab === 'ai' && isAdmin ? (
          <>
            <section className="panel">
              <div className="panel-heading">
                <div>
                  <h2>AI Workforce Insights</h2>
                  <p>Generate an attendance summary using records stored in MySQL and your local Qwen model via Ollama.</p>
                </div>
                <span className="count-pill">Local AI</span>
              </div>

              <label style={{ display: 'block', marginBottom: 16 }}>
                Attendance date
                <input
                  type="date"
                  value={aiDate}
                  onChange={event => setAiDate(event.target.value)}
                  style={{ display: 'block', marginTop: 6, padding: 8, border: '1px solid #d5d7e2', borderRadius: 8 }}
                />
              </label>

              <button className="primary-button" type="button" onClick={generateAIInsights} disabled={aiLoading || !aiDate}>
                {aiLoading ? 'Generating insights…' : aiInsights ? 'Refresh AI insights' : 'Generate AI insights'}
              </button>

              {aiError && <p role="alert" style={{ color: '#b42318', marginTop: 16 }}>{aiError}</p>}
            </section>

            {aiStatistics && (
              <section className="stats">
                <article className="stat-card"><span className="stat-icon purple">▤</span><div><p>Records found</p><strong>{String(aiStatistics.totalRecorded ?? 0)}</strong></div></article>
                <article className="stat-card"><span className="stat-icon green">✓</span><div><p>Present</p><strong>{String(aiStatistics.present ?? 0)}</strong></div></article>
                <article className="stat-card"><span className="stat-icon orange">!</span><div><p>Absent</p><strong>{String(aiStatistics.absent ?? 0)}</strong></div></article>
                <article className="stat-card"><span className="stat-icon purple">◷</span><div><p>Late / Leave</p><strong>{String(aiStatistics.late ?? 0)} / {String(aiStatistics.leave ?? 0)}</strong></div></article>
              </section>
            )}

            {aiInsights && (
              <section className="panel">
                <div className="panel-heading"><div><h2>AI-generated report</h2><p>Based on the selected date's recorded attendance.</p></div><span className="count-pill">Qwen 2.5</span></div>
                <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>{aiInsights}</div>
                <p style={{ color: '#667085', marginTop: 18, fontSize: 13 }}>AI-generated content may contain errors. Review the figures and recommendations before making HR decisions.</p>
              </section>
            )}
          </>
        ) : activeTab === 'chatbot' && isAdmin ? (
          <>
            <section className="panel">
              <div className="panel-heading">
                <div>
                  <h2>Ask NexusHR AI</h2>
                  <p>Ask questions about today's recorded attendance. Answers use your MySQL attendance statistics and local Qwen model.</p>
                </div>
                <span className="count-pill">Local AI</span>
              </div>

              <div
                role="log"
                aria-live="polite"
                aria-label="Chat conversation"
                style={{ display: 'flex', flexDirection: 'column', gap: 12, minHeight: 220, maxHeight: 460, overflowY: 'auto', padding: 16, background: '#f8f9fc', border: '1px solid #e4e7ec', borderRadius: 12, marginBottom: 16 }}
              >
                {chatMessages.length === 0 && (
                  <div style={{ margin: 'auto', textAlign: 'center', color: '#667085', maxWidth: 440 }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>✦</div>
                    <strong style={{ color: '#344054' }}>Hello! I'm your NexusHR AI assistant.</strong>
                    <p>Ask about today's recorded attendance, or choose a suggested question below.</p>
                  </div>
                )}
                {chatMessages.map((message, index) => (
                  <div key={`${index}-${message.role}`} style={{ alignSelf: message.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%', padding: '12px 14px', borderRadius: 12, background: message.role === 'user' ? '#4b3fbd' : '#ffffff', color: message.role === 'user' ? '#ffffff' : '#344054', border: message.role === 'assistant' ? '1px solid #e4e7ec' : 'none', whiteSpace: 'pre-wrap', lineHeight: 1.6, overflowWrap: 'anywhere' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.8, marginBottom: 4 }}>{message.role === 'user' ? 'YOU' : 'NEXUSHR AI'}</div>
                    {message.content}
                  </div>
                ))}
                {chatLoading && (
                  <div role="status" style={{ alignSelf: 'flex-start', padding: '12px 14px', borderRadius: 12, background: '#fff', border: '1px solid #e4e7ec', color: '#667085' }}>
                    Qwen is thinking…
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                {[
                  'How many employees were absent today?',
                  "Summarize today's attendance.",
                  'How many employees were marked late?'
                ].map(question => (
                  <button key={question} type="button" className="delete-button" disabled={chatLoading} onClick={() => sendChatMessage(question)}>
                    {question}
                  </button>
                ))}
              </div>

              <form onSubmit={event => { event.preventDefault(); void sendChatMessage(); }} style={{ display: 'flex', gap: 10, alignItems: 'stretch' }}>
                <input
                  aria-label="Your question"
                  value={chatQuestion}
                  onChange={event => setChatQuestion(event.target.value)}
                  placeholder="Ask about today's attendance…"
                  maxLength={1000}
                  disabled={chatLoading}
                  style={{ flex: 1, minWidth: 0, padding: 12, border: '1px solid #d0d5dd', borderRadius: 8 }}
                />
                <button className="primary-button" type="submit" disabled={chatLoading || !chatQuestion.trim()}>
                  {chatLoading ? 'Thinking…' : 'Send'}
                </button>
              </form>

              {chatError && <p role="alert" style={{ color: '#b42318', marginTop: 14 }}>{chatError}</p>}
              <p style={{ color: '#667085', marginTop: 16, fontSize: 13 }}>Currently answers questions using today's recorded attendance only. AI responses can be inaccurate; verify important HR decisions against the database.</p>
            </section>
          </>
        ) : activeTab === 'payroll' && isAdmin ? (
          <>
            <section className="panel"><div className="panel-heading"><div><h2>Monthly payroll</h2><p>Illustrative salary calculations for learning purposes only.</p></div><span className="count-pill">Demo mode</span></div>
              <div className="table-wrap"><table><thead><tr><th>EMPLOYEE</th><th>MONTHLY BASE (₹)</th><th>DEMO DEDUCTION (10%)</th><th>NET PAY (₹)</th><th>PAYMENT STATUS</th><th>ACTION</th></tr></thead><tbody>
                {employees.map((employee, index) => { const base = 30000 + index * 5000; const deduction = Math.round(base * 0.1); const net = base - deduction; return <tr key={employee.id}><td><b>{employee.name}</b><br /><small>{employee.email}</small></td><td>₹{base.toLocaleString('en-IN')}</td><td>₹{deduction.toLocaleString('en-IN')}</td><td><b>₹{net.toLocaleString('en-IN')}</b></td><td><span className={`status ${payrollPaid[String(employee.id)] ? 'approved' : 'pending'}`}>{payrollPaid[String(employee.id)] ? 'Marked paid' : 'Pending'}</span></td><td><button className="primary-button" type="button" onClick={() => setPayrollPaid(current => ({ ...current, [String(employee.id)]: !current[String(employee.id)] }))}>{payrollPaid[String(employee.id)] ? 'Undo paid' : 'Mark paid'}</button></td></tr>})}
                {employees.length === 0 && <tr><td colSpan={6} className="empty-state">Add employees first to preview payroll.</td></tr>}</tbody></table></div>
              <p style={{ color: '#667085', marginTop: 16 }}>This is not connected to a bank, tax rules, payslips, or the database. Do not use these figures for actual salary payments.</p>
            </section>
          </>
        ) : activeTab === 'performance' && isAdmin ? (
          <>
            <section className="panel"><div className="panel-heading"><div><h2>Add performance review</h2><p>Record a simple rating and feedback note.</p></div><span className="count-pill">Demo mode</span></div>
              {reviewMessage && <p role="status" style={{ color: '#067647' }}>{reviewMessage}</p>}
              <form className="employee-form" onSubmit={event => { event.preventDefault(); const form = event.currentTarget; const data = new FormData(form); const employee = String(data.get('employee')); const rating = Number(data.get('rating')); const feedback = String(data.get('feedback')).trim(); if (!employee || !feedback) return; setReviews(current => [{ id: Date.now(), employee, rating, feedback, date: new Date().toISOString().slice(0, 10) }, ...current]); setReviewMessage('Performance review added. This demo entry is temporary.'); form.reset(); }}>
                <label>Employee<select name="employee" required defaultValue=""><option value="" disabled>Select employee</option>{employees.map(employee => <option key={employee.id} value={employee.name}>{employee.name}</option>)}{employees.length === 0 && <option disabled value="none">Add employees first</option>}</select></label>
                <label>Rating (1–5)<select name="rating" defaultValue="3" required><option value="1">1 - Needs improvement</option><option value="2">2 - Developing</option><option value="3">3 - Meets expectations</option><option value="4">4 - Very good</option><option value="5">5 - Excellent</option></select></label>
                <label style={{ gridColumn: '1 / -1' }}>Feedback<textarea name="feedback" placeholder="Add a short performance note..." required rows={3} /></label>
                <button className="primary-button" type="submit" disabled={employees.length === 0}>+ Save review</button>
              </form>
            </section>
            <section className="panel"><div className="panel-heading"><div><h2>Performance reviews</h2><p>Latest review notes</p></div><span className="count-pill">{reviews.length} reviews</span></div>
              <div className="table-wrap"><table><thead><tr><th>EMPLOYEE</th><th>RATING</th><th>FEEDBACK</th><th>REVIEW DATE</th></tr></thead><tbody>{reviews.map(review => <tr key={review.id}><td><b>{review.employee}</b></td><td>{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)} ({review.rating}/5)</td><td>{review.feedback}</td><td>{review.date}</td></tr>)}{reviews.length === 0 && <tr><td colSpan={4} className="empty-state">No reviews have been added yet.</td></tr>}</tbody></table></div>
            </section>
          </>
        ) : (
          <section className="panel"><h2>Admin access required</h2><p>This section is available to HR admins only.</p></section>
        )}

        <footer>NEXUSHR · Beginner HR management project · Frontend demo modules</footer>
      </section>
    </main>
  );
}
