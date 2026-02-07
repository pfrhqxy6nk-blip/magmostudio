import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

const Navbar = () => {
    const location = useLocation();
    const isHomePage = location.pathname === '/';
    const isProfile = location.pathname === '/profile';
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(() =>
        typeof window !== 'undefined' ? window.innerWidth < 768 : false
    );

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
            if (window.innerWidth >= 768) setIsMobileMenuOpen(false);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const scrollToSection = (e, id) => {
        setIsMobileMenuOpen(false); // Close menu on click
        if (isHomePage) {
            e.preventDefault();
            const element = document.getElementById(id);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
            }
        }
    };

    return (
        <motion.nav
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.5 }}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                padding: isMobile ? '16px 20px' : '16px 40px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                zIndex: 1000,
                background: 'rgba(15, 15, 18, 0.72)',
                backdropFilter: 'blur(14px)',
                WebkitBackdropFilter: 'blur(14px)',
                borderBottom: '1px solid var(--border-glass)',
                boxShadow: '0 1px 0 rgba(255,255,255,0.06)'
            }}
        >
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', zIndex: 1001 }}>
                <div style={{
                    width: '28px',
                    height: '28px',
                    background: 'linear-gradient(135deg, var(--accent-start) 0%, var(--accent-mid) 55%, var(--accent-end) 100%)',
                    borderRadius: '9px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 10px 24px rgba(var(--accent-rgb), 0.22)',
                    border: '1px solid rgba(255,255,255,0.12)'
                }}>
                    <span style={{ color: 'black', fontWeight: 900, fontSize: '1rem' }}>M</span>
                </div>
                <span style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--text-main)', letterSpacing: '0.5px' }}>
                    magmostudio<span style={{ color: 'var(--accent-start)' }}>.</span>
                </span>
            </Link>

            {/* Desktop Menu */}
            {!isMobile && !isProfile && (
                <div style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
                    {['ПОСЛУГИ', 'КЕЙСИ', 'КОНФІГУРАТОР'].map((item, index) => {
                        const sectionId = item === 'ПОСЛУГИ' ? 'services' : item === 'КЕЙСИ' ? 'cases' : 'configurator';
                        return (
                            <a
                                key={index}
                                href={`#${sectionId}`}
                                onClick={(e) => scrollToSection(e, sectionId)}
                                style={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.8rem', letterSpacing: '0.08em', transition: '0.3s' }}
                            >
                                {item}
                            </a>
                        );
                    })}
                </div>
            )}

            {/* Profile Button (Desktop) */}
            {!isMobile && !isProfile && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Link to="/profile">
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            style={{
                                background: 'linear-gradient(90deg, var(--accent-start) 0%, var(--accent-mid) 55%, var(--accent-end) 100%)',
                                color: 'black',
                                padding: '10px 24px',
                                borderRadius: '50px',
                                fontWeight: 800,
                                fontSize: '0.8rem',
                                cursor: 'pointer',
                                boxShadow: '0 18px 50px rgba(var(--accent-rgb), 0.18), 0 16px 50px rgba(0,0,0,0.35)'
                            }}
                        >
                            Профіль
                        </motion.button>
                    </Link>
                </div>
            )}

            {/* Mobile Actions */}
            {isMobile && !isProfile && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', zIndex: 1001 }}>
                    <div
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        style={{ cursor: 'pointer', color: 'var(--text-main)', display: 'flex', alignItems: 'center' }}
                    >
                        {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
                    </div>
                </div>
            )}

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100vw',
                            height: '100vh',
                            background: 'rgba(11, 11, 16, 0.96)',
                            backdropFilter: 'blur(18px)',
                            WebkitBackdropFilter: 'blur(18px)',
                            padding: '100px 20px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '40px',
                            zIndex: 1000
                        }}
                    >
                        {['ПОСЛУГИ', 'КЕЙСИ', 'КОНФІГУРАТОР'].map((item, index) => {
                            const sectionId = item === 'ПОСЛУГИ' ? 'services' : item === 'КЕЙСИ' ? 'cases' : 'configurator';
                            return (
                                <a
                                    key={index}
                                    href={`#${sectionId}`}
                                    onClick={(e) => scrollToSection(e, sectionId)}
                                    style={{ color: 'var(--text-main)', fontWeight: 800, fontSize: '1.5rem', letterSpacing: '2px' }}
                                >
                                    {item}
                                </a>
                            );
                        })}
                        <Link to="/profile" onClick={() => setIsMobileMenuOpen(false)}>
                            <div
                                style={{
                                    backgroundColor: 'var(--text-main)',
                                    color: 'var(--text-invert)',
                                    padding: '15px 40px',
                                    borderRadius: '50px',
                                    fontWeight: 900,
                                    fontSize: '1rem',
                                    marginTop: '20px',
                                    boxShadow: '0 22px 70px rgba(0,0,0,0.45)'
                                }}
                            >
                                Профіль
                            </div>
                        </Link>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.nav>
    );
};

export default Navbar;
