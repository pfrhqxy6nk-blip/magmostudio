import { motion } from 'framer-motion';
import iphoneMockup from '/iphone_mockup.png';

const Card = ({ children, className, style }) => (
    <motion.div
        whileHover={{ y: -5 }}
        style={{
            background: 'rgba(255, 255, 255, 0.03)',
            backdropFilter: 'blur(30px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '24px',
            overflow: 'hidden',
            position: 'relative',
            ...style
        }}
        className={className}
    >
        {children}
    </motion.div>
);

const BentoGrid = () => {
    return (
        <section id="cases" style={{
            maxWidth: '1200px',
            margin: '0 auto',
            paddingBottom: '100px',
            paddingTop: '100px',
            display: 'grid',
            gridTemplateColumns: 'repeat(12, 1fr)',
            gridAutoRows: 'minmax(200px, auto)',
            gap: '20px'
        }}>
            {/* Example Item 1: Large Mockup */}
            <Card style={{ gridColumn: 'span 8', gridRow: 'span 2', minHeight: '500px', display: 'flex', alignItems: 'center' }}>
                <div style={{ padding: '60px', position: 'relative', zIndex: 10, maxWidth: '450px' }}>
                    <div style={{
                        background: 'linear-gradient(90deg, #FF4D00 0%, #FF9500 100%)',
                        padding: '6px 14px',
                        borderRadius: '20px',
                        display: 'inline-block',
                        marginBottom: '20px',
                        fontSize: '0.8rem',
                        fontWeight: '900',
                        color: 'black',
                        letterSpacing: '1px'
                    }}>
                        ФЛАГМАН
                    </div>
                    <h3 style={{ fontSize: '3.5rem', fontWeight: 950, marginBottom: '15px', lineHeight: 1, letterSpacing: '-0.02em' }}>xatko.com</h3>
                    <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '1.2rem', lineHeight: 1.5 }}>
                        Перша AI платформа для оренди нерухомості.<br />
                        <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.9rem', fontWeight: 700 }}>Created by Founder</span>
                    </p>
                </div>

                <div style={{
                    position: 'absolute',
                    right: '60px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    zIndex: 5
                }}>
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        whileHover={{ scale: 1.05 }}
                        transition={{ duration: 0.8 }}
                        style={{
                            width: '220px',
                            height: '460px',
                            background: '#000',
                            borderRadius: '35px',
                            border: '10px solid #222',
                            position: 'relative',
                            overflow: 'hidden',
                            boxShadow: '0 40px 100px rgba(0,0,0,0.8), 0 0 30px rgba(255, 77, 0, 0.2)'
                        }}
                    >
                        <div style={{ position: 'absolute', top: '15px', left: '50%', transform: 'translateX(-50%)', width: '50px', height: '18px', background: '#222', borderRadius: '10px', zIndex: 10, border: '1px solid rgba(255,255,255,0.05)' }} />
                        <video
                            autoPlay
                            muted
                            loop
                            playsInline
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        >
                            <source src="/promo.mp4" type="video/mp4" />
                            Your browser does not support the video tag.
                        </video>
                    </motion.div>
                </div>
            </Card>

            {/* Example Item 2: Stat or Feature */}
            <Card style={{ gridColumn: 'span 4', gridRow: 'span 1' }}>
                <div style={{ padding: '30px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <h4 style={{ fontSize: '2rem', fontWeight: 900, color: 'white', marginBottom: '5px' }}>Олександр</h4>
                    <p style={{ color: '#FF4D00', fontWeight: '600', marginBottom: '10px' }}>Засновник & Розробник</p>
                    <p style={{ color: '#888', fontSize: '0.9rem' }}>Створюю революційні цифрові продукти.</p>
                </div>
            </Card>

            {/* Example Item 3: Service */}
            <Card style={{ gridColumn: 'span 4', gridRow: 'span 1', overflow: 'visible' }}>
                <div style={{ padding: '30px', position: 'relative', zIndex: 10 }}>
                    <h3>Дизайн</h3>
                    <p style={{ color: '#888', marginTop: '10px' }}>UI/UX світового рівня</p>
                </div>
                <motion.img
                    src={iphoneMockup}
                    alt="iPhone 15 Pro"
                    style={{
                        position: 'absolute',
                        bottom: '-40px',
                        right: '-30px',
                        width: '160px',
                        transform: 'rotate(-15deg)',
                        opacity: 0.9,
                        zIndex: 5
                    }}
                    whileHover={{ bottom: '-20px', opacity: 1, rotate: -10 }}
                    transition={{ duration: 0.5 }}
                />
            </Card>

            {/* Add more cards as needed */}
        </section>
    );
};

export default BentoGrid;
