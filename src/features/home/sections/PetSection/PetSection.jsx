// O quê: vitrine da Home com 4 animais (urgentes primeiro) e o link para o catálogo completo.
// Como: recebe a lista já carregada pela Home (useAvailableAnimals) e mostra carregando, erro ou vazio.
// Para quê: apresentar quem precisa de um lar sem transformar a Home num catálogo.
import './PetSection.css';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { AnimalCard } from 'shared/components/AnimalCard/AnimalCard';

const SHOWCASE_SIZE = 4;

// Urgentes primeiro, mantendo a ordem da API dentro de cada grupo.
export function pickShowcase(pets, size = SHOWCASE_SIZE) {
  return [...pets.filter((pet) => pet.urgent), ...pets.filter((pet) => !pet.urgent)].slice(0, size);
}

export function PetSection({ pets = [], loading = false, error = null }) {
  const showcase = pickShowcase(pets);

  return (
    <section id="adotar" className="home-section home-pets" aria-labelledby="pets-title">
      <div className="wrap home-pets-layout">
        <div className="home-head">
          <p className="home-eyebrow">Para adoção</p>
          <h2 id="pets-title" className="home-title">Quem está esperando por você</h2>
          <p className="home-lead">Os casos urgentes aparecem primeiro. Cada perfil tem fotos, saúde e temperamento.</p>
        </div>

        {pets.length > 0 ? (
          <Link to="/adotar" className="home-btn home-btn--ghost home-pets-more">
            {pets.length === 1 ? 'Ver o animal disponível' : `Ver todos os ${pets.length} animais`}
            <ArrowRight size={18} aria-hidden="true" />
          </Link>
        ) : null}

        {loading ? <p className="home-pets-state" role="status">Carregando os animais…</p> : null}
        {error ? <p className="home-pets-state is-error" role="alert">{error}</p> : null}
        {!loading && !error && pets.length === 0 ? (
          <p className="home-pets-state">Nenhum animal disponível agora. Volte em breve!</p>
        ) : null}

        {showcase.length > 0 ? (
          <div className="home-pets-grid">
            {showcase.map((pet) => <AnimalCard key={pet.id ?? pet.name} pet={pet} />)}
          </div>
        ) : null}
      </div>
    </section>
  );
}

export default PetSection;
