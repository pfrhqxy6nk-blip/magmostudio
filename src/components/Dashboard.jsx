import { useState, useEffect, Component } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useSpring, useMotionValue } from 'framer-motion';
import { useAuth } from '../App';
import { supabase } from '../lib/supabase';
import {
    Layout, Plus, Settings, LogOut, ChevronRight, Share2, Bell,
    Search, Filter, MoreHorizontal, ArrowUpRight, Folder,
    MessageSquare, CheckCircle2, Clock, Shield, Zap, X,
    ChevronDown, Play, Pause, Download, FileText, Image as ImageIcon,
    ExternalLink, Trash2, Edit3, User, Mail, Phone, Lock, Eye,
    CreditCard, Calendar, BarChart3, PieChart, Activity,
    Briefcase, Users, LayoutDashboard, Wallet, Archive, ShieldCheck, Info,
    ArrowLeft, Circle, Send, Smartphone
} from 'lucide-react';

// Error Boundary Component
class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Dashboard Error:", error, errorInfo);
        this.setState({ error, errorInfo });
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: '40px', color: 'white' }}>
                    <h2>Something went wrong in the Dashboard.</h2>
                    <details style={{ whiteSpace: 'pre-wrap' }}>
                        {this.state.error && this.state.error.toString()}
                        <br />
                        {this.state.errorInfo && this.state.errorInfo.componentStack}
                    </details>
                    <button onClick={() => window.location.reload()} style={{ marginTop: '20px', padding: '10px 20px', background: 'white', color: 'black', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
                        Reload Page
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}

const ADMIN_THEME = {
    primary: '#00F0FF', // Cyan
    secondary: '#0066FF', // Blue
    accent: 'rgba(0, 240, 255, 0.1)',
    bg: 'radial-gradient(circle at 50% 0%, #001A33 0%, #000 100%)'
};

const getStatusDetails = (status, isAdmin = false) => {
    const primary = isAdmin ? ADMIN_THEME.primary : '#FF4D00';
    switch (status) {
        case 'ACTIVE': return { label: 'В РОБОТІ', color: '#4CAF50', bg: 'rgba(76, 175, 80, 0.1)' };
        case 'PENDING': return { label: 'ОБРОБКА', color: isAdmin ? ADMIN_THEME.primary : '#FF9500', bg: isAdmin ? 'rgba(0, 240, 255, 0.1)' : 'rgba(255, 149, 0, 0.1)' };
        case 'PAYMENT': return { label: 'ОПЛАТА', color: primary, bg: `${primary}1a` };
        case 'COMPLETED': return { label: 'ГОТОВО', color: '#2196F3', bg: 'rgba(33, 150, 243, 0.1)' };
        default: return { label: 'СТАТУС', color: '#FFF', bg: 'rgba(255, 255, 255, 0.1)' };
    }
};

const Magnetic = ({ children }) => {
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const mouseX = useSpring(x);
    const mouseY = useSpring(y);

    const handleMouseMove = (e) => {
        const { clientX, clientY, currentTarget } = e;
        const { left, top, width, height } = currentTarget.getBoundingClientRect();
        const centerX = left + width / 2;
        const centerY = top + height / 2;
        x.set((clientX - centerX) * 0.4);
        y.set((clientY - centerY) * 0.4);
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
    };

    return (
        <motion.div onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave} style={{ x: mouseX, y: mouseY }}>
            {children}
        </motion.div>
    );
};

