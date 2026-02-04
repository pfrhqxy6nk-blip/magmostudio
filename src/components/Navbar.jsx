import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';

const Navbar = () => {
    const location = useLocation();
    const isHomePage = location.pathname === '/';
    const isProfile = location.pathname === '/profile';

    const scrollToSection = (e, id) => {
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
                padding: '16px 40px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                zIndex: 1000,
                background: 'rgba(0, 0, 0, 0.4)',
                backdropFilter: 'blur(12px)',
                borderBottom: '1px solid var(--border-glass)'
            }}
        >
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <div style={{
                    width: '28px',
                    height: '28px',
                    background: 'linear-gradient(135deg, #FF4D00 0%, #FF9500 100%)',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <span style={{ color: 'black', fontWeight: 900, fontSize: '1rem' }}>M</span>
                </div>
                <span style={{ fontSize: '1.2rem', fontWeight: 900, color: 'white', letterSpacing: '1px' }}>
                    magmostudio<span style={{ color: '#FF4D00' }}>.</span>
                </span>
            </Link>

            {!isProfile && (
                <div style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
                    <a
                        href="#services"
                        onClick={(e) => scrollToSection(e, 'services')}
                        style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 600, fontSize: '0.8rem', letterSpacing: '1px', transition: '0.3s' }}
                    >
                        ПОСЛУГИ
                    </a>
                    <a
                        href="#cases"
                        onClick={(e) => scrollToSection(e, 'cases')}
                        style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 600, fontSize: '0.8rem', letterSpacing: '1px', transition: '0.3s' }}
                    >
                        КЕЙСИ
                    </a>
                    <a
                        href="#configurator"
                        onClick={(e) => scrollToSection(e, 'configurator')}
                        style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 600, fontSize: '0.8rem', letterSpacing: '1px', transition: '0.3s' }}
                    >
                        КОНФІГУРАТОР
                    </a>
                </div>
            )}

            {!isProfile && (
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
        </motion.nav>
    );
};

export default Navbar;
