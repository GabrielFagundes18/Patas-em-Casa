import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

function PetSection({ pets }) {
  const displayedPets = pets.slice(0, 8);

  return (
    <section id="adotar" className="pet-section">
      <div className="wrap">
        <div className="section-head reveal">
          <span className="eyebrow">Vitrine de animais</span>
          <h2>Quem está esperando por você</h2>
          <p>
            Conheça alguns dos pets que estão esperando por um lar cheio de carinho e cuidado.
          </p>
        </div>

        <AnimatePresence mode="popLayout">
          <motion.div layout className="gallery">
            {displayedPets.map((pet, index) => (
              <motion.article
                key={`${pet.name}-${pet.code}`}
                layout
                initial={{ opacity: 0, y: 18, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 12, scale: 0.98 }}
                transition={{
                  duration: 0.28,
                  delay: index * 0.03,
                  ease: [0.22, 1, 0.36, 1],
                }}
                whileHover={{ y: -4, transition: { duration: 0.18 } }}
                className="pet-card"
              >
                <div className="pet-photo">
                  <img src={pet.image} alt={pet.alt} loading="lazy" decoding="async" />
                  <div className={`pet-stamp ${pet.urgent ? 'urgent' : ''}`}>
                    <span dangerouslySetInnerHTML={{ __html: pet.stamp }} />
                  </div>
                </div>

                <div className="pet-body">
                  <div className="pet-header">
                    <div>
                      <p className="pet-code mono">{pet.code}</p>
                      <h3 className="pet-name">{pet.name}</h3>
                    </div>

                    <span className={`pet-status ${pet.urgent ? 'is-urgent' : ''}`}>
                      {pet.urgent ? 'Urgente' : 'Disponível'}
                    </span>
                  </div>

                  <p className="pet-meta">{pet.meta}</p>

                  <div className="pet-tags">
                    {pet.tags.map((tag) => (
                      <span className="tag" key={tag}>
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="pet-actions">
                    <motion.button
                      type="button"
                      className={`pet-btn primary ${pet.urgent ? 'urgent-btn' : ''}`}
                      whileHover={{ y: -1, transition: { duration: 0.18 } }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {pet.urgent ? 'Apadrinhar' : 'Ver ficha'}
                    </motion.button>

                    <motion.button
                      type="button"
                      className="pet-btn ghost"
                      whileHover={{ y: -1, transition: { duration: 0.18 } }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Compartilhar
                    </motion.button>
                  </div>
                </div>
              </motion.article>
            ))}
          </motion.div>
        </AnimatePresence>

        {pets.length > 8 && (
          <div className="pet-section-actions">
            {/* TODO: rota /adotar ainda será criada */}
            <motion.a
              href="/adotar"
              className="btn btn-secondary"
              whileHover={{ y: -1, x: 1 }}
              whileTap={{ scale: 0.98 }}
              aria-label="Ver todos os animais"
            >
              <span>Ver todos os animais</span>
              <motion.span
                className="toggle-icon-wrap"
                animate={{ x: [0, 2, 0] }}
                transition={{ duration: 0.45, repeat: 0 }}
              >
                <ArrowRight className="toggle-icon" aria-hidden="true" />
              </motion.span>
            </motion.a>
          </div>
        )}
      </div>
    </section>
  );
}

export default PetSection;
