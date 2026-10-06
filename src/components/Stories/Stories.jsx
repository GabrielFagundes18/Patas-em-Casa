// O quê: importa estado, efeitos, foto com alternativa, serviço de conteúdo e estilos da seção.
// Como: as histórias publicadas vêm do backend e são exibidas em cards.
// Para quê: mostrar no site os depoimentos reais cadastrados pela equipe.
import { useEffect, useState } from 'react';
import { PetPhoto } from '../PetPhoto/PetPhoto';
import { buscarHistorias } from '../../services/conteudoService';
import './Stories.css';

// O quê: adapta uma história da API para o card.
// Como: usa a foto da história ou do animal; sem foto, PetPhoto mostra o quadro com a pata.
// Para quê: manter o card completo mesmo quando não há imagem cadastrada.
function toCard(story) {
  const animalName = story.animal?.nome;
  return {
    id: story.id,
    photo: {
      image: story.foto_url || story.animal?.foto_url || '',
      alt: animalName ? `${animalName} no novo lar` : `História contada por ${story.autor_nome}`,
    },
    quote: `"${story.texto}"`,
    author: `— ${story.autor_nome}${animalName ? `, adotou ${animalName}` : ''}`,
  };
}

function Stories() {
  // O quê: guarda as histórias publicadas.
  // Como: começa vazio; a seção só aparece quando houver histórias para mostrar.
  // Para quê: não exibir depoimentos inventados nem uma seção vazia.
  const [stories, setStories] = useState([]);

  useEffect(() => {
    const controller = new AbortController();
    buscarHistorias({ signal: controller.signal })
      .then((historias) => {
        if (!controller.signal.aborted) setStories(historias.map(toCard));
      })
      .catch(() => {});
    return () => controller.abort();
  }, []);

  if (stories.length === 0) return null;

  // O quê: renderiza o título da seção e os cards de depoimentos.
  // Como: map transforma cada história em uma composição de imagem e texto.
  // Para quê: mostrar resultados concretos da atuação da organização.
  return (
    <section id="historias">
      <div className="wrap">
        <div className="section-head">
          <span className="eyebrow">Mural do impacto</span>
          <h2>Histórias de quem já tem um novo lar</h2>
        </div>
        <div className="impact-grid">
          {stories.map((story) => (
            <div className="impact-card" key={story.id}>
              <div className="impact-photo">
                <PetPhoto pet={story.photo} loading="lazy" />
              </div>
              <div className="impact-body">
                <p className="impact-quote">{story.quote}</p>
                <p className="impact-who">{story.author}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Stories;
