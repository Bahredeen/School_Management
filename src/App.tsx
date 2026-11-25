import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  Bell,
  BookOpen,
  CalendarDays,
  ChevronDown,
  CircleDollarSign,
  ClipboardCheck,
  Globe,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Receipt,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import { isSupabaseConfigured, supabase, type UserRole } from './lib/supabase';
import { translations, type Language } from './lib/i18n';
import { DirectorPortal } from './components/director/DirectorPortal';
import { IctPortal } from './components/ict/IctPortal';
import { RegistrarPortal } from './components/registrar/RegistrarPortal';
import { PropertyPortal } from './components/property/PropertyPortal';
import { TeacherPortal } from './components/teacher/TeacherPortal';
import { ParentPortal } from './components/parent/ParentPortal';

type Role = UserRole;

export type PortalUser = {
  id: string;
  role: Role;
  name: string;
  email: string;
};

const fallbackAccounts: (PortalUser & { phone: string })[] = [
  {
    id: '11111111-1111-1111-1111-111111111101',
    role: 'director',
    name: 'Dawit Tadesse',
    email: 'director@selamacademy.edu.et',
    phone: '+251911200301',
  },
  {
    id: '11111111-1111-1111-1111-111111111102',
    role: 'ict',
    name: 'Ekram Mohammad',
    email: 'ict@selamacademy.edu.et',
    phone: '+251911200302',
  },
  {
    id: '11111111-1111-1111-1111-111111111105',
    role: 'registrar',
    name: 'Meron Tesfaye',
    email: 'registrar@selamacademy.edu.et',
    phone: '+251911200305',
  },
  {
    id: '11111111-1111-1111-1111-111111111106',
    role: 'property',
    name: 'Bereket Yohannes',
    email: 'property@selamacademy.edu.et',
    phone: '+251911200306',
  },
  {
    id: '11111111-1111-1111-1111-111111111103',
    role: 'teacher',
    name: 'Tigist Alemu',
    email: 'teacher@selamacademy.edu.et',
    phone: '+251911200303',
  },
  {
    id: '11111111-1111-1111-1111-111111111104',
    role: 'parent',
    name: 'Ahmad Kedir',
    email: 'parent@selamacademy.edu.et',
    phone: '+251911200304',
  },
];

const navIconsByRole: Record<Role, (typeof LayoutDashboard)[]> = {
  director: [LayoutDashboard, GraduationCap, Users, BookOpen, Bell, MessageSquare, Receipt],
  ict: [LayoutDashboard, ShieldCheck, Users, Activity, ClipboardCheck],
  registrar: [LayoutDashboard, GraduationCap, BookOpen, CircleDollarSign, Users],
  property: [LayoutDashboard, ClipboardCheck, BookOpen, Activity],
  teacher: [LayoutDashboard, ClipboardCheck, CalendarDays, MessageSquare],
  parent: [LayoutDashboard, GraduationCap, CalendarDays, MessageSquare, CircleDollarSign, Sparkles],
};

function Crest({ small = false }: { small?: boolean }) {
  return (
    <div className={`crest ${small ? 'crest-small' : ''}`} aria-label="Selam Academy crest">
      <span>SA</span>
      <BookOpen size={small ? 13 : 17} strokeWidth={2.5} />
    </div>
  );
}

function LanguageDropdown({
  language,
  onLanguageChange,
}: {
  language: Language;
  onLanguageChange: (lang: Language) => void;
}) {
  return (
    <div className="relative inline-flex items-center">
      <Globe
        size={14}
        className="pointer-events-none absolute left-2.5 text-[#547268]"
      />
      <select
        value={language}
        onChange={(event) => onLanguageChange(event.target.value as Language)}
        aria-label="Select language"
        className="appearance-none rounded-lg border border-[#d9e2dd] bg-white py-1.5 pl-8 pr-7 text-xs font-semibold text-[#365247] shadow-2xs outline-none transition hover:border-[#8eb4a6] focus:border-[#157052] cursor-pointer"
      >
        <option value="en">English</option>
        <option value="am">አማርኛ</option>
      </select>
      <ChevronDown
        size={13}
        className="pointer-events-none absolute right-2 text-[#547268]"
      />
    </div>
  );
}

