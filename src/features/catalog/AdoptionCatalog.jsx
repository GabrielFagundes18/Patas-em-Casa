// O quê: catálogo de adoção (/adotar): busca, filtros rápidos, gaveta de filtros, ordenação, favoritos e grade.
// Como: busca, filtros e ordenação vivem no endereço (?especie=gato&urgente=1), então o link pode ser
// compartilhado e o botão Voltar do navegador mantém a busca; cada cartão leva à ficha completa (/animais/:id).
// Para quê: ajudar a pessoa a achar o animal certo e dar visibilidade a quem é urgente ou espera há mais tempo.
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
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
import { AnimalCard } from "../../shared/components/AnimalCard/AnimalCard";
import { FilterDrawer } from "./FilterDrawer/FilterDrawer";
import { PublicLayout } from "../../shared/components/layout/PublicLayout/PublicLayout";
import { PAGE_SIZE, SORT_OPTIONS } from "./catalogOptions";
import { useAvailableAnimals } from "../../shared/hooks/useAvailableAnimals";
import { useFavorites } from "./useFavorites";
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
import { sharePet } from "../../shared/utils/sharePet";
import "./AdoptionCatalog.css";

const NOTICE_DURATION_MS = 4000;
const SEARCH_DEBOUNCE_MS = 300;

// Critérios que já aparecem como filtro rápido não se repetem na linha de chips removíveis.
function isQuickChip(chip) {
  return chip.key === "favorites" || QUICK_FILTERS.some((quick) => quick.key === chip.key && quick.value === chip.value);
}

