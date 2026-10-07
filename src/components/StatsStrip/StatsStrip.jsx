// O quê: faixa com os números da ONG (resgatados, adoções, aguardando um lar e anos de atuação).
// Como: os três primeiros vêm da API; os anos são calculados a partir do ano de fundação.
// Para quê: mostrar resultados reais, nunca números inventados ou que envelhecem no código.
import { useEffect, useRef, useState } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import './StatsStrip.css';
import { buscarNumeros } from '../../api/content';
import { ORGANIZACAO } from '../../shared/constants/organization';

export function anosDeAtuacao(hoje = new Date()) {
  return hoje.getFullYear() - ORGANIZACAO.fundacao;
}

// Valores ainda não carregados (ou indisponíveis) ficam null e aparecem como "—".
function buildStats(numeros) {
  return [
    { value: numeros?.animais_resgatados ?? null, label: 'animais resgatados' },
    { value: numeros?.adocoes_realizadas ?? null, label: 'adoções realizadas' },
    { value: numeros?.aguardando_lar ?? null, label: 'aguardando um lar' },
    { value: anosDeAtuacao(), suffix: ' anos', label: `de atuação, desde ${ORGANIZACAO.fundacao}` },
  ];
}

// O quê: conta de 0 até o valor quando a faixa aparece na tela.
// Como: requestAnimationFrame com easing cúbico; quem pediu menos movimento vê o número final direto.
function CountUp({ value, suffix = '', inView }) {
  const reduceMotion = useReducedMotion();
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (!inView || reduceMotion) return undefined;

    let frameId = 0;
    let startTime = 0;
    const duration = 1400;

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setDisplayValue(Math.round(value * (1 - (1 - progress) ** 3)));
      if (progress < 1) frameId = requestAnimationFrame(animate);
    };

    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [inView, reduceMotion, value]);

  return (
    <>
      {reduceMotion ? value : displayValue}
      {suffix}
    </>
  );
}

function StatsStrip() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });
  const [numeros, setNumeros] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    buscarNumeros({ signal: controller.signal })
      .then((dados) => {
        if (!controller.signal.aborted) setNumeros(dados);
      })
      .catch(() => {});
    return () => controller.abort();
  }, []);

  return (
    <section className="home-stats" aria-label="A Patas em Casa em números" ref={ref}>
      <div className="wrap home-stats-grid">
        {buildStats(numeros).map((stat, index) => (
          <motion.div
            key={stat.label}
            className="home-stat"
            initial={{ opacity: 0, y: 16 }}
            animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
            transition={{ duration: 0.5, ease: 'easeOut', delay: index * 0.1 }}
          >
            <span className="home-stat-bar" aria-hidden="true" />
            <strong className="home-stat-value">
              {stat.value === null ? '—' : <CountUp value={stat.value} suffix={stat.suffix} inView={inView} />}
            </strong>
            <span className="home-stat-label">{stat.label}</span>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

export default StatsStrip;
