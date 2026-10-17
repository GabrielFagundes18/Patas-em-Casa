/*
 * ============================================================================
 * ARQUIVO: AnimalProfilePage.jsx
 * ============================================================================
 *
 * PARA QUE SERVE:
 *   É a PÁGINA DE PERFIL de um animal (/animais/:id). Mostra a galeria de fotos,
 *   os dados (espécie, raça, porte, sexo, idade), temperamento, descrição, saúde
 *   e data de chegada, além dos botões "Quero adotar" (abre o formulário de
 *   adoção) e "Compartilhar". Também trata os casos especiais:
 *     - carregando; animal não encontrado (404); animal já adotado (410); erro de conexão.
 *
 * PRINCIPAIS ITENS:
 *   - entryDateFormatter / formatEntryDate(date): formata a data de chegada.
 *   - SHARE_MESSAGES: mensagens após compartilhar.
 *   - Gallery({ pet }): galeria de fotos com miniaturas (interna).
 *   - AnimalProfilePage(): o componente da página (exportado como padrão).
 *
 * CONEXÕES COM OUTROS ARQUIVOS:
 *   - react, react-router-dom (Link, useParams), framer-motion (AnimatePresence), lucide-react.
 *   - shared/components/layout/PublicLayout             → cabeçalho e rodapé.
 *   - features/adoption/AdoptionFormModal/AdoptionFormModal → formulário de adoção.
 *   - api/animals.js                                    → buscarAnimal (GET /api/v1/public/animals/:id).
 *   - shared/utils/petMapper.js                         → mapPetFromApi.
 *   - shared/utils/sharePet.js                          → compartilhar.
 *   - ./AnimalProfilePage.css                           → estilos.
 *   - Quem usa: app/App.js (rota /animais/:id); os cartões (AnimalCard) linkam para cá.
 * ============================================================================
 */

// O quê: perfil público de um animal em /animais/:id.
// Como: busca o animal na API pública (fotos, temperamento, saúde) e abre o formulário de adoção na própria página.
// Para quê: ter um endereço próprio para divulgar cada animal e tratar animal inexistente (404) ou já adotado (410).
// Hooks do React.
import { useEffect, useState } from 'react';
// Link (navegação) e useParams (lê o ":id" da URL).
import { Link, useParams } from 'react-router-dom';
// Permite animar a saída do formulário de adoção.
import { AnimatePresence } from 'framer-motion';
// Ícones: calendário, coração, pata, compartilhar, estetoscópio e seringa.
import { CalendarDays, Heart, PawPrint, Share2, Stethoscope, Syringe } from 'lucide-react';
// Moldura com cabeçalho e rodapé.
import { PublicLayout } from 'shared/components/layout/PublicLayout/PublicLayout';
// Formulário (modal) de adoção.
import { AdoptionFormModal } from 'features/adoption/AdoptionFormModal/AdoptionFormModal';
// Busca um animal na API pública.
import { buscarAnimal } from 'api/animals';
// Converte o formato da API para o formato da interface.
import { mapPetFromApi } from 'shared/utils/petMapper';
// Compartilhar a página do animal.
import { sharePet } from 'shared/utils/sharePet';
// Estilos da página.
import './AnimalProfilePage.css';

// Formatador de datas em português, ex.: "23 de agosto de 2026".
// timeZone: 'UTC' evita que o fuso horário mude o dia (uma data "pura" não tem horário).
// Criado uma vez fora do componente (criar formatadores é relativamente caro).
const entryDateFormatter = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

/*
 * FUNÇÃO: formatEntryDate
 * O que faz: transforma a data de chegada (AAAA-MM-DD) em texto por extenso.
 * Parâmetros: date (string | null) — ex.: '2026-08-23'.
 * Retorno (string): ex.: '23 de agosto de 2026', ou 'Data não informada' se faltar ou for inválida.
 * Onde é usada: na lista "Saúde e chegada".
 */
function formatEntryDate(date) {
  // Sem data → texto padrão.
  if (!date) return 'Data não informada';
  // Monta a data à meia-noite em UTC ("Z" = UTC).
  const parsed = new Date(`${date}T00:00:00Z`);
  // valueOf() de uma data inválida é NaN; Number.isNaN detecta isso.
  return Number.isNaN(parsed.valueOf()) ? 'Data não informada' : entryDateFormatter.format(parsed);
}

