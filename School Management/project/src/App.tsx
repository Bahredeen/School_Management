import { useMemo, useState } from 'react';
import {
  Activity,
  Bell,
  BookOpen,
  BriefcaseBusiness,
  CalendarDays,
  ChevronDown,
  CircleDollarSign,
  ClipboardCheck,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  UserRound,
  Users,
  X,
} from 'lucide-react';

type Role = 'director' | 'ict' | 'teacher' | 'parent';
type NavItem = { label: string; icon: typeof LayoutDashboard };

type PortalUser = {
  role: Role;
  name: string;
  email: string;
  title: string;
};

const demoUsers: Record<Role, PortalUser> = {
  director: { role: 'director', name: 'Dawit Tadesse', email: 'director@selamacademy.edu.et', title: 'School Manager' },
  ict: { role: 'ict', name: 'Ekram Mohammad', email: 'ict@selamacademy.edu.et', title: 'ICT Manager' },
  teacher: { role: 'teacher', name: 'Tigist Alemu', email: 'teacher@selamacademy.edu.et', title: 'Mathematics Teacher' },
  parent: { role: 'parent', name: 'Ahmad Kedir', email: 'parent@selamacademy.edu.et', title: 'Family Account' },
};

const navByRole: Record<Role, NavItem[]> = {
  director: [
    { label: 'Executive overview', icon: LayoutDashboard },
    { label: 'Students & enrollment', icon: GraduationCap },
    { label: 'Staff directory', icon: Users },
    { label: 'Classes & subjects', icon: BookOpen },
    { label: 'Announcements', icon: Bell },
    { label: 'Parent feedback', icon: MessageSquare },
  ],
  ict: [
    { label: 'System overview', icon: LayoutDashboard },
    { label: 'Account provisioning', icon: ShieldCheck },
    { label: 'Family links', icon: Users },
    { label: 'Audit activity', icon: Activity },
    { label: 'Data exports', icon: ClipboardCheck },
  ],
  teacher: [
    { label: 'My classes', icon: LayoutDashboard },
    { label: 'Result entry sheet', icon: ClipboardCheck },
    { label: 'Daily attendance', icon: CalendarDays },
    { label: 'Family messages', icon: MessageSquare },
  ],
  parent: [
    { label: 'Family overview', icon: LayoutDashboard },
    { label: 'Academic results', icon: GraduationCap },
    { label: 'Attendance & conduct', icon: CalendarDays },
    { label: 'Teacher messages', icon: MessageSquare },
    { label: 'Fees & payments', icon: CircleDollarSign },
    { label: 'School feedback', icon: Sparkles },
  ],
};

const formatBirr = (amount: number) => `${amount.toLocaleString('en-US')} ETB`;

function Crest({ small = false }: { small?: boolean }) {
  return (
    <div className={`crest ${small ? 'crest-small' : ''}`} aria-label="Selam Academy crest">
      <span>SA</span>
      <BookOpen size={small ? 13 : 17} strokeWidth={2.5} />
    </div>
  );
}