const AdminOverview = ({ projects, onFilter }) => {
    const stats = [
        { id: 'ACTIVE', label: 'АКТИВНІ ПРОЕКТИ', value: projects.filter(p => p.status === 'ACTIVE').length, icon: <Layout size={20} />, color: '#4CAF50' },
        { id: 'PENDING', label: 'НОВІ ЗАЯВКИ', value: projects.filter(p => p.status === 'PENDING').length, icon: <Clock size={20} />, color: ADMIN_THEME.primary },
        { id: 'PAYMENT', label: 'ОЧІКУЮТЬ ОПЛАТИ', value: projects.filter(p => p.status === 'PAYMENT').length, icon: <Wallet size={20} />, color: ADMIN_THEME.secondary },
        { id: 'ALL', label: 'ВСІ ПРОЕКТИ', value: projects.length, icon: <CreditCard size={20} />, color: '#2196F3' }
    ];

    return (
        <div style={{ marginBottom: '40px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', opacity: 0.6 }}>
                <Shield size={16} color={ADMIN_THEME.primary} />
                <span style={{ fontSize: '0.7rem', fontWeight: 900, letterSpacing: '2px', color: ADMIN_THEME.primary }}>ADMINISTRATIVE OVERVIEW & CONTROL</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
                {stats.map((s, i) => (
                    <motion.div
                        key={i}
                        whileHover={{ y: -5, borderColor: s.color, cursor: 'pointer' }}
                        onClick={() => onFilter(s.id === 'ALL' ? null : s.id)}
                        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '24px', padding: '24px', transition: '0.3s' }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                            <div style={{ color: s.color, background: `${s.color}10`, padding: '8px', borderRadius: '12px' }}>{s.icon}</div>
                            <span style={{ fontSize: '0.65rem', fontWeight: 900, color: 'rgba(255,255,255,0.3)', letterSpacing: '1px' }}>{s.label}</span>
                        </div>
                        <div style={{ fontSize: '1.8rem', fontWeight: 950 }}>{s.value}</div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

const AdminTeamView = ({ addAdmin, removeAdmin }) => {
    const [team, setTeam] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchTeam = async () => {
        const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('is_admin', true)
            .order('created_at', { ascending: true });
        if (data) setTeam(data);
        setLoading(false);
    };

    useEffect(() => { fetchTeam(); }, []);

    const handleAdd = async (e) => {
        e.preventDefault();
        const email = e.target.email.value;
        await addAdmin(email);
        e.target.reset();
        fetchTeam();
    };

    const handleRemove = async (email) => {
        await removeAdmin(email);
        fetchTeam();
    };

    if (loading) return null;

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 950, letterSpacing: '-0.03em', marginBottom: '40px' }}>Керування Командою</h2>

            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '32px', padding: '40px', maxWidth: '800px' }}>
                <div style={{ marginBottom: '40px' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#FF4D00', marginBottom: '20px', letterSpacing: '1px' }}>ДОДАТИ РОЗРОБНИКА</h3>
                    <form onSubmit={handleAdd} style={{ display: 'flex', gap: '16px' }}>
                        <input
                            name="email"
                            type="email"
                            placeholder="email@example.com"
                            style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '16px', color: 'white', fontWeight: 600, outline: 'none' }}
                            required
                        />
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            type="submit"
                            style={{ background: '#FF4D00', color: 'white', border: 'none', borderRadius: '16px', padding: '0 32px', fontWeight: 900, cursor: 'pointer' }}
                        >
                            ДОДАТИ
                        </motion.button>
                    </form>
                </div>

                <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'rgba(255,255,255,0.3)', marginBottom: '20px', letterSpacing: '1px' }}>СПИСОК АДМІНІСТРАТОРІВ</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {team.map(member => (
                            <div key={member.email} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '16px 24px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <img src={member.avatar} style={{ width: '32px', height: '32px', borderRadius: '50%' }} alt="" />
                                    <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{member.email}</span>
                                    {member.is_root && <span style={{ fontSize: '0.6rem', fontWeight: 950, color: '#FF4D00', background: 'rgba(255,77,0,0.1)', padding: '4px 8px', borderRadius: '6px' }}>ROOT</span>}
                                </div>
                                {!member.is_root && (
                                    <button
                                        onClick={() => handleRemove(member.email)}
                                        style={{ background: 'transparent', border: 'none', color: 'rgba(255,50,50,0.5)', fontWeight: 800, cursor: 'pointer', fontSize: '0.7rem' }}
                                    >
                                        ВИДАЛИТИ
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

const AdminTable = ({ projects, onSelect, onDelete }) => {
    return (
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '24px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <th style={{ padding: '20px 24px', fontSize: '0.65rem', fontWeight: 950, color: 'rgba(255,255,255,0.3)', letterSpacing: '2px' }}>КЛІЄНТ / ПРОЕКТ</th>
                        <th style={{ padding: '20px 24px', fontSize: '0.65rem', fontWeight: 950, color: 'rgba(255,255,255,0.3)', letterSpacing: '2px' }}>КАТЕГОРІЯ</th>
                        <th style={{ padding: '20px 24px', fontSize: '0.65rem', fontWeight: 950, color: 'rgba(255,255,255,0.3)', letterSpacing: '2px' }}>СТАТУС</th>
                        <th style={{ padding: '20px 24px', fontSize: '0.65rem', fontWeight: 950, color: 'rgba(255,255,255,0.3)', letterSpacing: '2px' }}>ПРОГРЕС</th>
                        <th style={{ padding: '20px 24px', fontSize: '0.65rem', fontWeight: 950, color: 'rgba(255,255,255,0.3)', letterSpacing: '2px' }}>ДІЯ</th>
                    </tr>
                </thead>
                <tbody>
                    {projects.map((p, i) => {
                        const status = getStatusDetails(p.status, true);
                        return (
                            <motion.tr
                                key={p.id}
                                whileHover={{ background: 'rgba(0, 240, 255, 0.03)' }}
                                style={{ borderBottom: i === projects.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.03)', cursor: 'pointer' }}
                                onClick={() => onSelect(p.id)}
                            >
                                <td style={{ padding: '24px' }}>
                                    <div style={{ fontSize: '0.65rem', fontWeight: 900, color: ADMIN_THEME.primary, marginBottom: '4px' }}>{p.owner_email}</div>
                                    <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>{p.title}</div>
                                </td>
                                <td style={{ padding: '24px' }}>
                                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.05)', padding: '6px 12px', borderRadius: '8px' }}>{p.category}</span>
                                </td>
                                <td style={{ padding: '24px' }}>
                                    <span style={{ fontSize: '0.65rem', fontWeight: 950, color: status.color, background: status.bg, padding: '6px 12px', borderRadius: '30px', letterSpacing: '1px' }}>{status.label}</span>
                                </td>
                                <td style={{ padding: '24px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{ flex: 1, height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', overflow: 'hidden', minWidth: '100px' }}>
                                            <div style={{ height: '100%', width: `${p.progress}%`, background: status.color, boxShadow: `0 0 10px ${status.color}40` }} />
                                        </div>
                                        <span style={{ fontSize: '0.75rem', fontWeight: 950 }}>{p.progress}%</span>
                                    </div>
                                </td>
                                <td style={{ padding: '24px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onDelete(p.id);
                                            }}
                                            style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(255,50,50,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FF3232', cursor: 'pointer' }}
                                        >
                                            <Trash2 size={18} strokeWidth={3} />
                                        </div>
                                        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: ADMIN_THEME.primary }}>
                                            <ChevronRight size={18} strokeWidth={3} />
                                        </div>
                                    </div>
                                </td>
                            </motion.tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

const Dashboard = () => {
    const { user, logout, projects, admins, addAdmin, removeAdmin, addProject, updateProjectStatus, updateProjectData, deleteProject, payForProject, updateUser, addComment, updateRoadmapStep, addRoadmapStep, deleteRoadmapStep, addResource } = useAuth();
    const [activeTab, setActiveTab] = useState('projects');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedProjectId, setSelectedProjectId] = useState(null);
    const [isAdminMode, setIsAdminMode] = useState(false);
    const [filterStatus, setFilterStatus] = useState(null);

    // Sync admin mode with user state
    useEffect(() => {
        if (user?.is_admin) setIsAdminMode(true);
        else setIsAdminMode(false);
    }, [user]);

    // Reset selection when toggling admin mode
    useEffect(() => {
        setSelectedProjectId(null);
        if (isAdminMode && activeTab !== 'team' && activeTab !== 'portfolio') setActiveTab('projects');
    }, [isAdminMode]);

    const filteredProjects = isAdminMode
        ? (filterStatus ? projects.filter(p => p.status === filterStatus) : projects)
        : projects.filter(p => p.owner_email === user?.email);
    const selectedProject = projects.find(p => p.id === selectedProjectId);

    if (selectedProject && activeTab === 'projects') {
        return (
            <ErrorBoundary>
                <ProjectDetailsView
                    project={selectedProject}
                    onBack={() => setSelectedProjectId(null)}
                    user={user}
                />
            </ErrorBoundary>
        );
    }

    return (
        <section style={{
            minHeight: '100vh',
            padding: '120px 40px 60px',
            display: 'grid',
            gridTemplateColumns: '280px 1fr',
            gap: '60px',
            maxWidth: '1600px',
            margin: '0 auto',
            position: 'relative',
            background: isAdminMode ? '#000810' : '#000',
            overflow: 'hidden',
            transition: 'background 0.5s ease'
        }}>
            {/* BACKGROUND DECORATIVE ORBS */}
            <div style={{
                position: 'absolute',
                top: '-10%',
                right: '-5%',
                width: '600px',
                height: '600px',
                background: isAdminMode
                    ? `radial-gradient(circle, ${ADMIN_THEME.primary}08 0%, transparent 70%)`
                    : 'radial-gradient(circle, rgba(255,77,0,0.05) 0%, transparent 70%)',
                filter: 'blur(80px)',
                pointerEvents: 'none',
                transition: 'background 0.5s ease'
            }} />
            <div style={{ position: 'absolute', bottom: '10%', left: '-10%', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(255,77,0,0.03) 0%, transparent 70%)', filter: 'blur(80px)', pointerEvents: 'none' }} />
            {/* Sidebar */}
            <aside style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
                <Magnetic>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '0 10px', cursor: 'pointer' }} onClick={() => setActiveTab('settings')}>
                        <div style={{ position: 'relative' }}>
                            <img src={user?.avatar} alt="Avatar" style={{ width: '50px', height: '50px', borderRadius: '15px' }} />
                            <div style={{ position: 'absolute', bottom: -5, right: -5, width: '18px', height: '18px', background: isAdminMode ? ADMIN_THEME.primary : '#4CAF50', border: '3px solid #000', borderRadius: '50%' }} />
                        </div>
                        <div>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>{user?.name}</h3>
                            <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>{isAdminMode ? 'ADMIN MODE' : 'Клієнт'}</p>
                        </div>
                    </div>
                </Magnetic>

                <nav style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <SidebarLink icon={<Layout size={20} />} label="Мої проекти" active={activeTab === 'projects'} onClick={() => { setActiveTab('projects'); setSelectedProjectId(null); }} />
                    <SidebarLink icon={<Settings size={20} />} label="Налаштування" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />

                    {user?.is_root && (
                        <SidebarLink
                            icon={<ShieldCheck size={20} />}
                            label="Команда"
                            active={activeTab === 'team'}
                            onClick={() => setActiveTab('team')}
                        />
                    )}

                    {user?.is_admin && (
                        <div style={{ marginTop: '20px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '20px' }}>
                            <SidebarLink
                                icon={<Briefcase size={20} />}
                                label="Портфоліо CMS"
                                active={activeTab === 'portfolio'}
                                onClick={() => setActiveTab('portfolio')}
                            />
                            <button
                                onClick={() => setIsAdminMode(!isAdminMode)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    color: isAdminMode ? ADMIN_THEME.primary : 'rgba(255,255,255,0.3)',
                                    padding: '12px 15px',
                                    width: '100%',
                                    background: 'rgba(255,255,255,0.02)',
                                    fontWeight: 700,
                                    borderRadius: '12px',
                                    border: isAdminMode ? `1px solid ${ADMIN_THEME.primary}` : '1px solid transparent',
                                    transition: '0.3s'
                                }}
                            >
                                <Shield size={20} /> {isAdminMode ? 'ВИЙТИ З АДМІНКИ' : 'АДМІН-ПАНЕЛЬ'}
                            </button>
                        </div>
                    )}
                    <div style={{ marginTop: user?.is_admin ? '10px' : '20px', borderTop: !user?.is_admin ? '1px solid rgba(255,255,255,0.05)' : 'none', paddingTop: !user?.is_admin ? '20px' : '0' }}>
                        <button onClick={logout} style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'rgba(255,50,50,0.6)', padding: '12px 15px', width: '100%', background: 'transparent', fontWeight: 600 }}>
                            <LogOut size={20} /> Вийти
                        </button>
                    </div>
                </nav>
            </aside>

            {/* Main Content */}
            <main>
                <AnimatePresence mode="wait">
                    {activeTab === 'projects' ? (
                        <motion.div key="projects" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                                <h2 style={{ fontSize: '2.5rem', fontWeight: 950, letterSpacing: '-0.03em', textShadow: '0 0 20px rgba(255,255,255,0.1)' }}>
                                    {isAdminMode ? 'Центр Керування' : 'Ваші Проекти'}
                                </h2>
                                {!isAdminMode && (
                                    <motion.button
                                        whileHover={{ scale: 1.02, boxShadow: '0 0 40px rgba(255,255,255,0.2)' }}
                                        onClick={() => setIsModalOpen(true)}
                                        style={{ background: 'white', color: 'black', padding: '15px 30px', borderRadius: '50px', fontWeight: 950, fontSize: '0.8rem', letterSpacing: '1px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}
                                    >
                                        <Plus size={18} strokeWidth={3} /> НОВИЙ ПРОЕКТ
                                    </motion.button>
                                )}
                            </div>

                            {isAdminMode && <AdminOverview projects={projects} onFilter={setFilterStatus} />}

                            {isAdminMode && filterStatus && (
                                <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <span style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.5)' }}>Фільтр: <b style={{ color: 'white' }}>{getStatusDetails(filterStatus, true).label}</b></span>
                                    <button onClick={() => setFilterStatus(null)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white' }}><X size={14} /></button>
                                </div>
                            )}

                            {isAdminMode ? (
                                <AdminTable
                                    projects={filteredProjects}
                                    onSelect={setSelectedProjectId}
                                    onDelete={async (id) => {
                                        if (window.confirm('Ви впевнені, що хочете видалити цей проект?')) {
                                            const result = await deleteProject(id);
                                            if (result && !result.success) {
                                                alert(`Помилка видалення: ${result.error?.message || 'Невідома помилка'}`);
                                            }
                                        }
                                    }}
                                />
                            ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '30px' }}>
                                    {filteredProjects.map(p => (
                                        <ProjectCard key={p.id} project={p} onClick={() => setSelectedProjectId(p.id)} adminMode={isAdminMode} />
                                    ))}
                                    {filteredProjects.length === 0 && (
                                        <div style={{ gridColumn: 'span 2', padding: '100px', textAlign: 'center', background: 'rgba(255,255,255,0.01)', border: '2px dashed rgba(255,255,255,0.05)', borderRadius: '40px' }}>
                                            <Plus size={40} color="rgba(255,255,255,0.1)" style={{ marginBottom: '20px' }} />
                                            <h3 style={{ color: 'rgba(255,255,255,0.3)', fontWeight: 800 }}>У вас поки немає проектів</h3>
                                        </div>
                                    )}
                                </div>
                            )}
                        </motion.div>
                    ) : activeTab === 'team' ? (
                        <AdminTeamView addAdmin={addAdmin} removeAdmin={removeAdmin} />
                    ) : activeTab === 'portfolio' ? (
                        <AdminPortfolioCMS />
                    ) : (
                        <SettingsView user={user} updateUser={updateUser} />
                    )}
                </AnimatePresence>
            </main>

            <AnimatePresence>
                {isModalOpen && (
                    <ProjectCreatorModal onClose={() => setIsModalOpen(false)} onAdd={(data) => addProject(data)} />
                )}
            </AnimatePresence>
        </section>
    );
};

// --- PHONE MOCKUP COMPONENT ---
const PhoneFrame = ({ children }) => (
    <div style={{
        width: '240px',
        height: '480px',
        background: '#111',
        borderRadius: '35px',
        border: '8px solid #222',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 30px 60px rgba(0,0,0,0.5)',
        flexShrink: 0
    }}>
        <div style={{ position: 'absolute', top: '15px', left: '50%', transform: 'translateX(-50%)', width: '50px', height: '15px', background: '#222', borderRadius: '10px', zIndex: 10 }} />
        {children}
    </div>
);

// --- LAPTOP MOCKUP COMPONENT ---
const LaptopFrame = ({ children }) => (
    <div style={{
        width: '640px',
        height: '400px',
        background: '#111',
        borderRadius: '20px',
        border: '12px solid #222',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 30px 60px rgba(0,0,0,0.5)',
        flexShrink: 0
    }}>
        <div style={{ position: 'absolute', top: '0', left: '50%', transform: 'translateX(-50%)', width: '80px', height: '12px', background: '#222', borderBottomLeftRadius: '8px', borderBottomRightRadius: '8px', zIndex: 10 }} />
        {children}
    </div>
);

// --- PROJECT DETAILS VIEW ---

const ProjectDetailsView = ({ project, onBack, user }) => {
    const { updateProjectStatus, updateProjectData, deleteProject, payForProject, addComment, addRoadmapStep, updateRoadmapStep, deleteRoadmapStep, addResource, approveProject, uploadFile } = useAuth();
    const [commentText, setCommentText] = useState('');
    const [newResource, setNewResource] = useState({ label: '', link: '', type: 'Figma' });
    const [isUploading, setIsUploading] = useState(false);
    const [isSendingComment, setIsSendingComment] = useState(false);
    const [activeDevice, setActiveDevice] = useState('phone'); // 'phone' | 'laptop'
    const [isAddingStep, setIsAddingStep] = useState(false);
    const [newStepTitle, setNewStepTitle] = useState('');
    const isAdmin = user?.is_admin;

    if (!project) return null;

    // Safety defaults
    const roadmap = project.roadmap || [];
    const comments = project.comments || [];
    const visuals = project.visuals || [];

    // Find visual for active device
    const currentVisual = visuals.find(v => v.device === activeDevice);
    const resources = project.resources || [];

    const status = getStatusDetails(project.status, isAdmin);

    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        if (commentText.trim()) {
            setIsSendingComment(true);
            await addComment(project.id, commentText);
            setCommentText('');
            setIsSendingComment(false);
        }
    };

    const handleAddStep = () => {
        const titles = newStepTitle.split('\n').map(t => t.trim()).filter(t => t !== '');
        if (titles.length > 0) {
            addRoadmapStep(project.id, titles);
            setNewStepTitle('');
            setIsAddingStep(false);
        }
    };

    const handleAddResource = () => {
        if (newResource.label && newResource.link) {
            addResource(project.id, newResource);
            setNewResource({ label: '', link: '', type: 'Figma' });
        }
    };

    return (
        <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ minHeight: '100vh', padding: '80px 30px 40px', maxWidth: '1400px', margin: '0 auto', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '10%', left: '50%', transform: 'translateX(-50%)', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(255,100,0,0.03) 0%, transparent 70%)', filter: 'blur(100px)', pointerEvents: 'none', zIndex: 0 }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', position: 'relative', zIndex: 10 }}>
                <motion.button whileHover={{ x: -10 }} onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(255,255,255,0.4)', background: 'transparent', fontWeight: 800, fontSize: '0.7rem', letterSpacing: '1px', border: 'none', cursor: 'pointer' }}>
                    <ArrowLeft size={16} strokeWidth={3} /> НАЗАД
                </motion.button>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    {isAdmin && (
                        <motion.button
                            whileHover={{ scale: 1.05, background: 'rgba(255,50,50,0.2)' }}
                            onClick={async () => {
                                if (window.confirm('Видалити цей проект назавжди?')) {
                                    const result = await deleteProject(project.id);
                                    if (result && result.success) {
                                        onBack();
                                    } else {
                                        alert(`Помилка видалення: ${result?.error?.message || 'Невідома помилка'}`);
                                    }
                                }
                            }}
                            style={{ background: 'rgba(255,50,50,0.1)', border: '1px solid rgba(255,50,50,0.2)', color: '#FF3232', padding: '8px 16px', borderRadius: '40px', fontWeight: 900, fontSize: '0.65rem', letterSpacing: '1px', cursor: 'pointer' }}
                        >
                            ВИДАЛИТИ ПРОЕКТ
                        </motion.button>
                    )}
                    {isAdmin && (
                        <div style={{ background: 'rgba(0, 240, 255, 0.1)', border: '1px solid rgba(0, 240, 255, 0.2)', color: ADMIN_THEME.primary, padding: '8px 20px', borderRadius: '40px', fontWeight: 900, fontSize: '0.65rem', letterSpacing: '1px' }}>ADMINISTRATIVE CONTROL CENTER</div>
                    )}
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '16px' }}>
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4 }}
                    style={{
                        background: 'radial-gradient(120% 120% at 50% 0%, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: '24px',
                        padding: '24px',
                        position: 'relative',
                        overflow: 'hidden',
                        gridColumn: 'span 8',
                        minHeight: '220px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between'
                    }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        {isAdmin ? (
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <input
                                    defaultValue={project.category}
                                    onBlur={(e) => updateProjectData(project.id, { category: e.target.value })}
                                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: ADMIN_THEME.primary, padding: '4px 12px', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 900, outline: 'none', width: '120px' }}
                                />
                                <input
                                    defaultValue={project.budget}
                                    onBlur={(e) => updateProjectData(project.id, { budget: e.target.value })}
                                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#4CAF50', padding: '4px 12px', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 900, outline: 'none', width: '100px' }}
                                />
                            </div>
                        ) : (
                            <span style={{ color: '#FF4D00', fontWeight: 900, fontSize: '0.75rem', letterSpacing: '2px' }}>{project.category?.toUpperCase() || 'SAAS / WEB APP'}</span>
                        )}
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            {isAdmin && project.status === 'PENDING' && (
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    onClick={() => approveProject(project.id)}
                                    style={{ background: ADMIN_THEME.primary, color: 'black', padding: '6px 16px', borderRadius: '12px', fontSize: '0.65rem', fontWeight: 900, border: 'none', cursor: 'pointer', letterSpacing: '1px' }}
                                >
                                    СХВАЛИТИ ПРОЕКТ
                                </motion.button>
                            )}
                            {isAdmin ? (
                                <select
                                    value={project.status}
                                    onChange={(e) => updateProjectStatus(project.id, e.target.value)}
                                    style={{ background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '6px 12px', fontSize: '0.65rem', fontWeight: 900, outline: 'none' }}
                                >
                                    <option value="PENDING">ОБРОБКА</option>
                                    <option value="PAYMENT">ОПЛАТА</option>
                                    <option value="ACTIVE">В РОБОТІ</option>
                                    <option value="COMPLETED">ГОТОВО</option>
                                </select>
                            ) : (
                                <span style={{ fontSize: '0.65rem', fontWeight: 900, color: status.color, background: status.bg, padding: '6px 12px', borderRadius: '30px', letterSpacing: '1px' }}>{status.label}</span>
                            )}
                        </div>
                    </div>

                    <div>
                        {isAdmin ? (
                            <input
                                defaultValue={project.title}
                                onBlur={(e) => updateProjectData(project.id, { title: e.target.value })}
                                style={{ background: 'transparent', border: 'none', fontSize: '2.2rem', fontWeight: 950, color: 'white', outline: 'none', width: '100%', marginBottom: '8px' }}
                            />
                        ) : (
                            <h1 style={{ fontSize: '2.2rem', fontWeight: 950, letterSpacing: '-0.02em', lineHeight: 1, marginBottom: '8px', backgroundImage: 'linear-gradient(180deg, #FFF 0%, rgba(255,255,255,0.7) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{project.title}</h1>
                        )}
                        <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)', maxWidth: '400px', lineHeight: 1.4, marginBottom: '16px' }}>
                            {isAdmin ? `Власник: ${project.owner_email}` : 'Робота над проектом триває. Очікуйте наступних оновлень.'}
                        </p>

                        {/* Project Description */}
                        {isAdmin ? (
                            <textarea
                                defaultValue={project.description || ''}
                                placeholder="Додайте опис проекту..."
                                onBlur={(e) => updateProjectData(project.id, { description: e.target.value })}
                                style={{
                                    background: 'rgba(255,255,255,0.02)',
                                    border: '1px solid rgba(255,255,255,0.05)',
                                    borderRadius: '12px',
                                    padding: '12px',
                                    fontSize: '0.85rem',
                                    color: 'rgba(255,255,255,0.8)',
                                    width: '100%',
                                    maxWidth: '600px',
                                    minHeight: '80px',
                                    outline: 'none',
                                    resize: 'vertical',
                                    lineHeight: '1.5'
                                }}
                            />
                        ) : (
                            project.description && (
                                <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', maxWidth: '600px', lineHeight: 1.6, background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.03)' }}>
                                    {project.description}
                                </p>
                            )
                        )}
                    </div>
                </motion.div>

                {/* PROGRESS CARD - BENTO SPAN 4 */}
                <div style={{
                    gridColumn: 'span 4',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.05)',
                    borderRadius: '24px',
                    padding: '24px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                }}>
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h4 style={{ fontSize: '0.7rem', fontWeight: 900, color: 'rgba(255,255,255,0.2)', letterSpacing: '3px' }}>ЕТАПИ</h4>
                            {isAdmin && !isAddingStep && (
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    onClick={() => setIsAddingStep(true)}
                                    style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white', padding: '6px 12px', borderRadius: '10px', fontSize: '0.6rem', fontWeight: 900, cursor: 'pointer', letterSpacing: '1px' }}
                                >
                                    + ДОДАТИ ЕТАП
                                </motion.button>
                            )}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <AnimatePresence>
                                {isAddingStep && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0, marginBottom: 0 }}
                                        animate={{ height: 'auto', opacity: 1, marginBottom: 20 }}
                                        exit={{ height: 0, opacity: 0, marginBottom: 0 }}
                                        style={{ overflow: 'hidden' }}
                                    >
                                        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                            <textarea
                                                autoFocus
                                                placeholder="Введіть етапи (кожен з нового рядка)..."
                                                value={newStepTitle}
                                                onChange={e => setNewStepTitle(e.target.value)}
                                                style={{
                                                    background: 'rgba(255,255,255,0.03)',
                                                    border: '1px solid rgba(255,255,255,0.1)',
                                                    borderRadius: '12px',
                                                    color: 'white',
                                                    padding: '12px',
                                                    fontSize: '0.85rem',
                                                    fontWeight: 700,
                                                    outline: 'none',
                                                    minHeight: '100px',
                                                    resize: 'none',
                                                    lineHeight: 1.4
                                                }}
                                            />
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button
                                                    onClick={handleAddStep}
                                                    style={{ background: '#FF4D00', color: 'white', border: 'none', borderRadius: '10px', padding: '8px 16px', fontSize: '0.7rem', fontWeight: 900, cursor: 'pointer', flex: 1 }}
                                                >
                                                    ЗБЕРЕГТИ
                                                </button>
                                                <button
                                                    onClick={() => { setIsAddingStep(false); setNewStepTitle(''); }}
                                                    style={{ background: 'rgba(255,255,255,0.05)', color: 'white', border: 'none', borderRadius: '10px', padding: '8px 16px', fontSize: '0.7rem', fontWeight: 900, cursor: 'pointer' }}
                                                >
                                                    СКАСУВАТИ
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                            {roadmap.map((s, idx) => (
                                <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        {s.status === 'completed' ? <CheckCircle2 size={18} color="#4CAF50" strokeWidth={3} /> : s.status === 'current' ? <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 2 }} style={{ width: '10px', height: '10px', background: '#FF4D00', borderRadius: '50%', boxShadow: '0 0 15px #FF4D00' }} /> : <Circle size={18} color="rgba(255,255,255,0.1)" strokeWidth={2} />}
                                        <span style={{ fontWeight: 800, fontSize: '0.85rem', color: s.status === 'upcoming' ? 'rgba(255,255,255,0.2)' : 'white' }}>{s.title}</span>
                                    </div>
                                    {isAdmin && (
                                        <div style={{ display: 'flex', gap: '4px' }}>
                                            <select
                                                value={s.status}
                                                onChange={(e) => updateRoadmapStep(project.id, idx, e.target.value)}
                                                style={{ background: 'rgba(255,255,255,0.05)', color: 'white', border: 'none', borderRadius: '4px', fontSize: '0.55rem', fontWeight: 900, outline: 'none' }}
                                            >
                                                <option value="upcoming">WAIT</option>
                                                <option value="current">RUN</option>
                                                <option value="completed">OK</option>
                                            </select>
                                            <button onClick={() => deleteRoadmapStep(project.id, idx)} style={{ background: 'rgba(255, 50, 50, 0.1)', color: '#FF3232', padding: '4px 8px', borderRadius: '6px', fontSize: '0.55rem', fontWeight: 900, border: 'none', cursor: 'pointer' }}>×</button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* VISUALS CARD - BENTO SPAN 8 */}
                <div style={{
                    gridColumn: 'span 8',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.05)',
                    borderRadius: '24px',
                    padding: '24px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '20px'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ fontSize: '1.4rem', fontWeight: 950, display: 'flex', alignItems: 'center', gap: '12px', letterSpacing: '-0.02em' }}>
                            Live Preview
                        </h3>
                        <span style={{ background: 'rgba(76, 175, 80, 0.1)', color: '#4CAF50', padding: '6px 14px', borderRadius: '12px', fontSize: '0.65rem', fontWeight: 900, letterSpacing: '1px' }}>АКТУАЛЬНА ВЕРСІЯ</span>
                    </div>

                    <div style={{ display: 'flex', gap: '30px', alignItems: 'center', background: 'rgba(0,0,0,0.2)', borderRadius: '24px', padding: '24px', border: '1px solid rgba(255,255,255,0.02)', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', width: '100%', position: 'relative' }}>
                            {activeDevice === 'laptop' ? (
                                <LaptopFrame>
                                    {currentVisual ? (
                                        currentVisual.type === 'video' ? (
                                            <video src={currentVisual.url} autoPlay muted loop playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            <img src={currentVisual.url} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        )
                                    ) : (
                                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000', color: 'rgba(255,255,255,0.2)', fontSize: '0.7rem', fontWeight: 800 }}>
                                            NO LAPTOP VIEW
                                        </div>
                                    )}
                                </LaptopFrame>
                            ) : (
                                <PhoneFrame>
                                    {currentVisual ? (
                                        currentVisual.type === 'video' ? (
                                            <video src={currentVisual.url} autoPlay muted loop playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            <img src={currentVisual.url} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        )
                                    ) : (
                                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000', color: 'rgba(255,255,255,0.2)', fontSize: '0.7rem', fontWeight: 800 }}>
                                            {visuals.length > 0 ? 'SWITCH TO LAPTOP' : 'NO PREVIEW'}
                                        </div>
                                    )}
                                </PhoneFrame>
                            )}
                        </div>
                        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <p style={{ color: 'rgba(255,255,255,0.3)', lineHeight: 1.6, fontSize: '0.9rem' }}>
                                Тут з'явиться відео-прев'ю вашого інтерфейсу, коли ми його завантажимо.
                            </p>

                            <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                                {isAdmin ? (
                                    <>
                                        <input
                                            type="file"
                                            accept="video/*,image/*"
                                            id="video-upload-input"
                                            style={{ display: 'none' }}
                                            onChange={async (e) => {
                                                const file = e.target.files[0];
                                                if (file) {
                                                    setIsUploading(true);
                                                    const url = await uploadFile(file);
                                                    if (url) {
                                                        const fileType = file.type.startsWith('video') ? 'video' : 'image';
                                                        const newVisual = { id: Date.now(), url, type: fileType, device: activeDevice };
                                                        const otherVisuals = visuals.filter(v => v.device !== activeDevice);
                                                        const updatedVisuals = [...otherVisuals, newVisual];
                                                        updateProjectData(project.id, { visuals: updatedVisuals });
                                                    } else {
                                                        alert("Помилка завантаження. Спробуйте ще раз.");
                                                    }
                                                    setIsUploading(false);
                                                }
                                            }}
                                        />
                                        <button
                                            onClick={() => document.getElementById('video-upload-input').click()}
                                            disabled={isUploading}
                                            style={{
                                                background: isUploading ? 'rgba(255,255,255,0.1)' : 'white',
                                                color: isUploading ? 'rgba(255,255,255,0.5)' : 'black',
                                                padding: '12px 20px',
                                                borderRadius: '12px',
                                                fontWeight: 900,
                                                fontSize: '0.75rem',
                                                border: 'none',
                                                cursor: isUploading ? 'wait' : 'pointer',
                                                flex: 1,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '8px'
                                            }}
                                        >
                                            {isUploading ? (
                                                <>
                                                    <motion.div
                                                        animate={{ rotate: 360 }}
                                                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                                        style={{ width: '12px', height: '12px', border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid white', borderRadius: '50%' }}
                                                    />
                                                    ЗАВАНТАЖЕННЯ...
                                                </>
                                            ) : (
                                                `ЗАВАНТАЖИТИ ДЛЯ ${activeDevice === 'laptop' ? 'MAC' : 'MOBILE'}`
                                            )}
                                        </button>
                                    </>
                                ) : (
                                    <button onClick={() => window.open(currentVisual?.url || '#', '_blank')} style={{ background: 'rgba(255,255,255,0.05)', color: 'white', padding: '12px 24px', borderRadius: '12px', fontWeight: 800, border: 'none', cursor: 'pointer', fontSize: '0.75rem', flex: 1 }}>ВІДКРИТИ ПОВНІСТЮ</button>
                                )}

                                <button
                                    onClick={() => setActiveDevice(activeDevice === 'laptop' ? 'phone' : 'laptop')}
                                    style={{
                                        background: 'rgba(255,255,255,0.1)',
                                        color: 'white',
                                        padding: '12px',
                                        borderRadius: '12px',
                                        border: 'none',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        minWidth: '44px'
                                    }}
                                    title="Змінити пристрій"
                                >
                                    {activeDevice === 'laptop' ? <Layout size={20} /> : <Smartphone size={20} />}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* DISCUSSION - BENTO SPAN 4 */}
                <div style={{
                    gridColumn: 'span 4',
                    alignSelf: 'start',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.05)',
                    borderRadius: '24px',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column'
                }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 950, marginBottom: '12px', letterSpacing: '-0.02em' }}>Обговорення</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, maxHeight: '180px', overflowY: 'auto', marginBottom: '12px', paddingRight: '4px' }}>
                        {comments.length === 0 ? (
                            <div style={{ padding: '20px', textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: '0.8rem' }}>Поки що немає коментарів</div>
                        ) : comments.map((c) => (
                            <div key={c.id} style={{ padding: '12px', borderRadius: '16px', background: c.author?.includes('(Admin)') ? 'rgba(255,77,0,0.08)' : 'rgba(255,255,255,0.03)', alignSelf: c.author === user?.name || c.author?.includes('(Admin)') && user?.isAdmin ? 'flex-end' : 'flex-start', maxWidth: '90%', border: c.author?.includes('(Admin)') ? '1px solid rgba(255,77,0,0.1)' : '1px solid transparent' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', marginBottom: '2px' }}>
                                    <span style={{ fontWeight: 900, fontSize: '0.6rem', color: c.author?.includes('(Admin)') ? '#FF4D00' : 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>{c.author}</span>
                                    <span style={{ fontSize: '0.5rem', color: 'rgba(255,255,255,0.2)' }}>{new Date(c.date).toLocaleDateString()}</span>
                                </div>
                                <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.9)', lineHeight: 1.4 }}>{c.text}</p>
                            </div>
                        ))}
                    </div>
                    <form onSubmit={handleCommentSubmit} style={{ display: 'flex', gap: '8px' }}>
                        <input type="text" placeholder="Напишіть повідомлення..." value={commentText} onChange={e => setCommentText(e.target.value)} style={{ flex: 1, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '10px 14px', color: 'white', fontSize: '0.8rem', outline: 'none' }} />
                        <motion.button whileHover={{ scale: 1.05 }} disabled={isSendingComment} type="submit" style={{ background: '#FF4D00', color: 'white', width: '40px', height: '40px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', opacity: isSendingComment ? 0.7 : 1 }}>
                            {isSendingComment ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} style={{ width: '12px', height: '12px', border: '2px solid rgba(255,255,255,0.5)', borderTop: '2px solid white', borderRadius: '50%' }} /> : <Send size={16} strokeWidth={3} />}
                        </motion.button>
                    </form>
                </div>

                {/* RESOURCES CARD - BENTO SPAN 12 */}
                <div style={{
                    gridColumn: 'span 12',
                    background: 'rgba(255,255,255,0.01)',
                    border: '1px solid rgba(255,255,255,0.05)',
                    borderRadius: '24px',
                    padding: '24px'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                        <h4 style={{ fontSize: '0.7rem', fontWeight: 900, color: 'white', letterSpacing: '4px' }}>МАТЕРІАЛИ ПРОЕКТУ</h4>
                        {isAdmin && (
                            <button onClick={() => {/* Toggle Resource Add */ }} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white', padding: '6px 16px', borderRadius: '10px', fontWeight: 800, fontSize: '0.65rem', cursor: 'pointer' }}>+ ДОДАТИ</button>
                        )}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                        {resources.map((r) => (<ResourceLink key={r.id} icon={r.type === 'Figma' ? <Figma size={18} /> : <FileText size={18} />} label={r.label} />))}
                        {resources.length === 0 && (
                            <div style={{ gridColumn: 'span 4', textAlign: 'center', padding: '30px', color: 'rgba(255,255,255,0.1)', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '24px' }}>
                                <Clock size={20} style={{ marginBottom: '10px' }} />
                                <p style={{ fontSize: '0.8rem', fontWeight: 600 }}>Матеріали синхронізуються...</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </motion.section>
    );
};

// --- UTILITIES ---
const ResourceLink = ({ icon, label }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', cursor: 'pointer' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ color: '#FF4D00' }}>{icon}</span>
            <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{label}</span>
        </div>
        <ExternalLink size={14} color="rgba(255,255,255,0.2)" />
    </div>
);

const SidebarLink = ({ icon, label, active, onClick }) => (
    <motion.button
        whileHover={{ x: 5, background: 'rgba(255,255,255,0.03)' }}
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '16px 20px',
            width: '100%',
            borderRadius: '16px',
            background: active ? 'rgba(255, 77, 0, 0.1)' : 'transparent',
            color: active ? '#FF4D00' : 'rgba(255,255,255,0.4)',
            transition: '0.3s cubic-bezier(0.2, 0, 0.2, 1)',
            fontWeight: 800,
            fontSize: '0.9rem',
            border: active ? '1px solid rgba(255,77,0,0.1)' : '1px solid transparent',
            cursor: 'pointer'
        }}
    >
        <span style={{ color: active ? '#FF4D00' : 'inherit' }}>{icon}</span>
        {label}
    </motion.button>
);

const ProjectCard = ({ project, onClick, adminMode }) => {
    const status = getStatusDetails(project.status);
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const mouseXSpring = useSpring(x);
    const mouseYSpring = useSpring(y);

    const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["10deg", "-10deg"]);
    const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-10deg", "10deg"]);

    const handleMouseMove = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const xPct = mouseX / width - 0.5;
        const yPct = mouseY / height - 0.5;
        x.set(xPct);
        y.set(yPct);
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
    };

    return (
        <motion.div
            onClick={onClick}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            whileHover={{ y: -8, boxShadow: '0 40px 80px rgba(0,0,0,0.5)', background: 'rgba(255,255,255,0.06)' }}
            style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '40px',
                padding: '40px',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden',
                transition: '0.4s cubic-bezier(0.2, 0, 0.2, 1)',
                rotateX,
                rotateY,
                transformStyle: "preserve-3d"
            }}
        >
            <div style={{ transform: "translateZ(30px)", transformStyle: "preserve-3d" }}>
                <div style={{ position: 'absolute', top: '-20%', right: '-20%', width: '150px', height: '150px', background: `radial-gradient(circle, ${status.color}10 0%, transparent 70%)`, filter: 'blur(30px)' }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px', position: 'relative', zIndex: 1 }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                            <span style={{ fontSize: '0.65rem', fontWeight: 900, color: status.color, letterSpacing: '2px', textTransform: 'uppercase' }}>{status.label}</span>
                            {adminMode && <span style={{ fontSize: '0.65rem', fontWeight: 900, color: '#FF4D00', background: 'rgba(255,77,0,0.1)', padding: '2px 8px', borderRadius: '6px' }}>{project.owner_email}</span>}
                        </div>
                        <h3 style={{ fontSize: '1.8rem', fontWeight: 950, letterSpacing: '-0.02em' }}>{project.title}</h3>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.05)', width: '44px', height: '44px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ChevronRight size={20} strokeWidth={3} /></div>
                </div>

                <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '12px' }}>
                        <span style={{ color: 'rgba(255,255,255,0.3)', fontWeight: 700 }}>ПРОГРЕС РОЗРОБКИ</span>
                        <span style={{ fontWeight: 900, color: status.color }}>{project.progress}%</span>
                    </div>
                    <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', overflow: 'hidden' }}>
                        <motion.div initial={{ width: 0 }} animate={{ width: `${project.progress}%` }} transition={{ duration: 1.5, ease: 'easeOut' }} style={{ height: '100%', background: `linear-gradient(90deg, ${status.color}, ${status.color}88)`, boxShadow: `0 0 15px ${status.color}40` }} />
                    </div>
                </div>
            </div>
        </motion.div >
    );
};

