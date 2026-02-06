import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

const Navbar = () => {
    const location = useLocation();
    const isHomePage = location.pathname === '/';
    const isProfile = location.pathname === '/profile';
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

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
                background: 'rgba(0, 0, 0, 0.8)',
                backdropFilter: 'blur(12px)',
                borderBottom: '1px solid var(--border-glass)'
            }}
        >
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', zIndex: 1001 }}>
                <div style={{
                    width: '28px',
                    height: '28px',
                    background: 'linear-gradient(135deg, #7000FF 0%, #BD00FF 100%)',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <span style={{ color: 'black', fontWeight: 900, fontSize: '1rem' }}>M</span>
                </div>
                <span style={{ fontSize: '1.2rem', fontWeight: 900, color: 'white', letterSpacing: '1px' }}>
                    magmostudio<span style={{ color: '#7000FF' }}>.</span>
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
                                style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 600, fontSize: '0.8rem', letterSpacing: '1px', transition: '0.3s' }}
                            >
                                {item}
                            </a>
                        );
                    })}
                </div>
            )}

            {/* Profile Button (Desktop) */}
            {!isMobile && !isProfile && (
                <Link to="/profile">
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        style={{
                            backgroundColor: 'white',
                            color: 'black',
                            padding: '10px 24px',
                            borderRadius: '50px',
                            fontWeight: 800,
                            fontSize: '0.8rem',
                            cursor: 'pointer'
                        }}
                    >
                        Профіль
                    </motion.button>
                </Link>
            )}

            {/* Mobile Hamburger */}
            {isMobile && !isProfile && (
                <div
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    style={{ cursor: 'pointer', zIndex: 1001, color: 'white' }}
                >
                    {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
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
                            background: '#000',
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
                                    style={{ color: 'white', fontWeight: 800, fontSize: '1.5rem', letterSpacing: '2px' }}
                                >
                                    {item}
                                </a>
                            );
                        })}
                        <Link to="/profile" onClick={() => setIsMobileMenuOpen(false)}>
                            <div
                                style={{
                                    backgroundColor: 'white',
                                    color: 'black',
                                    padding: '15px 40px',
                                    borderRadius: '50px',
                                    fontWeight: 900,
                                    fontSize: '1rem',
                                    marginTop: '20px'
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