function Login({ onLogin }: { onLogin: (role: Role) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const match = (Object.values(demoUsers) as PortalUser[]).find((user) => user.email === email.trim().toLowerCase());
    if (!match || password.length < 6) {
      setError('Enter a valid school email and password, or use a demo account below.');
      return;
    }
    onLogin(match.role);
  };

  return (
    <main className="login-shell">
      <section className="login-visual">
        <div className="visual-orbit orbit-one" />
        <div className="visual-orbit orbit-two" />
        <div className="visual-content">
          <div className="brand-lockup"><Crest /><div><strong>SELAM ACADEMY</strong><span>Hawassa · Ethiopia</span></div></div>
          <div className="visual-copy">
            <p className="eyebrow">Academic year 2018 E.C. · 2025/26</p>
            <h1>Learning that shapes<br /><em>tomorrow.</em></h1>
            <p>One trusted space for the people, progress, and possibilities of Selam Academy.</p>
          </div>
          <div className="visual-footer"><span>01 Campus · Hawassa, Sidama</span><span>ሰላም አካዳሚ</span></div>
        </div>
      </section>
      <section className="login-panel">
        <div className="login-card">
          <div className="mobile-brand"><Crest small /><span>Selam Academy</span></div>
          <div className="login-heading"><p className="eyebrow gold">Secure portal access</p><h2>Welcome back</h2><p>Sign in to continue to your school workspace.</p></div>
          <form onSubmit={submit} className="login-form">
            <label>Email address<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@selamacademy.edu.et" /></label>
            <label>Password<div className="password-wrap"><input type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" /><button type="button" onClick={() => setShowPassword((value) => !value)}>{showPassword ? 'Hide' : 'Show'}</button></div></label>
            {error && <p className="form-error">{error}</p>}
            <button className="primary-button login-button" type="submit">Sign in <span>→</span></button>
          </form>
          <div className="demo-divider"><span>Quick demo login</span></div>
          <div className="demo-grid">
            {(Object.values(demoUsers) as PortalUser[]).map((user) => <button key={user.role} className="demo-button" onClick={() => onLogin(user.role)}><span className={`role-dot ${user.role}`} /><span><b>{user.title}</b><small>{user.name}</small></span><span className="arrow">↗</span></button>)}
          </div>
          <p className="login-note"><ShieldCheck size={14} /> Your school data is protected with secure access controls.</p>
        </div>
      </section>
    </main>
  );
}

function StatCard({ label, value, detail, icon: Icon, accent, trend }: { label: string; value: string; detail: string; icon: typeof Users; accent: string; trend?: string }) {
  return <div className="stat-card"><div className="stat-top"><span className={`stat-icon ${accent}`}><Icon size={18} /></span>{trend && <span className="trend">{trend}</span>}</div><p>{label}</p><strong>{value}</strong><small>{detail}</small></div>;
}

function DirectorDashboard() {
  const students = [
    ['SA-2026-0101', 'Hanan Kedir', '9 A', 'Addis Ketema', 'Active'],
    ['SA-2026-0102', 'Yusuf Kedir', '7 B', 'Addis Ketema', 'Active'],
    ['SA-2026-0103', 'Tigist Haile', '9 A', 'Tabor', 'Active'],
    ['SA-2026-0104', 'Dawit Bekele', '9 A', 'Menehariya', 'Active'],
  ];
  return <>
    <div className="welcome-row"><div><p className="eyebrow">Monday, 16 November 2026</p><h1>Good morning, Dawit.</h1><p className="subtle">Here is what is happening across Selam Academy today.</p></div><button className="secondary-button"><CalendarDays size={16} /> View calendar</button></div>
    <div className="stat-grid"><StatCard label="Total enrolled students" value="1,248" detail="Across KG-1 to Grade 12" icon={GraduationCap} accent="green" trend="+4.8%" /><StatCard label="Active teachers" value="86" detail="94% attendance this month" icon={Users} accent="gold" trend="+3" /><StatCard label="Daily attendance" value="94.6%" detail="Today · 1,181 present" icon={ClipboardCheck} accent="blue" trend="+1.2%" /><StatCard label="Fee collection" value="2.84M ETB" detail="November · 82% of target" icon={CircleDollarSign} accent="rose" trend="+12.4%" /></div>
    <div className="dashboard-grid"><section className="panel performance-panel"><div className="panel-heading"><div><p className="eyebrow">Academic health</p><h2>Performance by grade</h2></div><select defaultValue="semester"><option value="semester">Semester 1 average</option><option>Semester 2 average</option></select></div><div className="bars">{[['KG–2', 78], ['G3–5', 84], ['G6–8', 76], ['G9–10', 88], ['G11–12', 81]].map(([grade, score]) => <div className="bar-row" key={String(grade)}><span>{grade}</span><div className="bar-track"><div style={{ width: `${score}%` }} /></div><b>{score}%</b></div>)}</div><div className="panel-foot"><span><i className="legend-dot green-dot" /> Above school target</span><span>Target 80%</span></div></section><section className="panel alerts-panel"><div className="panel-heading"><div><p className="eyebrow">Needs attention</p><h2>Recent alerts</h2></div><button className="text-button">View all</button></div><div className="alert-list"><div className="alert-item"><span className="alert-avatar orange">FK</span><div><b>Fee follow-up needed</b><p>12 families have outstanding balances</p><small>Today, 9:24 AM</small></div><span className="alert-chevron">›</span></div><div className="alert-item"><span className="alert-avatar blue">AM</span><div><b>Parent feedback received</b><p>Library opening hours suggestion</p><small>Yesterday, 4:16 PM</small></div><span className="alert-chevron">›</span></div><div className="alert-item"><span className="alert-avatar green">TA</span><div><b>Attendance is improving</b><p>Grade 9 A reached 98% this week</p><small>Yesterday, 2:05 PM</small></div><span className="alert-chevron">›</span></div></div></section></div>
    <section className="panel table-panel"><div className="panel-heading"><div><p className="eyebrow">Directory snapshot</p><h2>Recently enrolled students</h2></div><button className="secondary-button small">Manage students <span>→</span></button></div><div className="table-wrap"><table><thead><tr><th>Student ID</th><th>Student name</th><th>Class</th><th>Sub-city</th><th>Status</th></tr></thead><tbody>{students.map((student) => <tr key={student[0]}><td className="muted-cell">{student[0]}</td><td><span className="table-person"><span className="mini-avatar">{student[1].split(' ').map((name) => name[0]).join('')}</span>{student[1]}</span></td><td>{student[2]}</td><td>{student[3]}</td><td><span className="status active">{student[4]}</span></td></tr>)}</tbody></table></div></section>
  </>;
}

