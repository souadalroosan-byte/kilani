import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight, ArrowLeft, ChevronRight, ChevronLeft, CircleUserRound, FlaskConical, Hammer,
  Instagram, Linkedin, LockKeyhole, Menu, Sparkles, Trophy, Users, X,
  Building2, Layers, Ruler, Beaker, Languages,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { translations, type Lang, type TranslationKey } from '@/lib/translations';

type Department = { id: string; name: string; slug: string; description: string; accent: string; image_url: string | null };
type Member = { id: string; member_id: string | null; full_name: string; role: string; academic_info: string; bio: string; points: number; department_id: string; image_url: string | null; join_date: string | null; linkedin_url: string | null };
type Achievement = { id: string; title: string; year: number; description: string; ranking: string | null };
type Event = { id: string; title: string; description: string; event_date: string; location: string; event_type: string };
type Research = { id: string; title: string; description: string; year: number; status: string };
type News = { id: string; title: string; description: string; image_url: string | null; published_date: string; external_url: string | null };
type SiteContent = Record<string, string>;

const fallbackDepartments: Department[] = [
  { id: '1', name: 'Research Department', slug: 'research', description: 'Turning questions about concrete and construction materials into practical, evidence-based work.', accent: 'blue', image_url: null },
  { id: '2', name: 'Public Relations', slug: 'public-relations', description: 'Connecting ACI JUST with students, faculty, industry partners, and the wider engineering community.', accent: 'orange', image_url: null },
  { id: '3', name: 'Events Department', slug: 'events', description: 'Creating memorable workshops, competitions, lectures, and hands-on engineering experiences.', accent: 'teal', image_url: null },
  { id: '4', name: 'Social Media', slug: 'social-media', description: 'Making engineering knowledge and the team\u2019s story accessible, useful, and easy to share.', accent: 'navy', image_url: null },
];
const fallbackMembers: Member[] = [
  { id: '1', member_id: 'R001', full_name: 'Ahmad Al-Kilani', role: 'Research Member', academic_info: 'Civil Engineering \u00b7 4th Year', bio: 'Exploring sustainable concrete technologies and material performance.', points: 87, department_id: '1', image_url: null, join_date: '2024-09-01', linkedin_url: null },
  { id: '2', member_id: 'E001', full_name: 'Lina Haddad', role: 'Events Coordinator', academic_info: 'Civil Engineering \u00b7 3rd Year', bio: 'Bringing students together through hands-on engineering experiences.', points: 92, department_id: '3', image_url: null, join_date: '2024-10-15', linkedin_url: null },
  { id: '3', member_id: 'P001', full_name: 'Omar Nassar', role: 'PR Member', academic_info: 'Civil Engineering \u00b7 4th Year', bio: 'Building bridges between ACI JUST and the engineering community.', points: 79, department_id: '2', image_url: null, join_date: '2024-09-10', linkedin_url: null },
];
const fallbackAchievement: Achievement = { id: '1', title: 'Ranked #1 Worldwide', year: 2025, description: 'ACI JUST achieved first place among ACI student chapters around the world in 2025.', ranking: '1st place among ACI student chapters worldwide' };
const fallbackEvents: Event[] = [{ id: '1', title: 'ACI JUST Concrete Talks', description: 'A student-led evening of ideas, case studies, and conversation around the material that shapes our world.', event_date: '2026-10-15', location: 'Civil Engineering Department, JUST', event_type: 'Lecture' }];
const fallbackResearch: Research[] = [{ id: '1', title: 'Concrete Innovation & Sustainable Materials', description: 'Exploring practical ways to make concrete more responsible, resilient, and ready for the future.', year: 2025, status: 'Active' }];
const fallbackNews: News[] = [
  { id: '1', title: 'ACI JUST Wins Global Recognition', description: 'Our chapter ranked first among ACI student chapters worldwide for 2025.', image_url: null, published_date: '2025-06-15', external_url: null },
  { id: '2', title: 'New Research Lab Opens', description: 'A new materials testing lab is now available for student research projects.', image_url: null, published_date: '2025-09-01', external_url: null },
];

