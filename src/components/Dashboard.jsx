import { useState, useEffect, Component } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useSpring, useMotionValue } from 'framer-motion';
import { useAuth } from '../auth/AuthContext';
import { supabase } from '../lib/supabase';
import { PRESET_ACCENTS, applyAccent, clearAccent, deriveAccentFromStart, loadAccent, saveAccent } from '../theme/accent.js';
import SubscriptionPlans from './SubscriptionPlans.jsx';
import {
	    Layout, Plus, Settings, LogOut, ChevronRight, Share2, Bell,
	    Search, Filter, MoreHorizontal, ArrowUpRight, Folder,
	    MessageSquare, CheckCircle2, Clock, Shield, Zap, X,
	    ChevronDown, Play, Pause, Download, FileText, Image as ImageIcon,
	    Figma, ExternalLink, Trash2, Edit3, User, Mail, Phone, Lock, Eye,
	    CreditCard, Calendar, BarChart3, PieChart, Activity,
	    Briefcase, Users, LayoutDashboard, Wallet, Archive, ShieldCheck, Info,
	    ArrowLeft, Circle, Send, Smartphone, Palette
} from 'lucide-react';

const MOBILE_BREAKPOINT_PX = 1024;
const DEFAULT_MONO_PAY_URL = 'https://send.monobank.ua/9eF51wt1iY';

const normalizeMaintenanceStatus = (value) => {
    if (typeof value !== 'string' || !value.trim()) return 'NONE';
    return value.trim().toUpperCase();
};

const pickPrimaryClientProject = (clientProjects) => {
    if (!Array.isArray(clientProjects) || clientProjects.length === 0) return null;

    const byCreatedDesc = [...clientProjects].sort((a, b) => {
        const at = new Date(a?.created_at || 0).getTime();
        const bt = new Date(b?.created_at || 0).getTime();
        return bt - at;
    });

    const activeOrDone = byCreatedDesc.find((p) => p?.status === 'ACTIVE' || p?.status === 'COMPLETED');
    return activeOrDone || byCreatedDesc[0];
};

