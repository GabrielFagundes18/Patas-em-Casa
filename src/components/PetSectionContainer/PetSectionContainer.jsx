// O quê: importa estilos, estado, efeitos, navegação, animações, serviço e utilitários da vitrine.
// Como: os hooks controlam a consulta, enquanto Framer Motion anima a grade de pets.
// Para quê: separar busca e normalização dos dados da apresentação da seção inicial.
import './PetSectionContainer.css';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { PetPhoto } from '../PetPhoto/PetPhoto';
import { buscarTodoAnimais } from '../../services/animaisService';
import { mapPetsFromApi } from '../../utils/petMapper';
import { sharePet } from '../../utils/sharePet';

export function PetSection({ pets = [] }) {
  // O quê: limita a vitrine inicial aos oito primeiros animais.
  // Como: slice cria uma visão não destrutiva da coleção recebida.
  // Para quê: manter a landing page compacta e direcionar para o catálogo completo.
  const displayedPets = pets.slice(0, 8);
  const navigate = useNavigate();
  const [aviso, setAviso] = useState('');

  // O quê: compartilha a ficha do animal e informa o resultado.
  // Como: usa o utilitário compartilhado (Web Share API ou cópia do link) e mostra um aviso curto.
  // Para quê: divulgar um perfil com link que abre direto na ficha dele.
  async function compartilhar(pet) {
    const { status, url } = await sharePet(pet);
    if (status === 'copied') setAviso(`Link da ficha de ${pet.name} copiado.`);
    if (status === 'failed') setAviso(`Não foi possível copiar. Link: ${url}`);
  }

  // O quê: renderiza a vitrine pública de animais.
  // Como: mapeia os pets para artigos animados e exibe ações e metadados derivados.
  // Para quê: permitir descoberta rápida e encaminhar o visitante para adoção.
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
              // O quê: cria um card visual para cada animal exibido.
              // Como: usa layout compartilhado, estados de entrada/saída e atraso proporcional ao índice.
              // Para quê: apresentar a coleção com movimento previsível e identidade estável por pet.
              <motion.article
                key={pet.id ?? `${pet.name}-${pet.code}`}
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
                  <PetPhoto pet={pet} loading="lazy" />
                  <div className={`pet-stamp ${pet.urgent ? 'urgent' : ''}`}>
                    <span>{pet.stamp}</span>
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
                      onClick={() => navigate(pet.id ? `/adotar?pet=${encodeURIComponent(pet.id)}` : '/adotar')}
                      aria-label={`Ver ficha de ${pet.name}`}
                    >
                      Ver ficha
                    </motion.button>

                    <motion.button
                      type="button"
                      className="pet-btn ghost"
                      whileHover={{ y: -1, transition: { duration: 0.18 } }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => compartilhar(pet)}
                      aria-label={`Compartilhar ficha de ${pet.name}`}
                    >
                      Compartilhar
                    </motion.button>
                  </div>
                </div>
              </motion.article>
            ))}
          </motion.div>
        </AnimatePresence>

        <p className="pet-section-notice" role="status">
          {aviso}
        </p>

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
  // O quê: armazena pets carregados, estado de carregamento e mensagem de erro.
  // Como: três estados independentes permitem renderizar cada fase do request.
  // Para quê: manter a vitrine responsiva enquanto a API é consultada.
  const [pets, setPets] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  // O quê: executa a busca da vitrine e cancela a requisição na desmontagem.
  // Como: AbortController fornece signal ao serviço e as verificações evitam setState após abort.
  // Para quê: prevenir atualizações tardias e reduzir trabalho de rede ao trocar de tela.
  useEffect(() => {
    const controller = new AbortController();

    async function carregarPets() {
      // O quê: busca e normaliza os animais retornados pela API.
      // Como: aguarda buscarTodoAnimais e só atualiza o estado quando o signal permanece ativo.
      // Para quê: alimentar a seção com o modelo usado pelos cards.
      try {
        const dadosApi = await buscarTodoAnimais({ signal: controller.signal });
        if (!controller.signal.aborted) {
          setPets(mapPetsFromApi(dadosApi));
        }
      } catch (e) {
        // O quê: registra uma mensagem de erro para falhas não relacionadas a cancelamento.
        // Como: verifica o signal antes de chamar setErro.
        // Para quê: informar o usuário sem transformar uma navegação normal em erro visual.
        if (!controller.signal.aborted) {
          setErro('Não foi possível carregar os animais agora.');
        }
      } finally {
        // O quê: encerra o estado de carregamento quando a operação termina.
        // Como: executa em sucesso ou exceção, condicionado ao controller ativo.
        // Para quê: trocar o feedback de carregamento pelo conteúdo ou erro apropriado.
        if (!controller.signal.aborted) {
          setCarregando(false);
        }
      }
    }

    carregarPets();
    return () => controller.abort();
  }, []);

  // O quê: escolhe a saída visual de carregamento, erro ou conteúdo.
  // Como: retornos antecipados simplificam os estados mutuamente exclusivos.
  // Para quê: evitar que a grade seja renderizada antes de ter dados válidos.
  if (carregando) return <p className="pet-section-state">Carregando pets...</p>;
  if (erro) return <p className="pet-section-state pet-section-state--error">{erro}</p>;

  return <PetSection pets={pets} />;
}