// O quê: importa hooks, roteamento, animações e ícones usados pelo catálogo.
// Como: useSearchParams guarda o animal aberto na URL (?pet=<id>); AnimatePresence anima overlays e cards.
// Para quê: sustentar busca, filtros, paginação progressiva, ficha compartilhável e formulário de adoção.
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  ChevronDown,
  PawPrint,
  RotateCw,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { AdoptionFormModal } from "../components/AdoptionFormModal/AdoptionFormModal";
import { FilterDrawer } from "../components/FilterDrawer/FilterDrawer";
import { PetCard } from "../components/PetCard/PetCard";
import { PetDetail } from "../components/PetDetail/PetDetail";
import { PAGE_SIZE } from "../constants/catalogOptions";
import { buscarTodoAnimais } from "../services/animaisService";
import {
  createInitialFilters,
  filterPets,
  getActiveFilterChips,
  removeFilter,
  sortPets,
} from "../utils/catalogFilters";
import { mapPetsFromApi } from "../utils/petMapper";
import { sharePet } from "../utils/sharePet";
import "./AdoptionCatalog.css";

const NOTICE_DURATION_MS = 4000;

export default function AdoptionCatalog() {
  // O quê: declara o estado dos animais, da busca, dos filtros e dos overlays.
  // Como: status separa carregamento, erro e sucesso; o animal aberto vem da URL.
  // Para quê: permitir voltar com o botão do navegador e compartilhar o link de uma ficha.
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const locationRef = useRef(location);
  const requestedPetId = searchParams.get("pet");
  const [pets, setPets] = useState([]);
  const [status, setStatus] = useState("loading");
  const [reloadKey, setReloadKey] = useState(0);
  const [inputQuery, setInputQuery] = useState("");
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState(createInitialFilters);
  const [sort, setSort] = useState("recent");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [adoptionPet, setAdoptionPet] = useState(null);
  const [notice, setNotice] = useState("");
  const loadMoreRef = useRef(null);

  useEffect(() => {
    locationRef.current = location;
  }, [location]);

  // O quê: carrega os animais ao montar a página e a cada "Tentar novamente".
  // Como: AbortController cancela a requisição na desmontagem; falhas viram status "error".
  // Para quê: diferenciar servidor indisponível de catálogo vazio.
  useEffect(() => {
    const controller = new AbortController();
    setStatus("loading");

    buscarTodoAnimais({ signal: controller.signal })
      .then((data) => {
        if (controller.signal.aborted) return;
        setPets(mapPetsFromApi(data));
        setStatus("ready");
      })
      .catch(() => {
        if (!controller.signal.aborted) setStatus("error");
      });

    return () => controller.abort();
  }, [reloadKey]);

  // O quê: aplica debounce ao texto digitado na busca.
  // Como: aguarda 300 ms antes de copiar inputQuery para query e cancela o timer anterior.
  // Para quê: reduzir recomputações enquanto o usuário ainda está escrevendo.
  useEffect(() => {
    const timer = window.setTimeout(() => setQuery(inputQuery), 300);
    return () => window.clearTimeout(timer);
  }, [inputQuery]);

  // O quê: volta para o primeiro lote quando a busca, os filtros ou a ordenação mudam.
  // Como: observa esses valores e restaura PAGE_SIZE.
  // Para quê: cada nova combinação de critérios começa do topo da lista.
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [query, filters, sort]);

  // O quê: esconde o aviso (link copiado, animal indisponível) depois de alguns segundos.
  // Como: agenda a limpeza sempre que um novo aviso é definido.
  // Para quê: dar retorno sem exigir que o usuário feche a mensagem.
  useEffect(() => {
    if (!notice) return undefined;
    const timer = window.setTimeout(() => setNotice(""), NOTICE_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [notice]);

  // O quê: deriva a lista exibida, os chips de filtro e o animal aberto.
  // Como: filterPets e sortPets são funções puras; o animal aberto é buscado pelo id da URL.
  // Para quê: manter uma única fonte de verdade para contador, grade e ficha.
  const filteredPets = useMemo(
    () => sortPets(filterPets(pets, query, filters), sort),
    [pets, query, filters, sort],
  );
  const visiblePets = filteredPets.slice(0, visibleCount);
  const hasMore = visibleCount < filteredPets.length;
  const activeChips = getActiveFilterChips(filters);
  const selectedPet = status === "ready" && requestedPetId
    ? pets.find((pet) => pet.id === requestedPetId) ?? null
    : null;

  // O quê: avisa quando o link aponta para um animal que não está mais disponível.
  // Como: após carregar, se o id da URL não existir na lista, remove o parâmetro e mostra um aviso.
  // Para quê: links antigos compartilhados não abrem uma ficha vazia.
  useEffect(() => {
    if (status !== "ready" || !requestedPetId || selectedPet) return;
    setNotice("Este animal não está mais disponível para adoção.");
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current);
        next.delete("pet");
        return next;
      },
      { replace: true },
    );
  }, [status, requestedPetId, selectedPet, setSearchParams]);

  // O quê: carrega mais cards quando o fim da lista se aproxima.
  // Como: o observador é recriado a cada lote, então dispara de novo se o sentinel continuar visível.
  // Para quê: evitar que a paginação trave em telas altas ou com poucos cards por lote.
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

  // O quê: abre a ficha de um animal.
  // Como: grava ?pet=<id> numa nova entrada de histórico, marcada como aberta pelo catálogo.
  // Para quê: o botão Voltar do navegador fecha a ficha e o link pode ser compartilhado.
  function openPet(pet) {
    if (!pet.id) return;
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current);
        next.set("pet", pet.id);
        return next;
      },
      { state: { openedFromCatalog: true } },
    );
  }

  // O quê: fecha a ficha aberta.
  // Como: se a ficha foi aberta pelo catálogo, volta uma entrada no histórico; se veio de um
  //       link compartilhado, apenas remove o parâmetro. Sem ?pet na URL, não faz nada.
  // Para quê: não acumular entradas no histórico nem sair do site ao fechar a ficha.
  function closeDetail() {
    const current = locationRef.current;
    if (!new URLSearchParams(current.search).has("pet")) return;

    if (current.state?.openedFromCatalog) {
      navigate(-1);
      return;
    }

    setSearchParams(
      (params) => {
        const next = new URLSearchParams(params);
        next.delete("pet");
        return next;
      },
      { replace: true },
    );
  }

  // O quê: compartilha a ficha e informa o resultado.
  // Como: usa a Web Share API ou copia o link; cancelamento pelo usuário não gera aviso.
  // Para quê: divulgar o animal com um link que abre direto na ficha dele.
  async function handleShare(pet) {
    const { status: result, url } = await sharePet(pet);
    if (result === "copied") setNotice(`Link da ficha de ${pet.name} copiado.`);
    if (result === "failed") setNotice(`Não foi possível copiar o link: ${url}`);
  }

  // O quê: limpa busca e filtros de uma vez.
  // Como: zera o texto digitado, a consulta aplicada e recria os filtros iniciais.
  // Para quê: ação do estado vazio quando nenhum animal atende aos critérios.
  function clearSearchAndFilters() {
    setInputQuery("");
    setQuery("");
    setFilters(createInitialFilters());
  }

  const resultCount = filteredPets.length;
  const headerText = {
    loading: "Buscando animais disponíveis...",
    error: "Não foi possível carregar a lista agora.",
    ready: (
      <>
        <strong>{resultCount}</strong>{" "}
        {resultCount === 1 ? "animal esperando" : "animais esperando"} por um lar
        cheio de carinho.
      </>
    ),
  }[status];

  // O quê: renderiza a página completa do catálogo de adoção.
  // Como: combina JSX condicional, componentes controlados e callbacks para refletir o estado local.
  // Para quê: oferecer busca, filtros, ordenação, navegação pelos animais e início do processo de adoção.
  return (
    <main className={`catalog-page ${selectedPet ? "has-detail" : ""}`}>
      <div className="catalog-wrap">
        <Link className="catalog-breadcrumb" to="/">
          Início <span aria-hidden="true">/</span> Adotar
        </Link>

        <div className="catalog-header">
          <div>
            <span className="catalog-eyebrow">Adoção responsável</span>
            <h1>Encontre seu novo melhor amigo</h1>
            <p aria-live="polite">{headerText}</p>
          </div>
          <PawPrint className="header-paw" size={71} aria-hidden="true" />
        </div>

        {/* O quê: renderiza busca, abertura de filtros e ordenação.
          Como: cada controle é controlado pelo estado e atualiza o componente por callbacks.
          Para quê: concentra os principais mecanismos de descoberta dos animais. */}
        <section className="catalog-toolbar" aria-label="Busca e ordenação">
          <label className="catalog-search">
            <Search size={19} aria-hidden="true" />
            <input
              type="search"
              aria-label="Buscar animais por nome, raça ou código"
              value={inputQuery}
              onChange={(event) => setInputQuery(event.target.value)}
              placeholder="Busque por nome, raça ou código..."
            />
          </label>
          <button
            type="button"
            className="filter-trigger"
            aria-haspopup="dialog"
            onClick={() => setDrawerOpen(true)}
          >
            <SlidersHorizontal size={18} aria-hidden="true" /> Filtros
            {activeChips.length > 0 && (
              <b aria-label={`${activeChips.length} ativos`}>{activeChips.length}</b>
            )}
          </button>
          <label className="sort-select">
            <span>Ordenar por</span>
            <select value={sort} onChange={(event) => setSort(event.target.value)}>
              <option value="recent">Mais recentes</option>
              <option value="urgent">Mais urgentes</option>
              <option value="name">Nome (A-Z)</option>
            </select>
            <ChevronDown size={16} aria-hidden="true" />
          </label>
        </section>

        {/* O quê: mostra os filtros ativos como chips removíveis.
          Como: cada chip remove apenas o próprio critério; "Limpar tudo" restaura o estado inicial.
          Para quê: tornar visível o estado da filtragem e permitir ajustes rápidos. */}
        {activeChips.length > 0 && (
          <div className="active-filters">
            {activeChips.map((chip) => (
              <button
                type="button"
                key={`${chip.key}-${chip.value ?? ""}`}
                aria-label={`Remover filtro ${chip.label}`}
                onClick={() => setFilters((current) => removeFilter(current, chip))}
              >
                {chip.label} <X size={13} aria-hidden="true" />
              </button>
            ))}
            <button
              type="button"
              className="clear-all"
              onClick={() => setFilters(createInitialFilters())}
            >
              Limpar tudo
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
            <button
              type="button"
              className="catalog-primary-button"
              onClick={() => setReloadKey((key) => key + 1)}
            >
              <RotateCw size={16} aria-hidden="true" /> Tentar novamente
            </button>
          </div>
        )}

        {status === "ready" && (
          <div className="catalog-grid">
            <AnimatePresence>
              {visiblePets.map((pet) => (
                <PetCard
                  key={pet.id ?? pet.code}
                  pet={pet}
                  onOpen={openPet}
                  onShare={handleShare}
                />
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* O quê: orienta o usuário quando não há resultados.
          Como: distingue catálogo sem nenhum animal de busca/filtros sem correspondência.
          Para quê: só oferecer "limpar filtros" quando isso realmente pode trazer resultados. */}
        {status === "ready" && resultCount === 0 && (
          pets.length === 0 ? (
            <div className="catalog-empty">
              <PawPrint size={34} aria-hidden="true" />
              <h2>Nenhum animal disponível no momento</h2>
              <p>Novos animais chegam com frequência. Volte em breve ou ajude a ONG de outras formas.</p>
              <a className="catalog-primary-button" href="/#ajudar">
                Como ajudar
              </a>
            </div>
          ) : (
            <div className="catalog-empty">
              <PawPrint size={34} aria-hidden="true" />
              <h2>Nenhum animal encontrado</h2>
              <p>Não encontramos um perfil com essa busca e esses filtros. Que tal ver todos?</p>
              <button
                type="button"
                className="catalog-primary-button"
                onClick={clearSearchAndFilters}
              >
                Limpar busca e filtros
              </button>
            </div>
          )
        )}

        {/* O quê: sentinel da paginação progressiva, com botão para quem não rola até o fim.
          Como: o IntersectionObserver observa este bloco; o botão faz o mesmo incremento.
          Para quê: carregar mais cards automaticamente e também por teclado/clique. */}
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
      </div>

      <div className="catalog-notice" role="status" aria-live="polite">
        {notice && <span>{notice}</span>}
      </div>

      {/* O quê: monta o drawer de filtros e sua camada de fundo.
        Como: overlay e drawer são filhos diretos de AnimatePresence, cada um com key própria.
        Para quê: permitir editar critérios sem abandonar o contexto do catálogo. */}
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
            onClose={() => setDrawerOpen(false)}
            onClear={() => setFilters(createInitialFilters())}
          />
        )}
      </AnimatePresence>

      {/* O quê: monta a ficha do animal indicado na URL.
        Como: "Quero adotar" fecha a ficha e abre o formulário do mesmo animal.
        Para quê: aprofundar a decisão antes de iniciar a solicitação. */}
      <AnimatePresence>
        {selectedPet && (
          <PetDetail
            key={selectedPet.id}
            pet={selectedPet}
            onClose={closeDetail}
            onAdopt={(pet) => {
              closeDetail();
              setAdoptionPet(pet);
            }}
          />
        )}
      </AnimatePresence>

      {/* O quê: monta o formulário de adoção para o animal escolhido.
        Como: "Voltar para a ficha" reabre a ficha; "Fechar" apenas encerra o formulário.
        Para quê: coletar os dados da solicitação sem perder o contexto do animal. */}
      <AnimatePresence>
        {adoptionPet && (
          <AdoptionFormModal
            key={adoptionPet.id ?? adoptionPet.code}
            pet={adoptionPet}
            onClose={() => setAdoptionPet(null)}
            onBack={() => {
              setAdoptionPet(null);
              openPet(adoptionPet);
            }}
          />
        )}
      </AnimatePresence>
    </main>
  );
}
