// O quê: importa animações, ícones, roteamento, imagem principal e a onda decorativa.
// Como: Framer Motion anima blocos, Link navega internamente e os demais módulos compõem a identidade visual.
// Para quê: apresentar a proposta de adoção e o principal caminho para encontrar um animal.
import { motion } from 'framer-motion';
import { ArrowRight, Dog, Heart, HeartPulse, PawPrint } from 'lucide-react';
import { useEffect, useState } from 'react';
import Fundo from '../../assets/fundo.png';
import './Hero.css';
import SvgOnda from '../SvgOnda/SvgOnda';

const stories = ['Bento', 'Luna', 'Milo'];

function Hero() {
  const [activeStory, setActiveStory] = useState(stories[0]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveStory((currentStory) => {
        const index = stories.indexOf(currentStory);
        const nextIndex = (index + 1) % stories.length;
        return stories[nextIndex];
      });
    }, 3500);

    return () => window.clearInterval(timer);
  }, []);

  // O quê: renderiza o hero e a seção de benefícios iniciais.
  // Como: agrupa texto, chamadas para ação, imagem e cards em seções sem estado local.
  // Para quê: comunicar o propósito da plataforma e preparar o visitante para o fluxo de adoção.
  return (
    <div className="home-wrapper">
      <section className="hero-section" aria-labelledby="hero-title">
        <div className="wrap hero-container">
          <motion.div
            className="hero-left"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="hero-kicker"><PawPrint size={15} /> Adoção responsável, todos os dias</span>
            <h1 id="hero-title" className="hero-title" aria-live="polite">
              Cada focinho tem uma <strong>{activeStory}</strong>
            </h1>

            <p className="hero-description">
              Encontre cães e gatos resgatados que esperam por uma família. A equipe acompanha cada encontro para que a adoção seja leve, segura e duradoura.
            </p>

            <div className="hero-actions hero">
              <a href="/adotar" className="btn-hero-pill" aria-label="Quero adotar">
                Quero adotar
              </a>
              <a href="/adotar" className="btn-hero-pill">
                Encontrar um companheiro <ArrowRight size={18} />
              </a>
              <a href="#como-funciona" className="hero-text-link">Entender o processo</a>
            </div>

          </motion.div>

          <motion.div
            className="hero-right"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <img src={Fundo} alt="Animaizinhos" className="hero-cutout-img" />
            <div className="hero-orbit hero-orbit-one" aria-hidden="true" />
            <div className="hero-orbit hero-orbit-two" aria-hidden="true" />
          </motion.div>
        </div>
        <SvgOnda color="var(--bg-primary)"  />
      </section>

      <section className="features-section">
        <div className="wrap">
          <div className="features-heading">
            <span className="eyebrow">O cuidado antes do encontro</span>
            <h2 className="features-title">Cada adoção começa bem antes do abraço.</h2>
          </div>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon icon-yellow">
                <Dog size={24} strokeWidth={2.2} />
              </div>
              <div className="feature-text">
                <h3>São muitos</h3>
                <p>
                  Cães e gatos com perfis diferentes, prontos para encontrar a rotina certa.
                </p>
              </div>
            </div>

            <div className="feature-card">
              <div className="feature-icon icon-green">
                <HeartPulse size={24} strokeWidth={2.2} />
              </div>
              <div className="feature-text">
                <h3>Eles são saudáveis</h3>
                <p>Vacinação, avaliação e acompanhamento fazem parte de cada resgate.</p>
              </div>
            </div>

            <div className="feature-card">
              <div className="feature-icon icon-pink">
                <Heart size={24} strokeWidth={2.2} />
              </div>
              <div className="feature-text">
                <h3>Eles são amados</h3>
                <p>
                  Eles recebem presença, cuidado e respeito enquanto esperam por um lar.
                </p>
              </div>
            </div>
          </div>
        </div>
        <SvgOnda color="var(--sage-dark)"  />
      </section>
    </div>
  );
}

export default Hero;
