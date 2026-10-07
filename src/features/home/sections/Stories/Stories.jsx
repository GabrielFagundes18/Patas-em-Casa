// O quê: histórias de adoção publicadas pela equipe (Painel › Histórias).
// Como: a primeira aparece em destaque (foto e citação grande); até duas outras ficam em cartões menores.
// Sem nenhuma história publicada, a seção não aparece.
// Para quê: mostrar resultados reais, sem depoimentos inventados nem seção vazia.
import { useEffect, useState } from 'react';
import { PetPhoto } from 'shared/components/PetPhoto/PetPhoto';
import { buscarHistorias } from 'api/content';
import './Stories.css';

const MAX_COMPACT = 2;

// Usa a foto da história ou a do animal; sem foto, PetPhoto mostra o quadro com a pata.
function toStory(story) {
  const animalName = story.animal?.nome || null;
  return {
    id: story.id,
    photo: {
      image: story.foto_url || story.animal?.foto_url || '',
      alt: animalName ? `${animalName} no novo lar` : `História contada por ${story.autor_nome}`,
    },
    text: story.texto,
    author: story.autor_nome,
    animalName,
  };
}

function StoryAuthor({ story }) {
  return (
    <p className="home-story-who">
      <strong>{story.author}</strong>
      {story.animalName ? ` · adotou ${story.animalName}` : ''}
    </p>
  );
}

function Stories() {
  const [stories, setStories] = useState([]);

  useEffect(() => {
    const controller = new AbortController();
    buscarHistorias({ signal: controller.signal })
      .then((historias) => {
        if (!controller.signal.aborted) setStories(historias.map(toStory));
      })
      .catch(() => {});
    return () => controller.abort();
  }, []);

  if (stories.length === 0) return null;

  const [featured, ...others] = stories;
  const compact = others.slice(0, MAX_COMPACT);

  return (
    <section id="historias" className="home-section home-stories" aria-labelledby="stories-title">
      <div className="wrap">
        <div className="home-head home-stories-head">
          <p className="home-eyebrow">Finais felizes</p>
          <h2 id="stories-title" className="home-title">Histórias de quem encontrou um lar</h2>
        </div>

        <article className="home-story-featured">
          <div className="home-story-photo">
            <PetPhoto pet={featured.photo} loading="lazy" />
          </div>
          <div className="home-story-body">
            <span className="home-story-mark" aria-hidden="true">“</span>
            <blockquote className="home-story-quote">{featured.text}</blockquote>
            <StoryAuthor story={featured} />
          </div>
        </article>

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

export default Stories;
