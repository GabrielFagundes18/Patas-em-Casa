// O quê: importa estilos, animação de entrada e o hook de visibilidade.
// Como: useInView informa quando a seção aparece e motion controla a sequência das bolhas.
// Para quê: explicar o processo de adoção em uma interface progressiva.
import './HowItWorks.css';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { Link } from 'react-router-dom';

// O quê: associa chaves de etapa a representações SVG de ícones.
// Como: o objeto permite selecionar uma figura por nome sem condicionais repetidos.
// Para quê: manter a apresentação das etapas configurável pelos dados recebidos.
const ICONS = {
  search: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  heart: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
    </svg>
  ),
  clipboard: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="6" y="4" width="12" height="17" rx="2" />
      <path d="M9 4V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  ),
  home: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 11.5L12 4l9 7.5" />
      <path d="M5 10v10h14V10" />
      <path d="M9.5 20v-6h5v6" />
    </svg>
  ),
  send: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  ),
};

// O quê: define uma ordem de fallback para etapas sem ícone explícito.
// Como: o índice da etapa é usado com módulo para repetir opções quando necessário.
// Para quê: garantir que toda bolha tenha uma representação visual.
const DEFAULT_ICON_ORDER = ['search', 'heart', 'clipboard', 'home'];

function HowItWorks({ steps, shelterName = 'Patas em Casa' }) {
  // O quê: cria a referência da seção e registra se ela está visível.
  // Como: useRef fornece o elemento observado e useInView mantém a detecção uma única vez.
  // Para quê: iniciar as animações somente quando o conteúdo entra na viewport.
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  // O quê: renderiza o mock de conversa que descreve o caminho da adoção.
  // Como: cada step é mapeado para uma bolha alternada, com atraso proporcional ao índice.
  // Para quê: transformar um processo sequencial em uma leitura visual simples.
  return (
    <section id="como-funciona" className="how" ref={ref}>
      <div className="wrap">
        <div className="section-head">
          <span className="eyebrow">O caminho até a adoção</span>
          <h2>Como funciona</h2>
          <div className="how-links">
            <Link to="/como-funciona" className="btn btn-secondary">Requisitos e passo a passo completo</Link>
            <Link to="/adotar" className="btn btn-primary">Ver animais</Link>
          </div>
        </div>

        <div className="chat-mock">
          <div className="chat-header">
            <div className="chat-avatar">{ICONS.home}</div>
            <div>
              <p className="chat-name">Abrigo {shelterName}</p>
              <p className="chat-status">
                <span className="chat-dot" aria-hidden="true" /> online agora
              </p>
            </div>
          </div>

          <div className="chat-thread">
            {steps.map((step, index) => {
              // O quê: calcula propriedades visuais derivadas da posição da etapa.
              // Como: compara o índice, usa paridade e escolhe o ícone informado ou um fallback.
              // Para quê: alternar remetentes, destacar a última mensagem e preservar a apresentação mesmo com dados incompletos.
              const isLast = index === steps.length - 1;
              const isSent = index % 2 === 1;
              const iconKey = step.icon || DEFAULT_ICON_ORDER[index % DEFAULT_ICON_ORDER.length];

              return (
                <motion.div
                  className={`bubble${isSent ? ' bubble-sent' : ' bubble-received'}${isLast ? ' bubble-final' : ''}`}
                  key={step.title}
                  initial={{ opacity: 0, y: 14, scale: 0.96 }}
                  animate={isInView ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 14, scale: 0.96 }}
                  transition={{
                    duration: 0.4,
                    delay: index * 0.22,
                    ease: 'easeOut',
                  }}
                >
                  <p className="bubble-title">
                    <span className="bubble-icon" aria-hidden="true">
                      {ICONS[iconKey]}
                    </span>
                    {step.title}
                  </p>
                  <p className="bubble-text">{step.description}</p>
                </motion.div>
              );
            })}
          </div>

          <div className="chat-input" aria-hidden="true">
            <span className="chat-input-field">Digite sua mensagem...</span>
            <span className="chat-input-send">{ICONS.send}</span>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HowItWorks;