const RequestCard = ({ project, onMockDiscuss, adminMode }) => (
    <motion.div
        whileHover={{ y: -5, background: 'rgba(255,255,255,0.05)' }}
        style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '40px', padding: '40px', position: 'relative' }}
    >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
            <h3 style={{ fontSize: '1.6rem', fontWeight: 950, letterSpacing: '-0.02em' }}>{project.title}</h3>
            {adminMode && <span style={{ fontSize: '0.65rem', fontWeight: 900, color: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: '6px' }}>{project.owner_email}</span>}
        </div>
        <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.3)', marginBottom: '32px', lineHeight: 1.5 }}>Етап аналізу: Узгодження технічних вимог та бюджету ({project.budget}).</p>
        <button onClick={onMockDiscuss} style={{ width: '100%', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'rgba(255,255,255,0.6)', padding: '16px', borderRadius: '16px', fontWeight: 800, fontSize: '0.75rem', letterSpacing: '1px', cursor: 'pointer' }}>ОЧІКУВАННЯ БРИФУ</button>
    </motion.div>
);

const PaymentCard = ({ project, onPay, adminMode }) => (
    <motion.div
        whileHover={{ scale: 1.02 }}
        style={{ background: 'linear-gradient(135deg, rgba(255, 77, 0, 0.1) 0%, rgba(255, 77, 0, 0.05) 100%)', border: '1px solid rgba(255, 77, 0, 0.3)', borderRadius: '40px', padding: '40px' }}
    >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
            <h3 style={{ fontSize: '1.6rem', fontWeight: 950, letterSpacing: '-0.02em' }}>{project.title}</h3>
            {adminMode && <span style={{ fontSize: '0.65rem', fontWeight: 900, color: '#FF4D00', background: 'rgba(255,77,0,0.1)', padding: '4px 10px', borderRadius: '6px' }}>{project.owner_email}</span>}
        </div>
        <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.5)', marginBottom: '32px', lineHeight: 1.5 }}>Перевірка завершена. Бюджет: {project.budget}. Необхідна оплата для початку робіт.</p>
        <motion.button
            whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(255,77,0,0.3)' }}
            onClick={onPay}
            style={{ width: '100%', background: '#FF4D00', color: 'white', padding: '18px', borderRadius: '20px', fontWeight: 900, fontSize: '0.85rem', letterSpacing: '1px', border: 'none', cursor: 'pointer' }}
        >
            ПІДТВЕРДИТИ ОПЛАТУ
        </motion.button>
    </motion.div>
);

