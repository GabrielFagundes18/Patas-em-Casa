// O quê: topo da Home: chamada principal, os dois caminhos (adotar e doar) e um animal em destaque.
// Como: o destaque é o primeiro caso urgente da lista (ou o primeiro animal, se não houver urgente).
// Para quê: apresentar a ONG em uma frase e levar o visitante direto a quem precisa de um lar.
import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Heart, PawPrint } from 'lucide-react';
import { Link } from 'react-router-dom';
import Fundo from 'assets/fundo.webp';
import { ORGANIZACAO } from 'shared/constants/organization';
import { artigo } from 'shared/utils/petText';
import './Hero.css';

export function pickHighlight(pets) {
  return pets.find((pet) => pet.urgent) ?? pets[0] ?? null;
}

// Miniatura do destaque: a foto do animal ou, sem foto (ou com link quebrado), a pata da marca.
function HighlightThumb({ pet }) {
  const [failed, setFailed] = useState(false);
  if (!pet.image || failed) {
    return (
      <span className="home-hero-thumb" aria-hidden="true">
        <PawPrint size={24} />
      </span>
    );
  }
  return <img className="home-hero-thumb" src={pet.image} alt="" onError={() => setFailed(true)} />;
}

function Hero({ pets = [] }) {
  const highlight = pickHighlight(pets);

  return (
    <section className="home-hero" aria-labelledby="hero-title">
      <div className="wrap home-hero-grid">
        <motion.div
          className="home-hero-copy"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <p className="home-eyebrow">ONG de proteção animal · desde {ORGANIZACAO.fundacao}</p>
          <h1 id="hero-title" className="home-hero-title">
            Cada focinho tem uma <em>história.</em>
          </h1>
          <p className="home-hero-lead">
            Resgatamos, tratamos e preparamos cães e gatos para um lar de verdade. A adoção é gratuita, e a equipe
            acompanha você do primeiro contato até as primeiras semanas em casa.
          </p>
          <div className="home-hero-actions">
            <Link to="/adotar" className="home-btn home-btn--primary">
              Quero adotar <ArrowRight size={18} aria-hidden="true" />
            </Link>
            <Link to="/doar" className="home-btn home-btn--outline">
              <Heart size={18} aria-hidden="true" /> Quero doar
            </Link>
          </div>
          <Link to="/como-funciona" className="home-link">Entender o processo de adoção</Link>
        </motion.div>

        <motion.div
          className="home-hero-visual"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
        >
          <div className="home-hero-frame">
            <span className="home-hero-orb home-hero-orb--amber" aria-hidden="true" />
            <span className="home-hero-orb home-hero-orb--sage" aria-hidden="true" />
            <img
              src={Fundo}
              alt="Um cachorro e um gato acenando com a pata"
              className="home-hero-img"
              width="1400"
              height="763"
              fetchPriority="high"
            />
          </div>

          {pets.length > 0 ? (
            <p className="home-hero-chip">
              <span aria-hidden="true" />
              {pets.length} aguardando um lar
            </p>
          ) : null}

          {highlight ? (
            <Link
              to={highlight.id ? `/animais/${encodeURIComponent(highlight.id)}` : '/adotar'}
              className="home-hero-highlight"
            >
              <HighlightThumb pet={highlight} />
              <span className="home-hero-highlight-text">
                {highlight.urgent ? <span className="home-badge-urgent">Urgente</span> : null}
                <strong>
                  {highlight.name} {highlight.urgent ? 'precisa de um lar' : 'está esperando por você'}
                </strong>
                <span className="home-hero-highlight-cta">Ver perfil d{artigo(highlight)} {highlight.name}</span>
              </span>
            </Link>
          ) : null}
        </motion.div>
      </div>
    </section>
  );
}

export default Hero;
