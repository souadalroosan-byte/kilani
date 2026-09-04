import { useEffect, useState, useCallback } from 'react';
import {
  ArrowLeft, ArrowRight, Award, CalendarDays, CircleUserRound,
  FlaskConical, LayoutDashboard, LoaderCircle, LockKeyhole, LogOut,
  Menu, PencilLine, Plus, Save, Trash2, Trophy, Users, X,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { ImageUpload } from '@/components/ImageUpload';

type Department = { id: string; name: string; slug: string; description: string; accent: string; image_url: string | null };
type Member = { id: string; member_id: string | null; full_name: string; role: string; academic_info: string; bio: string; points: number; department_id: string; image_url: string | null; join_date: string | null; linkedin_url: string | null };
type Achievement = { id: string; title: string; year: number; description: string; ranking: string | null; image_url: string | null; external_url: string | null };
type Event = { id: string; title: string; description: string; event_date: string; location: string; event_type: string; image_url: string | null };
type Research = { id: string; title: string; description: string; year: number; status: string; image_url: string | null };
type PointHistory = { id: string; change: number; reason: string; created_at: string };
type AdminRole = { role: string; department_id: string | null };
type SiteContent = { key: string; value: string }[];

type View = 'overview' | 'departments' | 'members' | 'research' | 'events' | 'achievements' | 'points' | 'content';

export function AdminDashboard() {
  const [session, setSession] = useState(false);
  const [adminRole, setAdminRole] = useState<AdminRole | null>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [showLogin, setShowLogin] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const [view, setView] = useState<View>('overview');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [research, setResearch] = useState<Research[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [siteContent, setSiteContent] = useState<SiteContent>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const checkAdmin = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('admins')
      .select('role,department_id')
      .eq('user_id', userId)
      .eq('is_active', true)
      .maybeSingle();
    setAdminRole(data as AdminRole | null);
    return data as AdminRole | null;
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setSession(true);
        void checkAdmin(data.session.user.id).finally(() => setAuthChecking(false));
      } else {
        setAuthChecking(false);
      }
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, sess) => {
      (async () => {
        if (sess) {
          setSession(true);
          await checkAdmin(sess.user.id);
        } else {
          setSession(false);
          setAdminRole(null);
        }
      })();
    });
    return () => listener.subscription.unsubscribe();
  }, [checkAdmin]);

  const loadAll = useCallback(async () => {
    setLoadingData(true);
    const [d, m, r, e, a, sc] = await Promise.all([
      supabase.from('departments').select('*').order('created_at'),
      supabase.from('members').select('*').order('points', { ascending: false }),
      supabase.from('research_projects').select('*').order('year', { ascending: false }),
      supabase.from('events').select('*').order('event_date', { ascending: false }),
      supabase.from('achievements').select('*').order('year', { ascending: false }),
      supabase.from('site_content').select('key,value').order('key'),
    ]);
    if (!d.error && d.data) setDepartments(d.data);
    if (!m.error && m.data) setMembers(m.data);
    if (!r.error && r.data) setResearch(r.data);
    if (!e.error && e.data) setEvents(e.data);
    if (!a.error && a.data) setAchievements(a.data);
    if (!sc.error && sc.data) setSiteContent(sc.data);
    setLoadingData(false);
  }, []);

  useEffect(() => {
    if (session && adminRole) void loadAll();
  }, [session, adminRole, loadAll]);

  async function handleAuth(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    const result = authMode === 'login'
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password });
    setAuthLoading(false);
    if (result.error) { setAuthError(result.error.message); return; }
    if (authMode === 'signup' && result.data.user) {
      await new Promise(r => setTimeout(r, 500));
      const role = await checkAdmin(result.data.user.id);
      if (role) { setShowLogin(false); setEmail(''); setPassword(''); return; }
      setAuthError('Account created! If this is the first account, you should be auto-activated. Try signing in now.');
      setAuthMode('login');
      return;
    }
    if (result.data.user) {
      const role = await checkAdmin(result.data.user.id);
      if (!role) { setAuthError('This account is not an administrator yet. If this is the first account, try signing in again.'); return; }
      setShowLogin(false); setEmail(''); setPassword('');
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setSession(false);
    setAdminRole(null);
    setView('overview');
  }

  if (authChecking) return <div className="admin-loading"><LoaderCircle className="spin" size={28} /></div>;

  if (!session || !adminRole) {
    return (
      <div className="admin-login-screen">
        <div className="admin-login-card">
          <div className="login-icon"><LockKeyhole /></div>
          <span className="section-kicker">PRIVATE ACCESS</span>
          <h2>Admin Dashboard</h2>
          <p>Sign in with your administrator account to manage the ACI JUST website.</p>
          {showLogin ? (
            <form onSubmit={handleAuth}>
              <label>Email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
              <label>Password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} required /></label>
              <button type="submit" className="button button-dark full-button" disabled={authLoading}>
                {authLoading ? <LoaderCircle className="spin" size={16} /> : authMode === 'login' ? 'Sign in' : 'Create account'} <ArrowRight size={16} />
              </button>
              {authError && <div className="auth-error">{authError}</div>}
              <button type="button" className="switch-auth" onClick={() => { setAuthMode(authMode === 'login' ? 'signup' : 'login'); setAuthError(''); }}>
                {authMode === 'login' ? 'No account? Create one (first account becomes admin)' : 'Already have an account? Sign in'}
              </button>
            </form>
          ) : (
            <button className="button button-dark full-button" onClick={() => setShowLogin(true)}>
              <LockKeyhole size={16} /> Sign in / Sign up
            </button>
          )}
          <a className="back-link" href="#"><ArrowLeft size={15} /> Back to website</a>
        </div>
      </div>
    );
  }

  const navItems: { key: View; label: string; icon: React.ReactNode }[] = [
    { key: 'overview', label: 'Overview', icon: <LayoutDashboard size={18} /> },
    { key: 'departments', label: 'Departments', icon: <Users size={18} /> },
    { key: 'members', label: 'Members', icon: <CircleUserRound size={18} /> },
    { key: 'research', label: 'Research', icon: <FlaskConical size={18} /> },
    { key: 'events', label: 'Events', icon: <CalendarDays size={18} /> },
    { key: 'achievements', label: 'Achievements', icon: <Trophy size={18} /> },
    { key: 'points', label: 'Points', icon: <Award size={18} /> },
    { key: 'content', label: 'Site Content', icon: <PencilLine size={18} /> },
  ];

  return (
    <div className="admin-shell">
      <aside className={menuOpen ? 'admin-sidebar open' : 'admin-sidebar'}>
        <div className="sidebar-brand">
          <span className="brand-mark"><span>ACI</span><i /></span>
          <div><strong>ACI JUST</strong><small>Admin Panel</small></div>
        </div>
        <nav>
          {navItems.map((item) => (
            <button key={item.key} className={view === item.key ? 'active' : ''} onClick={() => { setView(item.key); setMenuOpen(false); setEditing(null); setCreating(false); }}>
              {item.icon} {item.label}
            </button>
          ))}
        </nav>
        <button className="sidebar-logout" onClick={handleLogout}><LogOut size={16} /> Sign out</button>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X /> : <Menu />}</button>
          <h1>{navItems.find((n) => n.key === view)?.label}</h1>
          <span className="admin-role-badge">{adminRole.role === 'super_admin' ? 'Super Admin' : 'Department Admin'}</span>
        </header>
        <div className="admin-content">
          {loadingData ? <div className="admin-loading"><LoaderCircle className="spin" size={24} /></div> : (
            <>
              {view === 'overview' && <OverviewView departments={departments} members={members} research={research} events={events} achievements={achievements} onNavigate={setView} />}
              {view === 'departments' && <DepartmentsView departments={departments} members={members} editing={editing} creating={creating} setEditing={setEditing} setCreating={setCreating} reload={loadAll} />}
              {view === 'members' && <MembersView members={members} departments={departments} editing={editing} creating={creating} setEditing={setEditing} setCreating={setCreating} reload={loadAll} />}
              {view === 'research' && <ResearchView research={research} editing={editing} creating={creating} setEditing={setEditing} setCreating={setCreating} reload={loadAll} />}
              {view === 'events' && <EventsView events={events} editing={editing} creating={creating} setEditing={setEditing} setCreating={setCreating} reload={loadAll} />}
              {view === 'achievements' && <AchievementsView achievements={achievements} editing={editing} creating={creating} setEditing={setEditing} setCreating={setCreating} reload={loadAll} />}
              {view === 'points' && <PointsView members={members} reload={loadAll} />}
              {view === 'content' && <ContentView content={siteContent} reload={loadAll} />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function OverviewView({ departments, members, research, events, achievements, onNavigate }: {
  departments: Department[]; members: Member[]; research: Research[]; events: Event[]; achievements: Achievement[]; onNavigate: (v: View) => void;
}) {
  const cards = [
    { label: 'Total Members', value: members.length, icon: <CircleUserRound />, view: 'members' as View },
    { label: 'Departments', value: departments.length, icon: <Users />, view: 'departments' as View },
    { label: 'Research Projects', value: research.length, icon: <FlaskConical />, view: 'research' as View },
    { label: 'Events', value: events.length, icon: <CalendarDays />, view: 'events' as View },
    { label: 'Achievements', value: achievements.length, icon: <Trophy />, view: 'achievements' as View },
  ];
  return (
    <div>
      <div className="stat-grid">
        {cards.map((c) => (
          <button key={c.label} className="stat-card" onClick={() => onNavigate(c.view)}>
            <div className="stat-icon">{c.icon}</div>
            <strong>{c.value}</strong><span>{c.label}</span>
          </button>
        ))}
      </div>
      <div className="overview-section">
        <h3>Quick Actions</h3>
        <div className="quick-actions">
          <button onClick={() => onNavigate('members')}><Plus size={16} /> Add Member</button>
          <button onClick={() => onNavigate('events')}><Plus size={16} /> Create Event</button>
          <button onClick={() => onNavigate('research')}><Plus size={16} /> Add Research</button>
          <button onClick={() => onNavigate('achievements')}><Plus size={16} /> Add Achievement</button>
        </div>
      </div>
    </div>
  );
}

function DepartmentsView({ departments, members, editing, creating, setEditing, setCreating, reload }: {
  departments: Department[]; members: Member[]; editing: string | null; creating: boolean; setEditing: (v: string | null) => void; setCreating: (v: boolean) => void; reload: () => Promise<void>;
}) {
  const [form, setForm] = useState<Department>({ id: '', name: '', slug: '', description: '', accent: 'blue', image_url: null });

  function startCreate() { setForm({ id: '', name: '', slug: '', description: '', accent: 'blue', image_url: null }); setCreating(true); setEditing(null); }
  function startEdit(d: Department) { setForm(d); setEditing(d.id); setCreating(false); }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (creating) {
      await supabase.from('departments').insert({ name: form.name, slug: form.slug || form.name.toLowerCase().replace(/\s+/g, '-'), description: form.description, accent: form.accent, image_url: form.image_url });
    } else {
      await supabase.from('departments').update({ name: form.name, slug: form.slug, description: form.description, accent: form.accent, image_url: form.image_url }).eq('id', form.id);
    }
    setEditing(null); setCreating(false); await reload();
  }

  async function del(id: string) {
    if (!confirm('Delete this department? Members will remain but lose their department link.')) return;
    await supabase.from('departments').delete().eq('id', id);
    await reload();
  }

  return (
    <div>
      <div className="content-header">
        <h2>Manage Departments</h2>
        {!creating && !editing && <button className="button button-dark" onClick={startCreate}><Plus size={16} /> Add Department</button>}
      </div>
      {(creating || editing) && (
        <form className="edit-form" onSubmit={save}>
          <h3>{creating ? 'New Department' : 'Edit Department'}</h3>
          <div className="form-row">
            <label>Name<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></label>
            <label>Slug<input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="auto from name" /></label>
            <label>Accent
              <select value={form.accent} onChange={(e) => setForm({ ...form, accent: e.target.value })}>
                <option value="blue">Blue</option><option value="orange">Orange</option><option value="teal">Teal</option><option value="navy">Navy</option>
              </select>
            </label>
          </div>
          <label>Description<textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} /></label>
          <ImageUpload value={form.image_url} onChange={(url) => setForm({ ...form, image_url: url })} label="Department Image" folder="departments" />
          <div className="form-actions">
            <button type="submit" className="button button-dark"><Save size={16} /> Save</button>
            <button type="button" className="button button-ghost" onClick={() => { setCreating(false); setEditing(null); }}>Cancel</button>
          </div>
        </form>
      )}
      <div className="card-grid">
        {departments.map((d) => (
          <div className="admin-card" key={d.id}>
            {d.image_url ? <img src={d.image_url} alt={d.name} className="card-image" /> : <div className="card-image-placeholder"><Users size={28} /></div>}
            <div className="card-body">
              <h3>{d.name}</h3>
              <p>{d.description}</p>
              <span className="card-meta">{members.filter((m) => m.department_id === d.id).length} members</span>
              <div className="card-actions">
                <button onClick={() => startEdit(d)}><PencilLine size={15} /> Edit</button>
                <button onClick={() => del(d.id)} className="danger"><Trash2 size={15} /> Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MembersView({ members, departments, editing, creating, setEditing, setCreating, reload }: {
  members: Member[]; departments: Department[]; editing: string | null; creating: boolean; setEditing: (v: string | null) => void; setCreating: (v: boolean) => void; reload: () => Promise<void>;
}) {
  const [form, setForm] = useState<Member>({ id: '', member_id: '', full_name: '', role: 'Member', academic_info: '', bio: '', points: 0, department_id: '', image_url: null, join_date: null, linkedin_url: null });

  function startCreate() { setForm({ id: '', member_id: '', full_name: '', role: 'Member', academic_info: '', bio: '', points: 0, department_id: departments[0]?.id ?? '', image_url: null, join_date: new Date().toISOString().slice(0, 10), linkedin_url: null }); setCreating(true); setEditing(null); }
  function startEdit(m: Member) { setForm(m); setEditing(m.id); setCreating(false); }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (creating) {
      await supabase.from('members').insert({ member_id: form.member_id || null, full_name: form.full_name, role: form.role, academic_info: form.academic_info, bio: form.bio, points: form.points, department_id: form.department_id, image_url: form.image_url, join_date: form.join_date, linkedin_url: form.linkedin_url || null });
    } else {
      await supabase.from('members').update({ member_id: form.member_id || null, full_name: form.full_name, role: form.role, academic_info: form.academic_info, bio: form.bio, points: form.points, department_id: form.department_id, image_url: form.image_url, join_date: form.join_date, linkedin_url: form.linkedin_url || null }).eq('id', form.id);
    }
    setEditing(null); setCreating(false); await reload();
  }

  async function del(id: string) {
    if (!confirm('Delete this member?')) return;
    await supabase.from('members').delete().eq('id', id);
    await reload();
  }

  return (
    <div>
      <div className="content-header">
        <h2>Manage Members</h2>
        {!creating && !editing && <button className="button button-dark" onClick={startCreate}><Plus size={16} /> Add Member</button>}
      </div>
      {(creating || editing) && (
        <form className="edit-form" onSubmit={save}>
          <h3>{creating ? 'New Member' : 'Edit Member'}</h3>
          <ImageUpload value={form.image_url} onChange={(url) => setForm({ ...form, image_url: url })} label="Profile Picture" folder="members" />
          <div className="form-row">
            <label>Full Name<input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required /></label>
            <label>Member ID (max 5 chars)<input value={form.member_id ?? ''} maxLength={5} onChange={(e) => setForm({ ...form, member_id: e.target.value })} placeholder="e.g. R001" /></label>
          </div>
          <div className="form-row">
            <label>Role<input value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} required /></label>
            <label>Department
              <select value={form.department_id} onChange={(e) => setForm({ ...form, department_id: e.target.value })} required>
                {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </label>
          </div>
          <div className="form-row">
            <label>Points<input type="number" min={0} max={100} value={form.points} onChange={(e) => setForm({ ...form, points: parseInt(e.target.value) || 0 })} required /></label>
            <label>Join Date<input type="date" value={form.join_date ?? ''} onChange={(e) => setForm({ ...form, join_date: e.target.value })} /></label>
          </div>
          <label>Academic Info<input value={form.academic_info} onChange={(e) => setForm({ ...form, academic_info: e.target.value })} placeholder="e.g. Civil Engineering \u00b7 4th Year" /></label>
          <label>LinkedIn Profile URL<input value={form.linkedin_url ?? ''} onChange={(e) => setForm({ ...form, linkedin_url: e.target.value })} placeholder="https://linkedin.com/in/..." /></label>
          <label>Bio<textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={3} /></label>
          <div className="form-actions">
            <button type="submit" className="button button-dark"><Save size={16} /> Save</button>
            <button type="button" className="button button-ghost" onClick={() => { setCreating(false); setEditing(null); }}>Cancel</button>
          </div>
        </form>
      )}
      <div className="member-table">
        {members.map((m) => {
          const dept = departments.find((d) => d.id === m.department_id);
          return (
            <div className="member-row" key={m.id}>
              {m.image_url ? <img src={m.image_url} alt={m.full_name} className="member-thumb" /> : <div className="member-thumb-placeholder"><CircleUserRound size={20} /></div>}
              <div className="member-row-info">
                <strong>{m.full_name}</strong>
                <span>{m.role} \u00b7 {dept?.name ?? 'No department'}{m.member_id ? ` \u00b7 ID: ${m.member_id}` : ''}</span>
              </div>
              <div className="member-row-points"><strong>{m.points}</strong><span>pts</span></div>
              <div className="card-actions">
                <button onClick={() => startEdit(m)}><PencilLine size={15} /> Edit</button>
                <button onClick={() => del(m.id)} className="danger"><Trash2 size={15} /></button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ResearchView({ research, editing, creating, setEditing, setCreating, reload }: {
  research: Research[]; editing: string | null; creating: boolean; setEditing: (v: string | null) => void; setCreating: (v: boolean) => void; reload: () => Promise<void>;
}) {
  const [form, setForm] = useState<Research>({ id: '', title: '', description: '', year: new Date().getFullYear(), status: 'Active', image_url: null });

  function startCreate() { setForm({ id: '', title: '', description: '', year: new Date().getFullYear(), status: 'Active', image_url: null }); setCreating(true); setEditing(null); }
  function startEdit(r: Research) { setForm(r); setEditing(r.id); setCreating(false); }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (creating) await supabase.from('research_projects').insert(form);
    else await supabase.from('research_projects').update(form).eq('id', form.id);
    setEditing(null); setCreating(false); await reload();
  }

  async function del(id: string) { if (confirm('Delete this research project?')) { await supabase.from('research_projects').delete().eq('id', id); await reload(); } }

  return (
    <div>
      <div className="content-header">
        <h2>Manage Research</h2>
        {!creating && !editing && <button className="button button-dark" onClick={startCreate}><Plus size={16} /> Add Research</button>}
      </div>
      {(creating || editing) && (
        <form className="edit-form" onSubmit={save}>
          <h3>{creating ? 'New Research Project' : 'Edit Research Project'}</h3>
          <label>Title<input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></label>
          <label>Description<textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} /></label>
          <div className="form-row">
            <label>Year<input type="number" value={form.year} onChange={(e) => setForm({ ...form, year: parseInt(e.target.value) || new Date().getFullYear() })} required /></label>
            <label>Status<select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}><option>Active</option><option>Completed</option><option>Planned</option></select></label>
          </div>
          <ImageUpload value={form.image_url} onChange={(url) => setForm({ ...form, image_url: url })} label="Project Image" folder="research" />
          <div className="form-actions">
            <button type="submit" className="button button-dark"><Save size={16} /> Save</button>
            <button type="button" className="button button-ghost" onClick={() => { setCreating(false); setEditing(null); }}>Cancel</button>
          </div>
        </form>
      )}
      <div className="card-grid">
        {research.map((r) => (
          <div className="admin-card" key={r.id}>
            {r.image_url ? <img src={r.image_url} alt={r.title} className="card-image" /> : <div className="card-image-placeholder"><FlaskConical size={28} /></div>}
            <div className="card-body">
              <h3>{r.title}</h3><p>{r.description}</p>
              <span className="card-meta">{r.year} \u00b7 {r.status}</span>
              <div className="card-actions">
                <button onClick={() => startEdit(r)}><PencilLine size={15} /> Edit</button>
                <button onClick={() => del(r.id)} className="danger"><Trash2 size={15} /> Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EventsView({ events, editing, creating, setEditing, setCreating, reload }: {
  events: Event[]; editing: string | null; creating: boolean; setEditing: (v: string | null) => void; setCreating: (v: boolean) => void; reload: () => Promise<void>;
}) {
  const [form, setForm] = useState<Event>({ id: '', title: '', description: '', event_date: new Date().toISOString().slice(0, 10), location: 'JUST Campus', event_type: 'Workshop', image_url: null });

  function startCreate() { setForm({ id: '', title: '', description: '', event_date: new Date().toISOString().slice(0, 10), location: 'JUST Campus', event_type: 'Workshop', image_url: null }); setCreating(true); setEditing(null); }
  function startEdit(ev: Event) { setForm(ev); setEditing(ev.id); setCreating(false); }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (creating) await supabase.from('events').insert(form);
    else await supabase.from('events').update(form).eq('id', form.id);
    setEditing(null); setCreating(false); await reload();
  }

  async function del(id: string) { if (confirm('Delete this event?')) { await supabase.from('events').delete().eq('id', id); await reload(); } }

  return (
    <div>
      <div className="content-header">
        <h2>Manage Events</h2>
        {!creating && !editing && <button className="button button-dark" onClick={startCreate}><Plus size={16} /> Add Event</button>}
      </div>
      {(creating || editing) && (
        <form className="edit-form" onSubmit={save}>
          <h3>{creating ? 'New Event' : 'Edit Event'}</h3>
          <label>Title<input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></label>
          <label>Description<textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} /></label>
          <div className="form-row">
            <label>Date<input type="date" value={form.event_date} onChange={(e) => setForm({ ...form, event_date: e.target.value })} required /></label>
            <label>Type<select value={form.event_type} onChange={(e) => setForm({ ...form, event_type: e.target.value })}><option>Workshop</option><option>Lecture</option><option>Competition</option><option>Training</option><option>Social</option></select></label>
          </div>
          <label>Location<input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} required /></label>
          <ImageUpload value={form.image_url} onChange={(url) => setForm({ ...form, image_url: url })} label="Event Image" folder="events" />
          <div className="form-actions">
            <button type="submit" className="button button-dark"><Save size={16} /> Save</button>
            <button type="button" className="button button-ghost" onClick={() => { setCreating(false); setEditing(null); }}>Cancel</button>
          </div>
        </form>
      )}
      <div className="card-grid">
        {events.map((ev) => (
          <div className="admin-card" key={ev.id}>
            {ev.image_url ? <img src={ev.image_url} alt={ev.title} className="card-image" /> : <div className="card-image-placeholder"><CalendarDays size={28} /></div>}
            <div className="card-body">
              <h3>{ev.title}</h3><p>{ev.description}</p>
              <span className="card-meta">{ev.event_date} \u00b7 {ev.event_type} \u00b7 {ev.location}</span>
              <div className="card-actions">
                <button onClick={() => startEdit(ev)}><PencilLine size={15} /> Edit</button>
                <button onClick={() => del(ev.id)} className="danger"><Trash2 size={15} /> Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AchievementsView({ achievements, editing, creating, setEditing, setCreating, reload }: {
  achievements: Achievement[]; editing: string | null; creating: boolean; setEditing: (v: string | null) => void; setCreating: (v: boolean) => void; reload: () => Promise<void>;
}) {
  const [form, setForm] = useState<Achievement>({ id: '', title: '', year: new Date().getFullYear(), description: '', ranking: '', image_url: null, external_url: null });

  function startCreate() { setForm({ id: '', title: '', year: new Date().getFullYear(), description: '', ranking: '', image_url: null, external_url: null }); setCreating(true); setEditing(null); }
  function startEdit(a: Achievement) { setForm(a); setEditing(a.id); setCreating(false); }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (creating) await supabase.from('achievements').insert(form);
    else await supabase.from('achievements').update(form).eq('id', form.id);
    setEditing(null); setCreating(false); await reload();
  }

  async function del(id: string) { if (confirm('Delete this achievement?')) { await supabase.from('achievements').delete().eq('id', id); await reload(); } }

  return (
    <div>
      <div className="content-header">
        <h2>Manage Achievements</h2>
        {!creating && !editing && <button className="button button-dark" onClick={startCreate}><Plus size={16} /> Add Achievement</button>}
      </div>
      {(creating || editing) && (
        <form className="edit-form" onSubmit={save}>
          <h3>{creating ? 'New Achievement' : 'Edit Achievement'}</h3>
          <div className="form-row">
            <label>Title<input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></label>
            <label>Year<input type="number" value={form.year} onChange={(e) => setForm({ ...form, year: parseInt(e.target.value) || new Date().getFullYear() })} required /></label>
          </div>
          <label>Ranking<input value={form.ranking ?? ''} onChange={(e) => setForm({ ...form, ranking: e.target.value })} placeholder="e.g. 1st place worldwide" /></label>
          <label>Description<textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} /></label>
          <label>External Link<input value={form.external_url ?? ''} onChange={(e) => setForm({ ...form, external_url: e.target.value })} placeholder="https://..." /></label>
          <ImageUpload value={form.image_url} onChange={(url) => setForm({ ...form, image_url: url })} label="Achievement Image" folder="achievements" />
          <div className="form-actions">
            <button type="submit" className="button button-dark"><Save size={16} /> Save</button>
            <button type="button" className="button button-ghost" onClick={() => { setCreating(false); setEditing(null); }}>Cancel</button>
          </div>
        </form>
      )}
      <div className="card-grid">
        {achievements.map((a) => (
          <div className="admin-card" key={a.id}>
            {a.image_url ? <img src={a.image_url} alt={a.title} className="card-image" /> : <div className="card-image-placeholder"><Trophy size={28} /></div>}
            <div className="card-body">
              <h3>{a.title}</h3><p>{a.description}</p>
              <span className="card-meta">{a.year}{a.ranking ? ` \u00b7 ${a.ranking}` : ''}</span>
              <div className="card-actions">
                <button onClick={() => startEdit(a)}><PencilLine size={15} /> Edit</button>
                <button onClick={() => del(a.id)} className="danger"><Trash2 size={15} /> Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PointsView({ members, reload }: { members: Member[]; reload: () => Promise<void> }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [change, setChange] = useState(0);
  const [reason, setReason] = useState('');
  const [history, setHistory] = useState<PointHistory[]>([]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const member = members.find((m) => m.id === selected);

  async function loadHistory(memberId: string) {
    const { data } = await supabase.from('point_history').select('id,change,reason,created_at').eq('member_id', memberId).order('created_at', { ascending: false });
    setHistory(data ?? []);
  }

  function selectMember(m: Member) {
    setSelected(m.id); setChange(0); setReason(''); setMsg('');
    void loadHistory(m.id);
  }

  async function adjustPoints(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!member || change === 0) return;
    setSaving(true); setMsg('');
    const newPoints = Math.max(0, Math.min(100, member.points + change));
    const { data: userData } = await supabase.auth.getUser();
    const { error: histError } = await supabase.from('point_history').insert({ member_id: member.id, admin_id: userData.user?.id, change, reason });
    if (histError) { setMsg('Error: ' + histError.message); setSaving(false); return; }
    const { error: memError } = await supabase.from('members').update({ points: newPoints }).eq('id', member.id);
    if (memError) setMsg('Error: ' + memError.message);
    else setMsg(`${member.full_name}: ${member.points} \u2192 ${newPoints} (${change > 0 ? '+' : ''}${change})`);
    setChange(0); setReason(''); setSaving(false);
    await reload(); await loadHistory(member.id);
  }

  return (
    <div>
      <div className="content-header"><h2>Points Management</h2></div>
      <div className="points-layout">
        <div className="points-members">
          <h3>Select Member</h3>
          {members.map((m) => (
            <button key={m.id} className={selected === m.id ? 'points-member active' : 'points-member'} onClick={() => selectMember(m)}>
              <span>{m.full_name}</span><strong>{m.points} pts</strong>
            </button>
          ))}
        </div>
        <div className="points-detail">
          {member ? (
            <>
              <h3>{member.full_name}</h3>
              <div className="points-current">Current: <strong>{member.points}</strong> / 100</div>
              <form onSubmit={adjustPoints} className="points-form">
                <label>Adjustment<input type="number" value={change} onChange={(e) => setChange(parseInt(e.target.value) || 0)} placeholder="+10 or -5" required /></label>
                <label>Reason<input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Participated in research project" required /></label>
                <button type="submit" className="button button-dark" disabled={saving || change === 0}>
                  {saving ? <LoaderCircle className="spin" size={16} /> : 'Apply'} <ArrowRight size={16} />
                </button>
              </form>
              {msg && <div className="auth-message">{msg}</div>}
              <h4>History</h4>
              <div className="points-history">
                {history.length === 0 ? <p className="empty-state">No point changes yet.</p> : history.map((h) => (
                  <div key={h.id} className="history-row">
                    <span className={h.change > 0 ? 'change-pos' : 'change-neg'}>{h.change > 0 ? '+' : ''}{h.change}</span>
                    <span className="history-reason">{h.reason}</span>
                    <span className="history-date">{new Date(h.created_at).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            </>
          ) : <p className="empty-state">Select a member to manage their points.</p>}
        </div>
      </div>
    </div>
  );
}

function ContentView({ content, reload }: { content: SiteContent; reload: () => Promise<void> }) {
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const labels: Record<string, string> = {
    hero_title: 'Hero Title (use line breaks)',
    hero_subtitle: 'Hero Subtitle',
    hero_eyebrow: 'Hero Eyebrow Text',
    about_heading: 'About Heading',
    about_text_main: 'About Main Text',
    about_text_secondary: 'About Secondary Text',
    departments_heading: 'Departments Heading',
    departments_subtext: 'Departments Subtext',
    research_heading: 'Research Heading',
    research_subtext: 'Research Subtext',
    events_heading: 'Events Heading',
    events_subtext: 'Events Subtext',
    team_heading: 'Team Heading',
    team_subtext: 'Team Subtext',
  };

  function getValue(key: string): string {
    return edits[key] ?? content.find((r) => r.key === key)?.value ?? '';
  }

  async function saveAll(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true); setMsg('');
    const keys = Object.keys(edits);
    for (const key of keys) {
      const { error } = await supabase.from('site_content').upsert({ key, value: edits[key] }, { onConflict: 'key' });
      if (error) { setMsg('Error saving: ' + error.message); setSaving(false); return; }
    }
    setMsg(`Saved ${keys.length} field${keys.length !== 1 ? 's' : ''}.`);
    setEdits({}); setSaving(false);
    await reload();
  }

  return (
    <div>
      <div className="content-header"><h2>Edit Website Content</h2></div>
      <p className="content-intro">Update the text shown across the public website. Changes appear immediately after saving.</p>
      <form className="edit-form content-form" onSubmit={saveAll}>
        {Object.keys(labels).map((key) => (
          <label key={key}>{labels[key]}
            {key.includes('text') && key !== 'hero_eyebrow'
              ? <textarea value={getValue(key)} onChange={(e) => setEdits({ ...edits, [key]: e.target.value })} rows={key.includes('main') || key.includes('subtitle') || key.includes('secondary') ? 3 : 2} />
              : <input value={getValue(key)} onChange={(e) => setEdits({ ...edits, [key]: e.target.value })} />}
          </label>
        ))}
        <div className="form-actions">
          <button type="submit" className="button button-dark" disabled={saving || Object.keys(edits).length === 0}>
            {saving ? <LoaderCircle className="spin" size={16} /> : <Save size={16} />} Save Changes
          </button>
        </div>
        {msg && <div className="auth-message">{msg}</div>}
      </form>
    </div>
  );
}