const SettingsView = ({ user, updateUser }) => {
    const [name, setName] = useState(user?.name || '');
    const [email, setEmail] = useState(user?.email || '');
    const [phone, setPhone] = useState(user?.phone || '');
    const [company, setCompany] = useState(user?.company || '');
    const [role, setRole] = useState(user?.role || '');
    const [notifications, setNotifications] = useState({ email: true, push: false });
    const [showPassword, setShowPassword] = useState(false);

    const handleSave = () => {
        updateUser({ name, email, phone, company, role });
        alert('Збережено успішно');
    };

    const Section = ({ title, icon: Icon, children }) => (
        <div style={{ marginBottom: '40px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(255,77,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={20} color="#FF4D00" />
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: 'white' }}>{title}</h3>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '24px', padding: '24px' }}>
                {children}
            </div>
        </div>
    );

    const Toggle = ({ active, onToggle, label }) => (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span style={{ color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>{label}</span>
            <div onClick={onToggle} style={{ width: '44px', height: '24px', background: active ? '#FF4D00' : 'rgba(255,255,255,0.1)', borderRadius: '20px', padding: '2px', cursor: 'pointer', transition: '0.3s' }}>
                <div style={{ width: '20px', height: '20px', background: 'white', borderRadius: '50%', transform: active ? 'translateX(20px)' : 'translateX(0)', transition: '0.3s' }} />
            </div>
        </div>
    );

    return (
        <div style={{ maxWidth: '800px' }}>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 950, marginBottom: '48px', letterSpacing: '-0.04em' }}>Налаштування</h2>

            <Section title="Профіль" icon={User}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', gridColumn: 'span 2' }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'rgba(255,255,255,0.3)', letterSpacing: '1px' }}>ПОВНЕ ІМ'Я</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', color: 'white', outline: 'none' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'rgba(255,255,255,0.3)', letterSpacing: '1px' }}>EMAIL</label>
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', color: 'white', outline: 'none' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'rgba(255,255,255,0.3)', letterSpacing: '1px' }}>ТЕЛЕФОН</label>
                        <input type="tel" value={phone} placeholder="+380..." onChange={e => setPhone(e.target.value)} style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', color: 'white', outline: 'none' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'rgba(255,255,255,0.3)', letterSpacing: '1px' }}>КОМПАНІЯ</label>
                        <input type="text" value={company} onChange={e => setCompany(e.target.value)} style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', color: 'white', outline: 'none' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'rgba(255,255,255,0.3)', letterSpacing: '1px' }}>ПОСАДА</label>
                        <input type="text" value={role} onChange={e => setRole(e.target.value)} style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', color: 'white', outline: 'none' }} />
                    </div>
                </div>
            </Section>

            <Section title="Сповіщення" icon={Bell}>
                <Toggle label="Email сповіщення" active={notifications.email} onToggle={() => setNotifications({ ...notifications, email: !notifications.email })} />
                <Toggle label="Push сповіщення" active={notifications.push} onToggle={() => setNotifications({ ...notifications, push: !notifications.push })} />
            </Section>

            <Section title="Безпека" icon={Lock}>
                <button onClick={() => setShowPassword(!showPassword)} style={{ background: 'rgba(255,255,255,0.05)', color: 'white', padding: '12px 24px', borderRadius: '12px', border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}>
                    ЗМІНИТИ ПАРОЛЬ
                </button>
                {showPassword && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <input type="password" placeholder="Поточний пароль" style={{ padding: '14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', color: 'white' }} />
                        <input type="password" placeholder="Новий пароль" style={{ padding: '14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', color: 'white' }} />
                        <button style={{ background: '#FF4D00', color: 'white', padding: '12px', borderRadius: '12px', border: 'none', fontWeight: 900 }}>ПІДТВЕРДИТИ</button>
                    </motion.div>
                )}
            </Section>

            <button onClick={handleSave} style={{ background: 'white', color: 'black', padding: '18px 60px', borderRadius: '50px', fontWeight: 950, fontSize: '0.9rem', letterSpacing: '1px', boxShadow: '0 20px 40px rgba(255,255,255,0.1)', cursor: 'pointer', border: 'none' }}>ЗБЕРЕГТИ ВСЕ</button>
        </div>
    );
};

