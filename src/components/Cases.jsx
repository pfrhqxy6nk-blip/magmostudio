import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const Cases = () => {
    const [portfolio, setPortfolio] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPortfolio = async () => {
            const { data, error } = await supabase
                .from('portfolio')
                .select('*')
                .order('created_at', { ascending: false });

            if (data) setPortfolio(data);
            setLoading(false);
        };

        fetchPortfolio();
    }, []);

    if (loading) return null;

    return (
        <section id="cases" style={{ padding: '100px 40px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '60px' }}>
                <div>
                    <h2 style={{ fontSize: '3.5rem', fontWeight: 900 }}>Вибрані кейси</h2>
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '1.2rem', marginTop: '10px' }}>Проекти, якими ми пишаємося</p>
                </div>
                <button style={{ color: '#FF4D00', fontWeight: 700, fontSize: '1.1rem', background: 'transparent', borderBottom: '2px solid #FF4D00', paddingBottom: '5px' }}>
                    Всі проекти
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '30px' }}>
                {portfolio.map((project, index) => (
                    <motion.div
                        key={project.id || index}
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.2 }}
                        style={{
                            position: 'relative',
                            borderRadius: '32px',
                            overflow: 'hidden',
                            height: '600px',
                            cursor: 'pointer'
                        }}
                    >
                        <motion.img
                            src={project.image}
                            alt={project.title}
                            whileHover={{ scale: 1.05 }}
                            transition={{ duration: 0.6 }}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                        <div style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            background: 'linear-gradient(to bottom, rgba(0,0,0,0) 40%, rgba(0,0,0,0.9) 100%)',
                            padding: '50px',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'flex-end'
                        }}>
                            <span style={{ color: '#FF4D00', fontWeight: 800, fontSize: '0.9rem', marginBottom: '10px', letterSpacing: '2px' }}>{project.category}</span>
                            <h3 style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '10px' }}>{project.title}</h3>
                            <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '20px', maxWidth: '400px' }}>{project.description}</p>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                {project.tags?.map(tag => (
                                    <span key={tag} style={{ background: 'rgba(255,255,255,0.08)', padding: '8px 20px', borderRadius: '50px', fontSize: '0.8rem', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)' }}>{tag}</span>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </section>
    );
};

export default Cases;
