/*
 * ============================================================================
 * ARQUIVO: Stories.jsx
 * ============================================================================
 *
 * PARA QUE SERVE:
 *   Seção "Histórias de quem encontrou um lar" da página inicial. Busca na API
 *   as histórias de adoção publicadas pela equipe (no painel, aba Histórias) e
 *   mostra a primeira em destaque (foto + citação grande) e até duas outras em
 *   cartões menores. Se não houver nenhuma história publicada, a seção não aparece.
 *
 * PRINCIPAIS ITENS:
 *   - MAX_COMPACT: máximo de histórias em cartões menores (2).
 *   - toStory(story): converte a história da API para o formato da tela (interna).
 *   - StoryAuthor({ story }): linha "Fulana · adotou Pipoca" (interna).
 *   - Stories(): o componente da seção (exportado como padrão).
 *
 * CONEXÕES COM OUTROS ARQUIVOS:
 *   - react (useEffect, useState).
 *   - shared/components/PetPhoto/PetPhoto → foto (ou "Foto em breve").
 *   - api/content.js                      → buscarHistorias (GET /api/v1/public/stories).
 *   - ./Stories.css                       → estilos da seção.
 *   - Quem usa: features/home/LandingPage.jsx.
 *   - As histórias são cadastradas em admin/stories (painel).
 * ============================================================================
 */

// O quê: histórias de adoção publicadas pela equipe (Painel › Histórias).
// Como: a primeira aparece em destaque (foto e citação grande); até duas outras ficam em cartões menores.
// Sem nenhuma história publicada, a seção não aparece.
// Para quê: mostrar resultados reais, sem depoimentos inventados nem seção vazia.
// Hooks do React.
import { useEffect, useState } from 'react';
// Componente de foto com substituto.
import { PetPhoto } from 'shared/components/PetPhoto/PetPhoto';
// Busca as histórias publicadas.
import { buscarHistorias } from 'api/content';
// Estilos da seção.
import './Stories.css';

// Quantas histórias aparecem nos cartões menores (além da destacada).
const MAX_COMPACT = 2;

/*
 * FUNÇÃO: toStory (interna)
 * O que faz: adapta uma história da API ao formato usado pela tela.
 * Parâmetros:
 *   - story (objeto): história da API { id, texto, autor_nome, foto_url, animal: { nome, foto_url } }.
 * Retorno (objeto): { id, photo: { image, alt }, text, author, animalName }.
 *   "photo" tem o formato que o componente PetPhoto espera (image + alt).
 * Onde é usada: no useEffect do Stories, ao receber as histórias.
 */
// Usa a foto da história ou a do animal; sem foto, PetPhoto mostra o quadro com a pata.
function toStory(story) {
  // Nome do animal adotado (ou null).
  const animalName = story.animal?.nome || null;
  return {
    id: story.id,
    photo: {
      // Prioridade: foto da história → foto do animal → nenhuma ('').
      image: story.foto_url || story.animal?.foto_url || '',
      // Texto alternativo da foto.
      alt: animalName ? `${animalName} no novo lar` : `História contada por ${story.autor_nome}`,
    },
    text: story.texto,
    author: story.autor_nome,
    animalName,
  };
}

/*
 * COMPONENTE: StoryAuthor (interno)
 * O que faz: mostra quem contou a história e qual animal adotou.
 * Parâmetros (props): story (objeto no formato de toStory).
 * Retorno: <p> com "Autor · adotou Animal" (a segunda parte só se houver animal).
 * Onde é usado: no destaque e nos cartões menores.
 */
function StoryAuthor({ story }) {
  return (
    <p className="home-story-who">
      <strong>{story.author}</strong>
      {/* Só acrescenta "· adotou ..." se houver nome do animal; senão, texto vazio. */}
      {story.animalName ? ` · adotou ${story.animalName}` : ''}
    </p>
  );
}

/*
 * COMPONENTE: Stories
 * O que faz: busca as histórias e desenha o destaque e os cartões.
 * Parâmetros: nenhum.
 * Retorno: JSX da <section id="historias">, ou null se não houver histórias.
 * Onde é usado: LandingPage.jsx.
 */
function Stories() {
  // Lista de histórias já convertidas (começa vazia).
  const [stories, setStories] = useState([]);

  // Busca as histórias uma vez ao montar.
  useEffect(() => {
    // Permite cancelar a requisição.
    const controller = new AbortController();
    buscarHistorias({ signal: controller.signal })
      .then((historias) => {
        // Converte cada história com toStory e guarda (se não foi cancelado).
        if (!controller.signal.aborted) setStories(historias.map(toStory));
      })
      // Erro: a lista fica vazia e a seção simplesmente não aparece.
      .catch(() => {});
    // Limpeza: cancela a requisição.
    return () => controller.abort();
  }, []);

  // Sem histórias, o componente não desenha nada (return null = "nada na tela").
  if (stories.length === 0) return null;

  // Desestruturação com "rest": a 1ª história vai para "featured" e o resto para "others".
  const [featured, ...others] = stories;
  // Das demais, pega no máximo 2.
  const compact = others.slice(0, MAX_COMPACT);

  return (
    // id="historias": alvo dos links "/#historias".
    <section id="historias" className="home-section home-stories" aria-labelledby="stories-title">
      <div className="wrap">
        {/* Cabeçalho da seção. */}
        <div className="home-head home-stories-head">
          <p className="home-eyebrow">Finais felizes</p>
          <h2 id="stories-title" className="home-title">Histórias de quem encontrou um lar</h2>
        </div>

        {/* ===== História em destaque ===== */}
        <article className="home-story-featured">
          {/* Foto (ou substituto). PetPhoto recebe { image, alt } em "pet". */}
          <div className="home-story-photo">
            <PetPhoto pet={featured.photo} loading="lazy" />
          </div>
          <div className="home-story-body">
            {/* Aspas grandes decorativas. */}
            <span className="home-story-mark" aria-hidden="true">“</span>
            {/* <blockquote> é a tag semântica para citações. */}
            <blockquote className="home-story-quote">{featured.text}</blockquote>
            <StoryAuthor story={featured} />
          </div>
        </article>

        {/* ===== Cartões menores (se houver) ===== */}
        {compact.length > 0 ? (
          <div className="home-story-grid">
            {compact.map((story) => (
              <article className="home-story-card" key={story.id}>
                <blockquote className="home-story-card-quote">{story.text}</blockquote>
                <StoryAuthor story={story} />
              </article>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}

// Exporta a seção como padrão do arquivo.
export default Stories;

/*
 * ============================================================================
 * RESUMO DO ARQUIVO
 * ============================================================================
 *
 * COMO O FLUXO FUNCIONA:
 *   1. Ao montar, a seção busca as histórias publicadas na API.
 *   2. Cada história é convertida por toStory (escolhendo a foto e o texto alternativo).
 *   3. Se não houver histórias (ou der erro), a seção não aparece.
 *   4. A primeira vira destaque; até duas outras aparecem em cartões menores.
 *
 * CONCEITOS IMPORTANTES PARA ESTUDAR:
 *   - "return null" para não renderizar nada.
 *   - Desestruturação de arrays com rest ([primeiro, ...resto]).
 *   - Adaptar dados da API para o formato de um componente reutilizado (PetPhoto).
 *   - Busca de dados com useEffect + AbortController.
 *   - HTML semântico: <article>, <blockquote>.
 *   - Componentes pequenos reutilizados dentro do arquivo (StoryAuthor).
 * ============================================================================
 */
