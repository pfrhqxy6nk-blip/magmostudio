import { motion } from 'framer-motion';
import { ArrowRight, Shield, RefreshCw, Lock, Database, PencilLine, Zap, Search, TrendingUp, Crown, Info } from 'lucide-react';
import { safeSetItem } from '../utils/storage.js';

const SUB_PRICES = {
  basic: import.meta.env.VITE_SUB_BASIC_PRICE || 'За запитом',
  business: import.meta.env.VITE_SUB_BUSINESS_PRICE || 'За запитом',
  pro: import.meta.env.VITE_SUB_PRO_PRICE || 'За запитом',
};

const PLANS = [
  {
    id: 'basic',
    name: 'Basic',
    eyebrow: 'Технiчна стабiльнiсть',
    price: SUB_PRICES.basic,
    highlights: [
      { icon: <Database size={18} />, label: 'Хостинг включено' },
      { icon: <RefreshCw size={18} />, label: 'Авто-оновлення' },
      { icon: <Lock size={18} />, label: 'Базовий захист' },
      { icon: <Shield size={18} />, label: 'Регулярнi бекапи' },
    ],
    limits: [
      { icon: <PencilLine size={18} />, label: 'Правки не входять' },
      { icon: <Zap size={18} />, label: 'Пiдтримка: тiльки стабiльнiсть' },
    ],
  },
  {
    id: 'business',
    name: 'Business',
    eyebrow: 'Для росту без хаосу',
    badge: 'Popular',
    price: SUB_PRICES.business,
    highlights: [
      { icon: <Shield size={18} />, label: 'Все з Basic' },
      { icon: <PencilLine size={18} />, label: 'Дрiбнi правки: до 1 год/мiс' },
      { icon: <ArrowRight size={18} />, label: 'Тексти, кнопки, контакти, блоки' },
      { icon: <Lock size={18} />, label: 'Структура не змiнюється' },
    ],
    limits: [
      { icon: <Zap size={18} />, label: 'Дизайн не входить' },
      { icon: <RefreshCw size={18} />, label: 'Стандартна черга' },
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    eyebrow: 'Премiум супровiд',
    price: SUB_PRICES.pro,
    highlights: [
      { icon: <Crown size={18} />, label: 'Все з Business' },
      { icon: <Search size={18} />, label: 'Базовi SEO-покращення' },
      { icon: <TrendingUp size={18} />, label: 'Рекомендацiї по конверсiї' },
      { icon: <Zap size={18} />, label: 'Прiоритетна черга' },
    ],
    limits: [
      { icon: <Shield size={18} />, label: 'Аудит: 1 раз/мiс' },
      { icon: <PencilLine size={18} />, label: 'Масштабнi змiни окремо' },
    ],
  },
];

export default function Subscriptions() {
  const handleChoose = (planId) => {
    safeSetItem('magmo_subscription_plan', planId);
    const element = document.getElementById('configurator');
    if (element) element.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section
      id="services"
      style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '120px 20px 40px',
        position: 'relative',
        zIndex: 10,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '24px', flexWrap: 'wrap' }}>
        <div>
          <div style={{ color: 'var(--accent-start)', fontWeight: 900, letterSpacing: '0.18em', textTransform: 'uppercase', fontSize: '0.75rem' }}>
            Пiдписки (супровiд)
          </div>
          <h2 style={{ marginTop: 12, fontSize: 'clamp(2.2rem, 4vw, 3.4rem)', letterSpacing: '-0.04em', fontWeight: 950, lineHeight: 1.05 }}>
            Пiсля запуску: стабiльнiсть або керованi покращення.
          </h2>
          <p style={{ marginTop: 14, maxWidth: 720, color: 'var(--text-muted)', fontSize: '1.05rem', lineHeight: 1.6 }}>
            Це не пакети розробки. Це супровiд сайту/продукту пiсля релiзу: оновлення, безпека, бекапи та дрiбнi правки (за планом).
          </p>
        </div>

        <motion.a
          href="#configurator"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            padding: '14px 18px',
            borderRadius: 999,
            border: '1px solid rgba(255,255,255,0.14)',
            background: 'rgba(255,255,255,0.04)',
            color: 'var(--text-main)',
            textDecoration: 'none',
            fontWeight: 900,
            letterSpacing: '0.04em',
          }}
        >
          Пiдiбрати пiдписку <ArrowRight size={18} />
        </motion.a>
      </div>

      <div style={{ marginTop: 18, display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 16px', borderRadius: 22, border: '1px solid rgba(255,255,255,0.10)', background: 'rgba(255,255,255,0.03)' }}>
        <Info size={18} color="var(--accent-start)" style={{ marginTop: 2, flexShrink: 0 }} />
        <div style={{ color: 'var(--text-muted)', fontWeight: 750, lineHeight: 1.5 }}>
          Натисни <b style={{ color: 'var(--text-main)' }}>“Додати до заявки”</b>, якщо хочеш зафiксувати план супроводу одразу. Iнакше просто обери пакет розробки в конфiгураторi нижче.
        </div>
      </div>

      <div style={{ marginTop: 28, display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 16 }}>
        {PLANS.map((plan) => (
          <motion.div
            key={plan.id}
            whileHover={{ y: -6 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'relative',
              borderRadius: 28,
              padding: 18,
              border: plan.badge ? '1px solid rgba(var(--accent-rgb), 0.28)' : '1px solid var(--border-1)',
              background: plan.badge ? 'linear-gradient(180deg, rgba(var(--accent-rgb), 0.10) 0%, rgba(255,255,255,0.03) 100%)' : 'rgba(255,255,255,0.03)',
              boxShadow: plan.badge ? '0 26px 90px rgba(var(--accent-rgb), 0.10)' : 'var(--shadow-soft)',
              overflow: 'hidden',
            }}
          >
            <div style={{ position: 'absolute', inset: -1, pointerEvents: 'none', background: 'radial-gradient(900px 400px at 50% 0%, rgba(var(--accent-rgb), 0.12), transparent 60%)', opacity: plan.badge ? 1 : 0.6 }} />

            <div style={{ position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ fontWeight: 950, fontSize: '1.4rem', letterSpacing: '-0.02em' }}>{plan.name}</div>
                {plan.badge ? (
                  <div style={{ padding: '6px 10px', borderRadius: 999, background: 'var(--accent-start)', color: 'black', fontWeight: 950, fontSize: '0.72rem', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                    {plan.badge}
                  </div>
                ) : null}
              </div>

              <div style={{ marginTop: 6, color: 'var(--text-subtle)', fontWeight: 900, letterSpacing: '0.14em', textTransform: 'uppercase', fontSize: '0.72rem' }}>
                {plan.eyebrow}
              </div>

              <div style={{ marginTop: 12, display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 14 }}>
                <div style={{ fontWeight: 980, fontSize: '1.6rem', letterSpacing: '-0.03em' }}>
                  {plan.price}
                </div>
                <div style={{ color: 'var(--text-subtle)', fontWeight: 900, letterSpacing: '0.12em', textTransform: 'uppercase', fontSize: '0.72rem' }}>
                  / мiс
                </div>
              </div>

              <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {plan.highlights.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ width: 34, height: 34, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-start)', background: 'rgba(var(--accent-rgb), 0.10)', border: '1px solid rgba(var(--accent-rgb), 0.14)', flexShrink: 0 }}>
                      {item.icon}
                    </div>
                    <div style={{ fontWeight: 850, color: 'var(--text-main)' }}>{item.label}</div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {plan.limits.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-muted)' }}>
                    <div style={{ width: 28, height: 28, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)' }}>
                      {item.icon}
                    </div>
                    <div style={{ fontWeight: 750 }}>{item.label}</div>
                  </div>
                ))}
              </div>

              <motion.button
                type="button"
                onClick={() => handleChoose(plan.id)}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                style={{
                  marginTop: 16,
                  width: '100%',
                  borderRadius: 18,
                  padding: '14px 14px',
                  fontWeight: 950,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  fontSize: '0.85rem',
                  color: plan.badge ? 'black' : 'var(--text-main)',
                  background: plan.badge ? 'linear-gradient(90deg, var(--accent-start) 0%, var(--accent-mid) 55%, var(--accent-end) 100%)' : 'rgba(255,255,255,0.06)',
                  border: plan.badge ? '1px solid rgba(var(--accent-rgb), 0.25)' : '1px solid rgba(255,255,255,0.12)',
                  boxShadow: plan.badge ? '0 22px 70px rgba(var(--accent-rgb), 0.16)' : 'none',
                }}
              >
                Додати до заявки
              </motion.button>
            </div>
          </motion.div>
        ))}
      </div>

      <style>{`
        @media (max-width: 900px) {
          #services > div + div { grid-template-columns: 1fr; }
        }
      `}</style>
    </section>
  );
}