function Login({
  language,
  onLanguageChange,
  onLoginSuccess,
}: {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  onLoginSuccess: (user: PortalUser) => void;
}) {
  const t = translations[language];
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    const rawInput = identifier.trim();

    if (isSupabaseConfigured && supabase) {
      let resolvedEmail = rawInput.toLowerCase();

      if (!resolvedEmail.includes('@')) {
        const { data: rpcEmail, error: rpcError } = await supabase.rpc(
          'fn_resolve_login_email',
          { p_identifier: rawInput }
        );

        if (rpcError || !rpcEmail) {
          setLoading(false);
          setError(
            language === 'am'
              ? 'በዚህ ስልክ ቁጥር የተመዘገበ መለያ አልተገኘም።'
              : 'No active account found with that phone number.'
          );
          return;
        }
        resolvedEmail = String(rpcEmail).toLowerCase();
      }

      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: resolvedEmail,
        password,
      });

      if (authError || !data.user) {
        setLoading(false);
        setError(authError?.message || 'Invalid email/phone or password.');
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profileError || !profile) {
        await supabase.auth.signOut();
        setLoading(false);
        setError('Account profile not found. Contact Selam Academy ICT.');
        return;
      }

      if (profile.status === 'suspended') {
        await supabase.auth.signOut();
        setLoading(false);
        setError('This account has been suspended. Please contact Selam Academy ICT.');
        return;
      }

      setLoading(false);
      onLoginSuccess({
        id: profile.id,
        role: profile.role as Role,
        name: profile.full_name,
        email: profile.email,
      });
      return;
    }

    const inputDigits = rawInput.replace(/[^0-9]/g, '');
    const normalizedInputDigits =
      inputDigits.length === 10 && inputDigits.startsWith('0')
        ? `251${inputDigits.slice(1)}`
        : inputDigits;

    const match = fallbackAccounts.find((user) => {
      if (rawInput.includes('@')) {
        return user.email.toLowerCase() === rawInput.toLowerCase();
      }
      const userPhoneDigits = user.phone.replace(/[^0-9]/g, '');
      return normalizedInputDigits.length >= 9 && userPhoneDigits === normalizedInputDigits;
    });

    if (!match || password.length < 6) {
      setLoading(false);
      setError(
        language === 'am'
          ? 'እባክዎ ትክክለኛ ኢሜይል ወይም ስልክ ቁጥር እና የይለፍ ቃል ያስገቡ።'
          : 'Enter a valid email address or phone number and password.'
      );
      return;
    }

    setLoading(false);
    onLoginSuccess(match);
  };

  return (
    <main className="login-shell">
      <section className="login-visual">
        <div className="visual-orbit orbit-one" />
        <div className="visual-orbit orbit-two" />
        <div className="visual-content">
          <div className="brand-lockup">
            <Crest />
            <div>
              <strong>{t.schoolName}</strong>
              <span>{t.schoolSubtitle}</span>
            </div>
          </div>
          <div className="visual-copy">
            <p className="eyebrow">{t.academicYear}</p>
            <h1>
              {t.heroTitleLine1}
              <br />
              <em>{t.heroTitleHighlight}</em>
            </h1>
            <p>{t.heroDescription}</p>
          </div>
          <div className="visual-footer">
            <span>{t.campusFooter}</span>
            <span>ሰላም አካዳሚ · Selam Academy</span>
          </div>
        </div>
      </section>
      <section className="login-panel">
        <div className="login-card">
          <div className="flex items-center justify-between mb-6">
            <div className="mobile-brand !mb-0">
              <Crest small />
              <span>{t.schoolName}</span>
            </div>
            <div className="ml-auto">
              <LanguageDropdown
                language={language}
                onLanguageChange={onLanguageChange}
              />
            </div>
          </div>
          <div className="login-heading">
            <p className="eyebrow gold">{t.securePortalAccess}</p>
            <h2>{t.welcomeBack}</h2>
            <p>{t.signInSubtitle}</p>
          </div>
          <form onSubmit={submit} className="login-form">
            <label>
              {t.emailLabel}
              <input
                type="text"
                value={identifier}
                onChange={(event) => setIdentifier(event.target.value)}
                placeholder={t.emailPlaceholder}
                disabled={loading}
                required
              />
            </label>
            <label>
              {t.passwordLabel}
              <div className="password-wrap">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder={t.passwordPlaceholder}
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  disabled={loading}
                >
                  {showPassword ? t.hide : t.show}
                </button>
              </div>
            </label>
            {error && <p className="form-error">{error}</p>}
            <button className="primary-button login-button" type="submit" disabled={loading}>
              {loading ? t.signingIn : t.signIn} <span>→</span>
            </button>
          </form>
          <p className="login-note">
            <ShieldCheck size={14} />{' '}
            {isSupabaseConfigured ? t.connectedCloud : t.secureWorkspace}
          </p>
        </div>
      </section>
    </main>
  );
}

