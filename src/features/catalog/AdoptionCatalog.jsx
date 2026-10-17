/*
 * ============================================================================
 * ARQUIVO: AdoptionCatalog.jsx
 * ============================================================================
 *
 * PARA QUE SERVE:
 *   É a página do CATÁLOGO DE ADOÇÃO (/adotar). Mostra todos os animais
 *   disponíveis em cartões e permite: buscar por texto, usar filtros rápidos,
 *   abrir a gaveta com todos os filtros, ordenar, favoritar e compartilhar.
 *   Busca, filtros e ordenação ficam guardados na URL (ex.: /adotar?especie=gato),
 *   então o link pode ser compartilhado e o botão "Voltar" mantém a busca.
 *   Os cartões aparecem em lotes (carregamento progressivo ao rolar).
 *
 * PRINCIPAIS ITENS:
 *   - NOTICE_DURATION_MS, SEARCH_DEBOUNCE_MS: tempos do aviso e da busca.
 *   - isQuickChip(chip): diz se um chip já aparece como filtro rápido (interna).
 *   - AdoptionCatalog(): o componente da página (exportado como padrão).
 *       Dentro dele: updateCatalog, setFilters, handleShare, handleFavorite,
 *       clearSearchAndFilters e vários useEffect.
 *
 * CONEXÕES COM OUTROS ARQUIVOS:
 *   - react, react-router-dom (Link, useNavigate, useSearchParams), framer-motion, lucide-react.
 *   - shared/components/AnimalCard              → cartões.
 *   - ./FilterDrawer/FilterDrawer               → gaveta de filtros.
 *   - shared/components/layout/PublicLayout     → cabeçalho e rodapé.
 *   - ./catalogOptions                          → PAGE_SIZE e SORT_OPTIONS.
 *   - shared/hooks/useAvailableAnimals          → animais da API.
 *   - ./useFavorites                            → favoritos no navegador.
 *   - ./catalogFilters                          → lógica de filtros, ordenação e URL.
 *   - shared/utils/sharePet                     → compartilhar a ficha.
 *   - ./AdoptionCatalog.css                     → estilos.
 *   - Quem usa: app/App.js (rota /adotar).
 *   - Testado em: features/catalog/AdoptionCatalog.test.js.
 * ============================================================================
 */

