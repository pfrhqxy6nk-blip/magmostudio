import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Crown, Shield, Zap } from 'lucide-react';

const PLANS = [
  {
    id: 'basic',
    name: 'Basic',
    price: '$20',
    tagline: 'Стабiльнiсть i безпека',
    items: [
      'Хостинг включено',
      'Автоматичнi оновлення',
      'Базовий захист',
      'Регулярнi бекапи',
      'Правки: не входять',
      'Пiдтримка: тiльки технiчна стабiльнiсть',
    ],
    icon: <Shield size={18} />,
  },
  {
    id: 'business',
    name: 'Business',
    price: '$50',
    tagline: 'Дрiбнi правки щомiсяця',
    items: [
      'Все з Basic',
      'Дрiбнi правки: до 1 години/мiс',
      'Тип правок: тексти, кнопки, контакти, блоки',
      'Структура: не змiнюється',
      'Дизайн: не входить',
      'Термiн: у стандартнiй черзi',
    ],
    icon: <Zap size={18} />,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$100',
    tagline: 'Прiоритет + аудит',
    items: [
      'Все з Business',
      'SEO-покращення: базовi',
      'Конверсiя: рекомендацiї',
      'Прiоритет: швидша черга',
      'Аудит: 1 раз/мiс',
      'Масштабнi змiни: окремо',
    ],
    icon: <Crown size={18} />,
  },
];

export default function SubscriptionPlans({ onChoose }) {
  const [isNarrow, setIsNarrow] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 900 : false,
  );

  useEffect(() => {
    const onResize = () => setIsNarrow(window.innerWidth < 900);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: isNarrow ? '1fr' : 'repeat(3, minmax(0, 1fr))', gap: 16 }}>
      {PLANS.map((plan) => (
        <motion.div
          key={plan.id}
          whileHover={{ y: -6 }}
          transition={{ duration: 0.2 }}
          style={{
            position: 'relative',
            borderRadius: 28,
            padding: 18,
            border: '1px solid var(--border-1)',
            background: 'rgba(255,255,255,0.03)',
            boxShadow: 'var(--shadow-soft)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: -1,
              pointerEvents: 'none',
              background: 'radial-gradient(900px 420px at 50% 0%, rgba(255,255,255,0.08), transparent 60%)',
              opacity: 0.6,
            }}
          />

          <div style={{ position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 16,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'rgba(255,255,255,0.85)',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    flexShrink: 0,
                  }}
                >
                  {plan.icon}
                </div>
                <div style={{ fontWeight: 950, fontSize: '1.25rem', letterSpacing: '-0.02em' }}>{plan.name}</div>
                </div>
              </div>

            <div style={{ marginTop: 12, display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 14 }}>
              <div style={{ fontWeight: 980, fontSize: '1.8rem', letterSpacing: '-0.03em' }}>{plan.price}</div>
              <div style={{ color: 'var(--text-subtle)', fontWeight: 900, letterSpacing: '0.12em', textTransform: 'uppercase', fontSize: '0.72rem' }}>
                / мiс
              </div>
            </div>

            <div style={{ marginTop: 6, color: 'var(--text-muted)', fontWeight: 750 }}>{plan.tagline}</div>

            <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {plan.items.map((text) => (
                <div
                  key={text}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10,
                    padding: '10px 12px',
                    borderRadius: 16,
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 12,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'rgba(255,255,255,0.85)',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      flexShrink: 0,
                      marginTop: 1,
                    }}
                  >
                    <Check size={16} />
                  </div>
                  <div style={{ fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.35 }}>{text}</div>
                </div>
              ))}
            </div>

            <motion.button
              type="button"
              onClick={() => onChoose?.(plan)}
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
                color: 'var(--text-main)',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.12)',
                boxShadow: 'none',
                cursor: 'pointer',
              }}
            >
              Пiдключити
            </motion.button>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