const ProjectCreatorModal = ({ onClose, onAdd }) => {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({ title: '', category: 'Landing Page', budget: '$5k - $15k', details: '', customBudget: '' });

    const categories = [
        { id: 'Landing Page', title: 'Landing Page', desc: 'Односторінковий сайт для презентації продукту.' },
        { id: 'SaaS', title: 'SaaS / Web App', desc: 'Складний сервіс з логікою та базами даних.' },
        { id: 'E-commerce', title: 'E-commerce', desc: 'Інтернет-магазин з оплатою та каталогом.' },
        { id: 'AI Service', title: 'AI Automation', desc: 'Рішення зі штучним інтелектом для автоматизації.' },
    ];

    const [isSuccess, setIsSuccess] = useState(false);

    const handleNext = () => setStep(s => s + 1);
    const handlePrev = () => setStep(s => s - 1);
    const handleSubmit = async (e) => {
        e.preventDefault();
        const finalBudget = formData.customBudget ? `$${formData.customBudget}` : formData.budget;

        const result = await onAdd({ ...formData, budget: finalBudget });

        if (result && result.success) {
            setIsSuccess(true);
        } else {
            alert(`Помилка: ${result?.error?.message || 'Не вдалося створити заявку. Напишіть адміну'}`);
        }
    };

    const isStepComplete = () => {
        if (step === 1) return formData.title.length > 2 && formData.category;
        if (step === 2) return formData.budget || formData.customBudget.length >= 3;
        if (step === 3) return formData.details.length > 5;
        return false;
    };

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', backdropFilter: 'blur(40px)', zIndex: 2000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ background: '#050505', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '32px', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', padding: '40px 30px', position: 'relative', boxShadow: '0 50px 100px rgba(0,0,0,0.9)' }}>
                <button onClick={onClose} style={{ position: 'absolute', right: '20px', top: '20px', color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10 }}><X size={18} /></button>
                {!isSuccess && <div style={{ display: 'flex', gap: '6px', marginBottom: '30px', marginTop: '10px' }}>{[1, 2, 3].map(i => (<div key={i} style={{ height: '3px', flex: 1, background: i <= step ? 'linear-gradient(90deg, #FF4D00, #FF9500)' : 'rgba(255,255,255,0.05)', borderRadius: '10px', boxShadow: i <= step ? '0 0 10px rgba(255,77,0,0.3)' : 'none' }} />))}</div>}

                <AnimatePresence mode="wait">
                    {isSuccess ? (
                        <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: 'center', padding: '40px 0' }}>
                            <div style={{ width: '80px', height: '80px', background: '#4CAF50', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 0 30px rgba(76, 175, 80, 0.4)' }}>
                                <CheckCircle2 size={40} color="white" />
                            </div>
                            <h3 style={{ fontSize: '2rem', fontWeight: 950, marginBottom: '10px' }}>Запит Відправлено!</h3>
                            <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '30px', maxWidth: '80%', marginInline: 'auto', lineHeight: 1.5 }}>Ваш проект успішно створено. Адміністратор вже отримав сповіщення і скоро з'яжеться з вами.</p>
                            <button onClick={onClose} style={{ background: 'white', color: 'black', padding: '16px 40px', borderRadius: '30px', fontWeight: 900, border: 'none', cursor: 'pointer' }}>ЗРОЗУМІЛО</button>
                        </motion.div>
                    ) : (
                        step === 1 && (
                            <motion.div key="s1" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                                <h3 style={{ fontSize: '1.5rem', fontWeight: 950, marginBottom: '8px', letterSpacing: '-0.03em' }}>Тематика</h3>
                                <div style={{ background: 'rgba(255,77,0,0.04)', borderLeft: '3px solid #FF4D00', padding: '12px', borderRadius: '0 10px 10px 0', marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                                    <Info size={16} color="#FF4D00" style={{ flexShrink: 0 }} />
                                    <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.3 }}>Оберіть категорію проекту.</p>
                                </div>
                                <input type="text" placeholder="Назва вашого проекту" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '16px', color: 'white', width: '100%', marginBottom: '20px', fontSize: '0.95rem', outline: 'none', transition: '0.3s' }} value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                    {categories.map(cat => {
                                        const isSelected = formData.category === cat.id;
                                        return (
                                            <motion.div whileHover={{ scale: 1.01 }} key={cat.id} onClick={() => setFormData({ ...formData, category: cat.id })} style={{ padding: '12px', borderRadius: '16px', border: `1px solid ${isSelected ? '#FF4D00' : 'rgba(255,255,255,0.05)'}`, background: isSelected ? 'rgba(255,77,0,0.08)' : 'rgba(255,255,255,0.01)', cursor: 'pointer', transition: '0.2s' }}>
                                                <h4 style={{ fontSize: '0.85rem', fontWeight: 900, marginBottom: '2px', color: isSelected ? '#FF4D00' : 'white', letterSpacing: '-0.01em' }}>{cat.title}</h4>
                                                <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', lineHeight: 1.2 }}>{cat.desc}</p>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        )
                    )}
                    {!isSuccess && step === 2 && (
                        <motion.div key="s2" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: 950, marginBottom: '8px', letterSpacing: '-0.03em' }}>Інвестиції</h3>
                            <div style={{ background: 'rgba(255,77,0,0.04)', borderLeft: '3px solid #FF4D00', padding: '12px', borderRadius: '0 10px 10px 0', marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                                <Info size={16} color="#FF4D00" style={{ flexShrink: 0 }} />
                                <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.3 }}>Вкажіть ваш бюджет.</p>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '20px' }}>
                                {[
                                    { title: '$5k - $15k' },
                                    { title: '$20k - $50k' },
                                    { title: '$100k+' }
                                ].map((b) => (
                                    <div
                                        key={b.title}
                                        onClick={() => setFormData({ ...formData, budget: b.title, customBudget: '' })}
                                        style={{
                                            padding: '16px 8px',
                                            borderRadius: '16px',
                                            border: `1px solid ${formData.budget === b.title ? '#FF4D00' : 'rgba(255,255,255,0.05)'}`,
                                            background: formData.budget === b.title ? 'rgba(255,77,0,0.08)' : 'rgba(255,255,255,0.01)',
                                            cursor: 'pointer',
                                            textAlign: 'center',
                                            transition: '0.2s'
                                        }}
                                    >
                                        <span style={{ fontSize: '0.85rem', fontWeight: 800 }}>{b.title}</span>
                                    </div>
                                ))}
                            </div>

                            <div style={{ padding: '20px', background: 'rgba(255,255,255,0.01)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', opacity: formData.customBudget ? 1 : 0.4 }}>
                                    <Shield size={14} color={formData.customBudget ? '#FF4D00' : 'white'} />
                                    <span style={{ fontSize: '0.6rem', fontWeight: 800, letterSpacing: '1px' }}>ВЛАСНИЙ БЮДЖЕТ</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <span style={{ fontWeight: 900, color: formData.customBudget ? '#FF4D00' : 'rgba(255,255,255,0.1)', fontSize: '1.8rem' }}>$</span>
                                    <input type="number" placeholder="0" value={formData.customBudget} onChange={e => setFormData({ ...formData, customBudget: e.target.value, budget: '' })} style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '2rem', fontWeight: 900, outline: 'none', width: '180px', textAlign: 'left', letterSpacing: '-1px' }} />
                                </div>
                            </div>
                        </motion.div>
                    )}
                    {!isSuccess && step === 3 && (
                        <motion.div key="s3" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: 950, marginBottom: '8px', letterSpacing: '-0.03em' }}>Деталі</h3>
                            <div style={{ background: 'rgba(255,77,0,0.04)', borderLeft: '3px solid #FF4D00', padding: '12px', borderRadius: '0 10px 10px 0', marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                                <Info size={16} color="#FF4D00" style={{ flexShrink: 0 }} />
                                <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.3 }}>Коротко опишіть задачу.</p>
                            </div>
                            <textarea placeholder="Опишіть суть вашого продукту..." style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '20px', color: 'white', width: '100%', height: '140px', resize: 'none', fontSize: '0.9rem', lineHeight: 1.5, outline: 'none' }} value={formData.details} onChange={e => setFormData({ ...formData, details: e.target.value })} />
                        </motion.div>
                    )}
                </AnimatePresence>

                {!isSuccess && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '30px' }}>
                        {step > 1 ? <motion.button whileHover={{ x: -2 }} onClick={handlePrev} style={{ background: 'transparent', color: 'rgba(255,255,255,0.3)', fontWeight: 900, fontSize: '0.75rem', letterSpacing: '1px', cursor: 'pointer', border: 'none' }}>НАЗАД</motion.button> : <div />}
                        {step < 3 ? (
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                onClick={handleNext}
                                disabled={!isStepComplete()}
                                style={{ background: isStepComplete() ? 'white' : 'rgba(255,255,255,0.05)', color: isStepComplete() ? 'black' : 'rgba(255,255,255,0.2)', padding: '14px 32px', borderRadius: '40px', fontWeight: 900, fontSize: '0.75rem', letterSpacing: '1px', transition: '0.2s', border: 'none', cursor: isStepComplete() ? 'pointer' : 'not-allowed' }}
                            >
                                ДАЛІ
                            </motion.button>
                        ) : (
                            <motion.button
                                whileHover={{ scale: 1.02, boxShadow: '0 0 30px rgba(255,77,0,0.3)' }}
                                onClick={handleSubmit}
                                disabled={!isStepComplete()}
                                style={{ background: '#FF4D00', color: 'white', padding: '14px 32px', borderRadius: '40px', fontWeight: 950, fontSize: '0.75rem', letterSpacing: '1px', transition: '0.2s', border: 'none', cursor: isStepComplete() ? 'pointer' : 'not-allowed' }}
                            >
                                СТВОРИТИ
                            </motion.button>
                        )}
                    </div>
                )}
            </motion.div>
        </div>
    );
};