// O quê: catálogo de adoção (/adotar): busca, filtros rápidos, gaveta de filtros, ordenação, favoritos e grade.
// Como: busca, filtros e ordenação vivem no endereço (?especie=gato&urgente=1), então o link pode ser
// compartilhado e o botão Voltar do navegador mantém a busca; cada cartão leva à ficha completa (/animais/:id).
// Para quê: ajudar a pessoa a achar o animal certo e dar visibilidade a quem é urgente ou espera há mais tempo.
// Hooks do React. useMemo: "memoriza" o resultado de um cálculo e só refaz quando as dependências mudam.
import { useEffect, useMemo, useRef, useState } from "react";
// Link (navegação), useNavigate (navegar pelo código), useSearchParams (ler/escrever a URL).
import { Link, useNavigate, useSearchParams } from "react-router-dom";
// AnimatePresence: permite animar a SAÍDA de componentes; motion: elementos animáveis.
import { AnimatePresence, motion } from "framer-motion";
// Ícones usados na página.
import {
  AlertTriangle,
  ChevronDown,
  Heart,
  PawPrint,
  RotateCw,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
// Cartão de animal.
import { AnimalCard } from "shared/components/AnimalCard/AnimalCard";
// Gaveta de filtros.
import { FilterDrawer } from "./FilterDrawer/FilterDrawer";
// Moldura com cabeçalho e rodapé.
import { PublicLayout } from "shared/components/layout/PublicLayout/PublicLayout";
// Tamanho do lote e opções de ordenação.
import { PAGE_SIZE, SORT_OPTIONS } from "./catalogOptions";
// Hook que busca os animais.
import { useAvailableAnimals } from "shared/hooks/useAvailableAnimals";
// Hook dos favoritos.
import { useFavorites } from "./useFavorites";
// Funções de filtro, ordenação e URL.
import {
  QUICK_FILTERS,
  collectTemperaments,
  createInitialFilters,
  filterPets,
  getActiveFilterChips,
  isFilterOn,
  readCatalogParams,
  removeFilter,
  sortPets,
  toggleFilter,
  writeCatalogParams,
} from "./catalogFilters";
// Compartilhar a ficha de um animal.
import { sharePet } from "shared/utils/sharePet";
// Estilos da página.
import "./AdoptionCatalog.css";

// Por quanto tempo o aviso (ex.: "Link copiado") fica na tela: 4 segundos.
const NOTICE_DURATION_MS = 4000;
// Espera de 300 ms depois da última tecla antes de aplicar a busca ("debounce").
const SEARCH_DEBOUNCE_MS = 300;

/*
 * FUNÇÃO: isQuickChip (interna)
 * O que faz: diz se um chip de filtro ativo já está representado nos botões de filtro rápido.
 * Parâmetros: chip ({ key, value? }).
 * Retorno (boolean): true para "favoritos" e para chips iguais a algum atalho rápido.
 * Onde é usada: para não repetir esses critérios na linha de chips removíveis.
 */
// Critérios que já aparecem como filtro rápido não se repetem na linha de chips removíveis.
function isQuickChip(chip) {
  return chip.key === "favorites" || QUICK_FILTERS.some((quick) => quick.key === chip.key && quick.value === chip.value);
}

/*
 * COMPONENTE: AdoptionCatalog
 * O que faz: desenha a página do catálogo e controla busca, filtros, ordenação,
 *   favoritos, compartilhamento e carregamento progressivo.
 * Parâmetros: nenhum.
 * Retorno: JSX da página dentro do PublicLayout.
 * Onde é usado: App.js, rota /adotar.
 */
export default function AdoptionCatalog() {
  // Parâmetros da URL e função para trocá-los.
  const [searchParams, setSearchParams] = useSearchParams();
  // Função para navegar pelo código.
  const navigate = useNavigate();
  // Id de um animal vindo de links antigos (/adotar?pet=<id>).
  const legacyPetId = searchParams.get("pet");
  // Animais da API e estados de carregamento/erro, além da função de recarregar.
  const { pets, loading, error, reload } = useAvailableAnimals();
  // Favoritos do visitante.
  const { favoriteIds, isFavorite, toggleFavorite } = useFavorites();
  // Lê busca, filtros e ordenação da URL. useMemo evita reler a cada renderização:
  // só recalcula quando searchParams muda. A URL é a "fonte da verdade" desses dados.
  const { query, filters, sort } = useMemo(() => readCatalogParams(searchParams), [searchParams]);
  // Texto digitado no campo de busca (separado de "query" para permitir o debounce).
  const [inputQuery, setInputQuery] = useState(query);
  // Quantos cartões estão visíveis (aumenta de PAGE_SIZE em PAGE_SIZE).
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  // A gaveta de filtros está aberta?
  const [drawerOpen, setDrawerOpen] = useState(false);
  // Texto do aviso temporário (ex.: "Mel foi para os favoritos.").
  const [notice, setNotice] = useState("");
  // Ref para o elemento "sentinela" no fim da lista (usado no carregamento progressivo).
  const loadMoreRef = useRef(null);

  // Links antigos (/adotar?pet=<id>) abriam a ficha numa janela do catálogo; agora vão para a ficha completa,
  // que também avisa quando o animal já foi adotado ou não existe.
  useEffect(() => {
    // replace: true substitui a entrada atual do histórico (o "Voltar" não volta para o link antigo).
    if (legacyPetId) navigate(`/animais/${encodeURIComponent(legacyPetId)}`, { replace: true });
  }, [legacyPetId, navigate]);

  /*
   * FUNÇÃO INTERNA: updateCatalog
   * O que faz: grava na URL o estado atual com algumas mudanças.
   * Parâmetros: changes (objeto) — ex.: { sort: 'name' } ou { filters: {...} }.
   * Retorno: nada.
   */
  // O quê: grava busca, filtros e ordenação no endereço.
  // Como: replace, para não criar uma entrada de histórico a cada clique.
  function updateCatalog(changes) {
    // Junta o estado atual com as mudanças ("...changes" sobrescreve) e converte para parâmetros de URL.
    setSearchParams(writeCatalogParams({ query, filters, sort, ...changes }), { replace: true });
  }

  /*
   * FUNÇÃO INTERNA: setFilters
   * O que faz: troca os filtros (aceita um objeto novo ou uma função que recebe os filtros atuais).
   * Parâmetros: update (objeto | função).
   * Retorno: nada.
   * Por quê: imita a assinatura de um "setState", que é o que a gaveta espera receber.
   */
  // A gaveta chama setFilters com um objeto ou com uma função (estado atual → novo estado).
  function setFilters(update) {
    updateCatalog({ filters: typeof update === "function" ? update(filters) : update });
  }

  // O quê: aplica a busca digitada depois de 300 ms sem digitar.
  // Como: lê o endereço atual no momento da gravação, para não desfazer filtros escolhidos nesse intervalo.
  // Técnica "debounce": cada tecla reinicia o cronômetro; só quando a pessoa para de digitar a busca é aplicada.
  useEffect(() => {
    // Agenda a gravação para daqui a 300 ms.
    const timer = window.setTimeout(() => {
      setSearchParams(
        // setSearchParams aceita uma função que recebe os parâmetros ATUAIS ("current").
        (current) => {
          const state = readCatalogParams(current);
          // Se a busca na URL já é igual ao texto digitado, não muda nada; senão, grava a nova busca.
          return state.query === inputQuery ? current : writeCatalogParams({ ...state, query: inputQuery });
        },
        { replace: true },
      );
    }, SEARCH_DEBOUNCE_MS);
    // Limpeza: se a pessoa digitar de novo antes de 300 ms, cancela o agendamento anterior.
    return () => window.clearTimeout(timer);
  }, [inputQuery, setSearchParams]);

  // Busca alterada fora do campo (Voltar do navegador, "Limpar busca e filtros"): o campo acompanha.
  useEffect(() => {
    setInputQuery(query);
  }, [query]);

  // Cada nova combinação de critérios começa do primeiro lote.
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [searchParams]);

  // O aviso (link copiado, favorito) some sozinho depois de alguns segundos.
  useEffect(() => {
    // Sem aviso, nada a fazer.
    if (!notice) return undefined;
    // Agenda a limpeza do aviso.
    const timer = window.setTimeout(() => setNotice(""), NOTICE_DURATION_MS);
    // Se surgir outro aviso antes, cancela o agendamento anterior.
    return () => window.clearTimeout(timer);
  }, [notice]);

  // Lista filtrada e ordenada (recalculada só quando algum destes valores muda).
  const filteredPets = useMemo(
    () => sortPets(filterPets(pets, query, filters, { favoriteIds }), sort),
    [pets, query, filters, sort, favoriteIds],
  );
  // Traços de temperamento disponíveis (para a gaveta).
  const temperamentOptions = useMemo(() => collectTemperaments(pets), [pets]);
  // Só os primeiros "visibleCount" cartões aparecem.
  const visiblePets = filteredPets.slice(0, visibleCount);
  // Ainda há cartões para mostrar?
  const hasMore = visibleCount < filteredPets.length;
  // Todos os chips de filtros ativos.
  const activeChips = getActiveFilterChips(filters);
  // Chips que NÃO são atalhos rápidos (estes aparecem na linha de chips removíveis).
  const drawerChips = activeChips.filter((chip) => !isQuickChip(chip));
  // Número exibido no botão "Filtros" (todos os filtros ativos, exceto favoritos).
  const drawerFilterCount = activeChips.filter((chip) => chip.key !== "favorites").length;
  // Estado geral da página: "loading", "error" ou "ready" (ternário encadeado).
  const status = loading ? "loading" : error ? "error" : "ready";
  // Total de resultados.
  const resultCount = filteredPets.length;

  // O quê: carrega mais cards quando o fim da lista se aproxima.
  // Como: o observador é recriado a cada lote, então dispara de novo se o sentinel continuar visível.
  useEffect(() => {
    // Não há mais o que carregar, ou o navegador não tem IntersectionObserver.
    if (!hasMore || typeof IntersectionObserver === "undefined") return undefined;
    // O elemento "sentinela" no fim da lista.
    const sentinel = loadMoreRef.current;
    if (!sentinel) return undefined;

    // Quando o sentinela chega perto da tela, mostra mais um lote.
    const observer = new IntersectionObserver(
      // "[entry]" desestrutura o primeiro (e único) elemento observado.
      ([entry]) => {
        if (entry.isIntersecting) setVisibleCount((count) => count + PAGE_SIZE);
      },
      // rootMargin "260px": começa a carregar 260px ANTES de o sentinela aparecer.
      { rootMargin: "260px" },
    );
    observer.observe(sentinel);
    // Limpeza: desliga o observador.
    return () => observer.disconnect();
  }, [hasMore, visibleCount]);

  /*
   * FUNÇÃO INTERNA: handleShare
   * O que faz: compartilha a ficha do animal e mostra um aviso conforme o resultado.
   * Parâmetros: pet (animal do cartão).
   * Retorno: Promise (async), sem valor útil.
   */
  async function handleShare(pet) {
    // Renomeia "status" para "result" na desestruturação (para não confundir com o "status" da página).
    const { status: result, url } = await sharePet(pet);
    if (result === "copied") setNotice(`Link da ficha de ${pet.name} copiado.`);
    if (result === "failed") setNotice(`Não foi possível copiar o link: ${url}`);
    // "shared" e "cancelled" não precisam de aviso.
  }

  /*
   * FUNÇÃO INTERNA: handleFavorite
   * O que faz: alterna o favorito e mostra um aviso.
   * Parâmetros: pet (animal do cartão).
   * Retorno: nada.
   */
  function handleFavorite(pet) {
    // A mensagem depende do estado ANTES da troca.
    setNotice(isFavorite(pet.id) ? `${pet.name} saiu dos favoritos.` : `${pet.name} foi para os favoritos.`);
    toggleFavorite(pet.id);
  }

  /*
   * FUNÇÃO INTERNA: clearSearchAndFilters
   * O que faz: apaga a busca e todos os filtros.
   * Parâmetros: nenhum. Retorno: nada.
   */
  function clearSearchAndFilters() {
    setInputQuery("");
    updateCatalog({ query: "", filters: createInitialFilters() });
  }

  // Texto do cabeçalho conforme o estado. Truque: um objeto com os 3 textos e "[status]" escolhe um.
  const headerText = {
    loading: "Buscando animais disponíveis...",
    error: "Não foi possível carregar a lista agora.",
    // Quando pronto: "<N> animais esperando por um lar..." ({" "} insere um espaço em JSX).
    ready: (
      <>
        <strong>{resultCount}</strong>{" "}
        {resultCount === 1 ? "animal esperando" : "animais esperando"} por um lar cheio de carinho.
      </>
    ),
  }[status];

  return (
    // Moldura da página com uma classe extra para estilos do catálogo.
    <PublicLayout className="catalog-page">
      <section className="catalog-section" aria-labelledby="catalog-title">
        <div className="wrap">
          {/* ===== Cabeçalho ===== */}
          <div className="catalog-header">
            <p className="catalog-eyebrow">Adoção responsável</p>
            <h1 id="catalog-title">Encontre seu novo melhor amigo</h1>
            {/* aria-live="polite": leitores de tela anunciam quando o texto muda (ex.: número de resultados). */}
            <p aria-live="polite">{headerText}</p>
          </div>

          {/* ===== Barra de ferramentas: busca, botão de filtros e ordenação =====
              role="search" marca esta área como região de busca (acessibilidade). */}
          <div className="catalog-toolbar" role="search">
            {/* Campo de busca com ícone de lupa. */}
            <label className="catalog-search">
              <Search size={19} aria-hidden="true" />
              {/* type="search" mostra o "x" de limpar em alguns navegadores. Atualiza só inputQuery (debounce). */}
              <input
                type="search"
                aria-label="Buscar animais por nome, raça ou temperamento"
                value={inputQuery}
                onChange={(event) => setInputQuery(event.target.value)}
                placeholder="Busque por nome, raça ou temperamento"
              />
            </label>
            {/* Botão que abre a gaveta. aria-haspopup="dialog" avisa que abre uma janela.
                Mostra um contador quando há filtros ativos. */}
            <button
              type="button"
              className="filter-trigger"
              aria-haspopup="dialog"
              onClick={() => setDrawerOpen(true)}
            >
              <SlidersHorizontal size={18} aria-hidden="true" /> Filtros
              {drawerFilterCount > 0 && <b aria-label={`${drawerFilterCount} ativos`}>{drawerFilterCount}</b>}
            </button>
            {/* Seleção da ordenação: grava a nova ordem na URL. */}
            <label className="sort-select">
              <span>Ordenar</span>
              <select aria-label="Ordenar" value={sort} onChange={(event) => updateCatalog({ sort: event.target.value })}>
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              {/* Setinha decorativa do select. */}
              <ChevronDown size={16} aria-hidden="true" />
            </label>
          </div>

          {/* ===== Filtros rápidos ===== role="group" agrupa os botões com um nome acessível. */}
          <div className="catalog-quick" role="group" aria-label="Filtros rápidos">
            {QUICK_FILTERS.map((quick) => {
              // O atalho está ligado?
              const active = isFilterOn(filters, quick);
              return (
                <button
                  key={quick.id}
                  type="button"
                  aria-pressed={active}
                  className={active ? "is-active" : ""}
                  // Liga/desliga o critério e grava na URL.
                  onClick={() => setFilters(toggleFilter(filters, quick))}
                >
                  {quick.label}
                </button>
              );
            })}
            {/* Botão "Meus favoritos": aparece se houver favoritos ou se o filtro estiver ligado. */}
            {favoriteIds.length > 0 || filters.favorites ? (
              <button
                type="button"
                aria-pressed={filters.favorites}
                className={`catalog-quick-fav ${filters.favorites ? "is-active" : ""}`.trim()}
                onClick={() => setFilters({ ...filters, favorites: !filters.favorites })}
              >
                <Heart size={15} fill="currentColor" aria-hidden="true" /> Meus favoritos ({favoriteIds.length})
              </button>
            ) : null}
          </div>

          {/* ===== Chips dos filtros ativos (com botão de remover cada um) ===== */}
          {activeChips.length > 0 && (
            <div className="active-filters">
              {drawerChips.map((chip) => (
                <button
                  type="button"
                  // key combinando a chave e o valor (?? "" quando não há valor).
                  key={`${chip.key}-${chip.value ?? ""}`}
                  aria-label={`Remover filtro ${chip.label}`}
                  onClick={() => setFilters(removeFilter(filters, chip))}
                >
                  {chip.label} <X size={13} aria-hidden="true" />
                </button>
              ))}
              {/* Limpa todos os filtros (a busca por texto continua). */}
              <button type="button" className="clear-all" onClick={() => setFilters(createInitialFilters())}>
                Limpar filtros
              </button>
            </div>
          )}

          {/* ===== Carregando: "esqueletos" (cartões cinzas animados) ===== */}
          {status === "loading" && (
            <div className="catalog-grid" aria-hidden="true">
              {/* Array.from({ length: N }) cria uma lista com N posições para gerar N esqueletos.
                  "_" indica que o primeiro parâmetro (o item) não é usado; só o índice. */}
              {Array.from({ length: PAGE_SIZE }).map((_, index) => (
                <div className="catalog-skeleton" key={index} />
              ))}
            </div>
          )}

          {/* ===== Erro ao carregar ===== */}
          {status === "error" && (
            <div className="catalog-empty catalog-error" role="alert">
              <AlertTriangle size={34} aria-hidden="true" />
              <h2>Não conseguimos carregar os animais</h2>
              <p>Verifique sua conexão e tente novamente em instantes.</p>
              {/* "reload" vem do useAvailableAnimals e refaz a busca. */}
              <button type="button" className="catalog-primary-button" onClick={reload}>
                <RotateCw size={16} aria-hidden="true" /> Tentar novamente
              </button>
            </div>
          )}

          {/* ===== Grade de cartões ===== */}
          {status === "ready" && resultCount > 0 && (
            <div className="catalog-grid">
              {visiblePets.map((pet) => (
                // headingLevel={2}: aqui o nome do animal é um <h2> (o <h1> é o título da página).
                <AnimalCard
                  key={pet.id ?? pet.name}
                  pet={pet}
                  headingLevel={2}
                  isFavorite={isFavorite(pet.id)}
                  onToggleFavorite={handleFavorite}
                  onShare={handleShare}
                />
              ))}
            </div>
          )}

          {/* Sem resultados: catálogo vazio, nenhum favorito marcado ou busca/filtros sem correspondência. */}
          {status === "ready" && resultCount === 0 && (
            // Caso 1: não há nenhum animal disponível.
            pets.length === 0 ? (
              <div className="catalog-empty">
                <PawPrint size={34} aria-hidden="true" />
                <h2>Nenhum animal disponível no momento</h2>
                <p>Novos animais chegam com frequência. Volte em breve ou ajude a ONG de outras formas.</p>
                <a className="catalog-primary-button" href="/#ajudar">Como ajudar</a>
              </div>
            // Caso 2: filtro de favoritos ligado, mas sem favoritos.
            ) : filters.favorites && favoriteIds.length === 0 ? (
              <div className="catalog-empty">
                <Heart size={34} aria-hidden="true" />
                <h2>Você ainda não tem favoritos</h2>
                <p>Toque no coração dos animais de que gostar para encontrá-los aqui depois.</p>
                <button
                  type="button"
                  className="catalog-primary-button"
                  onClick={() => setFilters({ ...filters, favorites: false })}
                >
                  Ver todos os animais
                </button>
              </div>
            // Caso 3: busca/filtros sem nenhum resultado.
            ) : (
              <div className="catalog-empty">
                <PawPrint size={34} aria-hidden="true" />
                <h2>Nenhum animal encontrado</h2>
                <p>Não encontramos um perfil com essa busca e esses filtros. Que tal ver todos?</p>
                <button type="button" className="catalog-primary-button" onClick={clearSearchAndFilters}>
                  Limpar busca e filtros
                </button>
              </div>
            )
          )}

          {/* Paginação progressiva: o observador carrega sozinho; o botão serve a teclado e clique. */}
          {status === "ready" && hasMore && (
            // ref={loadMoreRef}: este bloco é o "sentinela" observado pelo IntersectionObserver.
            <div ref={loadMoreRef} className="catalog-load-more">
              <button
                type="button"
                className="catalog-secondary-button"
                onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
              >
                Mostrar mais animais ({resultCount - visibleCount} restantes)
              </button>
            </div>
          )}

          {/* Fim da lista: quem não achou agora ainda pode ajudar quem já está na ONG. */}
          {status === "ready" && pets.length > 0 && !hasMore && (
            <aside className="catalog-invite" aria-labelledby="catalog-invite-title">
              <div>
                <h2 id="catalog-invite-title">Não encontrou agora?</h2>
                <p>Novos animais chegam com frequência. Enquanto isso, dá para ajudar quem já está aqui.</p>
              </div>
              <div className="catalog-invite-actions">
                <Link to="/doar" className="catalog-primary-button">
                  <Heart size={16} aria-hidden="true" /> Quero doar
                </Link>
                {/* <a> porque é uma âncora da página inicial. */}
                <a href="/#voluntariado" className="catalog-secondary-button">Ser voluntário</a>
              </div>
            </aside>
          )}
        </div>
      </section>

      {/* ===== Aviso temporário (toast) =====
          O contêiner sempre existe (para o leitor de tela "escutar"); o texto aparece quando há aviso. */}
      <div className="catalog-notice" role="status" aria-live="polite">
        {notice && <span>{notice}</span>}
      </div>

      {/* Gaveta de filtros e sua camada de fundo, cada uma com key própria dentro do AnimatePresence. */}
      {/* AnimatePresence mantém os elementos na tela até a animação de saída ("exit") terminar. */}
      <AnimatePresence>
        {/* Fundo escuro: clicar nele fecha a gaveta. tabIndex={-1} tira do Tab (o X já fecha). */}
        {drawerOpen && (
          <motion.button
            key="filters-overlay"
            type="button"
            className="drawer-overlay"
            aria-label="Fechar filtros"
            tabIndex={-1}
            onClick={() => setDrawerOpen(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
        )}
        {/* A gaveta, recebendo os filtros e as funções para alterá-los. */}
        {drawerOpen && (
          <FilterDrawer
            key="filters-drawer"
            filters={filters}
            setFilters={setFilters}
            resultCount={resultCount}
            temperamentOptions={temperamentOptions}
            onClose={() => setDrawerOpen(false)}
            onClear={() => setFilters(createInitialFilters())}
          />
        )}
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
 *   1. Ao abrir /adotar, a página lê da URL a busca, os filtros e a ordenação.
 *   2. useAvailableAnimals busca os animais; enquanto isso aparecem os esqueletos.
 *   3. Os animais passam por filterPets e sortPets (com useMemo) e os primeiros 8
 *      aparecem; ao rolar até o fim, mais lotes são carregados (IntersectionObserver).
 *   4. Qualquer mudança (busca com debounce, atalhos, gaveta, chips, ordenação)
 *      é gravada na URL com replace; a URL nova dispara um novo cálculo.
 *   5. Favoritar e compartilhar mostram um aviso temporário.
 *   6. Estados especiais: erro (com "Tentar novamente"), sem animais, sem favoritos,
 *      sem resultados; no fim da lista, um convite para doar ou ser voluntário.
 *
 * CONCEITOS IMPORTANTES PARA ESTUDAR:
 *   - Estado na URL com useSearchParams (URL como "fonte da verdade").
 *   - useMemo para cálculos derivados e desempenho.
 *   - Debounce com setTimeout/clearTimeout dentro do useEffect.
 *   - Rolagem infinita / carregamento progressivo com IntersectionObserver (sentinela).
 *   - "Esqueletos" de carregamento (skeleton screens).
 *   - AnimatePresence e animações de saída.
 *   - Redirecionamento com navigate(..., { replace: true }).
 *   - Acessibilidade: role="search", role="group", aria-live, aria-pressed, aria-haspopup.
 *   - Ternários encadeados e o truque { a: ..., b: ... }[chave].
 * ============================================================================
 */
