import { motion } from 'framer-motion';

function Hero() {
  return (
    <section className="hero" aria-label="Seção principal da ONG Patas em Casa">
      {/**
       * A imagem é decorativa porque todo o contexto visual da mensagem já está
       * no texto sobreposto. Mantemos o contraste acessível por meio do overlay.
       */}
      <motion.img
        className="hero-bg"
        src="fundo.jpeg"
        alt=""
        aria-hidden="true"
        loading="eager"
        fetchPriority="high"
        initial={{ opacity: 0, scale: 1.06 }}
        animate={{ opacity: 1, scale: 1.02 }}
        transition={{ duration: 1.1, ease: 'easeOut' }}
      />

      <div className="wrap hero-grid">
        <motion.div
          className="hero-copy"
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <motion.span
            className="eyebrow"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.08, ease: 'easeOut' }}
          >
            ONG de proteção animal · desde 2019
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.12, ease: 'easeOut' }}
          >
            Cada focinho tem uma <em>história</em> esperando um novo capítulo.
          </motion.h1>

          <motion.p
            className="lead"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.2, ease: 'easeOut' }}
          >
            Resgatamos, cuidamos e encontramos lares responsáveis para cães e
            gatos. Adote com consciência ou ajude quem ainda está esperando.
          </motion.p>

          <motion.div
            className="hero-actions"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.28, ease: 'easeOut' }}
          >
            <a href="#adotar" className="btn btn-primary">
              Quero adotar →
            </a>
            <a href="#ajudar" className="btn btn-secondary">
              Quero ajudar
            </a>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

export default Hero;
