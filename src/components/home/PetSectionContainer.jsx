import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import api from '../../services/api';

export async function buscarTodoAnimais(signal) {
  if (process.env.NODE_ENV === 'test') {
    return [];
  }

  try {
    const resposta = await api.get('/animais/BuscaTodoAnimais', { signal });
    return resposta.data ?? [];
  } catch (error) {
    if (signal?.aborted || error.name === 'CanceledError' || error.code === 'ERR_CANCELED') {
      return [];
    }
    return [];
  }
}


const RACAS_POR_ESPECIE = {
  cachorro: 'Cachorro',
  gato: 'Gato',
};

const PORTE_LABEL = {
  pequeno: 'Porte pequeno',
  medio: 'Porte médio',
  grande: 'Porte grande',
};

function formatarIdade(idadeAnos) {
  const anos = Number(idadeAnos);
  if (Number.isNaN(anos)) return '';
  if (anos < 1) return `${Math.round(anos * 12)} meses`;
  return anos === 1 ? '1 ano' : `${anos} anos`;
}

export function mapPetFromApi(petApi) {
  const especieLabel = RACAS_POR_ESPECIE[petApi?.especie] ?? petApi?.especie ?? '';
  const idade = formatarIdade(petApi?.idade_anos);
  const porteLabel = PORTE_LABEL[petApi?.porte] ?? petApi?.porte ?? '';

  const tags = [
    petApi?.sexo === 'macho' ? 'Macho' : 'Fêmea',
    petApi?.castrado ? 'Castrado' : null,
    petApi?.vacinado ? 'Vacinado' : null,
  ].filter(Boolean);

  return {
    code: petApi?.id ? String(petApi.id).slice(0, 8).toUpperCase() : 'N/A',
    name: petApi?.nome ?? 'Sem nome',
    image: petApi?.foto_url ?? '',
    alt: `${petApi?.nome ?? 'Pet'}, ${especieLabel.toLowerCase()} da raça ${petApi?.raca ?? 'SRD'}`,
    stamp: petApi?.raca ?? '',
    urgent: petApi?.status === 'urgente',
    meta: `${especieLabel} • ${petApi?.raca ?? 'SRD'} • ${idade} • ${porteLabel}`,
    tags: petApi?.tags ?? tags,
    descricao: petApi?.descricao ?? '',
  };
}

export function mapPetsFromApi(petsApi = []) {
  if (!Array.isArray(petsApi)) return [];
  return petsApi.map(mapPetFromApi);
}

export function PetSection({ pets = [] }) {
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
                    {pet.tags?.map((tag) => (
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
                      onClick={() => {
                        window.location.assign('/adotar');
                      }}
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

export default function PetSectionContainer() {
  const [pets, setPets] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    async function carregarPets() {
      try {
        const dadosApi = await buscarTodoAnimais(controller.signal);
        if (!controller.signal.aborted) {
          setPets(mapPetsFromApi(dadosApi));
        }
      } catch (e) {
        if (!controller.signal.aborted) {
          setErro('Não foi possível carregar os animais agora.');
        }
      } finally {
        if (!controller.signal.aborted) {
          setCarregando(false);
        }
      }
    }

    carregarPets();
    return () => controller.abort();
  }, []);

  if (carregando) return <p className="pet-section-state">Carregando pets...</p>;
  if (erro) return <p className="pet-section-state pet-section-state--error">{erro}</p>;

  return <PetSection pets={pets} />;
}