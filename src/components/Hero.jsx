import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

const Hero = () => {
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <section style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center',
            paddingTop: isMobile ? '80px' : '100px',
            paddingLeft: '20px',
            paddingRight: '20px',
            position: 'relative'
        }}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    padding: '8px 20px',
                    borderRadius: '50px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    letterSpacing: '0.1em',
                    color: 'rgba(255, 255, 255, 0.6)',
                    marginBottom: isMobile ? '1.5rem' : '2.5rem',
                    textTransform: 'uppercase'
                }}
            >
                Premium Digital Experience
            </motion.div>

            <motion.h1
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                style={{
                    fontSize: isMobile ? '3rem' : 'clamp(4rem, 10vw, 8.5rem)',
                    fontWeight: 900,
                    lineHeight: 0.9,
                    letterSpacing: '-0.04em',
                    marginBottom: isMobile ? '2rem' : '3rem',
                    maxWidth: '1200px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center'
                }}
            >
                <span style={{ color: 'white' }}>Створюємо</span>
                <span style={{
                    background: 'linear-gradient(135deg, #FF4D00 0%, #FF9500 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                }}>
                    цифрове
                </span>
                <span style={{ color: 'white' }}>майбутнє.</span>
            </motion.h1>

            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.8 }}
                style={{
                    color: 'rgba(255, 255, 255, 0.6)',
                    fontSize: isMobile ? '1rem' : '1.2rem',
                    maxWidth: '600px',
                    lineHeight: 1.6,
                    marginBottom: isMobile ? '2.5rem' : '3.5rem'
                }}
            >
                Ми трансформуємо сміливі ідеї у виняткові цифрові продукти. Від стратегії до запуску.
            </motion.p>

            <motion.a
                href="#configurator"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6, duration: 0.5 }}
                whileHover={{ scale: 1.05, boxShadow: "0 0 40px rgba(255, 77, 0, 0.4)" }}
                whileTap={{ scale: 0.95 }}
                style={{
                    background: 'linear-gradient(90deg, #FF4D00 0%, #FF9500 100%)',
                    color: 'black',
                    padding: isMobile ? '16px 32px' : '20px 40px',
                    fontSize: isMobile ? '1rem' : '1.2rem',
                    fontWeight: 800,
                    borderRadius: '50px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    textDecoration: 'none',
                    marginTop: '20px',
                    width: isMobile ? '100%' : 'auto',
                    justifyContent: 'center'
                }}
            >
                Запустити проект
                <ArrowRight size={isMobile ? 18 : 22} color="black" strokeWidth={3} />
            </motion.a>
        </section>
    );
};

export default Hero;
