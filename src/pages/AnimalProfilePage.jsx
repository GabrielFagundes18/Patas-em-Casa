// O quê: perfil público de um animal em /animais/:id.
// Como: busca o animal na API pública (fotos, temperamento, saúde) e abre o formulário de adoção na própria página.
// Para quê: ter um endereço próprio para divulgar cada animal e tratar animal inexistente (404) ou já adotado (410).
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { CalendarDays, Heart, PawPrint, Share2, Stethoscope, Syringe } from 'lucide-react';
import { PublicLayout } from '../components/PublicLayout/PublicLayout';
import { AdoptionFormModal } from '../components/AdoptionFormModal/AdoptionFormModal';
import { buscarAnimal } from '../services/animaisService';
import { mapPetFromApi } from '../utils/petMapper';
import { sharePet } from '../utils/sharePet';
import './AnimalProfilePage.css';

const entryDateFormatter = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

function formatEntryDate(date) {
  if (!date) return 'Data não informada';
  const parsed = new Date(`${date}T00:00:00Z`);
  return Number.isNaN(parsed.valueOf()) ? 'Data não informada' : entryDateFormatter.format(parsed);
}

const SHARE_MESSAGES = {
  shared: 'Obrigado por divulgar!',
  copied: 'Link copiado. É só colar onde quiser divulgar.',
  failed: 'Não foi possível compartilhar. Copie o endereço da página.',
};

