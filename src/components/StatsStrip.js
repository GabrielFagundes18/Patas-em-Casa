import { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';

const stats = [
  { value: '+150', label: 'ANIMAIS RESGATADOS' },
  { value: '+120', label: 'ADOÇÕES REALIZADAS' },
  { value: '28', label: 'AGUARDANDO UM LAR' },
  { value: '5 anos', label: 'DE ATUAÇÃO' },
];

function CountUp({ value, inView }) {
  const [displayValue, setDisplayValue] = useState(0);
  const parsed = value.match(/\d+(?:[.,]\d+)?/g)?.[0]?.replace(',', '.') ?? '0';
  const numericValue = Number(parsed);
  const prefix = value.startsWith('+') ? '+' : '';
  const suffix = value.includes('anos') ? ' anos' : '';

  useEffect(() => {
    if (!inView) {
      return undefined;
    }

    let frameId = 0;
    let startTime = 0;
    const duration = 1400;

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const easedProgress = 1 - (1 - progress) ** 3;
      setDisplayValue(Math.round(numericValue * easedProgress));

      if (progress < 1) {
        frameId = requestAnimationFrame(animate);
      }
    };

    frameId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(frameId);
  }, [inView, numericValue]);

  return (
    <>
      {prefix}
      {displayValue}
      {suffix}
    </>
  );
}

function StatsStrip() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });

  return (
    <div className="stats-strip" ref={ref}>
      <div className="wrap stats-grid">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            className="stat-item"
            initial={{ opacity: 0, y: 28 }}
            animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 28 }}
            transition={{
              duration: 0.55,
              ease: 'easeOut',
              delay: index * 0.12,
            }}
            whileHover={{
              y: -8,
              scale: 1.03,
              transition: { duration: 0.2, ease: 'easeOut' },
            }}
          >
            <div className="stat-num">
              <CountUp value={stat.value} inView={inView} />
            </div>
            <div className="stat-label">{stat.label}</div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export default StatsStrip;