export function PublicSite() {
  const [activeSection, setActiveSection] = useState('home');
  const [menuOpen, setMenuOpen] = useState(false);
  const [lang, setLang] = useState<Lang>('en');
  const [departments, setDepartments] = useState<Department[]>(fallbackDepartments);
  const [members, setMembers] = useState<Member[]>(fallbackMembers);
  const [achievement, setAchievement] = useState<Achievement>(fallbackAchievement);
  const [events, setEvents] = useState<Event[]>(fallbackEvents);
  const [research, setResearch] = useState<Research[]>(fallbackResearch);
  const [news, setNews] = useState<News[]>(fallbackNews);
  const [content, setContent] = useState<SiteContent>({});
  const [activeDept, setActiveDept] = useState<string | null>(null);

  const isAr = lang === 'ar';

  useEffect(() => {
    async function loadContent() {
      const [d, m, a, e, r, n, c] = await Promise.all([
        supabase.from('departments').select('id,name,slug,description,accent,image_url').order('created_at'),
        supabase.from('members').select('id,member_id,full_name,role,academic_info,bio,points,department_id,image_url,join_date,linkedin_url').order('points', { ascending: false }),
        supabase.from('achievements').select('id,title,year,description,ranking').order('year', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('events').select('id,title,description,event_date,location,event_type').order('event_date').limit(3),
        supabase.from('research_projects').select('id,title,description,year,status').order('year', { ascending: false }).limit(3),
        supabase.from('news').select('id,title,description,image_url,published_date,external_url').order('published_date', { ascending: false }).limit(6),
        supabase.from('site_content').select('key,value'),
      ]);
      if (!d.error && d.data?.length) setDepartments(d.data);
      if (!m.error && m.data?.length) setMembers(m.data);
      if (!a.error && a.data) setAchievement(a.data);
      if (!e.error && e.data?.length) setEvents(e.data);
      if (!r.error && r.data?.length) setResearch(r.data);
      if (!n.error && n.data?.length) setNews(n.data);
      if (!c.error && c.data) {
        const map: SiteContent = {};
        c.data.forEach((row: { key: string; value: string }) => { map[row.key] = row.value; });
        setContent(map);
      }
    }
    void loadContent();
  }, []);

  function t(key: TranslationKey): string {
    return translations[lang][key] ?? translations.en[key];
  }

  function tc(key: string, fallback: string): string {
    return content[key] ?? fallback;
  }

  function navigate(section: string) {
    setActiveSection(section);
    setMenuOpen(false);
    document.getElementById(section)?.scrollIntoView({ behavior: 'smooth' });
  }

  function toggleLang() {
    setLang(prev => prev === 'en' ? 'ar' : 'en');
  }

  const Arrow = isAr ? ArrowLeft : ArrowRight;
  const Chevron = isAr ? ChevronLeft : ChevronRight;

  const stats = useMemo(() => [
    { value: members.length ? `${members.length}+` : '40+', label: t('stat_members') },
    { value: '04', label: t('stat_departments') },
    { value: '01', label: t('stat_ranking') },
  ], [members.length, lang]);

  const filteredMembers = useMemo(() => {
    if (!activeDept) return members;
    return members.filter((m) => m.department_id === activeDept);
  }, [members, activeDept]);

  const locale = isAr ? 'ar' : 'en';

  return (
    <div className={`site-shell${isAr ? ' rtl' : ''}`} dir={isAr ? 'rtl' : 'ltr'}>
      <header className="topbar">
        <button className="brand" onClick={() => navigate('home')} aria-label="ACI JUST home">
          <span className="brand-mark"><span>ACI</span><i /></span>
          <span><strong>ACI JUST</strong><small>{isAr ? 'فصل طلابي' : 'Student Chapter'}</small></span>
        </button>
        <nav className={menuOpen ? 'nav-links open' : 'nav-links'}>
          {(['home', 'about', 'departments', 'research', 'events', 'achievements', 'team', 'news'] as const).map((item) => (
            <button key={item} className={activeSection === item ? 'active' : ''} onClick={() => navigate(item)}>
              {t(`nav_${item}` as TranslationKey)}
            </button>
          ))}
        </nav>
        <button className="lang-toggle" onClick={toggleLang} aria-label="Switch language">
          <Languages size={16} /> {t('lang_button')}
        </button>
        <a className="admin-button" href="#/admin"><LockKeyhole size={15} /> {t('admin_login')}</a>
        <button className="menu-button" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">{menuOpen ? <X /> : <Menu />}</button>
      </header>

      <main>
        <section id="home" className="hero section-pad">
          <div className="hero-grid" />
          <div className="hero-blueprint" />
          <div className="hero-copy reveal">
            <div className="eyebrow"><span className="eyebrow-line" /> {tc('hero_eyebrow', t('hero_eyebrow'))}</div>
            <h1 dangerouslySetInnerHTML={{ __html: tc('hero_title', t('hero_title')).replace(/\n/g, '<br/>') }} />
            <p className="hero-lede">{tc('hero_subtitle', t('hero_subtitle'))}</p>
            <div className="hero-actions">
              <button className="button button-blue" onClick={() => navigate('team')}>{t('meet_team')} <Arrow size={17} /></button>
              <button className="text-link" onClick={() => navigate('research')}>{t('discover_work')} <Chevron size={16} /></button>
            </div>
            <div className="hero-stats">{stats.map((stat) => <div key={stat.label}><strong>{stat.value}</strong><span>{stat.label}</span></div>)}</div>
          </div>
          <div className="hero-art">
            <div className="art-ring ring-one" /><div className="art-ring ring-two" />
            <div className="art-label">ACI / JUST<span>EST. 2021</span></div>
            <div className="concrete-block block-one" /><div className="concrete-block block-two" />
            <div className="hero-icon-row"><Building2 size={20} /><Layers size={20} /><Beaker size={20} /><Ruler size={20} /></div>
            <img src="/assets/images/Screenshot_2026-08-26_152621.png" alt="ACI JUST official logo" />
          </div>
          <div className="scroll-cue"><span>{t('scroll_explore')}</span><div /></div>
        </section>

        <section id="about" className="section-pad about-section">
          <div className="section-intro"><span className="section-kicker">{t('about_kicker')}</span><h2 dangerouslySetInnerHTML={{ __html: tc('about_heading', t('about_heading')).replace(/\n/g, '<br/>') }} /></div>
          <div className="about-body">
            <div className="about-text">
              <p className="large-copy">{tc('about_text_main', t('about_text_main'))}</p>
              <p>{tc('about_text_secondary', t('about_text_secondary'))}</p>
              <button className="arrow-link" onClick={() => navigate('departments')}>{t('see_what')} <Arrow size={17} /></button>
            </div>
            <div className="about-image">
              <img src="/assets/images/WhatsApp_Image_2026-08-31_at_5.26.09_PM.jpeg" alt="ACI JUST team" />
              <div className="about-image-frame" />
            </div>
          </div>
        </section>

        <section id="departments" className="section-pad departments-section">
          <div className="section-heading"><div><span className="section-kicker">{t('dept_kicker')}</span><h2 dangerouslySetInnerHTML={{ __html: tc('departments_heading', t('dept_heading')).replace(/\n/g, '<br/>') }} /></div><p>{tc('departments_subtext', t('dept_subtext'))}</p></div>
          <div className="department-grid">
            {departments.map((department, index) => (
              <button className={`department-card accent-${department.accent}`} key={department.id} onClick={() => { setActiveDept(department.id); navigate('team'); }}>
                {department.image_url && <img src={department.image_url} alt={department.name} className="dept-card-img" />}
                <span className="card-number">0{index + 1}</span>
                <div className="department-icon">{index === 0 ? <FlaskConical /> : index === 1 ? <Users /> : index === 2 ? <Hammer /> : <Sparkles />}</div>
                <h3>{department.name}</h3>
                <p>{department.description}</p>
                <span className="card-link">{t('view_dept')} <Arrow size={16} /></span>
              </button>
            ))}
          </div>
        </section>

        <section id="research" className="section-pad dark-section">
          <div className="section-heading light"><div><span className="section-kicker">{t('research_kicker')}</span><h2 dangerouslySetInnerHTML={{ __html: tc('research_heading', t('research_heading')).replace(/\n/g, '<br/>') }} /></div><button className="outline-button">{t('all_research')} <Arrow size={16} /></button></div>
          <div className="research-layout">
            <div className="research-feature">
              <span className="feature-tag">{t('research_featured')} / {research[0]?.year ?? 2025}</span>
              <div className="research-visual"><div className="grid-lines" /><div className="cube cube-a" /><div className="cube cube-b" /><span dangerouslySetInnerHTML={{ __html: t('research_matters') }} /></div>
              <h3>{research[0]?.title ?? fallbackResearch[0].title}</h3>
              <p>{research[0]?.description ?? fallbackResearch[0].description}</p>
              <button className="light-link">{t('read_project')} <Arrow size={16} /></button>
            </div>
            <div className="research-aside">
              <div className="aside-stat"><strong>{String(research.length).padStart(2, '0')}</strong><span dangerouslySetInnerHTML={{ __html: t('research_projects') }} /></div>
              <div className="aside-quote">{tc('research_subtext', t('research_subtext'))}</div>
              <div className="aside-rule" />
            </div>
          </div>
        </section>

        <section id="achievements" className="section-pad achievement-section">
          <div className="achievement-badge"><Trophy size={23} /></div>
          <div className="achievement-copy">
            <span className="section-kicker">{t('ach_kicker')}</span>
            <h2>{achievement.title}</h2>
            <p>{achievement.description}</p>
            <button className="arrow-link" onClick={() => navigate('team')}>{t('our_journey')} <Arrow size={17} /></button>
          </div>
          <div className="achievement-rank"><span>{t('worldwide')}</span><strong>#1</strong><small>{achievement.year}</small></div>
        </section>

        <section id="events" className="section-pad events-section">
          <div className="section-heading"><div><span className="section-kicker">{t('events_kicker')}</span><h2 dangerouslySetInnerHTML={{ __html: tc('events_heading', t('events_heading')).replace(/\n/g, '<br/>') }} /></div><p>{tc('events_subtext', t('events_subtext'))}</p></div>
          <div className="event-list">
            {events.map((event, index) => (
              <article className="event-row" key={event.id}>
                <span className="event-index">0{index + 1}</span>
                <div className="event-date"><strong>{new Date(event.event_date).getDate()}</strong><span>{new Date(event.event_date).toLocaleString(locale, { month: 'short' }).toUpperCase()}<br />{new Date(event.event_date).getFullYear()}</span></div>
                <div className="event-info"><span>{event.event_type} \u00b7 {event.location}</span><h3>{event.title}</h3><p>{event.description}</p></div>
                <Chevron className="event-arrow" />
              </article>
            ))}
          </div>
        </section>

        <section id="team" className="section-pad team-section">
          <div className="section-heading"><div><span className="section-kicker">{t('team_kicker')}</span><h2 dangerouslySetInnerHTML={{ __html: tc('team_heading', t('team_heading')).replace(/\n/g, '<br/>') }} /></div><p>{tc('team_subtext', t('team_subtext'))}</p></div>
          <div className="dept-tabs">
            <button className={!activeDept ? 'active' : ''} onClick={() => setActiveDept(null)}>{t('all_members')}</button>
            {departments.map((d) => (
              <button key={d.id} className={activeDept === d.id ? 'active' : ''} onClick={() => setActiveDept(d.id)}>{d.name}</button>
            ))}
          </div>
          {activeDept && (() => {
            const dept = departments.find((d) => d.id === activeDept);
            if (!dept) return null;
            return (
              <div className="dept-detail-banner">
                {dept.image_url && <img src={dept.image_url} alt={dept.name} className="dept-banner-img" />}
                <div className="dept-banner-info">
                  <h3>{dept.name}</h3>
                  <p>{dept.description}</p>
                  <span>{filteredMembers.length} {t(filteredMembers.length === 1 ? 'member_count_one' : 'member_count_other')}</span>
                </div>
              </div>
            );
          })()}
          <div className="team-grid">
            {filteredMembers.map((member, index) => (
              <article className="member-card" key={member.id}>
                {member.image_url ? <img src={member.image_url} alt={member.full_name} className="member-avatar-img" /> : <div className={`member-avatar avatar-${index % 3}`}><CircleUserRound size={42} /></div>}
                <div className="member-meta">
                  <span>{member.role}</span>
                  <h3>{member.full_name}</h3>
                  <p>{member.academic_info}</p>
                  {member.member_id && <span className="member-id-badge">{t('member_id_label')}: {member.member_id}</span>}
                  {member.join_date && <span className="member-join-date">{t('joined')} {new Date(member.join_date).toLocaleDateString(locale, { year: 'numeric', month: 'short' })}</span>}
                </div>
                <div className="member-footer">
                  <div className="member-score"><strong>{member.points}</strong><span>{t('points')}</span></div>
                  {member.linkedin_url && <a href={member.linkedin_url} target="_blank" rel="noopener noreferrer" className="member-linkedin" aria-label={`${member.full_name} LinkedIn`}><Linkedin size={18} /></a>}
                </div>
              </article>
            ))}
          </div>
          {filteredMembers.length === 0 && <p className="empty-team">{t('no_members')}</p>}
        </section>

        <section id="news" className="section-pad news-section">
          <div className="section-heading"><div><span className="section-kicker">{t('news_kicker')}</span><h2 dangerouslySetInnerHTML={{ __html: tc('news_heading', t('news_heading')).replace(/\n/g, '<br/>') }} /></div><p>{tc('news_subtext', t('news_subtext'))}</p></div>
          {news.length > 0 ? (
            <div className="news-grid">
              {news.map((item, index) => (
                <article className="news-card" key={item.id}>
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.title} className="news-card-img" />
                  ) : (
                    <div className="news-card-img-placeholder"><span className="news-card-index">0{index + 1}</span></div>
                  )}
                  <div className="news-card-body">
                    <span className="news-card-date">{new Date(item.published_date).toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>
                    {item.external_url && (
                      <a href={item.external_url} target="_blank" rel="noopener noreferrer" className="news-card-link">{t('news_read_more')} <Arrow size={15} /></a>
                    )}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="empty-team">{t('news_no_items')}</p>
          )}
        </section>
      </main>

      <footer>
        <div className="footer-brand"><span className="brand-mark"><span>ACI</span><i /></span><div><strong>ACI JUST</strong><p dangerouslySetInnerHTML={{ __html: t('footer_org') }} /></div></div>
        <div className="footer-note"><span>{t('footer_tagline')}</span><div><Instagram size={18} /><Linkedin size={18} /></div></div>
      </footer>
    </div>
  );
}