function Gallery({ pet }) {
  const [current, setCurrent] = useState(0);
  const photo = pet.photos[current];

  if (!photo) {
    return (
      <div className="profile-photo profile-photo-empty" role="img" aria-label={pet.alt}>
        <PawPrint size={48} aria-hidden="true" />
        <span>Foto em breve</span>
      </div>
    );
  }

  return (
    <div className="profile-gallery">
      <img className="profile-photo" src={photo.url} alt={`${pet.alt} (foto ${current + 1} de ${pet.photos.length})`} />
      {pet.photos.length > 1 ? (
        <div className="profile-thumbs" aria-label="Escolher foto">
          {pet.photos.map((item, index) => (
            <button
              aria-current={index === current ? 'true' : undefined}
              aria-label={`Ver foto ${index + 1}`}
              className="profile-thumb"
              key={item.id}
              onClick={() => setCurrent(index)}
              type="button"
            >
              <img alt="" loading="lazy" src={item.url} />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default function AnimalProfilePage() {
  const { id } = useParams();
  const [state, setState] = useState({ status: 'loading' });
  const [reloadKey, setReloadKey] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [shareMessage, setShareMessage] = useState('');

  // O quê: carrega o perfil quando o id muda; 404 e 410 viram estados próprios, demais falhas viram "erro".
  useEffect(() => {
    const controller = new AbortController();
    setState({ status: 'loading' });
    buscarAnimal(id, { signal: controller.signal })
      .then((animal) => setState({ status: 'ready', pet: mapPetFromApi(animal) }))
      .catch((error) => {
        if (controller.signal.aborted) return;
        const status = error?.response?.status;
        if (status === 410) setState({ status: 'gone', message: error.response.data?.error?.message });
        else if (status === 404 || status === 422) setState({ status: 'missing' });
        else setState({ status: 'error' });
      });
    return () => controller.abort();
  }, [id, reloadKey]);

  useEffect(() => {
    if (state.status === 'ready') document.title = `${state.pet.name} | Patas em Casa`;
  }, [state]);

  async function handleShare() {
    const result = await sharePet(state.pet);
    setShareMessage(SHARE_MESSAGES[result.status] || '');
  }

  if (state.status !== 'ready') {
    const content = {
      loading: { title: 'Carregando o perfil...', text: '' },
      missing: { title: 'Não encontramos este animal', text: 'O link pode estar incompleto ou o perfil foi removido.' },
      gone: { title: state.message || 'Este animal já encontrou um lar.', text: 'Outros animais continuam esperando por uma família.' },
      error: { title: 'Não foi possível carregar o perfil', text: 'Verifique sua conexão e tente de novo.' },
    }[state.status];

    return (
      <PublicLayout>
        <section>
          <div className="wrap public-state" role={state.status === 'loading' ? 'status' : undefined} aria-busy={state.status === 'loading'}>
            <span className="eyebrow">{state.status === 'gone' ? 'Adoção concluída' : 'Perfil do animal'}</span>
            <h1>{content.title}</h1>
            {content.text ? <p>{content.text}</p> : null}
            {state.status !== 'loading' ? (
              <div className="public-state-actions">
                {state.status === 'error' ? (
                  <button className="btn btn-primary" onClick={() => setReloadKey((key) => key + 1)} type="button">Tentar novamente</button>
                ) : null}
                <Link to="/adotar" className={state.status === 'error' ? 'btn btn-secondary' : 'btn btn-primary'}>Ver animais para adoção</Link>
              </div>
            ) : null}
          </div>
        </section>
      </PublicLayout>
    );
  }

  const { pet } = state;
  const article = pet.sex === 'Macho' ? 'o ' : pet.sex === 'Fêmea' ? 'a ' : '';
  const paragraphs = pet.descricao.split(/\n+/).map((paragraph) => paragraph.trim()).filter(Boolean);
  const specs = [
    ['Espécie', pet.species],
    ['Raça', pet.breed],
    ['Porte', pet.size ?? 'Não informado'],
    ['Sexo', pet.sex ?? 'Não informado'],
    ['Idade', pet.ageLabel || 'Não informada'],
  ];
  const facts = [
    { icon: Syringe, title: 'Vacinação', detail: pet.vacinado ? 'Em dia' : 'Pendente' },
    { icon: Stethoscope, title: 'Castração', detail: pet.castrado ? 'Realizada' : 'Pendente' },
    { icon: CalendarDays, title: 'Chegada à ONG', detail: formatEntryDate(pet.entryDate) },
  ];

  return (
    <PublicLayout className="animal-profile">
      <section>
        <div className="wrap">
          <nav className="profile-breadcrumb" aria-label="Você está em">
            <Link to="/adotar">Animais para adoção</Link> <span aria-hidden="true">/</span> <span aria-current="page">{pet.name}</span>
          </nav>

          <div className="profile-grid">
            <Gallery pet={pet} />

            <div className="profile-info">
              <span className={`profile-status ${pet.urgent ? 'is-urgent' : ''}`}>{pet.urgent ? 'Urgente' : 'Disponível para adoção'}</span>
              <h1>{pet.name}</h1>
              <p className="profile-meta">{pet.meta}</p>

              <dl className="profile-specs">
                {specs.map(([label, value]) => (
                  <div key={label}><dt>{label}</dt><dd>{value}</dd></div>
                ))}
              </dl>

              {pet.temperament.length > 0 ? (
                <div className="profile-block">
                  <h2>Temperamento</h2>
                  <ul className="profile-traits">
                    {pet.temperament.map((trait) => <li key={trait}>{trait}</li>)}
                  </ul>
                </div>
              ) : null}

              <div className="profile-actions">
                <button className="btn btn-primary" onClick={() => setFormOpen(true)} type="button">
                  <Heart aria-hidden="true" size={17} /> Quero adotar {article}{pet.name}
                </button>
                <button className="btn btn-secondary" onClick={handleShare} type="button">
                  <Share2 aria-hidden="true" size={17} /> Compartilhar
                </button>
              </div>
              <p aria-live="polite" className="profile-share-message">{shareMessage}</p>
            </div>
          </div>

          <div className="profile-details">
            <div className="profile-block">
              <h2>Sobre {article}{pet.name}</h2>
              {paragraphs.length > 0
                ? paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)
                : <p>{pet.name} ainda não tem uma descrição. Envie seu interesse para conversar com a equipe sobre a personalidade e a rotina.</p>}
            </div>

            <div className="profile-block">
              <h2>Saúde e chegada</h2>
              <ul className="profile-facts">
                {facts.map(({ icon: Icon, title, detail }) => (
                  <li key={title}>
                    <span aria-hidden="true"><Icon size={16} /></span>
                    <strong>{title}</strong>
                    <small>{detail}</small>
                  </li>
                ))}
              </ul>
              <p className="profile-note">
                Quer saber como funciona? Veja o <Link to="/como-funciona">passo a passo da adoção</Link>.
              </p>
            </div>
          </div>
        </div>
      </section>

      <AnimatePresence>
        {formOpen ? <AdoptionFormModal onClose={() => setFormOpen(false)} pet={pet} /> : null}
      </AnimatePresence>
    </PublicLayout>
  );
}
