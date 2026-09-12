// O quê: importa hooks, animação e o divisor visual da seção.
// Como: useInView controla o contador e motion anima cada estatística.
// Para quê: comunicar resultados da ONG com uma entrada progressiva.
import { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import './StatsStrip.css';
import SgvOndaInvertida from '../SvgOndaInvertida/SvgOndaInvertida';

// O quê: define os números e rótulos exibidos na faixa de impacto.
// Como: cada objeto separa o valor formatado da legenda semântica.
// Para quê: centralizar as métricas que alimentam os componentes de apresentação.
const stats = [
  { value: '+150', label: 'ANIMAIS RESGATADOS' },
  { value: '+120', label: 'ADOÇÕES REALIZADAS' },
  { value: '28', label: 'AGUARDANDO UM LAR' },
  { value: '5 anos', label: 'DE ATUAÇÃO' },
];

function CountUp({ value, inView }) {
  // O quê: mantém o número atualmente exibido pelo contador.
  // Como: o valor é atualizado a cada frame enquanto a animação progride.
  // Para quê: criar a transição visual entre zero e a métrica final.
  const [displayValue, setDisplayValue] = useState(0);
  // O quê: separa número, prefixo e sufixo do valor textual recebido.
  // Como: regex extrai dígitos e verificações de string preservam “+” e “anos”.
  // Para quê: animar somente o trecho numérico sem perder a formatação de negócio.
  const parsed = value.match(/\d+(?:[.,]\d+)?/g)?.[0]?.replace(',', '.') ?? '0';
  const numericValue = Number(parsed);
  const prefix = value.startsWith('+') ? '+' : '';
  const suffix = value.includes('anos') ? ' anos' : '';

  // O quê: inicia e encerra a animação do contador quando o item entra na viewport.
  // Como: requestAnimationFrame calcula progresso limitado, aplica easing cúbico e agenda o próximo frame.
  // Para quê: produzir uma contagem suave e cancelar o callback se o componente sair da tela.
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

  // O quê: renderiza prefixo, número animado e sufixo.
  // Como: fragment evita um elemento extra na árvore e preserva a composição textual.
  // Para quê: exibir a métrica no formato original durante e após a animação.
  return (
    <>
      {prefix}
      {displayValue}
      {suffix}
    </>
  );
}

function StatsStrip() {
  // O quê: observa a faixa para disparar a animação de entrada e os contadores.
  // Como: useRef conecta o DOM ao useInView com execução única.
  // Para quê: evitar iniciar métricas antes de o usuário alcançá-las.
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });

  // O quê: renderiza a faixa e uma célula para cada estatística.
  // Como: map cria elementos animados com atraso baseado no índice e CountUp recebe o estado de visibilidade.
  // Para quê: apresentar as métricas de impacto em uma sequência visual coerente.
  return (
    <div className="stats-strip" ref={ref}>
   
      
     
     <SgvOndaInvertida/>
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