// Mensagens mostradas depois de compartilhar, por resultado (o "cancelled" não tem mensagem).
const SHARE_MESSAGES = {
  shared: 'Obrigado por divulgar!',
  copied: 'Link copiado. É só colar onde quiser divulgar.',
  failed: 'Não foi possível compartilhar. Copie o endereço da página.',
};

/*
 * COMPONENTE: Gallery (interno)
 * O que faz: mostra a foto selecionada e, se houver mais de uma, miniaturas para trocar.
 * Parâmetros (props): pet (animal do petMapper; usa pet.photos e pet.alt).
 * Retorno: JSX da galeria, ou um quadro "Foto em breve" se não houver fotos.
 * Onde é usado: na página de perfil.
 */
function Gallery({ pet }) {
  // Índice da foto exibida (começa na primeira, a principal).
  const [current, setCurrent] = useState(0);
  // Foto atual (undefined se a lista estiver vazia).
  const photo = pet.photos[current];

  // Sem fotos: quadro substituto (role="img" com descrição).
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
      {/* Foto principal, com texto alternativo indicando a posição (ex.: "foto 1 de 3"). */}
      <img className="profile-photo" src={photo.url} alt={`${pet.alt} (foto ${current + 1} de ${pet.photos.length})`} />
      {/* Miniaturas só quando há mais de uma foto. */}
      {pet.photos.length > 1 ? (
        <div className="profile-thumbs" aria-label="Escolher foto">
          {pet.photos.map((item, index) => (
            <button
              // aria-current marca a miniatura da foto exibida (undefined = atributo ausente).
              aria-current={index === current ? 'true' : undefined}
              aria-label={`Ver foto ${index + 1}`}
              className="profile-thumb"
              key={item.id}
              // Clicar troca a foto exibida.
              onClick={() => setCurrent(index)}
              type="button"
            >
              {/* alt="" porque o botão já tem aria-label; loading="lazy" adia o download. */}
              <img alt="" loading="lazy" src={item.url} />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/*
 * COMPONENTE: AnimalProfilePage
 * O que faz: busca o animal pelo id da URL e desenha o perfil (ou a mensagem do caso especial).
 * Parâmetros: nenhum (o id vem da URL via useParams).
 * Retorno: JSX da página dentro do PublicLayout.
 * Onde é usado: App.js, rota /animais/:id.
 */
export default function AnimalProfilePage() {
  // Lê o parâmetro ":id" da rota.
  const { id } = useParams();
  // Estado da página: { status: 'loading' | 'ready' | 'missing' | 'gone' | 'error', pet?, message? }.
  const [state, setState] = useState({ status: 'loading' });
  // Contador para "tentar novamente" (muda → o efeito busca de novo).
  const [reloadKey, setReloadKey] = useState(0);
  // O formulário de adoção está aberto?
  const [formOpen, setFormOpen] = useState(false);
  // Mensagem após compartilhar.
  const [shareMessage, setShareMessage] = useState('');

  // O quê: carrega o perfil quando o id muda; 404 e 410 viram estados próprios, demais falhas viram "erro".
  useEffect(() => {
    // Permite cancelar a busca se o id mudar ou a página fechar.
    const controller = new AbortController();
    // Volta para "carregando".
    setState({ status: 'loading' });
    buscarAnimal(id, { signal: controller.signal })
      // Sucesso: converte o animal e marca como pronto.
      .then((animal) => setState({ status: 'ready', pet: mapPetFromApi(animal) }))
      .catch((error) => {
        // Cancelado: ignora.
        if (controller.signal.aborted) return;
        // Código HTTP da resposta de erro.
        const status = error?.response?.status;
        // 410 (Gone) = o animal já foi adotado; o backend manda uma mensagem com o nome.
        if (status === 410) setState({ status: 'gone', message: error.response.data?.error?.message });
        // 404 (não existe) ou 422 (id inválido) = não encontrado.
        else if (status === 404 || status === 422) setState({ status: 'missing' });
        // Qualquer outra falha (ex.: sem internet) = erro.
        else setState({ status: 'error' });
      });
    // Limpeza: cancela a requisição.
    return () => controller.abort();
  }, [id, reloadKey]);

  // Quando o perfil carrega, muda o título da aba do navegador (ex.: "Nino | Patas em Casa").
  useEffect(() => {
    if (state.status === 'ready') document.title = `${state.pet.name} | Patas em Casa`;
  }, [state]);

  /*
   * FUNÇÃO INTERNA: handleShare
   * O que faz: compartilha a página e mostra a mensagem correspondente ao resultado.
   * Parâmetros: nenhum. Retorno: Promise (async), sem valor útil.
   */
  async function handleShare() {
    const result = await sharePet(state.pet);
    // Mensagem do resultado (ou vazia, se cancelado).
    setShareMessage(SHARE_MESSAGES[result.status] || '');
  }

  // ===== Estados especiais (carregando, não encontrado, adotado, erro) =====
  if (state.status !== 'ready') {
    // Título e texto de cada estado (o objeto é indexado pelo status atual).
    const content = {
      loading: { title: 'Carregando o perfil...', text: '' },
      missing: { title: 'Não encontramos este animal', text: 'O link pode estar incompleto ou o perfil foi removido.' },
      gone: { title: state.message || 'Este animal já encontrou um lar.', text: 'Outros animais continuam esperando por uma família.' },
      error: { title: 'Não foi possível carregar o perfil', text: 'Verifique sua conexão e tente de novo.' },
    }[state.status];

    return (
      <PublicLayout>
        <section>
          {/* Enquanto carrega: role="status" e aria-busy avisam leitores de tela. */}
          <div className="wrap public-state" role={state.status === 'loading' ? 'status' : undefined} aria-busy={state.status === 'loading'}>
            <span className="eyebrow">{state.status === 'gone' ? 'Adoção concluída' : 'Perfil do animal'}</span>
            <h1>{content.title}</h1>
            {/* Texto só se houver. */}
            {content.text ? <p>{content.text}</p> : null}
            {/* Botões (não aparecem durante o carregamento). */}
            {state.status !== 'loading' ? (
              <div className="public-state-actions">
                {/* "Tentar novamente" só no erro de conexão. */}
                {state.status === 'error' ? (
                  <button className="btn btn-primary" onClick={() => setReloadKey((key) => key + 1)} type="button">Tentar novamente</button>
                ) : null}
                {/* Link para o catálogo (vira secundário quando há o botão de tentar de novo). */}
                <Link to="/adotar" className={state.status === 'error' ? 'btn btn-secondary' : 'btn btn-primary'}>Ver animais para adoção</Link>
              </div>
            ) : null}
          </div>
        </section>
      </PublicLayout>
    );
  }

  // ===== Perfil carregado =====
  // Desestrutura o animal do estado.
  const { pet } = state;
  // Artigo antes do nome ("o Nino", "a Mel"; vazio se o sexo for desconhecido).
  const article = pet.sex === 'Macho' ? 'o ' : pet.sex === 'Fêmea' ? 'a ' : '';
  // Descrição dividida em parágrafos: separa por uma ou mais quebras de linha (/\n+/),
  // tira espaços e remove os vazios.
  const paragraphs = pet.descricao.split(/\n+/).map((paragraph) => paragraph.trim()).filter(Boolean);
  // Ficha técnica: lista de pares [rótulo, valor].
  const specs = [
    ['Espécie', pet.species],
    ['Raça', pet.breed],
    ['Porte', pet.size ?? 'Não informado'],
    ['Sexo', pet.sex ?? 'Não informado'],
    ['Idade', pet.ageLabel || 'Não informada'],
  ];
  // Saúde e chegada: cada item tem o componente do ícone, o título e o detalhe.
  const facts = [
    { icon: Syringe, title: 'Vacinação', detail: pet.vacinado ? 'Em dia' : 'Pendente' },
    { icon: Stethoscope, title: 'Castração', detail: pet.castrado ? 'Realizada' : 'Pendente' },
    { icon: CalendarDays, title: 'Chegada à ONG', detail: formatEntryDate(pet.entryDate) },
  ];

  return (
    <PublicLayout className="animal-profile">
      <section>
        <div className="wrap">
          {/* "Breadcrumb" (trilha de navegação): Animais para adoção / Nome.
              aria-current="page" indica a página atual. */}
          <nav className="profile-breadcrumb" aria-label="Você está em">
            <Link to="/adotar">Animais para adoção</Link> <span aria-hidden="true">/</span> <span aria-current="page">{pet.name}</span>
          </nav>

          {/* Grade principal: galeria à esquerda, informações à direita. */}
          <div className="profile-grid">
            <Gallery pet={pet} />

            <div className="profile-info">
              {/* Selo de status (classe is-urgent para casos urgentes). */}
              <span className={`profile-status ${pet.urgent ? 'is-urgent' : ''}`}>{pet.urgent ? 'Urgente' : 'Disponível para adoção'}</span>
              <h1>{pet.name}</h1>
              {/* Linha de resumo (ex.: "Cachorro • SRD • 2 anos • Porte médio"). */}
              <p className="profile-meta">{pet.meta}</p>

              {/* <dl> = lista de definições: <dt> é o termo e <dd> é o valor.
                  ([label, value]) desestrutura cada par da lista specs. */}
              <dl className="profile-specs">
                {specs.map(([label, value]) => (
                  <div key={label}><dt>{label}</dt><dd>{value}</dd></div>
                ))}
              </dl>

              {/* Temperamento (só se houver traços). */}
              {pet.temperament.length > 0 ? (
                <div className="profile-block">
                  <h2>Temperamento</h2>
                  <ul className="profile-traits">
                    {pet.temperament.map((trait) => <li key={trait}>{trait}</li>)}
                  </ul>
                </div>
              ) : null}

              {/* Ações: adotar (abre o formulário) e compartilhar. */}
              <div className="profile-actions">
                <button className="btn btn-primary" onClick={() => setFormOpen(true)} type="button">
                  <Heart aria-hidden="true" size={17} /> Quero adotar {article}{pet.name}
                </button>
                <button className="btn btn-secondary" onClick={handleShare} type="button">
                  <Share2 aria-hidden="true" size={17} /> Compartilhar
                </button>
              </div>
              {/* Mensagem do compartilhamento; aria-live anuncia quando muda. */}
              <p aria-live="polite" className="profile-share-message">{shareMessage}</p>
            </div>
          </div>

          {/* Detalhes: descrição e saúde. */}
          <div className="profile-details">
            <div className="profile-block">
              <h2>Sobre {article}{pet.name}</h2>
              {/* Um <p> por parágrafo; sem descrição, um texto padrão. */}
              {paragraphs.length > 0
                ? paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)
                : <p>{pet.name} ainda não tem uma descrição. Envie seu interesse para conversar com a equipe sobre a personalidade e a rotina.</p>}
            </div>

            <div className="profile-block">
              <h2>Saúde e chegada</h2>
              <ul className="profile-facts">
                {/* { icon: Icon } renomeia "icon" para "Icon" (com maiúscula, para usar como <Icon />). */}
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

      {/* Formulário de adoção em modal; AnimatePresence permite a animação de saída ao fechar. */}
      <AnimatePresence>
        {formOpen ? <AdoptionFormModal onClose={() => setFormOpen(false)} pet={pet} /> : null}
      </AnimatePresence>
    </PublicLayout>
  );
}

/*
 * ============================================================================
 * RESUMO DO ARQUIVO
 * ============================================================================
 *
 * COMO O FLUXO FUNCIONA:
 *   1. A página lê o id da URL e busca o animal na API (estado "loading").
 *   2. Conforme a resposta: "ready" (mostra o perfil), "gone" (410, já adotado),
 *      "missing" (404/422) ou "error" (com botão "Tentar novamente").
 *   3. Com o perfil pronto: muda o título da aba, mostra galeria, ficha, temperamento,
 *      descrição e saúde.
 *   4. "Quero adotar" abre o AdoptionFormModal; "Compartilhar" usa sharePet e mostra
 *      uma mensagem.
 *
 * CONCEITOS IMPORTANTES PARA ESTUDAR:
 *   - Rotas com parâmetros (useParams) e busca por id.
 *   - Máquina de estados simples na interface (loading/ready/missing/gone/error).
 *   - Códigos HTTP 404, 410 e 422 tratados de forma diferente.
 *   - Intl.DateTimeFormat e cuidado com fuso horário (UTC).
 *   - document.title dinâmico.
 *   - HTML semântico: breadcrumb (<nav>), <dl>/<dt>/<dd>, aria-current.
 *   - Galeria com estado de índice e miniaturas.
 *   - split com expressão regular (/\n+/) para dividir parágrafos.
 * ============================================================================
 */