export default Dashboard;

// --- PORTFOLIO CMS ---
const AdminPortfolioCMS = () => {
    const [portfolio, setPortfolio] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newItem, setNewItem] = useState({ title: '', category: '', image: '', description: '', tags: '' });

    const fetchPortfolio = async () => {
        const { data } = await supabase.from('portfolio').select('*').order('created_at', { ascending: false });
        if (data) setPortfolio(data);
        setLoading(false);
    };

    useEffect(() => { fetchPortfolio(); }, []);

    const handleAdd = async (e) => {
        e.preventDefault();
        const tagsArray = newItem.tags.split(',').map(t => t.trim()).filter(t => t);
        const { error } = await supabase.from('portfolio').insert([{
            title: newItem.title,
            category: newItem.category,
            image: newItem.image,
            description: newItem.description,
            tags: tagsArray
        }]);
        if (!error) {
            setNewItem({ title: '', category: '', image: '', description: '', tags: '' });
            fetchPortfolio();
        } else {
            console.error("Error adding portfolio item:", error);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Видалити цей кейс?')) return;
        const { error } = await supabase.from('portfolio').delete().eq('id', id);
        if (!error) fetchPortfolio();
    };

    if (loading) return null;

    return (
        <div style={{ color: 'white' }}>
            <div style={{ marginBottom: '40px' }}>
                <h2 style={{ fontSize: '2rem', fontWeight: 950, marginBottom: '8px' }}>Керування Портфоліо</h2>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem' }}>Додавайте або видаляйте проекти, які бачать клієнти на головній сторінці.</p>
            </div>

            <form onSubmit={handleAdd} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '24px', padding: '30px', marginBottom: '40px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <input placeholder="Назва (напр. Xatko)" value={newItem.title} onChange={e => setNewItem({ ...newItem, title: e.target.value })} style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', padding: '12px', borderRadius: '12px', color: 'white', outline: 'none' }} required />
                <input placeholder="Категорія (напр. AI SaaS)" value={newItem.category} onChange={e => setNewItem({ ...newItem, category: e.target.value })} style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', padding: '12px', borderRadius: '12px', color: 'white', outline: 'none' }} required />
                <input placeholder="URL Зображення" value={newItem.image} onChange={e => setNewItem({ ...newItem, image: e.target.value })} style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', padding: '12px', borderRadius: '12px', color: 'white', outline: 'none' }} required />
                <input placeholder="Теги (через кому)" value={newItem.tags} onChange={e => setNewItem({ ...newItem, tags: e.target.value })} style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', padding: '12px', borderRadius: '12px', color: 'white', outline: 'none' }} />
                <textarea placeholder="Опис" value={newItem.description} onChange={e => setNewItem({ ...newItem, description: e.target.value })} style={{ gridColumn: 'span 2', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', padding: '12px', borderRadius: '12px', color: 'white', height: '80px', outline: 'none', resize: 'none' }} required />
                <button type="submit" style={{ gridColumn: 'span 2', background: ADMIN_THEME.primary, color: 'black', border: 'none', padding: '15px', borderRadius: '12px', fontWeight: 900, cursor: 'pointer' }}>ДОДАТИ В ПОРТФОЛІО</button>
            </form>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                {portfolio.map(item => (
                    <div key={item.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '20px', overflow: 'hidden', position: 'relative' }}>
                        <img src={item.image} style={{ width: '100%', height: '160px', objectFit: 'cover' }} alt="" />
                        <div style={{ padding: '20px' }}>
                            <div style={{ fontSize: '0.6rem', color: ADMIN_THEME.primary, fontWeight: 900, marginBottom: '5px' }}>{item.category}</div>
                            <h4 style={{ fontSize: '1.2rem', fontWeight: 900, marginBottom: '8px' }}>{item.title}</h4>
                            <button onClick={() => handleDelete(item.id)} style={{ color: '#ff3333', background: 'transparent', border: 'none', fontSize: '0.7rem', fontWeight: 800, cursor: 'pointer' }}>ВИДАЛИТИ</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
