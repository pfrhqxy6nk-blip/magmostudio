import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Check, Send, Info, DollarSign, Wallet } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';

const BUDGET_PLANS = [
    {
        id: 'start',
        product: 'Start',
        price: '$300',
        forWhom: 'Малий бізнес / старт',
        inside: '1 сторінка, адаптив, форма, базовий SEO',
        title: '$300',
        desc: '1 сторінка + базовий SEO',
    },
    {
        id: 'business',
        product: 'Business',
        price: '$600',
        forWhom: 'Основний сегмент',
        inside: 'До 5 сторінок, інтеграції, UX, готовність до реклами',
        title: '$600',
        desc: 'До 5 сторінок + інтеграції',
    },
    {
        id: 'pro',
        product: 'Pro',
        price: '$900',
        forWhom: 'Складніші кейси',
        inside: 'До 10 сторінок, логіка, пріоритет',
        title: '$900',
        desc: 'До 10 сторінок + пріоритет',
    },
];

const steps = [
    {
        id: 1,
        title: "Категорія",
        subtitle: "Який основний напрямок ми розглядаємо?",
        description: "Оберіть тип продукту, який ви хочете створити. Це допоможе нам призначити релевантну команду експертів саме у вашій ніші.",
        options: [
            { id: 'landing', title: 'Landing Page', desc: 'Односторінковий сайт для швидкого запуску та збору заявок.' },
            { id: 'webapp', title: 'SaaS / Web App', desc: 'Складний сервіс з кабінетами, базами даних та логікою.' },
            { id: 'ecommerce', title: 'E-commerce', desc: 'Інтернет-магазин з оплатою, кошиком та каталогом.' },
            { id: 'ai', title: 'AI Automation', desc: 'Рішення зі штучним інтелектом для автоматизації бізнес-процесів.' },
        ]
    },
    {
        id: 2,
        title: "Інвестиції",
        subtitle: "Оберіть бюджетний діапазон або вкажіть свій",
        description: "Важливо вказати реалістичний бюджет. Це впливає на складність дизайну, кількість ітерацій та швидкість виходу продукту на ринок.",
        isBudget: true,
        options: BUDGET_PLANS,
    },
    {
        id: 3,
        title: "Деталі проекту",
        subtitle: "Опишіть вашу ідею та функціонал",
        description: "Не обов'язково писати професійне ТЗ. Просто розкажіть, яку проблему вирішує ваш продукт і які функції є критично важливими для запуску.",
        isDetails: true
    },
    {
        id: 4,
        title: "Контакти",
        subtitle: "Як нам з вами зв'язатися?",
        description: "Ми проаналізуємо ваші дані та підготуємо персональну пропозицію протягом 24 годин.",
        isContact: true
    }
];

