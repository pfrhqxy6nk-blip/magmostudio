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
            background: '#000'
        }}>
            {/* Light Leaks */}
            <motion.div
                animate={{
                    opacity: [0.4, 0.6, 0.4],
                    scale: [1, 1.1, 1],
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
                    background: 'radial-gradient(circle, rgba(255,77,0,0.15) 0%, rgba(0,0,0,0) 70%)',
                    filter: 'blur(60px)',
                }}
            />

            <motion.div
                animate={{
                    opacity: [0.3, 0.5, 0.3],
                    x: [0, 50, 0],
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
                    background: 'radial-gradient(circle, rgba(255,149,0,0.1) 0%, rgba(0,0,0,0) 70%)',
                    filter: 'blur(80px)',
                }}
            />
        </div>
    );
};

export default BackgroundEffects;