function RoleDashboard({ user, activePage }: { user: PortalUser; activePage: string }) {
  if (user.role === 'director') return <DirectorDashboard />;
  const configs: Record<Exclude<Role, 'director'>, { eyebrow: string; title: string; copy: string; cards: [string, string, string, typeof Users, string][] }> = {
    ict: { eyebrow: 'System administration', title: 'Systems at a glance', copy: 'Manage private school accounts and keep Selam Academy connected.', cards: [['Active accounts', '1,336', 'Across all roles', Users, 'green'], ['Pending actions', '08', 'Require your review', ShieldCheck, 'gold'], ['Family links', '624', 'Children connected', Users, 'blue'], ['System health', '99.9%', 'Last 30 days', Activity, 'rose']] },
    teacher: { eyebrow: 'Your teaching workspace', title: 'Good morning, Tigist.', copy: 'Your Grade 9 classes are ready for today.', cards: [['Assigned students', '34', 'Across 2 classes', GraduationCap, 'green'], ['Average score', '84.2%', 'Semester 1 · Mathematics', ClipboardCheck, 'gold'], ['Attendance today', '32 / 34', '2 students absent', CalendarDays, 'blue'], ['Unread messages', '03', 'From families', MessageSquare, 'rose']] },
    parent: { eyebrow: 'Family account', title: 'Welcome, Ahmad.', copy: 'Stay close to Hanan and Yusuf’s learning journey.', cards: [['Children enrolled', '02', 'Hanan · Grade 9 A, Yusuf · Grade 7 B', Users, 'green'], ['Hanan average', '86.4%', 'Semester 1 · Grade 9 A', GraduationCap, 'gold'], ['Attendance', '96.8%', 'This semester', CalendarDays, 'blue'], ['Balance due', '6,000 ETB', 'Next payment due Dec 01', CircleDollarSign, 'rose']] },
  };
  const config = configs[user.role];
  return <><div className="welcome-row"><div><p className="eyebrow">{config.eyebrow}</p><h1>{config.title}</h1><p className="subtle">{config.copy}</p></div><button className="primary-button"><Sparkles size={16} /> {user.role === 'teacher' ? 'Open gradebook' : user.role === 'parent' ? 'View report card' : 'Review actions'}</button></div><div className="stat-grid">{config.cards.map(([label, value, detail, Icon, accent]) => <StatCard key={label} label={label} value={value} detail={detail} icon={Icon} accent={accent} />)}</div><div className="dashboard-grid"><section className="panel performance-panel"><div className="panel-heading"><div><p className="eyebrow">{user.role === 'parent' ? 'Academic progress' : 'At a glance'}</p><h2>{activePage}</h2></div><button className="text-button">Open details →</button></div><div className="empty-content"><span className="empty-icon"><BookOpen size={24} /></span><h3>{user.role === 'parent' ? 'Hanan is making great progress' : 'Your workspace is ready'}</h3><p>{user.role === 'teacher' ? 'Continue with your gradebook and attendance tasks from the navigation.' : 'Use the navigation to explore records, messages, and school updates.'}</p></div></section><section className="panel alerts-panel"><div className="panel-heading"><div><p className="eyebrow">Latest update</p><h2>School notice</h2></div><Bell size={18} className="gold-icon" /></div><div className="notice-card"><span className="notice-mark"><Bell size={16} /></span><div><b>Semester 1 Mid-Exam Schedule</b><p>Mid-exams begin Monday. Please check the notice board for room assignments.</p><small>Posted by School Management · Today</small></div></div></section></div></>;
}

