import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import LavaEffect from './LavaEffect';

const Hero = () => {
    return (
        <section style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center',
            paddingTop: '100px',
            position: 'relative',
            overflow: 'hidden'
        }}>
            <LavaEffect intensity="low" style={{ zIndex: 1 }} />
            <div style={{ position: 'relative', zIndex: 10 }}>
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
                        marginBottom: '2.5rem',
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
                        fontSize: 'clamp(4rem, 10vw, 8.5rem)',
                        fontWeight: 900,
                        lineHeight: 0.9,
                        letterSpacing: '-0.04em',
                        marginBottom: '3rem',
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
                        fontSize: '1.2rem',
                        maxWidth: '600px',
                        lineHeight: 1.6,
                        marginBottom: '3.5rem'
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
                        padding: '20px 40px',
                        fontSize: '1.2rem',
                        fontWeight: 800,
                        borderRadius: '50px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        textDecoration: 'none',
                        marginTop: '20px'
                    }}
                >
                    Запустити проект
                    <ArrowRight size={22} color="black" strokeWidth={3} />
                </motion.a>
            </div>
        </section>
    );
};

export default Hero;