function App() {
  const [user, setUser] = useState<PortalUser | null>(null);
  const [activeNavIndex, setActiveNavIndex] = useState(0);
  const [pendingFeedbackCount, setPendingFeedbackCount] = useState(1);
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('selam_lang');
    return saved === 'am' ? 'am' : 'en';
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [initializing, setInitializing] = useState(isSupabaseConfigured);

  const t = translations[language];

  const handleLanguageChange = (newLang: Language) => {
    setLanguage(newLang);
    localStorage.setItem('selam_lang', newLang);
  };

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setInitializing(false);
      return;
    }

    let mounted = true;

    const loadSessionUser = async (userId: string) => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (!mounted) return;

      if (profile && profile.status === 'active') {
        setUser({
          id: profile.id,
          role: profile.role as Role,
          name: profile.full_name,
          email: profile.email,
        });
        setActiveNavIndex(0);
      } else {
        await supabase.auth.signOut();
        setUser(null);
      }
      setInitializing(false);
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadSessionUser(session.user.id);
      } else if (mounted) {
        setInitializing(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user && mounted) {
        setUser(null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
  };

  const navItems = useMemo(() => {
    if (!user) return [];
    const labels = t.nav[user.role];
    const icons = navIconsByRole[user.role];
    return labels.map((label, idx) => ({
      label,
      icon: icons[idx] || LayoutDashboard,
    }));
  }, [user, t]);

  if (initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f7f5] text-[#073c2f] font-medium">
        {t.loadingPortal}
      </div>
    );
  }

  if (!user) {
    return (
      <Login
        language={language}
        onLanguageChange={handleLanguageChange}
        onLoginSuccess={(loggedInUser) => {
          setUser(loggedInUser);
          setActiveNavIndex(0);
        }}
      />
    );
  }

  const activePageLabel = navItems[activeNavIndex]?.label || navItems[0]?.label || '';
  const userRoleTitle = t.roles[user.role];

  return (
    <div className="app-shell">
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <Crest />
          <div>
            <b>{t.schoolName}</b>
            <span>{t.schoolSubtitle}</span>
          </div>
          <button className="mobile-close" onClick={() => setSidebarOpen(false)}>
            <X size={19} />
          </button>
        </div>
        <div className="campus-pill">
          <span className="online-dot" /> {t.campusLabel} <ChevronDown size={14} />
        </div>
        <nav>
          {navItems.map(({ label, icon: Icon }, index) => (
            <button
              key={label}
              className={activeNavIndex === index ? 'selected' : ''}
              onClick={() => {
                setActiveNavIndex(index);
                setSidebarOpen(false);
              }}
            >
              <Icon size={18} />
              <span>{label}</span>
              {user.role === 'director' && index === 5 && pendingFeedbackCount > 0 && (
                <i className="nav-badge">{pendingFeedbackCount}</i>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <button>
            <Settings size={18} /> {t.settings}
          </button>
          <div className="user-mini">
            <span className="profile-avatar">
              {user.name
                .split(' ')
                .map((part) => part[0])
                .join('')}
            </span>
            <div>
              <b>{user.name}</b>
              <small>{userRoleTitle}</small>
            </div>
            <ChevronDown size={15} />
          </div>
        </div>
      </aside>
      <div className="content-shell">
        <header className="topbar">
          <button className="mobile-menu" onClick={() => setSidebarOpen(true)}>
            <Menu size={21} />
          </button>
          <div className="breadcrumb">
            <span>{t.schoolName}</span>
            <b>/</b>
            <strong>{activePageLabel}</strong>
          </div>
          <div className="top-actions">
            <LanguageDropdown
              language={language}
              onLanguageChange={handleLanguageChange}
            />
            <button className="icon-button notification">
              <Bell size={19} />
              <i />
            </button>
            <div className="top-profile">
              <span className="profile-avatar">
                {user.name
                  .split(' ')
                  .map((part) => part[0])
                  .join('')}
              </span>
              <div>
                <b>{user.name}</b>
                <small>{userRoleTitle}</small>
              </div>
            </div>
            <button className="logout-button" onClick={handleSignOut} title={t.signOut}>
              <LogOut size={17} />
            </button>
          </div>
        </header>
        <main className="page-content">
          <div className="search-line">
            <div className="global-search">
              <Search size={17} />
              <input placeholder={t.searchPlaceholder} />
              <kbd>⌘ K</kbd>
            </div>
            <span className="secure-label">
              <ShieldCheck size={14} /> {t.secureWorkspace}
            </span>
          </div>

          {user.role === 'director' && (
            <DirectorPortal
              user={user}
              activeNavIndex={activeNavIndex}
              language={language}
              onNavigate={setActiveNavIndex}
              onPendingFeedbackCountChange={setPendingFeedbackCount}
            />
          )}

          {user.role === 'ict' && (
            <IctPortal
              user={user}
              activeNavIndex={activeNavIndex}
              language={language}
              onNavigate={setActiveNavIndex}
            />
          )}

          {user.role === 'registrar' && (
            <RegistrarPortal
              user={user}
              activeNavIndex={activeNavIndex}
              language={language}
              onNavigate={setActiveNavIndex}
            />
          )}

          {user.role === 'property' && (
            <PropertyPortal
              user={user}
              activeNavIndex={activeNavIndex}
              language={language}
              onNavigate={setActiveNavIndex}
            />
          )}

          {user.role === 'teacher' && (
            <TeacherPortal
              user={user}
              activeNavIndex={activeNavIndex}
              language={language}
              onNavigate={setActiveNavIndex}
            />
          )}

          {user.role === 'parent' && (
            <ParentPortal
              user={user}
              activeNavIndex={activeNavIndex}
              language={language}
              onNavigate={setActiveNavIndex}
            />
          )}
        </main>
      </div>
      {sidebarOpen && (
        <button
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close menu"
        />
      )}
    </div>
  );
}

export default App;