function App() {
  const [user, setUser] = useState<PortalUser | null>(null);
  const [activePage, setActivePage] = useState('Executive overview');
  const [language, setLanguage] = useState('English');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navItems = useMemo(() => user ? navByRole[user.role] : [], [user]);

  if (!user) return <Login onLogin={(role) => { setUser(demoUsers[role]); setActivePage(navByRole[role][0].label); }} />;
  return <div className="app-shell"><aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}><div className="sidebar-brand"><Crest /><div><b>SELAM ACADEMY</b><span>Hawassa · Ethiopia</span></div><button className="mobile-close" onClick={() => setSidebarOpen(false)}><X size={19} /></button></div><div className="campus-pill"><span className="online-dot" /> 01 Campus <ChevronDown size={14} /></div><nav>{navItems.map(({ label, icon: Icon }) => <button key={label} className={activePage === label ? 'selected' : ''} onClick={() => { setActivePage(label); setSidebarOpen(false); }}><Icon size={18} /><span>{label}</span>{label === 'Parent feedback' && <i className="nav-badge">2</i>}</button>)}</nav><div className="sidebar-bottom"><button><Settings size={18} /> Settings</button><div className="user-mini"><span className="profile-avatar">{user.name.split(' ').map((part) => part[0]).join('')}</span><div><b>{user.name}</b><small>{user.title}</small></div><ChevronDown size={15} /></div></div></aside><div className="content-shell"><header className="topbar"><button className="mobile-menu" onClick={() => setSidebarOpen(true)}><Menu size={21} /></button><div className="breadcrumb"><span>Selam Academy</span><b>/</b><strong>{activePage}</strong></div><div className="top-actions"><div className="language-select"><span>{language === 'English' ? 'EN' : language === 'አማርኛ' ? 'አማ' : 'SDA'}</span><select value={language} onChange={(event) => setLanguage(event.target.value)} aria-label="Language"><option>English</option><option>አማርኛ</option><option>Sidaamu Afoo</option></select><ChevronDown size={13} /></div><button className="icon-button notification"><Bell size={19} /><i /></button><div className="top-profile"><span className="profile-avatar">{user.name.split(' ').map((part) => part[0]).join('')}</span><div><b>{user.name}</b><small>{user.title}</small></div></div><button className="logout-button" onClick={() => setUser(null)} title="Sign out"><LogOut size={17} /></button></div></header><main className="page-content"><div className="search-line"><div className="global-search"><Search size={17} /><input placeholder="Search students, staff, records..." /><kbd>⌘ K</kbd></div><span className="secure-label"><ShieldCheck size={14} /> Secure school workspace</span></div><RoleDashboard user={user} activePage={activePage} /></main></div>{sidebarOpen && <button className="sidebar-overlay" onClick={() => setSidebarOpen(false)} aria-label="Close menu" />}</div>;
}

export default App;