const getIsMobileLayout = () => {
    if (typeof window === 'undefined') return false;
    try {
        const visualViewportWidth = window.visualViewport?.width;
        const clientWidth = document?.documentElement?.clientWidth;
        const innerWidth = window.innerWidth;
        const widthCandidates = [innerWidth, clientWidth, visualViewportWidth].filter(
            (v) => typeof v === 'number' && Number.isFinite(v) && v > 0
        );
        const viewportWidth = widthCandidates.length > 0 ? Math.min(...widthCandidates) : innerWidth;

        const isViewportNarrow = viewportWidth < MOBILE_BREAKPOINT_PX;

        const hasMatchMedia = typeof window.matchMedia === 'function';
        const isCoarsePointer = hasMatchMedia ? window.matchMedia('(pointer: coarse)').matches : false;
        const isNoHover = hasMatchMedia ? window.matchMedia('(hover: none)').matches : false;
        const hasTouch = isCoarsePointer || isNoHover || (navigator?.maxTouchPoints || 0) > 0;

        const screenWidth = window.screen?.width;
        const screenHeight = window.screen?.height;
        const smallestScreenSide = Math.min(
            typeof screenWidth === 'number' ? screenWidth : Infinity,
            typeof screenHeight === 'number' ? screenHeight : Infinity
        );
        const isSmallScreen = smallestScreenSide <= MOBILE_BREAKPOINT_PX;

        // Fallback for iOS/Telegram WebViews that report a "desktop" viewport width on phones.
        return isViewportNarrow || (hasTouch && isSmallScreen);
    } catch {
        return window.innerWidth < MOBILE_BREAKPOINT_PX;
    }
};

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
    const primary = isAdmin ? ADMIN_THEME.primary : 'var(--accent-start)';
    const primaryBg = isAdmin ? ADMIN_THEME.accent : 'rgba(var(--accent-rgb), 0.1)';
    switch (status) {
        case 'ACTIVE': return { label: 'В РОБОТІ', color: '#4CAF50', bg: 'rgba(76, 175, 80, 0.1)' };
        case 'PENDING': return { label: 'ОБРОБКА', color: primary, bg: primaryBg };
        case 'PAYMENT': return { label: 'ОПЛАТА', color: primary, bg: primaryBg };
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

const AdminOverview = ({ projects, onFilter, isMobile }) => {
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
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)', gap: '20px' }}>
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

	            <div style={{ background: 'var(--surface-1)', border: '1px solid var(--border-1)', borderRadius: '32px', padding: '40px', maxWidth: '800px' }}>
	                <div style={{ marginBottom: '40px' }}>
	                    <h3 style={{ fontSize: '1rem', fontWeight: 800, color: ADMIN_THEME.primary, marginBottom: '20px', letterSpacing: '1px' }}>ДОДАТИ РОЗРОБНИКА</h3>
	                    <form onSubmit={handleAdd} style={{ display: 'flex', gap: '16px' }}>
	                        <input
	                            name="email"
	                            type="email"
	                            placeholder="email@example.com"
	                            style={{ flex: 1, background: 'var(--surface-1)', border: '1px solid var(--border-1)', borderRadius: '16px', padding: '16px', color: 'var(--text-main)', fontWeight: 600, outline: 'none' }}
	                            required
	                        />
	                        <motion.button
	                            whileHover={{ scale: 1.05 }}
	                            whileTap={{ scale: 0.95 }}
	                            type="submit"
	                            style={{ background: ADMIN_THEME.primary, color: 'black', border: 'none', borderRadius: '16px', padding: '0 32px', fontWeight: 900, cursor: 'pointer' }}
	                        >
	                            ДОДАТИ
	                        </motion.button>
	                    </form>
	                </div>

                <div>
	                    <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-subtle)', marginBottom: '20px', letterSpacing: '1px' }}>СПИСОК АДМІНІСТРАТОРІВ</h3>
	                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
	                        {team.map(member => (
	                            <div key={member.email} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface-1)', padding: '16px 24px', borderRadius: '16px', border: '1px solid var(--border-1)' }}>
	                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
	                                    <img src={member.avatar} style={{ width: '32px', height: '32px', borderRadius: '50%' }} alt="" />
	                                    <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{member.email}</span>
	                                    {member.is_root && <span style={{ fontSize: '0.6rem', fontWeight: 950, color: ADMIN_THEME.primary, background: 'rgba(0, 240, 255, 0.12)', padding: '4px 8px', borderRadius: '6px' }}>ROOT</span>}
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

const AdminTable = ({ projects, onSelect, onDelete, isMobile }) => {
    if (isMobile) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {projects.map((p) => {
                    const status = getStatusDetails(p.status, true);
                    return (
                        <motion.div
                            key={p.id}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => onSelect(p.id)}
                            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '24px', padding: '24px', position: 'relative' }}
                        >
                            <div style={{ position: 'absolute', top: '24px', right: '24px' }}>
                                <div
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDelete(p.id);
                                    }}
                                    style={{ width: '30px', height: '30px', background: 'rgba(255,50,50,0.1)', color: '#FF3333', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 900 }}
                                >
                                    <Trash2 size={16} />
                                </div>
                            </div>

                            <div style={{ marginBottom: '16px' }}>
                                <div style={{ fontSize: '0.65rem', fontWeight: 900, color: ADMIN_THEME.primary, marginBottom: '4px' }}>{p.owner_email}</div>
                                <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>{p.title}</div>
                            </div>

                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '20px' }}>
                                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.05)', padding: '6px 12px', borderRadius: '8px' }}>{p.category}</span>
                                <span style={{ fontSize: '0.65rem', fontWeight: 950, color: status.color, background: status.bg, padding: '6px 12px', borderRadius: '30px', letterSpacing: '1px' }}>{status.label}</span>
                                {normalizeMaintenanceStatus(p.maintenance_status) === 'REQUESTED' ? (
                                    <span style={{ fontSize: '0.65rem', fontWeight: 950, color: 'rgba(255,255,255,0.82)', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', padding: '6px 12px', borderRadius: '30px', letterSpacing: '1px' }}>
                                        MAINT REQ: {String(p.maintenance_requested_plan_name || p.maintenance_requested_plan_id || '').toUpperCase()}
                                    </span>
                                ) : null}
                                {normalizeMaintenanceStatus(p.maintenance_status) === 'ACTIVE' ? (
                                    <span style={{ fontSize: '0.65rem', fontWeight: 950, color: 'rgba(255,255,255,0.82)', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', padding: '6px 12px', borderRadius: '30px', letterSpacing: '1px' }}>
                                        MAINT: {String(p.maintenance_plan_name || p.maintenance_plan_id || '').toUpperCase()}
                                    </span>
                                ) : null}
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ flex: 1, height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', overflow: 'hidden' }}>
                                    <div style={{ height: '100%', width: `${p.progress}%`, background: status.color, boxShadow: `0 0 10px ${status.color}40` }} />
                                </div>
                                <span style={{ fontSize: '0.75rem', fontWeight: 950 }}>{p.progress}%</span>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        );
    }

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
                                    {normalizeMaintenanceStatus(p.maintenance_status) === 'REQUESTED' ? (
                                        <div style={{ marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 999, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.82)', fontSize: '0.62rem', fontWeight: 950, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                                            <span style={{ width: 8, height: 8, borderRadius: 999, background: 'rgba(255, 193, 7, 0.95)' }} />
                                            Maintenance req: {String(p.maintenance_requested_plan_name || p.maintenance_requested_plan_id || '').toUpperCase()}
                                        </div>
                                    ) : null}
                                    {normalizeMaintenanceStatus(p.maintenance_status) === 'ACTIVE' ? (
                                        <div style={{ marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 999, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.82)', fontSize: '0.62rem', fontWeight: 950, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                                            <span style={{ width: 8, height: 8, borderRadius: 999, background: 'rgba(76, 175, 80, 0.95)' }} />
                                            Maintenance: {String(p.maintenance_plan_name || p.maintenance_plan_id || '').toUpperCase()}
                                        </div>
                                    ) : null}
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
        </div >
    );
};

const Dashboard = () => {
		    const { user, logout, projects, admins, addAdmin, removeAdmin, addProject, updateProjectStatus, updateProjectData, deleteProject, updateUser, addComment, updateRoadmapStep, addRoadmapStep, deleteRoadmapStep, addResource } = useAuth();
		    const [activeTab, setActiveTab] = useState('projects');
		    const [isModalOpen, setIsModalOpen] = useState(false);
		    const [selectedProjectId, setSelectedProjectId] = useState(null);
	    const [isAdminMode, setIsAdminMode] = useState(() => {
	        try {
	            return window.localStorage.getItem('adminMode') === '1';
	        } catch {
	            return false;
	        }
		    });
		    const [filterStatus, setFilterStatus] = useState(null);
		    // State for mobile detection
		    const [isMobile, setIsMobile] = useState(() => getIsMobileLayout());
		    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        const update = () => setIsMobile(getIsMobileLayout());

        update();
        window.addEventListener('resize', update);
        window.addEventListener('orientationchange', update);

        const vv = window.visualViewport;
        vv?.addEventListener('resize', update);

        let mq;
        if (typeof window.matchMedia === 'function') {
            mq = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT_PX}px)`);
            if (typeof mq.addEventListener === 'function') mq.addEventListener('change', update);
            else if (typeof mq.addListener === 'function') mq.addListener(update);
        }

        return () => {
            window.removeEventListener('resize', update);
            window.removeEventListener('orientationchange', update);
            vv?.removeEventListener('resize', update);
            if (mq) {
                if (typeof mq.removeEventListener === 'function') mq.removeEventListener('change', update);
                else if (typeof mq.removeListener === 'function') mq.removeListener(update);
            }
        };
    }, []);

	    // Only admins can use admin mode; persist for admins.
	    useEffect(() => {
	        if (!user?.is_admin) setIsAdminMode(false);
	    }, [user]);

	    useEffect(() => {
	        try {
	            window.localStorage.setItem('adminMode', isAdminMode ? '1' : '0');
	        } catch {
	            // ignore
	        }
	    }, [isAdminMode]);

    // Reset selection when toggling admin mode.
    // Keep deps minimal to avoid loops; use functional update for activeTab.
    useEffect(() => {
        setSelectedProjectId(null);
        if (!isAdminMode) return;
        setActiveTab((prev) => (prev === 'team' || prev === 'portfolio' ? prev : 'projects'));
    }, [isAdminMode]);

	    const filteredProjects = isAdminMode
	        ? (filterStatus ? projects.filter(p => p.status === filterStatus) : projects)
	        : projects.filter(p => p.owner_email === user?.email);

        const primaryClientProject = !user?.is_admin
            ? pickPrimaryClientProject(filteredProjects)
            : null;

        const cancelMaintenanceForClient = async () => {
            if (!primaryClientProject?.id) return;
            const ok = window.confirm('Скасувати обслуговування сайту?');
            if (!ok) return;
            const result = await updateProjectData(primaryClientProject.id, {
                maintenance_status: 'CANCELED',
                maintenance_ended_at: new Date().toISOString(),
            });
            if (result?.success === false) {
                alert('Не вдалося оновити план у базі. Запусти `supabase_maintenance_migration.sql` у Supabase SQL editor.');
                return;
            }
            await addComment(primaryClientProject.id, '🧾 Скасовано обслуговування сайту.');
        };
	    const selectedProject = projects.find(p => p.id === selectedProjectId);
	    const adminSchemeVars = isAdminMode ? {
	        '--bg': '#000810',
	        '--text-main': '#FFFFFF',
	        '--text-muted': 'rgba(255,255,255,0.58)',
	        '--text-subtle': 'rgba(255,255,255,0.38)',
	        '--text-invert': '#0b0b10',
	        '--surface-1': 'rgba(255,255,255,0.04)',
	        '--surface-2': 'rgba(255,255,255,0.07)',
	        '--surface-3': 'rgba(255,255,255,0.10)',
	        '--border-1': 'rgba(255,255,255,0.10)',
	        '--border-2': 'rgba(255,255,255,0.14)',
	        '--glass-bg': 'rgba(0, 0, 0, 0.35)',
	        '--glass-bg-strong': 'rgba(0, 0, 0, 0.45)',
	        '--border-glass': 'rgba(255,255,255,0.10)',
	        '--shadow-soft': '0 22px 70px rgba(0,0,0,0.55)',
	        '--shadow-accent': '0 26px 90px rgba(var(--accent-rgb), 0.22)',
	    } : null;

	    if (selectedProject && activeTab === 'projects') {
	        return (
	            <ErrorBoundary>
	                <div style={{ ...(adminSchemeVars || {}), color: 'var(--text-main)' }}>
	                    <ProjectDetailsView
	                        project={selectedProject}
	                        onBack={() => setSelectedProjectId(null)}
	                        user={user}
	                        isMobile={isMobile}
	                    />
	                </div>
	            </ErrorBoundary>
	        );
	    }

	    return (
		        <section style={{
		            minHeight: '100vh',
		            padding: isMobile ? '80px 16px calc(180px + env(safe-area-inset-bottom))' : '120px 40px 60px',
		            display: isMobile ? 'block' : 'grid',
		            gridTemplateColumns: '280px 1fr',
		            gap: isMobile ? '40px' : '60px',
		            maxWidth: '1600px',
		            margin: '0 auto',
		            position: 'relative',
		            background: 'var(--bg)',
		            color: 'var(--text-main)',
		            overflow: 'hidden',
		            transition: 'background 0.5s ease',
		            ...(adminSchemeVars || {})
		        }}>
            {/* BACKGROUND DECORATIVE ORBS */}
	            <div style={{
	                position: 'absolute',
	                top: '-10%',
	                right: '-5%',
	                width: isMobile ? '300px' : '600px',
	                height: isMobile ? '300px' : '600px',
	                background: isAdminMode
	                    ? `radial-gradient(circle, ${ADMIN_THEME.primary}08 0%, transparent 70%)`
	                    : 'radial-gradient(circle, rgba(var(--accent-rgb), 0.05) 0%, transparent 70%)',
	                filter: 'blur(80px)',
	                pointerEvents: 'none',
	                transition: 'background 0.5s ease'
	            }} />
	            <div style={{ position: 'absolute', bottom: '10%', left: '-10%', width: isMobile ? '250px' : '500px', height: isMobile ? '250px' : '500px', background: 'radial-gradient(circle, rgba(var(--accent-rgb), 0.03) 0%, transparent 70%)', filter: 'blur(80px)', pointerEvents: 'none' }} />

            {/* Sidebar / Bottom Nav */}
	            <aside style={{
                display: 'flex',
                flexDirection: isMobile ? 'row' : 'column',
                gap: isMobile ? '0' : '40px',
                position: isMobile ? 'fixed' : 'relative',
                bottom: isMobile ? 0 : 'auto',
                left: isMobile ? 0 : 'auto',
                width: isMobile ? '100%' : 'auto',
	                background: isMobile ? 'linear-gradient(180deg, rgba(11, 11, 16, 0.92) 0%, rgba(11, 11, 16, 0.98) 70%)' : 'transparent',
	                zIndex: 100,
	                padding: isMobile ? '10px 16px calc(10px + env(safe-area-inset-bottom))' : '0',
	                justifyContent: isMobile ? 'space-around' : 'flex-start',
	                borderTop: isMobile ? '1px solid var(--border-1)' : 'none',
	                marginBottom: isMobile ? 0 : 0,
	                boxShadow: isMobile ? '0 -22px 70px rgba(0,0,0,0.78)' : 'none',
	                backdropFilter: isMobile ? 'blur(16px) saturate(140%)' : 'none',
	                WebkitBackdropFilter: isMobile ? 'blur(16px) saturate(140%)' : 'none'
	            }}>
                {!isMobile && (
                    <Magnetic>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '0 10px', cursor: 'pointer' }} onClick={() => setActiveTab('settings')}>
                            <div style={{ position: 'relative' }}>
                                <img src={user?.avatar} alt="Avatar" style={{ width: '50px', height: '50px', borderRadius: '15px' }} />
	                                <div style={{ position: 'absolute', bottom: -5, right: -5, width: '18px', height: '18px', background: isAdminMode ? ADMIN_THEME.primary : '#4CAF50', border: '3px solid var(--bg)', borderRadius: '50%' }} />
	                            </div>
	                            <div>
	                                <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>{user?.name}</h3>
	                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{isAdminMode ? 'ADMIN MODE' : 'Клієнт'}</p>
	                            </div>
	                        </div>
	                    </Magnetic>
	                )}

                <nav style={{ display: 'flex', flexDirection: isMobile ? 'row' : 'column', gap: isMobile ? '20px' : '10px', width: isMobile ? '100%' : 'auto', justifyContent: isMobile ? 'space-around' : 'flex-start', alignItems: 'center' }}>
                    <SidebarLink icon={<Layout size={24} />} label={isMobile ? "" : "Мої проекти"} active={activeTab === 'projects'} onClick={() => { setActiveTab('projects'); setSelectedProjectId(null); }} />
                    <SidebarLink icon={<Settings size={24} />} label={isMobile ? "" : "Налаштування"} active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />

                    {user?.is_root && (
                        <SidebarLink
                            icon={<ShieldCheck size={24} />}
                            label={isMobile ? "" : "Команда"}
                            active={activeTab === 'team'}
                            onClick={() => setActiveTab('team')}
                        />
                    )}

                    {user?.is_admin && (
                        isMobile ? (
                            <div onClick={() => setActiveTab('portfolio')} style={{ color: activeTab === 'portfolio' ? 'white' : 'rgba(255,255,255,0.4)' }}>
                                <Briefcase size={24} />
                            </div>
                        ) : (
                            <div style={{ marginTop: '20px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '20px' }}>
                                <SidebarLink
                                    icon={<Briefcase size={20} />}
                                    label="Портфоліо CMS"
                                    active={activeTab === 'portfolio'}
                                    onClick={() => setActiveTab('portfolio')}
                                />
	                                <button
	                                    onClick={() => setIsAdminMode((v) => !v)}
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
                        )
                    )}

                    {!isMobile && (
                        <div style={{ marginTop: user?.is_admin ? '10px' : '20px', borderTop: !user?.is_admin ? '1px solid rgba(255,255,255,0.05)' : 'none', paddingTop: !user?.is_admin ? '20px' : '0' }}>
                            <button onClick={logout} style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'rgba(255,50,50,0.6)', padding: '12px 15px', width: '100%', background: 'transparent', fontWeight: 600 }}>
                                <LogOut size={20} /> Вийти
                            </button>
                        </div>
                    )}

                    {isMobile && (
                        <div onClick={logout} style={{ color: 'rgba(255,50,50,0.6)' }}>
                            <LogOut size={24} />
                        </div>
                    )}
                </nav>
            </aside>

            {/* Main Content */}
            <main>
                <AnimatePresence mode="wait">
                    {activeTab === 'projects' ? (
                        <motion.div key="projects" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
	                                <h2 style={{ fontSize: '2.5rem', fontWeight: 950, letterSpacing: '-0.03em' }}>
	                                    {isAdminMode ? 'Центр Керування' : 'Ваші Проекти'}
	                                </h2>
                                {!isAdminMode && (
	                                    <motion.button
	                                        whileHover={{ scale: 1.02, boxShadow: '0 0 40px rgba(255,255,255,0.2)' }}
	                                        onClick={() => setIsModalOpen(true)}
	                                        style={{ background: 'var(--text-main)', color: 'var(--text-invert)', padding: '15px 30px', borderRadius: '50px', fontWeight: 950, fontSize: '0.8rem', letterSpacing: '1px', border: '1px solid var(--border-1)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: 'var(--shadow-soft)' }}
	                                    >
	                                        <Plus size={18} strokeWidth={3} /> НОВИЙ ПРОЕКТ
	                                    </motion.button>
	                                )}
	                            </div>

                            {isAdminMode && <AdminOverview projects={projects} onFilter={setFilterStatus} isMobile={isMobile} />}

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
                                    isMobile={isMobile}
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
                                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: isMobile ? '16px' : '30px' }}>
                                    {filteredProjects.map(p => (
                                        <ProjectCard key={p.id} project={p} onClick={() => setSelectedProjectId(p.id)} adminMode={isAdminMode} />
                                    ))}
                                    {filteredProjects.length === 0 && (
                                        <div style={{ gridColumn: isMobile ? 'span 1' : 'span 2', padding: isMobile ? '60px 20px' : '100px', textAlign: 'center', background: 'rgba(255,255,255,0.01)', border: '2px dashed rgba(255,255,255,0.05)', borderRadius: '40px' }}>
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
                        <SettingsView
                            user={user}
                            updateUser={updateUser}
                            isMobile={isMobile}
                            maintenanceProject={primaryClientProject}
                            onCancelMaintenance={cancelMaintenanceForClient}
                        />
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

const ProjectDetailsView = ({ project, onBack, user, isMobile = false }) => {
    const { updateProjectStatus, updateProjectData, deleteProject, addComment, addRoadmapStep, updateRoadmapStep, deleteRoadmapStep, addResource, approveProject, uploadFile } = useAuth();
    const [commentText, setCommentText] = useState('');
    const [newResource, setNewResource] = useState({ label: '', link: '', type: 'Figma' });
    const [isUploading, setIsUploading] = useState(false);
    const [isSendingComment, setIsSendingComment] = useState(false);
    const [isApprovingVersion, setIsApprovingVersion] = useState(false);
    const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);
    const [pendingMaintenancePlan, setPendingMaintenancePlan] = useState(null);
    const [activeDevice, setActiveDevice] = useState('phone'); // 'phone' | 'laptop'
    const [isAddingStep, setIsAddingStep] = useState(false);
    const [newStepTitle, setNewStepTitle] = useState('');
    const isAdmin = user?.is_admin;
    const canBuyMaintenance = !isAdmin && (project?.status === 'ACTIVE' || project?.status === 'COMPLETED');
    const monoPayUrl = import.meta.env.VITE_MONO_PAY_URL || DEFAULT_MONO_PAY_URL;
    const maintenanceStatus = normalizeMaintenanceStatus(project?.maintenance_status);
    const activeMaintenancePlan =
        maintenanceStatus === 'ACTIVE' && project?.maintenance_plan_id
            ? {
                id: project.maintenance_plan_id,
                name: project.maintenance_plan_name || project.maintenance_plan_id,
                price: project.maintenance_plan_price || '',
            }
            : null;
    const requestedMaintenancePlan =
        project?.maintenance_requested_plan_id
            ? {
                id: project.maintenance_requested_plan_id,
                name: project.maintenance_requested_plan_name || project.maintenance_requested_plan_id,
                price: project.maintenance_requested_plan_price || '',
                requestedAt: project.maintenance_requested_at,
            }
            : null;

    // Layout helpers (ProjectDetails is rendered without Dashboard sidebar, so handle mobile here too).
    const gridColumnSpan = (span) => (isMobile ? '1 / -1' : `span ${span}`);
    const containerPadding = isMobile ? '72px 16px 32px' : '80px 30px 40px';

    // Prevent laptop preview on small screens (LaptopFrame is intentionally wide).
    useEffect(() => {
        if (isMobile && activeDevice === 'laptop') setActiveDevice('phone');
    }, [isMobile, activeDevice]);

    // Safety defaults
    const roadmap = project?.roadmap || [];
    const comments = project?.comments || [];
    const visuals = project?.visuals || [];

    // Find visual for active device
    const currentVisual = visuals.find(v => v.device === activeDevice);
    const resources = project?.resources || [];

    const status = getStatusDetails(project?.status, isAdmin);

    const approvalRegex = /^✅\s*(Підтверджую|Підтверждаю)\s+актуальн(у|ую)\s+верс(і|и)ю/i;
    const lastClientApproval = [...comments]
        .reverse()
        .find((c) => (c?.author === user?.name || c?.author === user?.email) && approvalRegex.test(String(c?.text || '')));

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
            if (!project?.id) return;
            addRoadmapStep(project.id, titles);
            setNewStepTitle('');
            setIsAddingStep(false);
        }
    };

    const handleAddResource = () => {
        if (newResource.label && newResource.link) {
            if (!project?.id) return;
            addResource(project.id, newResource);
            setNewResource({ label: '', link: '', type: 'Figma' });
        }
    };

    if (!project) return null;

    return (
        <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ minHeight: '100vh', padding: containerPadding, maxWidth: '1400px', margin: '0 auto', position: 'relative' }}>
            <div
                style={{
                    position: 'absolute',
                    top: '10%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '600px',
                    height: '600px',
                    background: 'radial-gradient(circle, rgba(var(--accent-rgb), 0.03) 0%, transparent 70%)',
                    filter: 'blur(100px)',
                    pointerEvents: 'none',
                    zIndex: 0,
                }}
            />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? '14px' : 0, marginBottom: '24px', position: 'relative', zIndex: 10 }}>
                <motion.button whileHover={{ x: -10 }} onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(255,255,255,0.4)', background: 'transparent', fontWeight: 800, fontSize: '0.7rem', letterSpacing: '1px', border: 'none', cursor: 'pointer' }}>
                    <ArrowLeft size={16} strokeWidth={3} /> НАЗАД
                </motion.button>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    {canBuyMaintenance && (
                        <motion.button
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setIsMaintenanceModalOpen(true)}
                            style={{
                                background: 'rgba(255,255,255,0.06)',
                                border: '1px solid rgba(255,255,255,0.14)',
                                color: 'var(--text-main)',
                                padding: '10px 14px',
                                borderRadius: '999px',
                                fontWeight: 950,
                                letterSpacing: '0.08em',
                                textTransform: 'uppercase',
                                fontSize: '0.72rem',
                                cursor: 'pointer',
                            }}
                        >
                            Купити обслуговування
                        </motion.button>
                    )}
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

            {!isAdmin && project?.status === 'PAYMENT' ? (
                <div
                    style={{
                        position: 'relative',
                        zIndex: 10,
                        marginBottom: 16,
                        borderRadius: 24,
                        padding: isMobile ? 16 : 20,
                        border: '1px solid rgba(255,255,255,0.12)',
                        background: 'rgba(255,255,255,0.04)',
                        boxShadow: '0 26px 90px rgba(0,0,0,0.45)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 14,
                        flexWrap: 'wrap',
                    }}
                >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 240 }}>
                        <div style={{ fontSize: '0.72rem', fontWeight: 950, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--text-subtle)' }}>
                            Оплата проекту
                        </div>
                        <div style={{ fontWeight: 950, fontSize: isMobile ? '1.05rem' : '1.15rem' }}>
                            Для старту робiт потрiбна оплата (бюджет: {project?.budget || '—'}).
                        </div>
                        <div style={{ color: 'var(--text-muted)', lineHeight: 1.45 }}>
                            Натисни “Оплатити”. Пiсля оплати ми перевiримо надходження та оновимо статус.
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                        <a
                            href={monoPayUrl}
                            target="_blank"
                            rel="noreferrer noopener"
                            style={{
                                textDecoration: 'none',
                                background: 'rgba(255,255,255,0.06)',
                                border: '1px solid rgba(255,255,255,0.14)',
                                color: 'var(--text-main)',
                                padding: '12px 14px',
                                borderRadius: 14,
                                fontWeight: 950,
                                letterSpacing: '0.08em',
                                textTransform: 'uppercase',
                                fontSize: '0.72rem',
                            }}
                        >
                            Оплатити
                        </a>
                    </div>
                </div>
            ) : null}

            {isAdmin ? (
                <div
                    style={{
                        position: 'relative',
                        zIndex: 10,
                        marginBottom: 16,
                        borderRadius: 24,
                        padding: isMobile ? 16 : 20,
                        border: '1px solid rgba(255,255,255,0.10)',
                        background: 'rgba(255,255,255,0.03)',
                        boxShadow: '0 26px 90px rgba(0,0,0,0.40)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 14,
                        flexWrap: 'wrap',
                    }}
                >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 240 }}>
                        <div style={{ fontSize: '0.72rem', fontWeight: 950, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--text-subtle)' }}>
                            Обслуговування (адмiн)
                        </div>
                        {activeMaintenancePlan?.id ? (
                            <div style={{ fontWeight: 950 }}>
                                ACTIVE: {String(activeMaintenancePlan.name || activeMaintenancePlan.id).toUpperCase()} ({activeMaintenancePlan.price}/мiс)
                            </div>
                        ) : requestedMaintenancePlan?.id ? (
                            <div style={{ fontWeight: 950 }}>
                                REQUESTED: {String(requestedMaintenancePlan.name || requestedMaintenancePlan.id).toUpperCase()} ({requestedMaintenancePlan.price}/мiс)
                            </div>
                        ) : (
                            <div style={{ color: 'var(--text-muted)', fontWeight: 850 }}>
                                Немає активного плану / запиту
                            </div>
                        )}
                        <div style={{ color: 'var(--text-muted)', lineHeight: 1.45 }}>
                            Тут ти вмикаєш/вимикаєш план після перевірки оплати.
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                        {requestedMaintenancePlan?.id ? (
                            <>
                                <button
                                    type="button"
                                    onClick={async () => {
                                        if (!project?.id) return;
                                        const result = await updateProjectData(project.id, {
                                            maintenance_status: 'ACTIVE',
                                            maintenance_plan_id: requestedMaintenancePlan.id,
                                            maintenance_plan_name: requestedMaintenancePlan.name,
                                            maintenance_plan_price: requestedMaintenancePlan.price,
                                            maintenance_started_at: new Date().toISOString(),
                                            maintenance_ended_at: null,
                                            maintenance_requested_plan_id: null,
                                            maintenance_requested_plan_name: null,
                                            maintenance_requested_plan_price: null,
                                            maintenance_requested_at: null,
                                        });
                                        if (result?.success === false) {
                                            alert('Не вдалося оновити план у базі. Запусти `supabase_maintenance_migration.sql` у Supabase SQL editor.');
                                            return;
                                        }
                                        await addComment(project.id, `✅ (Admin) Активовано обслуговування: ${requestedMaintenancePlan.name} — ${requestedMaintenancePlan.price}/мiс.`);
                                    }}
                                    style={{
                                        background: ADMIN_THEME.primary,
                                        border: 'none',
                                        color: 'black',
                                        padding: '12px 14px',
                                        borderRadius: 14,
                                        fontWeight: 980,
                                        letterSpacing: '0.08em',
                                        textTransform: 'uppercase',
                                        fontSize: '0.72rem',
                                        cursor: 'pointer',
                                    }}
                                >
                                    Активувати
                                </button>
                                <button
                                    type="button"
                                    onClick={async () => {
                                        if (!project?.id) return;
                                        const result = await updateProjectData(project.id, {
                                            maintenance_status: 'NONE',
                                            maintenance_requested_plan_id: null,
                                            maintenance_requested_plan_name: null,
                                            maintenance_requested_plan_price: null,
                                            maintenance_requested_at: null,
                                        });
                                        if (result?.success === false) {
                                            alert('Не вдалося оновити план у базі. Запусти `supabase_maintenance_migration.sql` у Supabase SQL editor.');
                                            return;
                                        }
                                        await addComment(project.id, '🧾 (Admin) Запит на обслуговування скинуто.');
                                    }}
                                    style={{
                                        background: 'rgba(255,255,255,0.06)',
                                        border: '1px solid rgba(255,255,255,0.12)',
                                        color: 'var(--text-main)',
                                        padding: '12px 14px',
                                        borderRadius: 14,
                                        fontWeight: 900,
                                        letterSpacing: '0.08em',
                                        textTransform: 'uppercase',
                                        fontSize: '0.72rem',
                                        cursor: 'pointer',
                                    }}
                                >
                                    Скинути
                                </button>
                            </>
                        ) : activeMaintenancePlan?.id ? (
                            <button
                                type="button"
                                onClick={async () => {
                                    if (!project?.id) return;
                                    const ok = window.confirm('Скасувати активне обслуговування?');
                                    if (!ok) return;
                                    const result = await updateProjectData(project.id, {
                                        maintenance_status: 'CANCELED',
                                        maintenance_ended_at: new Date().toISOString(),
                                    });
                                    if (result?.success === false) {
                                        alert('Не вдалося оновити план у базі. Запусти `supabase_maintenance_migration.sql` у Supabase SQL editor.');
                                        return;
                                    }
                                    await addComment(project.id, '🧾 (Admin) Обслуговування скасовано.');
                                }}
                                style={{
                                    background: 'rgba(255,50,50,0.12)',
                                    border: '1px solid rgba(255,50,50,0.22)',
                                    color: '#FF5A5A',
                                    padding: '12px 14px',
                                    borderRadius: 14,
                                    fontWeight: 980,
                                    letterSpacing: '0.08em',
                                    textTransform: 'uppercase',
                                    fontSize: '0.72rem',
                                    cursor: 'pointer',
                                }}
                            >
                                Скасувати
                            </button>
                        ) : null}

                        <a
                            href={monoPayUrl}
                            target="_blank"
                            rel="noreferrer noopener"
                            style={{
                                textDecoration: 'none',
                                background: 'rgba(255,255,255,0.06)',
                                border: '1px solid rgba(255,255,255,0.14)',
                                color: 'var(--text-main)',
                                padding: '12px 14px',
                                borderRadius: 14,
                                fontWeight: 950,
                                letterSpacing: '0.08em',
                                textTransform: 'uppercase',
                                fontSize: '0.72rem',
                            }}
                        >
                            Посилання на оплату
                        </a>
                    </div>
                </div>
            ) : null}

            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(12, 1fr)', gap: '16px' }}>
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
                        gridColumn: gridColumnSpan(8),
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
	                            <span style={{ color: 'var(--accent-start)', fontWeight: 900, fontSize: '0.75rem', letterSpacing: '2px' }}>{project.category?.toUpperCase() || 'SAAS / WEB APP'}</span>
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
                    gridColumn: gridColumnSpan(4),
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
	                                                    style={{ background: 'var(--accent-start)', color: 'black', border: 'none', borderRadius: '10px', padding: '8px 16px', fontSize: '0.7rem', fontWeight: 900, cursor: 'pointer', flex: 1 }}
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
	                                        {s.status === 'completed' ? <CheckCircle2 size={18} color="#4CAF50" strokeWidth={3} /> : s.status === 'current' ? <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 2 }} style={{ width: '10px', height: '10px', background: 'var(--accent-start)', borderRadius: '50%', boxShadow: '0 0 15px var(--accent-start)' }} /> : <Circle size={18} color="rgba(255,255,255,0.1)" strokeWidth={2} />}
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
                    gridColumn: gridColumnSpan(8),
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.05)',
                    borderRadius: '24px',
                    padding: '24px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '20px'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        <h3 style={{ fontSize: '1.4rem', fontWeight: 950, display: 'flex', alignItems: 'center', gap: '12px', letterSpacing: '-0.02em' }}>
                            Live Preview
                        </h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                            <span style={{ background: 'rgba(76, 175, 80, 0.1)', color: '#4CAF50', padding: '6px 14px', borderRadius: '12px', fontSize: '0.65rem', fontWeight: 900, letterSpacing: '1px' }}>АКТУАЛЬНА ВЕРСІЯ</span>
                            {!isAdmin && (
                                lastClientApproval ? (
                                    <span style={{ background: 'rgba(var(--accent-rgb), 0.10)', color: 'var(--accent-start)', padding: '6px 14px', borderRadius: '12px', fontSize: '0.65rem', fontWeight: 900, letterSpacing: '1px' }}>
                                        ПIДТВЕРДЖЕНО
                                    </span>
                                ) : (
                                    <motion.button
                                        whileHover={{ scale: 1.03 }}
                                        whileTap={{ scale: 0.98 }}
                                        disabled={isApprovingVersion}
                                        onClick={async () => {
                                            const ok = window.confirm("Підтвердити актуальну версію? Після цього ми переходимо до наступної.");
                                            if (!ok) return;
                                            setIsApprovingVersion(true);
                                            const stamp = new Date().toLocaleString();
                                            await addComment(project.id, `✅ Підтверджую актуальну версію (${stamp}).`);
                                            setIsApprovingVersion(false);
                                        }}
                                        style={{
                                            background: isApprovingVersion ? 'rgba(255,255,255,0.12)' : 'var(--accent-start)',
                                            color: 'black',
                                            padding: '8px 14px',
                                            borderRadius: '12px',
                                            fontSize: '0.65rem',
                                            fontWeight: 950,
                                            letterSpacing: '1px',
                                            cursor: isApprovingVersion ? 'wait' : 'pointer',
                                            opacity: isApprovingVersion ? 0.75 : 1
                                        }}
                                    >
                                        {isApprovingVersion ? '...' : 'ПIДТВЕРДИТИ'}
                                    </motion.button>
                                )
                            )}
                        </div>
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
	                                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', color: 'var(--text-subtle)', fontSize: '0.7rem', fontWeight: 800 }}>
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
	                                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', color: 'var(--text-subtle)', fontSize: '0.7rem', fontWeight: 800 }}>
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

                            <div style={{ display: 'flex', gap: '10px', marginTop: '16px', flexWrap: 'wrap' }}>
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

                                {!isMobile && (
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
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* DISCUSSION - BENTO SPAN 4 */}
                <div style={{
                    gridColumn: gridColumnSpan(4),
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
	                            <div key={c.id} style={{ padding: '12px', borderRadius: '16px', background: c.author?.includes('(Admin)') ? 'rgba(var(--accent-rgb), 0.08)' : 'rgba(255,255,255,0.03)', alignSelf: c.author === user?.name || c.author?.includes('(Admin)') && user?.isAdmin ? 'flex-end' : 'flex-start', maxWidth: '90%', border: c.author?.includes('(Admin)') ? '1px solid rgba(var(--accent-rgb), 0.1)' : '1px solid transparent' }}>
	                                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', marginBottom: '2px' }}>
	                                    <span style={{ fontWeight: 900, fontSize: '0.6rem', color: c.author?.includes('(Admin)') ? 'var(--accent-start)' : 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>{c.author}</span>
	                                    <span style={{ fontSize: '0.5rem', color: 'rgba(255,255,255,0.2)' }}>{new Date(c.date).toLocaleDateString()}</span>
	                                </div>
	                                <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.9)', lineHeight: 1.4 }}>{c.text}</p>
	                            </div>
                        ))}
                    </div>
                    <form onSubmit={handleCommentSubmit} style={{ display: 'flex', gap: '8px' }}>
	                        <input type="text" placeholder="Напишіть повідомлення..." value={commentText} onChange={e => setCommentText(e.target.value)} style={{ flex: 1, background: 'var(--surface-1)', border: '1px solid var(--border-1)', borderRadius: '14px', padding: '10px 14px', color: 'var(--text-main)', fontSize: '0.8rem', outline: 'none' }} />
	                        <motion.button whileHover={{ scale: 1.05 }} disabled={isSendingComment} type="submit" style={{ background: 'var(--accent-start)', color: 'black', width: '40px', height: '40px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', opacity: isSendingComment ? 0.7 : 1 }}>
	                            {isSendingComment ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} style={{ width: '12px', height: '12px', border: '2px solid rgba(255,255,255,0.5)', borderTop: '2px solid white', borderRadius: '50%' }} /> : <Send size={16} strokeWidth={3} />}
	                        </motion.button>
                    </form>
                </div>

                {/* RESOURCES CARD - BENTO SPAN 12 */}
	                <div style={{
	                    gridColumn: gridColumnSpan(12),
	                    background: 'var(--surface-1)',
	                    border: '1px solid var(--border-1)',
	                    borderRadius: '24px',
	                    padding: '24px'
	                }}>
	                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
	                        <h4 style={{ fontSize: '0.7rem', fontWeight: 900, color: 'var(--text-main)', letterSpacing: '4px' }}>МАТЕРІАЛИ ПРОЕКТУ</h4>
	                        {isAdmin && (
	                            <button onClick={() => {/* Toggle Resource Add */ }} style={{ background: 'var(--surface-1)', border: '1px solid var(--border-1)', color: 'var(--text-main)', padding: '6px 16px', borderRadius: '10px', fontWeight: 800, fontSize: '0.65rem', cursor: 'pointer' }}>+ ДОДАТИ</button>
	                        )}
	                    </div>
	                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, minmax(0, 1fr))' : 'repeat(4, 1fr)', gap: '16px' }}>
	                        {resources.map((r) => (<ResourceLink key={r.id} icon={r.type === 'Figma' ? <Figma size={18} /> : <FileText size={18} />} label={r.label} />))}
	                        {resources.length === 0 && (
	                            <div style={{ gridColumn: isMobile ? '1 / -1' : 'span 4', textAlign: 'center', padding: '30px', color: 'var(--text-subtle)', border: '1px dashed var(--border-1)', borderRadius: '24px' }}>
	                                <Clock size={20} style={{ marginBottom: '10px' }} />
	                                <p style={{ fontSize: '0.8rem', fontWeight: 600 }}>Матеріали синхронізуються...</p>
	                            </div>
	                        )}
	                    </div>
	                </div>
            </div>

            <AnimatePresence>
                {isMaintenanceModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: 'fixed',
                            inset: 0,
                            background: 'rgba(0,0,0,0.72)',
                            backdropFilter: 'blur(10px)',
                            WebkitBackdropFilter: 'blur(10px)',
                            zIndex: 2000,
                            padding: isMobile ? '16px' : '26px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                        onClick={() => setIsMaintenanceModalOpen(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, y: 14, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 14, scale: 0.98 }}
                            transition={{ duration: 0.18 }}
                            style={{
                                width: 'min(1100px, 100%)',
                                maxHeight: 'min(86vh, 860px)',
                                overflow: 'auto',
                                background: 'rgba(15, 15, 18, 0.92)',
                                border: '1px solid rgba(255,255,255,0.10)',
                                borderRadius: 28,
                                padding: isMobile ? 16 : 20,
                                boxShadow: '0 40px 120px rgba(0,0,0,0.65)',
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 14, marginBottom: 14 }}>
                                <div>
                                    <div style={{ color: 'var(--text-subtle)', fontWeight: 950, letterSpacing: '0.18em', textTransform: 'uppercase', fontSize: '0.72rem' }}>
                                        Обслуговування сайту
                                    </div>
                                    <div style={{ marginTop: 6, fontSize: isMobile ? '1.35rem' : '1.7rem', fontWeight: 980, letterSpacing: '-0.03em' }}>
                                        Обери план супроводу
                                    </div>
                                    <div style={{ marginTop: 8, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                                        Обери план або закрий це вiкно.
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setIsMaintenanceModalOpen(false)}
                                    style={{
                                        background: 'rgba(255,255,255,0.06)',
                                        border: '1px solid rgba(255,255,255,0.12)',
                                        color: 'var(--text-main)',
                                        padding: '10px 12px',
                                        borderRadius: 14,
                                        fontWeight: 950,
                                        cursor: 'pointer',
                                    }}
                                >
                                    ✕
                                </button>
                            </div>

                            {activeMaintenancePlan?.id ? (
                                <div style={{ marginBottom: 16, padding: '12px 14px', borderRadius: 18, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                                    <div style={{ fontWeight: 950 }}>
                                        Поточний план: {String(activeMaintenancePlan.name || activeMaintenancePlan.id).toUpperCase()} ({activeMaintenancePlan.price}/мiс)
                                    </div>
                                    <button
                                        type="button"
                                        onClick={async () => {
                                            if (!project?.id) return;
                                            const ok = window.confirm('Скасувати обслуговування?');
                                            if (!ok) return;
                                            const result = await updateProjectData(project.id, {
                                                maintenance_status: 'CANCELED',
                                                maintenance_ended_at: new Date().toISOString(),
                                            });
                                            if (result?.success === false) {
                                                alert('Не вдалося оновити план у базі. Запусти `supabase_maintenance_migration.sql` у Supabase SQL editor.');
                                                return;
                                            }
                                            await addComment(project.id, '🧾 Скасовано обслуговування сайту.');
                                            setIsMaintenanceModalOpen(false);
                                        }}
                                        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'var(--text-main)', padding: '10px 12px', borderRadius: 14, fontWeight: 900, cursor: 'pointer' }}
                                    >
                                        Скасувати
                                    </button>
                                </div>
                            ) : null}

                            {!activeMaintenancePlan?.id && requestedMaintenancePlan?.id ? (
                                <div style={{ marginBottom: 16, padding: '12px 14px', borderRadius: 18, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                                    <div style={{ fontWeight: 900 }}>
                                        Запит на план: {String(requestedMaintenancePlan.name || requestedMaintenancePlan.id).toUpperCase()} ({requestedMaintenancePlan.price}/мiс) — очiкує пiдтвердження
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setPendingMaintenancePlan(null)}
                                        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'var(--text-main)', padding: '10px 12px', borderRadius: 14, fontWeight: 900, cursor: 'pointer' }}
                                    >
                                        Змiнити
                                    </button>
                                </div>
                            ) : null}

                            {!activeMaintenancePlan?.id ? (
                                pendingMaintenancePlan ? (
                                    <div style={{ marginTop: 12, borderRadius: 22, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.04)', padding: 16 }}>
                                        <div style={{ fontWeight: 980, fontSize: '1.1rem' }}>
                                            Обрано: {pendingMaintenancePlan.name} ({pendingMaintenancePlan.price}/мiс)
                                        </div>
                                        <div style={{ marginTop: 8, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                                            Натисни “Оплатити”, а пiсля оплати — “Надiслати запит”, щоб ми активували план.
                                        </div>

                                        <div style={{ marginTop: 14, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                                            <a
                                                href={monoPayUrl}
                                                target="_blank"
                                                rel="noreferrer noopener"
                                                style={{
                                                    textDecoration: 'none',
                                                    background: 'rgba(255,255,255,0.06)',
                                                    border: '1px solid rgba(255,255,255,0.14)',
                                                    color: 'var(--text-main)',
                                                    padding: '12px 14px',
                                                    borderRadius: 14,
                                                    fontWeight: 950,
                                                    letterSpacing: '0.08em',
                                                    textTransform: 'uppercase',
                                                    fontSize: '0.72rem',
                                                }}
                                            >
                                                Оплатити
                                            </a>
                                            <button
                                                type="button"
                                                onClick={async () => {
                                                    if (!project?.id) return;
                                                    const plan = pendingMaintenancePlan;
                                                    setPendingMaintenancePlan(null);
                                                    const result = await updateProjectData(project.id, {
                                                        maintenance_status: 'REQUESTED',
                                                        maintenance_requested_plan_id: plan.id,
                                                        maintenance_requested_plan_name: plan.name,
                                                        maintenance_requested_plan_price: plan.price,
                                                        maintenance_requested_at: new Date().toISOString(),
                                                    });
                                                    if (result?.success === false) {
                                                        alert('Не вдалося записати запит у базу. Запусти `supabase_maintenance_migration.sql` у Supabase SQL editor.');
                                                        return;
                                                    }
                                                    await addComment(project.id, `🧾 Запит на обслуговування: ${plan.name} — ${plan.price}/мiс. Оплата: ${monoPayUrl}`);
                                                    setIsMaintenanceModalOpen(false);
                                                }}
                                                style={{
                                                    background: 'var(--accent-start)',
                                                    border: 'none',
                                                    color: 'black',
                                                    padding: '12px 14px',
                                                    borderRadius: 14,
                                                    fontWeight: 980,
                                                    letterSpacing: '0.08em',
                                                    textTransform: 'uppercase',
                                                    fontSize: '0.72rem',
                                                    cursor: 'pointer',
                                                }}
                                            >
                                                Надiслати запит
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setPendingMaintenancePlan(null)}
                                                style={{
                                                    background: 'rgba(255,255,255,0.06)',
                                                    border: '1px solid rgba(255,255,255,0.12)',
                                                    color: 'var(--text-main)',
                                                    padding: '12px 14px',
                                                    borderRadius: 14,
                                                    fontWeight: 900,
                                                    letterSpacing: '0.08em',
                                                    textTransform: 'uppercase',
                                                    fontSize: '0.72rem',
                                                    cursor: 'pointer',
                                                }}
                                            >
                                                Назад
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <SubscriptionPlans onChoose={(plan) => setPendingMaintenancePlan(plan)} />
                                )
                            ) : null}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.section>
    );
};

// --- UTILITIES ---
const ResourceLink = ({ icon, label }) => (
		    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'var(--surface-1)', border: '1px solid var(--border-1)', borderRadius: '16px', cursor: 'pointer' }}>
		        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
		            <span style={{ color: 'var(--accent-start)' }}>{icon}</span>
		            <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{label}</span>
		        </div>
		        <ExternalLink size={14} color="rgba(255,255,255,0.2)" />
		    </div>
);

const SidebarLink = ({ icon, label, active, onClick }) => (
    <motion.button
        whileHover={{ x: 5, background: 'var(--surface-1)' }}
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
		        style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '16px 20px',
            width: '100%',
            borderRadius: '16px',
		            background: active ? 'rgba(var(--accent-rgb), 0.1)' : 'transparent',
		            color: active ? 'var(--accent-start)' : 'var(--text-muted)',
		            transition: '0.3s cubic-bezier(0.2, 0, 0.2, 1)',
		            fontWeight: 800,
		            fontSize: '0.9rem',
		            border: active ? '1px solid rgba(var(--accent-rgb), 0.1)' : '1px solid transparent',
		            cursor: 'pointer'
		        }}
		    >
		        <span style={{ color: active ? 'var(--accent-start)' : 'inherit' }}>{icon}</span>
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
	                            {adminMode && <span style={{ fontSize: '0.65rem', fontWeight: 900, color: ADMIN_THEME.primary, background: ADMIN_THEME.accent, padding: '2px 8px', borderRadius: '6px' }}>{project.owner_email}</span>}
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
	        style={{ background: 'linear-gradient(135deg, rgba(var(--accent-rgb), 0.1) 0%, rgba(var(--accent-rgb), 0.05) 100%)', border: '1px solid rgba(var(--accent-rgb), 0.3)', borderRadius: '40px', padding: '40px' }}
	    >
	        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
	            <h3 style={{ fontSize: '1.6rem', fontWeight: 950, letterSpacing: '-0.02em' }}>{project.title}</h3>
	            {adminMode && <span style={{ fontSize: '0.65rem', fontWeight: 900, color: ADMIN_THEME.primary, background: ADMIN_THEME.accent, padding: '4px 10px', borderRadius: '6px' }}>{project.owner_email}</span>}
	        </div>
	        <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.5)', marginBottom: '32px', lineHeight: 1.5 }}>Перевірка завершена. Бюджет: {project.budget}. Необхідна оплата для початку робіт.</p>
	        <motion.button
	            whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(var(--accent-rgb), 0.35)' }}
	            onClick={onPay}
	            style={{ width: '100%', background: 'var(--accent-start)', color: 'black', padding: '18px', borderRadius: '20px', fontWeight: 900, fontSize: '0.85rem', letterSpacing: '1px', border: 'none', cursor: 'pointer' }}
	        >
	            ПІДТВЕРДИТИ ОПЛАТУ
	        </motion.button>
	    </motion.div>
);

const Section = ({ title, icon: Icon, children }) => (
	    <div style={{ marginBottom: '40px' }}>
	        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
	            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(var(--accent-rgb), 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
	                <Icon size={20} color="var(--accent-start)" />
	            </div>
	            <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--text-main)' }}>{title}</h3>
	        </div>
	        <div style={{ background: 'var(--surface-1)', border: '1px solid var(--border-1)', borderRadius: '24px', padding: '24px' }}>
	            {children}
	        </div>
	    </div>
);

const Toggle = ({ active, onToggle, label }) => (
	    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
	        <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{label}</span>
	        <div onClick={onToggle} style={{ width: '44px', height: '24px', background: active ? 'var(--accent-start)' : 'rgba(255,255,255,0.1)', borderRadius: '20px', padding: '2px', cursor: 'pointer', transition: '0.3s' }}>
	            <div style={{ width: '20px', height: '20px', background: 'white', borderRadius: '50%', transform: active ? 'translateX(20px)' : 'translateX(0)', transition: '0.3s' }} />
	        </div>
	    </div>
);

const SettingsView = ({ user, updateUser, isMobile = false, maintenanceProject = null, onCancelMaintenance = null }) => {
    const [name, setName] = useState(user?.name || '');
    const [email, setEmail] = useState(user?.email || '');
    const [phone, setPhone] = useState(user?.phone || '');
    const [company, setCompany] = useState(user?.company || '');
    const [role, setRole] = useState(user?.role || '');
	    const [avatarStyle, setAvatarStyle] = useState('avataaars');
	    const [avatarSeed, setAvatarSeed] = useState(user?.email || 'seed');
	    const [showPassword, setShowPassword] = useState(false);
	    const [passwordData, setPasswordData] = useState({ current: '', next: '' });
    const [accentStart, setAccentStart] = useState(() => loadAccent().start);
	    const [accentPresetId, setAccentPresetId] = useState(() => {
	        const current = loadAccent();
	        const match = PRESET_ACCENTS.find(p => (p.accent?.start || '').toUpperCase() === (current?.start || '').toUpperCase());
	        return match ? match.id : 'custom';
	    });

    const handleSave = () => {
        const avatar = `https://api.dicebear.com/7.x/${avatarStyle}/svg?seed=${avatarSeed}`;
        updateUser({ name, email, phone, company, role, avatar });
        alert('Збережено успішно');
    };
    const maintenanceStatus = normalizeMaintenanceStatus(maintenanceProject?.maintenance_status);
    const maintenanceActive =
        maintenanceStatus === 'ACTIVE' && maintenanceProject?.maintenance_plan_id
            ? {
                id: maintenanceProject.maintenance_plan_id,
                name: maintenanceProject.maintenance_plan_name || maintenanceProject.maintenance_plan_id,
                price: maintenanceProject.maintenance_plan_price || '',
            }
            : null;
    const maintenanceRequested =
        !maintenanceActive?.id && maintenanceProject?.maintenance_requested_plan_id
            ? {
                id: maintenanceProject.maintenance_requested_plan_id,
                name: maintenanceProject.maintenance_requested_plan_name || maintenanceProject.maintenance_requested_plan_id,
                price: maintenanceProject.maintenance_requested_plan_price || '',
            }
            : null;

    const handlePasswordUpdate = () => {
        if (passwordData.current !== user.password) {
            alert('Поточний пароль невірний');
            return;
        }
        if (passwordData.next.length < 4) {
            alert('Новий пароль занадто короткий (мін. 4 символи)');
            return;
        }
        updateUser({ password: passwordData.next });
        setPasswordData({ current: '', next: '' });
        setShowPassword(false);
        alert('Пароль успішно змінено');
    };

	    const avatarStyles = [
        { id: 'avataaars', label: 'Classic' },
        { id: 'pixel-art', label: 'Pixel' },
        { id: 'bottts', label: 'Robot' },
        { id: 'identicon', label: 'Abstract' },
        { id: 'micah', label: 'Staged' },
        { id: 'lorelei', label: 'Modern' }
	    ];

	    const handlePresetAccent = (preset) => {
	        const next = preset?.accent;
	        if (!next?.start) return;
	        applyAccent(next);
	        saveAccent(next);
	        setAccentStart(next.start);
	        setAccentPresetId(preset.id);
	    };

	    const handleCustomAccent = (hex) => {
	        setAccentStart(hex);
	        const next = deriveAccentFromStart(hex);
	        applyAccent(next);
	        saveAccent(next);
	        setAccentPresetId('custom');
	    };

	    const handleResetAccent = () => {
	        clearAccent();
	        const current = loadAccent();
	        setAccentStart(current.start);
	        const match = PRESET_ACCENTS.find(p => (p.accent?.start || '').toUpperCase() === (current?.start || '').toUpperCase());
	        setAccentPresetId(match ? match.id : 'custom');
	    };

	    return (
	        <div style={{ maxWidth: '800px' }}>
	            <h2 style={{ fontSize: '2.5rem', fontWeight: 950, marginBottom: '48px', letterSpacing: '-0.04em' }}>Налаштування</h2>

            <Section title="Профіль" icon={User}>
                {maintenanceActive?.id ? (
                    <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', padding: '14px 16px', borderRadius: 18, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.04)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <div style={{ fontSize: '0.75rem', fontWeight: 950, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--text-subtle)' }}>
                                План обслуговування
                            </div>
                            <div style={{ fontWeight: 980, fontSize: '1.05rem' }}>
                                {String(maintenanceActive.name || maintenanceActive.id).toUpperCase()} ({maintenanceActive.price}/мiс)
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => {
                                if (typeof onCancelMaintenance === 'function') onCancelMaintenance();
                            }}
                            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'var(--text-main)', padding: '10px 12px', borderRadius: 14, fontWeight: 950, cursor: 'pointer' }}
                        >
                            Скасувати
                        </button>
                    </div>
                ) : null}

                {maintenanceRequested?.id ? (
                    <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', padding: '14px 16px', borderRadius: 18, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.04)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <div style={{ fontSize: '0.75rem', fontWeight: 950, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--text-subtle)' }}>
                                Запит на обслуговування
                            </div>
                            <div style={{ fontWeight: 950, fontSize: '1.02rem' }}>
                                {String(maintenanceRequested.name || maintenanceRequested.id).toUpperCase()} ({maintenanceRequested.price}/мiс) — очiкує пiдтвердження
                            </div>
                        </div>
                    </div>
                ) : null}

                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', gridColumn: isMobile ? 'span 1' : 'span 2' }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'rgba(255,255,255,0.3)', letterSpacing: '1px' }}>ПОВНЕ ІМ'Я</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} style={{ padding: '16px', background: 'var(--surface-1)', border: '1px solid var(--border-1)', borderRadius: '16px', color: 'var(--text-main)', outline: 'none' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'rgba(255,255,255,0.3)', letterSpacing: '1px' }}>EMAIL</label>
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} style={{ padding: '16px', background: 'var(--surface-1)', border: '1px solid var(--border-1)', borderRadius: '16px', color: 'var(--text-main)', outline: 'none' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'rgba(255,255,255,0.3)', letterSpacing: '1px' }}>ТЕЛЕФОН</label>
                        <input type="tel" value={phone} placeholder="+380..." onChange={e => setPhone(e.target.value)} style={{ padding: '16px', background: 'var(--surface-1)', border: '1px solid var(--border-1)', borderRadius: '16px', color: 'var(--text-main)', outline: 'none' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'rgba(255,255,255,0.3)', letterSpacing: '1px' }}>КОМПАНІЯ</label>
                        <input type="text" value={company} onChange={e => setCompany(e.target.value)} style={{ padding: '16px', background: 'var(--surface-1)', border: '1px solid var(--border-1)', borderRadius: '16px', color: 'var(--text-main)', outline: 'none' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'rgba(255,255,255,0.3)', letterSpacing: '1px' }}>ПОСАДА</label>
                        <input type="text" value={role} onChange={e => setRole(e.target.value)} style={{ padding: '16px', background: 'var(--surface-1)', border: '1px solid var(--border-1)', borderRadius: '16px', color: 'var(--text-main)', outline: 'none' }} />
                    </div>
                </div>
            </Section>

            <Section title="Профільний Аватар" icon={User}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
                    <div style={{ position: 'relative' }}>
	                        <img
	                            src={`https://api.dicebear.com/7.x/${avatarStyle}/svg?seed=${avatarSeed}`}
	                            style={{ width: '100px', height: '100px', borderRadius: '30px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(var(--accent-rgb), 0.2)' }}
	                            alt="Avatar Preview"
	                        />
	                        <motion.button
	                            whileTap={{ rotate: 180 }}
	                            onClick={() => setAvatarSeed(Math.random().toString(36).substring(7))}
	                            style={{ position: 'absolute', bottom: '-10px', right: '-10px', width: '36px', height: '36px', borderRadius: '12px', background: 'var(--accent-start)', color: 'black', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(var(--accent-rgb), 0.3)' }}
	                        >
	                            <Zap size={16} fill="white" />
	                        </motion.button>
                    </div>
                    <div style={{ flex: 1 }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'rgba(255,255,255,0.3)', letterSpacing: '1px', marginBottom: '12px', display: 'block' }}>ОБЕРІТЬ СТИЛЬ</label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                            {avatarStyles.map(s => (
                                <button
                                    key={s.id}
                                    onClick={() => setAvatarStyle(s.id)}
	                                    style={{
	                                        padding: '10px',
	                                        borderRadius: '12px',
	                                        background: avatarStyle === s.id ? 'rgba(var(--accent-rgb), 0.1)' : 'rgba(255,255,255,0.03)',
	                                        border: `1px solid ${avatarStyle === s.id ? 'var(--accent-start)' : 'transparent'}`,
	                                        color: avatarStyle === s.id ? 'var(--accent-start)' : 'rgba(255,255,255,0.6)',
	                                        fontSize: '0.75rem',
	                                        fontWeight: 800,
	                                        cursor: 'pointer'
	                                    }}
	                                >
                                    {s.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </Section>

	            <Section title="Безпека" icon={Lock}>
                <button onClick={() => setShowPassword(!showPassword)} style={{ background: 'var(--surface-1)', color: 'var(--text-main)', padding: '12px 24px', borderRadius: '12px', border: '1px solid var(--border-1)', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}>
                    ЗМІНИТИ ПАРОЛЬ
                </button>
                {showPassword && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <input
                            type="password"
                            placeholder="Поточний пароль"
                            value={passwordData.current}
                            onChange={e => setPasswordData({ ...passwordData, current: e.target.value })}
                            style={{ padding: '14px', background: 'var(--surface-1)', border: '1px solid var(--border-1)', borderRadius: '12px', color: 'var(--text-main)', outline: 'none' }}
                        />
                        <input
                            type="password"
                            placeholder="Новий пароль"
                            value={passwordData.next}
                            onChange={e => setPasswordData({ ...passwordData, next: e.target.value })}
                            style={{ padding: '14px', background: 'var(--surface-1)', border: '1px solid var(--border-1)', borderRadius: '12px', color: 'var(--text-main)', outline: 'none' }}
                        />
	                        <button
	                            onClick={handlePasswordUpdate}
	                            style={{ background: 'var(--accent-start)', color: 'black', padding: '12px', borderRadius: '12px', border: 'none', fontWeight: 900, cursor: 'pointer' }}
	                        >
	                            ПІДТВЕРДИТИ
	                        </button>
                    </motion.div>
                )}
	            </Section>

	            <Section title="Вигляд" icon={Palette}>
	                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
	                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
	                        <div>
		                            <div style={{ fontWeight: 900, letterSpacing: '0.02em' }}>Акцентний колiр сайту</div>
		                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
		                                Обери пресет або свiй колiр. Змiни застосовуються одразу.
		                            </div>
		                        </div>
		                        <button
		                            onClick={handleResetAccent}
		                            style={{ background: 'var(--surface-1)', color: 'var(--text-main)', padding: '10px 14px', borderRadius: '12px', border: '1px solid var(--border-1)', fontWeight: 800, cursor: 'pointer' }}
		                        >
		                            Скинути
		                        </button>
	                    </div>

	                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '12px' }}>
	                        {PRESET_ACCENTS.map((p) => {
	                            const active = accentPresetId === p.id;
	                            return (
	                                <button
	                                    key={p.id}
	                                    onClick={() => handlePresetAccent(p)}
	                                    style={{
	                                        display: 'flex',
	                                        alignItems: 'center',
	                                        gap: '12px',
		                                        padding: '12px',
		                                        borderRadius: '16px',
		                                        background: active ? 'rgba(var(--accent-rgb), 0.10)' : 'var(--surface-1)',
		                                        border: active ? '1px solid rgba(var(--accent-rgb), 0.22)' : '1px solid var(--border-1)',
		                                        color: 'var(--text-main)',
		                                        cursor: 'pointer',
		                                        transition: '0.2s',
		                                        textAlign: 'left'
		                                    }}
	                                >
	                                    <div style={{
	                                        width: '34px',
	                                        height: '34px',
	                                        borderRadius: '12px',
	                                        background: `linear-gradient(135deg, ${p.accent.start} 0%, ${p.accent.mid} 55%, ${p.accent.end} 100%)`,
		                                        boxShadow: '0 10px 24px rgba(0,0,0,0.35)',
		                                        border: '1px solid var(--border-1)',
		                                        flexShrink: 0
		                                    }} />
		                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
		                                        <div style={{ fontWeight: 900 }}>{p.name}</div>
		                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', letterSpacing: '0.02em' }}>{p.accent.start}</div>
		                                    </div>
		                                </button>
	                            );
	                        })}
	                    </div>

		                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', padding: '14px 16px', borderRadius: '16px', border: '1px solid var(--border-1)', background: 'var(--surface-1)' }}>
		                        <div>
		                            <div style={{ fontWeight: 900 }}>Свiй колiр</div>
		                            <div style={{ fontSize: '0.8rem', color: 'var(--text-subtle)' }}>Вибери базовий акцент (градієнт згенерується автоматично)</div>
		                        </div>
		                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
		                            <div style={{ width: '36px', height: '36px', borderRadius: '12px', background: 'linear-gradient(135deg, var(--accent-start) 0%, var(--accent-mid) 55%, var(--accent-end) 100%)', border: '1px solid var(--border-1)', boxShadow: '0 12px 30px rgba(var(--accent-rgb), 0.18)' }} />
		                            <input
		                                aria-label="Accent color"
		                                type="color"
		                                value={accentStart}
		                                onChange={(e) => handleCustomAccent(e.target.value)}
		                                style={{ width: '44px', height: '36px', borderRadius: '12px', border: '1px solid var(--border-1)', background: 'transparent', padding: 0, cursor: 'pointer' }}
		                            />
		                        </div>
		                    </div>
	                </div>
	            </Section>

		            <button onClick={handleSave} style={{ background: 'var(--text-main)', color: 'var(--text-invert)', padding: '18px 60px', borderRadius: '50px', fontWeight: 950, fontSize: '0.9rem', letterSpacing: '1px', boxShadow: 'var(--shadow-soft)', cursor: 'pointer', border: '1px solid var(--border-1)' }}>ЗБЕРЕГТИ ВСЕ</button>
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
        if (step === 2) return formData.customBudget.length >= 2;
        if (step === 3) return formData.details.length > 5;
        return false;
    };

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', backdropFilter: 'blur(40px)', zIndex: 2000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
	            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ background: 'var(--bg)', border: '1px solid var(--border-1)', borderRadius: '32px', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', padding: '40px 30px', position: 'relative', boxShadow: 'var(--shadow-soft)' }}>
                <button onClick={onClose} style={{ position: 'absolute', right: '20px', top: '20px', color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10 }}><X size={18} /></button>
	                {!isSuccess && <div style={{ display: 'flex', gap: '6px', marginBottom: '30px', marginTop: '10px' }}>{[1, 2, 3].map(i => (<div key={i} style={{ height: '3px', flex: 1, background: i <= step ? 'linear-gradient(90deg, var(--accent-start), var(--accent-mid), var(--accent-end))' : 'rgba(255,255,255,0.05)', borderRadius: '10px', boxShadow: i <= step ? '0 0 10px rgba(var(--accent-rgb), 0.3)' : 'none' }} />))}</div>}

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
	                                <div style={{ background: 'rgba(var(--accent-rgb), 0.04)', borderLeft: '3px solid var(--accent-start)', padding: '12px', borderRadius: '0 10px 10px 0', marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'center' }}>
	                                    <Info size={16} color="var(--accent-start)" style={{ flexShrink: 0 }} />
	                                    <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.3 }}>Оберіть категорію проекту.</p>
	                                </div>
                                <input type="text" placeholder="Назва вашого проекту" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '16px', color: 'white', width: '100%', marginBottom: '20px', fontSize: '0.95rem', outline: 'none', transition: '0.3s' }} value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                    {categories.map(cat => {
                                        const isSelected = formData.category === cat.id;
                                        return (
	                                            <motion.div whileHover={{ scale: 1.01 }} key={cat.id} onClick={() => setFormData({ ...formData, category: cat.id })} style={{ padding: '12px', borderRadius: '16px', border: `1px solid ${isSelected ? 'var(--accent-start)' : 'rgba(255,255,255,0.05)'}`, background: isSelected ? 'rgba(var(--accent-rgb), 0.08)' : 'rgba(255,255,255,0.01)', cursor: 'pointer', transition: '0.2s' }}>
	                                                <h4 style={{ fontSize: '0.85rem', fontWeight: 900, marginBottom: '2px', color: isSelected ? 'var(--accent-start)' : 'white', letterSpacing: '-0.01em' }}>{cat.title}</h4>
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
	                            <div style={{ background: 'rgba(var(--accent-rgb), 0.04)', borderLeft: '3px solid var(--accent-start)', padding: '12px', borderRadius: '0 10px 10px 0', marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'center' }}>
	                                <Info size={16} color="var(--accent-start)" style={{ flexShrink: 0 }} />
	                                <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.3 }}>Вкажіть ваш бюджет.</p>
	                            </div>


                            <div style={{ padding: '20px', background: 'rgba(255,255,255,0.01)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', opacity: formData.customBudget ? 1 : 0.4 }}>
	                                    <Shield size={14} color={formData.customBudget ? 'var(--accent-start)' : 'white'} />
	                                    <span style={{ fontSize: '0.6rem', fontWeight: 800, letterSpacing: '1px' }}>ВЛАСНИЙ БЮДЖЕТ</span>
	                                </div>
	                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
	                                    <span style={{ fontWeight: 900, color: formData.customBudget ? 'var(--accent-start)' : 'rgba(255,255,255,0.1)', fontSize: '1.8rem' }}>$</span>
	                                    <input type="number" placeholder="0" value={formData.customBudget} onChange={e => setFormData({ ...formData, customBudget: e.target.value, budget: '' })} style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '2rem', fontWeight: 900, outline: 'none', width: '180px', textAlign: 'left', letterSpacing: '-1px' }} />
	                                </div>
	                            </div>
                        </motion.div>
                    )}
                    {!isSuccess && step === 3 && (
                        <motion.div key="s3" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: 950, marginBottom: '8px', letterSpacing: '-0.03em' }}>Деталі</h3>
	                            <div style={{ background: 'rgba(var(--accent-rgb), 0.04)', borderLeft: '3px solid var(--accent-start)', padding: '12px', borderRadius: '0 10px 10px 0', marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'center' }}>
	                                <Info size={16} color="var(--accent-start)" style={{ flexShrink: 0 }} />
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
	                                whileHover={{ scale: 1.02, boxShadow: '0 0 30px rgba(var(--accent-rgb), 0.35)' }}
	                                onClick={handleSubmit}
	                                disabled={!isStepComplete()}
	                                style={{ background: 'var(--accent-start)', color: 'black', padding: '14px 32px', borderRadius: '40px', fontWeight: 950, fontSize: '0.75rem', letterSpacing: '1px', transition: '0.2s', border: 'none', cursor: isStepComplete() ? 'pointer' : 'not-allowed' }}
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
