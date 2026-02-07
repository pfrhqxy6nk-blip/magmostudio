import { motion } from 'framer-motion';

const BackgroundEffects = () => {
    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100vh',
            zIndex: 0,
            pointerEvents: 'none',
            background: 'var(--bg)'
        }}>
            {/* Subtle Apple-like blooms (single-hue) */}
            <motion.div
                animate={{
                    opacity: [0.35, 0.55, 0.35],
                    scale: [1, 1.08, 1],
                }}
                transition={{
                    duration: 8,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
                style={{
                    position: 'absolute',
                    top: '-20%',
                    left: '10%',
                    width: '600px',
                    height: '600px',
                    background: 'radial-gradient(circle, rgba(var(--accent-rgb), 0.16) 0%, rgba(0,0,0,0) 70%)',
                    filter: 'blur(70px)',
                }}
            />

            <motion.div
                animate={{
                    opacity: [0.25, 0.45, 0.25],
                    x: [0, 36, 0],
                }}
                transition={{
                    duration: 12,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
                style={{
                    position: 'absolute',
                    bottom: '-10%',
                    right: '5%',
                    width: '800px',
                    height: '800px',
                    background: 'radial-gradient(circle, rgba(var(--accent-rgb), 0.10) 0%, rgba(0,0,0,0) 70%)',
                    filter: 'blur(90px)',
                }}
            />

            <motion.div
                animate={{
                    opacity: [0.10, 0.18, 0.10],
                    y: [0, 22, 0],
                }}
                transition={{
                    duration: 14,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
                style={{
                    position: 'absolute',
                    top: '15%',
                    right: '-15%',
                    width: '720px',
                    height: '720px',
                    background: 'radial-gradient(circle, rgba(255,255,255,0.10) 0%, rgba(0,0,0,0) 65%)',
                    filter: 'blur(110px)',
                }}
            />
        </div>
    );
};

export default BackgroundEffects;
