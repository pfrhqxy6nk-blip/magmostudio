import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../auth/AuthContext';
import { Mail, Lock, User, Phone, ArrowRight, ChevronRight, ChevronLeft, Send, Info, Check, Wallet } from 'lucide-react';

const AuthPage = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [authStep, setAuthStep] = useState(1); // 1: Auth fields, 2+: Configurator steps
    const [formData, setFormData] = useState({ name: '', email: '', password: '', phone: '' });
    const [emailCode, setEmailCode] = useState('');
    const [isAwaitingCode, setIsAwaitingCode] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const { login, register, verifyEmailCode } = useAuth();

    const handleAuthSubmit = async (e) => {
        if (e) e.preventDefault();
        setError('');
        setSuccess('');

        if (isLogin) {
            const user = await login(formData.email, formData.password);
            if (!user) {
                setError('Користувача не знайдено або помилка входу.');
            }
        } else {
            try {
                if (!isAwaitingCode) {
                    await register({ email: formData.email });
                    setIsAwaitingCode(true);
                    setSuccess('Ми надiслали код на email. Введи код нижче, щоб створити акаунт.');
                    return;
                }

                await verifyEmailCode({
                    email: formData.email,
                    code: emailCode,
                    password: formData.password,
                    name: formData.name,
                    phone: formData.phone,
                    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + formData.name
                });

                setSuccess('Email підтверджено. Акаунт створено — можеш користуватися.');
                setIsAwaitingCode(false);
                setEmailCode('');
            } catch (err) {
                console.error("Registration flow error:", err);
                if (err.code === '23505') {
                    setError("Цей email вже зареєстрований. Спробуйте увійти.");
                } else {
                    setError(`Помилка: ${err.message || 'Не вдалося створити акаунт'}`);
                }
            }
        }
    };

    return (
        <section style={{ minHeight: '90vh', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '100px 20px' }}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ width: '100%', maxWidth: '480px', background: 'var(--glass-bg)', borderRadius: '40px', border: '1px solid var(--border-glass)', padding: '60px 40px', backdropFilter: 'blur(20px)', transition: '0.4s ease', boxShadow: 'var(--shadow-soft)' }}>

                {error && (
                    <div style={{ padding: '15px', marginBottom: '20px', borderRadius: '12px', background: 'rgba(255, 50, 50, 0.1)', border: '1px solid rgba(255, 50, 50, 0.2)', color: '#FF3333', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Info size={18} />
                        <p style={{ fontSize: '0.9rem', margin: 0 }}>{error}</p>
                    </div>
                )}

                {success && (
                    <div style={{ padding: '15px', marginBottom: '20px', borderRadius: '12px', background: 'rgba(76, 175, 80, 0.12)', border: '1px solid rgba(76, 175, 80, 0.22)', color: 'rgba(255,255,255,0.92)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Check size={18} />
                        <p style={{ fontSize: '0.9rem', margin: 0, lineHeight: 1.4 }}>{success}</p>
                    </div>
                )}

                <AnimatePresence mode="wait">
                    <motion.div key="auth" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                            <h2 style={{ fontSize: '2.5rem', fontWeight: 950, marginBottom: '10px', letterSpacing: '-0.03em' }}>{isLogin ? 'З поверненням' : 'Створити акаунт'}</h2>
                            <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>{isLogin ? 'Увійдіть у свій цифровий кабінет' : 'Приєднуйтесь до майбутнього розробки'}</p>
                        </div>

                        <form onSubmit={handleAuthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            {!isLogin && (
                                <>
                                    <div style={{ position: 'relative' }}>
                                        <User size={18} style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)' }} />
                                        <input type="text" placeholder="Ваше ім'я" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} style={{ width: '100%', background: 'var(--surface-1)', border: '1px solid var(--border-1)', borderRadius: '16px', padding: '16px 20px 16px 50px', color: 'var(--text-main)', fontSize: '1rem' }} />
                                    </div>
                                    <div style={{ position: 'relative' }}>
                                        <Phone size={18} style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)' }} />
                                        <input type="tel" placeholder="Номер телефону" required value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} style={{ width: '100%', background: 'var(--surface-1)', border: '1px solid var(--border-1)', borderRadius: '16px', padding: '16px 20px 16px 50px', color: 'var(--text-main)', fontSize: '1rem' }} />
                                    </div>
                                </>
                            )}
                            <div style={{ position: 'relative' }}>
                                <Mail size={18} style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)' }} />
                                <input
                                    type="email"
                                    placeholder="Email"
                                    required
                                    value={formData.email}
                                    onChange={(e) => {
                                        setFormData({ ...formData, email: e.target.value });
                                        if (!isLogin) {
                                            setIsAwaitingCode(false);
                                            setEmailCode('');
                                        }
                                    }}
                                    style={{ width: '100%', background: 'var(--surface-1)', border: '1px solid var(--border-1)', borderRadius: '16px', padding: '16px 20px 16px 50px', color: 'var(--text-main)', fontSize: '1rem' }}
                                />
                            </div>
                            <div style={{ position: 'relative' }}>
                                <Lock size={18} style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)' }} />
                                <input type="password" placeholder="Пароль" required value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} style={{ width: '100%', background: 'var(--surface-1)', border: '1px solid var(--border-1)', borderRadius: '16px', padding: '16px 20px 16px 50px', color: 'var(--text-main)', fontSize: '1rem' }} />
                            </div>
                            {!isLogin && isAwaitingCode ? (
                                <div style={{ position: 'relative' }}>
                                    <Send size={18} style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)' }} />
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        autoComplete="one-time-code"
                                        placeholder="Код з email"
                                        required
                                        value={emailCode}
                                        onChange={(e) => setEmailCode(e.target.value)}
                                        style={{ width: '100%', background: 'var(--surface-1)', border: '1px solid var(--border-1)', borderRadius: '16px', padding: '16px 20px 16px 50px', color: 'var(--text-main)', fontSize: '1rem', letterSpacing: '0.12em' }}
                                    />
                                    <button
                                        type="button"
                                        onClick={async () => {
                                            setError('');
                                            setSuccess('');
                                            try {
                                                await register({ email: formData.email });
                                                setSuccess('Код надiслано ще раз.');
                                            } catch (err) {
                                                setError(err?.message || 'Не вдалося надiслати код');
                                            }
                                        }}
                                        style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'var(--text-main)', padding: '10px 12px', borderRadius: 12, fontWeight: 900, cursor: 'pointer', fontSize: '0.75rem' }}
                                    >
                                        Надiслати ще раз
                                    </button>
                                </div>
                            ) : null}
                            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" style={{ background: 'linear-gradient(90deg, var(--accent-start) 0%, var(--accent-mid) 55%, var(--accent-end) 100%)', color: 'var(--text-invert)', padding: '18px', borderRadius: '16px', fontWeight: 800, fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginTop: '10px', boxShadow: 'var(--shadow-accent)' }}>
                                {isLogin ? 'Увійдіть' : (isAwaitingCode ? 'Пiдтвердити код' : 'Отримати код')}
                                <ArrowRight size={20} />
                            </motion.button>
                        </form>
                        <div style={{ marginTop: '30px', textAlign: 'center' }}>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{isLogin ? 'Ще немає акаунту?' : 'Вже маєте акаунт?'}
                                <button onClick={() => { setIsLogin(!isLogin); setIsAwaitingCode(false); setEmailCode(''); setError(''); setSuccess(''); }} style={{ color: 'var(--accent-start)', fontWeight: 700, marginLeft: '8px', background: 'transparent' }}>{isLogin ? 'Зареєструватися' : 'Увійти'}</button>
                            </p>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </motion.div>
        </section>
    );
};

export default AuthPage;