const Configurator = () => {
    const { addProject } = useAuth();
    const [currentStep, setCurrentStep] = useState(0);
    const [selections, setSelections] = useState({});
    const [contact, setContact] = useState({ name: '', email: '', telegram: '' });
    const [details, setDetails] = useState('');
    const [projectTitle, setProjectTitle] = useState('');
    const [customBudget, setCustomBudget] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleSelect = (optionId) => {
        setSelections({ ...selections, [currentStep]: optionId });
        if (steps[currentStep].isBudget) setCustomBudget('');
    };

    const nextStep = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            const finalBudget = customBudget ? `$${customBudget}` :
                steps[1].options.find(o => o.id === selections[1])?.title || 'N/A';

            const projectData = {
                title: projectTitle || `${steps[0].options.find(o => o.id === selections[0])?.title || 'New Project'} Request`,
                category: steps[0].options.find(o => o.id === selections[0])?.title || 'Web Project',
                budget: finalBudget,
                details: details,
                owner_email: contact.email,
                owner_name: contact.name,
                telegram: contact.telegram,
                status: 'PENDING',
                created_at: new Date().toISOString()
            };
            addProject(projectData);
            setIsSubmitted(true);
        }
    };

    const prevStep = () => {
        if (currentStep > 0) setCurrentStep(prev => prev - 1);
    };

    const isStepComplete = () => {
        const step = steps[currentStep];
        if (currentStep === 0) return selections[0] !== undefined && projectTitle.trim().length > 3;
        if (step.id === 4) {
            return contact.name.length > 2 && contact.email.includes('@');
        }
        if (step.isDetails) return details.length > 10;
        if (step.isBudget) return (selections[currentStep] !== undefined && selections[currentStep] !== null) || customBudget.length >= 3;
        return selections[currentStep] !== undefined;
    };

    if (isSubmitted) {
        return (
            <section id="configurator" style={{ padding: '120px 20px', minHeight: '60vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: 'center', maxWidth: '500px' }}>
                    <div style={{ width: '60px', height: '60px', background: 'var(--accent-start)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                        <Check size={32} color="black" strokeWidth={3} />
                    </div>
                    <h2 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '16px' }}>Заявку прийнято!</h2>
                    <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '32px' }}>
                        Ми вже почали аналізувати ваш проект. Очікуйте повідомлення у вказаному вікні найближчим часом.
                    </p>
                    <button onClick={() => { setIsSubmitted(false); setCurrentStep(0); setSelections({}); setContact({ name: '', email: '', telegram: '' }); setDetails(''); setCustomBudget(''); }} style={{ color: 'var(--text-main)', background: 'var(--surface-1)', padding: '12px 24px', borderRadius: '50px', fontWeight: 600, border: '1px solid var(--border-1)' }}>Створити ще один</button>
                </motion.div>
            </section>
        );
    }

    const step = steps[currentStep];

    return (
        <section id="configurator" style={{ padding: isMobile ? '80px 20px' : '120px 20px', minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ maxWidth: '900px', width: '100%', position: 'relative' }}>

                {/* Progress Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        {steps.map((_, i) => (
                            <div key={i} style={{ width: isMobile ? '20px' : '40px', height: '4px', borderRadius: '2px', background: i <= currentStep ? 'var(--accent-start)' : 'var(--surface-2)', transition: '0.4s' }} />
                        ))}
                    </div>
                    <span style={{ fontSize: '0.8rem', fontWeight: 900, opacity: 0.4, letterSpacing: '1px' }}>КРОК {currentStep + 1} / {steps.length}</span>
                </div>

                <AnimatePresence mode="wait">
                    <motion.div key={currentStep} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
                        <h2 style={{ fontSize: isMobile ? '2rem' : '3.5rem', fontWeight: 950, marginBottom: '8px', letterSpacing: '-0.04em' }}>{step.title}</h2>
                        <p style={{ color: 'var(--accent-start)', fontSize: isMobile ? '1rem' : '1.2rem', fontWeight: 700, marginBottom: '32px' }}>{step.subtitle}</p>

                        {/* Description Box */}
                        <div style={{ background: 'rgba(var(--accent-rgb), 0.03)', borderLeft: '4px solid var(--accent-start)', padding: '24px', borderRadius: '0 20px 20px 0', marginBottom: '20px', display: 'flex', gap: '20px', backdropFilter: 'blur(10px)' }}>
                            <Info size={24} color="var(--accent-start)" style={{ flexShrink: 0, marginTop: '2px' }} />
                            <p style={{ color: 'var(--text-muted)', fontSize: '1rem', lineHeight: 1.6 }}>{step.description}</p>
                        </div>

                        {currentStep === 0 && (
                            <div style={{ marginBottom: '32px' }}>
                                <input
                                    type="text"
                                    placeholder="Введіть назву вашого проекту (напр. Xatko AI)"
                                    value={projectTitle}
                                    onChange={(e) => setProjectTitle(e.target.value)}
                                    style={{
                                        width: '100%',
                                        background: 'var(--surface-1)',
                                        border: '2px solid rgba(var(--accent-rgb), 0.2)',
                                        borderRadius: '20px',
                                        padding: '24px',
                                        color: 'var(--text-main)',
                                        fontSize: isMobile ? '1rem' : '1.2rem',
                                        fontWeight: 800,
                                        outline: 'none',
                                        transition: '0.3s',
                                        boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
                                    }}
                                />
                            </div>
                        )}

                        {step.isContact ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <input type="text" placeholder="Ваше ім'я" value={contact.name} onChange={(e) => setContact({ ...contact, name: e.target.value })} style={{ background: 'var(--surface-1)', border: '1px solid var(--border-1)', borderRadius: '20px', padding: '24px', color: 'var(--text-main)', fontSize: '1.1rem', width: '100%', outline: 'none' }} />
                                <div style={{ display: isMobile ? 'flex' : 'grid', flexDirection: 'column', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                    <input type="email" placeholder="Email" value={contact.email} onChange={(e) => setContact({ ...contact, email: e.target.value })} style={{ background: 'var(--surface-1)', border: '1px solid var(--border-1)', borderRadius: '20px', padding: '24px', color: 'var(--text-main)', fontSize: '1.1rem', outline: 'none' }} />
                                    <input type="text" placeholder="Telegram @username" value={contact.telegram} onChange={(e) => setContact({ ...contact, telegram: e.target.value })} style={{ background: 'var(--surface-1)', border: '1px solid var(--border-1)', borderRadius: '20px', padding: '24px', color: 'var(--text-main)', fontSize: '1.1rem', outline: 'none' }} />
                                </div>
                            </div>
                        ) : step.isDetails ? (
                            <textarea placeholder="Опишіть основні функції вашого майбутнього продукту..." value={details} onChange={(e) => setDetails(e.target.value)} style={{ width: '100%', height: '240px', background: 'var(--surface-1)', border: '1px solid var(--border-1)', borderRadius: '24px', padding: '24px', color: 'var(--text-main)', fontSize: '1.1rem', resize: 'none', lineHeight: 1.6, outline: 'none' }} />
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                {step.isBudget ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
                                        <div style={{
                                            background: 'linear-gradient(180deg, var(--surface-2) 0%, rgba(0,0,0,0) 100%)',
                                            borderRadius: '32px',
                                            border: '1px solid var(--border-1)',
                                            padding: isMobile ? '18px' : '22px',
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                                                <Info size={18} color="var(--accent-start)" />
                                                <div style={{ fontWeight: 950, letterSpacing: '0.04em', textTransform: 'uppercase', fontSize: '0.8rem' }}>
                                                    Пакети
                                                </div>
                                            </div>

                                            <div style={{
                                                display: 'grid',
                                                gridTemplateColumns: isMobile ? '1fr' : '1.2fr 0.8fr 1.2fr 2fr',
                                                gap: isMobile ? '10px' : '14px',
                                                alignItems: 'stretch',
                                            }}>
                                                {!isMobile && (
                                                    <>
                                                        <div style={{ color: 'var(--text-subtle)', fontWeight: 900, fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Продукт</div>
                                                        <div style={{ color: 'var(--text-subtle)', fontWeight: 900, fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Цiна</div>
                                                        <div style={{ color: 'var(--text-subtle)', fontWeight: 900, fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Для кого</div>
                                                        <div style={{ color: 'var(--text-subtle)', fontWeight: 900, fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Що всерединi</div>
                                                    </>
                                                )}

                                                {BUDGET_PLANS.map((plan) => {
                                                    const isSelected = selections[currentStep] === plan.id && !customBudget;
                                                    return (
                                                        <motion.button
                                                            key={plan.id}
                                                            type="button"
                                                            onClick={() => handleSelect(plan.id)}
                                                            whileHover={{ y: -2 }}
                                                            whileTap={{ scale: 0.99 }}
                                                            style={{
                                                                gridColumn: isMobile ? '1 / -1' : 'auto',
                                                                display: 'grid',
                                                                gridTemplateColumns: isMobile ? '1fr' : '1.2fr 0.8fr 1.2fr 2fr',
                                                                gap: isMobile ? '8px' : '14px',
                                                                padding: isMobile ? '16px' : '14px 16px',
                                                                borderRadius: '20px',
                                                                border: isSelected ? '1px solid rgba(var(--accent-rgb), 0.55)' : '1px solid var(--border-1)',
                                                                background: isSelected ? 'rgba(var(--accent-rgb), 0.10)' : 'rgba(255,255,255,0.02)',
                                                                color: 'var(--text-main)',
                                                                textAlign: 'left',
                                                            }}
                                                        >
                                                            <div style={{ fontWeight: 950, letterSpacing: '-0.02em', fontSize: '1.05rem' }}>
                                                                {plan.product}
                                                            </div>
                                                            <div style={{ fontWeight: 950, color: 'var(--accent-start)', fontSize: '1.05rem' }}>
                                                                {plan.price}
                                                            </div>
                                                            <div style={{ color: 'var(--text-muted)', fontWeight: 750 }}>
                                                                {plan.forWhom}
                                                            </div>
                                                            <div style={{ color: 'var(--text-muted)', fontWeight: 750, lineHeight: 1.4 }}>
                                                                {plan.inside}
                                                            </div>
                                                        </motion.button>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        <div style={{
                                            position: 'relative',
                                            marginTop: '2px',
                                            padding: isMobile ? '26px 18px' : '34px',
                                            background: 'linear-gradient(180deg, var(--surface-2) 0%, rgba(0,0,0,0) 100%)',
                                            borderRadius: '32px',
                                            border: `2px solid ${customBudget ? 'rgba(var(--accent-rgb), 0.45)' : 'var(--border-glass)'}`,
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            gap: '14px',
                                            overflow: 'hidden'
                                        }}>
                                            <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '60px', height: '4px', background: customBudget ? 'var(--accent-start)' : 'var(--surface-2)', borderRadius: '0 0 10px 10px' }} />

                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', opacity: customBudget ? 1 : 0.75 }}>
                                                <Wallet size={18} color={customBudget ? 'var(--accent-start)' : 'var(--text-main)'} />
                                                <h4 style={{ fontSize: '0.8rem', fontWeight: 900, color: 'var(--text-main)', letterSpacing: '2px', textTransform: 'uppercase' }}>Свiй бюджет</h4>
                                            </div>

                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                                                <span style={{ fontSize: isMobile ? '2.2rem' : '3.2rem', fontWeight: 950, color: customBudget ? 'var(--accent-start)' : 'var(--text-subtle)', marginRight: '10px' }}>$</span>
                                                <input
                                                    type="number"
                                                    placeholder="0.00"
                                                    value={customBudget}
                                                    onChange={(e) => {
                                                        setCustomBudget(e.target.value);
                                                        setSelections((prev) => (prev[currentStep] === undefined ? prev : { ...prev, [currentStep]: null }));
                                                    }}
                                                    style={{
                                                        background: 'transparent',
                                                        border: 'none',
                                                        color: 'var(--text-main)',
                                                        fontSize: isMobile ? '2.8rem' : '4.0rem',
                                                        fontWeight: 950,
                                                        width: isMobile ? '200px' : '280px',
                                                        textAlign: 'left',
                                                        outline: 'none',
                                                        letterSpacing: '-3px',
                                                        caretColor: 'var(--accent-start)'
                                                    }}
                                                />
                                            </div>
                                            <p style={{ fontSize: '0.9rem', color: 'var(--text-subtle)', fontWeight: 600, textAlign: 'center' }}>Введiть суму, на яку ви орiєнтуєтесь</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                                        {step.options?.map((option) => {
                                            const isSelected = selections[currentStep] === option.id;
                                            return (
                                                <motion.div key={option.id} onClick={() => handleSelect(option.id)} whileHover={{ y: -5, background: isSelected ? 'rgba(var(--accent-rgb), 0.15)' : 'var(--surface-2)' }} whileTap={{ scale: 0.98 }} style={{ padding: '40px 24px', borderRadius: '32px', background: isSelected ? 'rgba(var(--accent-rgb), 0.10)' : 'var(--surface-1)', border: `2px solid ${isSelected ? 'var(--accent-start)' : 'var(--border-1)'}`, cursor: 'pointer', textAlign: 'center', transition: '0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}>
                                                    <h4 style={{ fontSize: '1.75rem', fontWeight: 950, marginBottom: '0' }}>{option.title}</h4>
                                                    {option.desc && <p style={{ fontSize: '0.85rem', color: isSelected ? 'var(--text-main)' : 'var(--text-muted)', lineHeight: 1.5, marginTop: '10px' }}>{option.desc}</p>}
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '60px', alignItems: 'center' }}>
                    <button onClick={prevStep} disabled={currentStep === 0} style={{ background: 'transparent', color: currentStep === 0 ? 'transparent' : 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <ChevronLeft size={20} /> НАЗАД
                    </button>
                    <motion.button whileHover={isStepComplete() ? { scale: 1.02 } : {}} whileTap={isStepComplete() ? { scale: 0.98 } : {}} onClick={nextStep} disabled={!isStepComplete()} style={{ background: isStepComplete() ? 'var(--text-main)' : 'var(--surface-1)', color: isStepComplete() ? 'var(--text-invert)' : 'var(--text-subtle)', padding: isMobile ? '20px 32px' : '20px 48px', borderRadius: '50px', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.1rem', transition: '0.3s', border: '1px solid var(--border-1)' }}>
                        {currentStep === steps.length - 1 ? 'СТВОРИТИ ПРОЕКТ' : 'ДАЛІ'}
                        {currentStep === steps.length - 1 ? <Send size={20} /> : <ChevronRight size={20} />}
                    </motion.button>
                </div>
            </div>
        </section >
    );
};

export default Configurator;
