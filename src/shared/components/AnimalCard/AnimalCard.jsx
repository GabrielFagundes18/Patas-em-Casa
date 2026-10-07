// O quê: cartão de um animal, o mesmo na vitrine da Home e no catálogo.
// Como: foto (ou "Foto em breve"), selo de urgente, dados básicos, tempo de espera, temperamento e cuidados.
// Favoritar e compartilhar só aparecem quando a tela passa as funções (o catálogo passa; a Home não).
// Para quê: um visual só para o animal em todo o site, sempre levando à ficha completa (/animais/:id).
import './AnimalCard.css';
import { Link } from 'react-router-dom';
import { ArrowRight, Clock3, Heart, Share2 } from 'lucide-react';
import { PetPhoto } from 'shared/components/PetPhoto/PetPhoto';
import { artigo, concordar, especieDoAnimal, tempoDeEspera } from 'shared/utils/petText';

const MAX_TRAITS = 3;

export function AnimalCard({ pet, headingLevel = 3, isFavorite = false, onToggleFavorite, onShare }) {
  const Heading = `h${headingLevel}`;
  const meta = [especieDoAnimal(pet), pet.sex, pet.ageLabel, pet.size ? `Porte ${pet.size.toLowerCase()}` : null]
    .filter(Boolean)
    .join(' · ');
  const waiting = tempoDeEspera(pet.entryDate);
  const traits = (pet.temperament ?? []).slice(0, MAX_TRAITS);
  const cuidados = [
    pet.castrado ? concordar(pet, 'Castrado') : null,
    pet.vacinado ? concordar(pet, 'Vacinado') : null,
  ].filter(Boolean);

  return (
    <article className="animal-card">
      <div className="animal-card-photo">
        <PetPhoto pet={pet} loading="lazy" />
        {pet.urgent ? <span className="animal-card-badge">Urgente</span> : null}
        {onToggleFavorite ? (
          <button
            type="button"
            className={`animal-card-fav ${isFavorite ? 'is-active' : ''}`.trim()}
            aria-pressed={isFavorite}
            aria-label={`Favoritar ${pet.name}`}
            title={isFavorite ? 'Tirar dos favoritos' : 'Favoritar'}
            onClick={() => onToggleFavorite(pet)}
          >
            <Heart size={20} fill={isFavorite ? 'currentColor' : 'none'} aria-hidden="true" />
          </button>
        ) : null}
      </div>

      <div className="animal-card-body">
        <Heading className="animal-card-name">{pet.name}</Heading>
        <p className="animal-card-meta">{meta}</p>
        {waiting ? (
          <p className="animal-card-waiting">
            <Clock3 size={14} aria-hidden="true" />
            {waiting}
          </p>
        ) : null}
        {pet.descricao ? <p className="animal-card-desc">{pet.descricao}</p> : null}
        {traits.length + cuidados.length > 0 ? (
          <ul className="animal-card-tags" aria-label="Temperamento e cuidados">
            {traits.map((trait) => <li className="is-trait" key={`trait-${trait}`}>{trait}</li>)}
            {cuidados.map((cuidado) => <li key={cuidado}>{cuidado}</li>)}
          </ul>
        ) : null}

        <div className="animal-card-footer">
          <Link to={pet.id ? `/animais/${encodeURIComponent(pet.id)}` : '/adotar'} className="animal-card-link">
            Conhecer {artigo(pet)}{' '}
            <span className="animal-card-link-end">
              {pet.name}
              <ArrowRight size={16} aria-hidden="true" />
            </span>
          </Link>
          {onShare ? (
            <button type="button" className="animal-card-share" aria-label={`Compartilhar ${pet.name}`} onClick={() => onShare(pet)}>
              <Share2 size={17} aria-hidden="true" />
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
}