export default function AdoptionCatalog() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const legacyPetId = searchParams.get("pet");
  const { pets, loading, error, reload } = useAvailableAnimals();
  const { favoriteIds, isFavorite, toggleFavorite } = useFavorites();
  const { query, filters, sort } = useMemo(() => readCatalogParams(searchParams), [searchParams]);
  const [inputQuery, setInputQuery] = useState(query);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const loadMoreRef = useRef(null);

  // Links antigos (/adotar?pet=<id>) abriam a ficha numa janela do catálogo; agora vão para a ficha completa,
  // que também avisa quando o animal já foi adotado ou não existe.
  useEffect(() => {
    if (legacyPetId) navigate(`/animais/${encodeURIComponent(legacyPetId)}`, { replace: true });
  }, [legacyPetId, navigate]);

  // O quê: grava busca, filtros e ordenação no endereço.
  // Como: replace, para não criar uma entrada de histórico a cada clique.
  function updateCatalog(changes) {
    setSearchParams(writeCatalogParams({ query, filters, sort, ...changes }), { replace: true });
  }

  // A gaveta chama setFilters com um objeto ou com uma função (estado atual → novo estado).
  function setFilters(update) {
    updateCatalog({ filters: typeof update === "function" ? update(filters) : update });
  }

  // O quê: aplica a busca digitada depois de 300 ms sem digitar.
  // Como: lê o endereço atual no momento da gravação, para não desfazer filtros escolhidos nesse intervalo.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearchParams(
        (current) => {
          const state = readCatalogParams(current);
          return state.query === inputQuery ? current : writeCatalogParams({ ...state, query: inputQuery });
        },
        { replace: true },
      );
    }, SEARCH_DEBOUNCE_MS);
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
    if (!notice) return undefined;
    const timer = window.setTimeout(() => setNotice(""), NOTICE_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const filteredPets = useMemo(
    () => sortPets(filterPets(pets, query, filters, { favoriteIds }), sort),
    [pets, query, filters, sort, favoriteIds],
  );
  const temperamentOptions = useMemo(() => collectTemperaments(pets), [pets]);
  const visiblePets = filteredPets.slice(0, visibleCount);
  const hasMore = visibleCount < filteredPets.length;
  const activeChips = getActiveFilterChips(filters);
  const drawerChips = activeChips.filter((chip) => !isQuickChip(chip));
  const drawerFilterCount = activeChips.filter((chip) => chip.key !== "favorites").length;
  const status = loading ? "loading" : error ? "error" : "ready";
  const resultCount = filteredPets.length;

  // O quê: carrega mais cards quando o fim da lista se aproxima.
  // Como: o observador é recriado a cada lote, então dispara de novo se o sentinel continuar visível.
  useEffect(() => {
    if (!hasMore || typeof IntersectionObserver === "undefined") return undefined;
    const sentinel = loadMoreRef.current;
    if (!sentinel) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisibleCount((count) => count + PAGE_SIZE);
      },
      { rootMargin: "260px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, visibleCount]);

  async function handleShare(pet) {
    const { status: result, url } = await sharePet(pet);
    if (result === "copied") setNotice(`Link da ficha de ${pet.name} copiado.`);
    if (result === "failed") setNotice(`Não foi possível copiar o link: ${url}`);
  }

  function handleFavorite(pet) {
    setNotice(isFavorite(pet.id) ? `${pet.name} saiu dos favoritos.` : `${pet.name} foi para os favoritos.`);
    toggleFavorite(pet.id);
  }

  function clearSearchAndFilters() {
    setInputQuery("");
    updateCatalog({ query: "", filters: createInitialFilters() });
  }

  const headerText = {
    loading: "Buscando animais disponíveis...",
    error: "Não foi possível carregar a lista agora.",
    ready: (
      <>
        <strong>{resultCount}</strong>{" "}
        {resultCount === 1 ? "animal esperando" : "animais esperando"} por um lar cheio de carinho.
      </>
    ),
  }[status];

  return (
    <PublicLayout className="catalog-page">
      <section className="catalog-section" aria-labelledby="catalog-title">
        <div className="wrap">
          <div className="catalog-header">
            <p className="catalog-eyebrow">Adoção responsável</p>
            <h1 id="catalog-title">Encontre seu novo melhor amigo</h1>
            <p aria-live="polite">{headerText}</p>
          </div>

          <div className="catalog-toolbar" role="search">
            <label className="catalog-search">
              <Search size={19} aria-hidden="true" />
              <input
                type="search"
                aria-label="Buscar animais por nome, raça ou temperamento"
                value={inputQuery}
                onChange={(event) => setInputQuery(event.target.value)}
                placeholder="Busque por nome, raça ou temperamento"
              />
            </label>
            <button
              type="button"
              className="filter-trigger"
              aria-haspopup="dialog"
              onClick={() => setDrawerOpen(true)}
            >
              <SlidersHorizontal size={18} aria-hidden="true" /> Filtros
              {drawerFilterCount > 0 && <b aria-label={`${drawerFilterCount} ativos`}>{drawerFilterCount}</b>}
            </button>
            <label className="sort-select">
              <span>Ordenar</span>
              <select aria-label="Ordenar" value={sort} onChange={(event) => updateCatalog({ sort: event.target.value })}>
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              <ChevronDown size={16} aria-hidden="true" />
            </label>
          </div>

          <div className="catalog-quick" role="group" aria-label="Filtros rápidos">
            {QUICK_FILTERS.map((quick) => {
              const active = isFilterOn(filters, quick);
              return (
                <button
                  key={quick.id}
                  type="button"
                  aria-pressed={active}
                  className={active ? "is-active" : ""}
                  onClick={() => setFilters(toggleFilter(filters, quick))}
                >
                  {quick.label}
                </button>
              );
            })}
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

          {activeChips.length > 0 && (
            <div className="active-filters">
              {drawerChips.map((chip) => (
                <button
                  type="button"
                  key={`${chip.key}-${chip.value ?? ""}`}
                  aria-label={`Remover filtro ${chip.label}`}
                  onClick={() => setFilters(removeFilter(filters, chip))}
                >
                  {chip.label} <X size={13} aria-hidden="true" />
                </button>
              ))}
              <button type="button" className="clear-all" onClick={() => setFilters(createInitialFilters())}>
                Limpar filtros
              </button>
            </div>
          )}

          {status === "loading" && (
            <div className="catalog-grid" aria-hidden="true">
              {Array.from({ length: PAGE_SIZE }).map((_, index) => (
                <div className="catalog-skeleton" key={index} />
              ))}
            </div>
          )}

          {status === "error" && (
            <div className="catalog-empty catalog-error" role="alert">
              <AlertTriangle size={34} aria-hidden="true" />
              <h2>Não conseguimos carregar os animais</h2>
              <p>Verifique sua conexão e tente novamente em instantes.</p>
              <button type="button" className="catalog-primary-button" onClick={reload}>
                <RotateCw size={16} aria-hidden="true" /> Tentar novamente
              </button>
            </div>
          )}

          {status === "ready" && resultCount > 0 && (
            <div className="catalog-grid">
              {visiblePets.map((pet) => (
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
            pets.length === 0 ? (
              <div className="catalog-empty">
                <PawPrint size={34} aria-hidden="true" />
                <h2>Nenhum animal disponível no momento</h2>
                <p>Novos animais chegam com frequência. Volte em breve ou ajude a ONG de outras formas.</p>
                <a className="catalog-primary-button" href="/#ajudar">Como ajudar</a>
              </div>
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
                <a href="/#voluntariado" className="catalog-secondary-button">Ser voluntário</a>
              </div>
            </aside>
          )}
        </div>
      </section>

      <div className="catalog-notice" role="status" aria-live="polite">
        {notice && <span>{notice}</span>}
      </div>

      {/* Gaveta de filtros e sua camada de fundo, cada uma com key própria dentro do AnimatePresence. */}
      <AnimatePresence>
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
