import { motion } from 'framer-motion';

const LavaEffect = ({ style, intensity = 'medium' }) => {
    const intensities = {
        low: {
            colors: 'rgba(255, 77, 0, 0.15), rgba(255, 149, 0, 0.1), rgba(255, 30, 0, 0.05)',
            blur: '60px',
            scale: 1.2
        },
        medium: {
            colors: 'rgba(255, 77, 0, 0.25), rgba(255, 149, 0, 0.2), rgba(255, 30, 0, 0.15)',
            blur: '80px',
            scale: 1.5
        },
        high: {
            colors: 'rgba(255, 77, 0, 0.4), rgba(255, 149, 0, 0.3), rgba(255, 30, 0, 0.25)',
            blur: '100px',
            scale: 2
        }
    };

    const settings = intensities[intensity];

    return (
        <div style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            overflow: 'hidden',
            pointerEvents: 'none',
            ...style
        }}>
            <motion.div
                animate={{
                    background: [
                        `radial-gradient(circle at 20% 50%, ${settings.colors})`,
                        `radial-gradient(circle at 80% 50%, ${settings.colors})`,
                        `radial-gradient(circle at 50% 80%, ${settings.colors})`,
                        `radial-gradient(circle at 20% 50%, ${settings.colors})`
                    ],
                    scale: [1, settings.scale, 1, settings.scale, 1],
                    rotate: [0, 90, 180, 270, 360]
                }}
                transition={{
                    duration: 15,
                    repeat: Infinity,
                    ease: "linear"
                }}
                style={{
                    position: 'absolute',
                    top: '-50%',
                    left: '-50%',
                    width: '200%',
                    height: '200%',
                    filter: `blur(${settings.blur})`,
                    opacity: 0.8
                }}
            />
            <motion.div
                animate={{
                    background: [
                        `radial-gradient(circle at 70% 30%, ${settings.colors})`,
                        `radial-gradient(circle at 30% 70%, ${settings.colors})`,
                        `radial-gradient(circle at 60% 60%, ${settings.colors})`,
                        `radial-gradient(circle at 70% 30%, ${settings.colors})`
                    ],
                    scale: [settings.scale, 1, settings.scale, 1, settings.scale],
                    rotate: [360, 270, 180, 90, 0]
                }}
                transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: "linear"
                }}
                style={{
                    position: 'absolute',
                    top: '-50%',
                    left: '-50%',
                    width: '200%',
                    height: '200%',
                    filter: `blur(${settings.blur})`,
                    opacity: 0.6
                }}
            />
        </div>
    );
};

export default LavaEffect;
