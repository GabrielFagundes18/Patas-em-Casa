// O quê: importa estilos, estado, efeitos, animações, ícone e cliente HTTP da vitrine.
// Como: os hooks controlam a consulta, enquanto Framer Motion anima a grade de pets.
// Para quê: separar busca e normalização dos dados da apresentação da seção inicial.
import './PetSectionContainer.css';
import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import api from '../../services/api';

// O quê: busca todos os animais usados pela vitrine da landing page.
// Como: ignora chamadas reais em testes e trata cancelamentos e falhas retornando lista vazia.
// Para quê: fornecer uma fonte resiliente de dados e evitar que erros de rede interrompam a página.
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
// O quê: mapeia chaves técnicas de espécie para rótulos legíveis.
// Como: usa um objeto de consulta com fallback para o valor recebido ou texto vazio.
// Para quê: normalizar dados da API para o vocabulário da interface.
const RACAS_POR_ESPECIE = {
  cachorro: 'Cachorro',
  gato: 'Gato',
};

// O quê: mapeia códigos de porte para descrições exibidas ao usuário.
// Como: usa a mesma estratégia de lookup com fallback.
// Para quê: manter a apresentação uniforme dos metadados dos animais.
const PORTE_LABEL = {
  pequeno: 'Porte pequeno',
  medio: 'Porte médio',
  grande: 'Porte grande',
};

// O quê: converte idade em anos para uma unidade legível.
// Como: valores menores que um ano são convertidos para meses e os demais recebem singular/plural correto.
// Para quê: evitar que o catálogo exiba números crus da API.
function formatarIdade(idadeAnos) {
  const anos = Number(idadeAnos);
  if (Number.isNaN(anos)) return '';
  if (anos < 1) return `${Math.round(anos * 12)} meses`;
  return anos === 1 ? '1 ano' : `${anos} anos`;
}

// O quê: adapta um animal do contrato da API ao modelo consumido pelos componentes React.
// Como: usa optional chaining, fallbacks, tags derivadas e um objeto de saída estável.
// Para quê: isolar diferenças entre backend e interface, incluindo código, status, texto alternativo e metadados.
export function mapPetFromApi(petApi) {
  const especieLabel = RACAS_POR_ESPECIE[petApi?.especie] ?? petApi?.especie ?? '';
  const idade = formatarIdade(petApi?.idade_anos);
  const porteLabel = PORTE_LABEL[petApi?.porte] ?? petApi?.porte ?? '';

  // O quê: calcula tags de sexo e cuidados básicos.
  // Como: expressões condicionais produzem valores ou null e filter(Boolean) remove ausências.
  // Para quê: formar uma lista limpa para filtros, cards e detalhes.
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

// O quê: adapta uma coleção inteira de animais.
// Como: valida Array.isArray e aplica mapPetFromApi a cada item.
// Para quê: garantir que a camada visual sempre receba uma lista iterável.
export function mapPetsFromApi(petsApi = []) {
  if (!Array.isArray(petsApi)) return [];
  return petsApi.map(mapPetFromApi);
}

export function PetSection({ pets = [] }) {
  // O quê: limita a vitrine inicial aos oito primeiros animais.
  // Como: slice cria uma visão não destrutiva da coleção recebida.
  // Para quê: manter a landing page compacta e direcionar para o catálogo completo.
  const displayedPets = pets.slice(0, 8);

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
        const dadosApi = await buscarTodoAnimais(controller.signal);
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