import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown,
  PawPrint,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { AdoptionFormModal } from "../components/catalog/AdoptionFormModal/AdoptionFormModal";
import { FilterDrawer } from "../components/catalog/FilterDrawer/FilterDrawer";
import { PetCard } from "../components/catalog/PetCard/PetCard";
import { PetDetail } from "../components/catalog/PetDetail/PetDetail";
import { PAGE_SIZE } from "../constants/catalogOptions";
import {
  buscarTodoAnimais,
  mapPetsFromApi,
} from "../components/home/PetSectionContainer";
import { getAge, getSize, getSpecies } from "../utils/petHelpers";
import "../styles/adoption-catalog.css";

const initialFilters = {
  species: [],
  size: [],
  sex: [],
  age: 15,
  city: "Todas as cidades",
  castrado: false,
  vacinado: false,
  urgent: false,
};

function createInitialFilters() {
  return {
    ...initialFilters,
    species: [],
    size: [],
    sex: [],
  };
}

export default function AdoptionCatalog() {
  const [pets, setPets] = useState([]);
  const [inputQuery, setInputQuery] = useState("");
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState(createInitialFilters);
  const [sort, setSort] = useState("recent");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedPet, setSelectedPet] = useState(null);
  const [adoptionPet, setAdoptionPet] = useState(null);
  const [loading, setLoading] = useState(true);
  const loadMoreRef = useRef(null);

  useEffect(() => {
    let active = true;

    buscarTodoAnimais()
      .then((data) => {
        if (active) setPets(mapPetsFromApi(data));
      })
      .catch(() => {
        if (active) setPets([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => setQuery(inputQuery), 300);
    return () => window.clearTimeout(timer);
  }, [inputQuery]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [query, filters, sort]);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisibleCount((count) => count + PAGE_SIZE);
        }
      },
      { rootMargin: "260px" },
    );

    if (loadMoreRef.current) observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, []);

  const filteredPets = useMemo(() => {
    const normalized = query.toLowerCase().trim();

    return pets
      .filter((pet) => {
        const matchesQuery =
          !normalized ||
          [pet.name, pet.code, pet.meta]
            .join(" ")
            .toLowerCase()
            .includes(normalized);
        const matchesSpecies =
          !filters.species.length || filters.species.includes(getSpecies(pet));
        const matchesSize =
          !filters.size.length || filters.size.includes(getSize(pet));
        const matchesAge = getAge(pet) <= Number(filters.age);
        const matchesCity =
          filters.city === "Todas as cidades" || pet.city === filters.city;
        const matchesStatus = !filters.urgent || pet.urgent;
        const matchesCare =
          (!filters.castrado || pet.tags?.includes("Castrado")) &&
          (!filters.vacinado || pet.tags?.includes("Vacinado"));
        const matchesSex =
          !filters.sex.length ||
          filters.sex.some((sex) => pet.tags?.includes(sex));

        return (
          matchesQuery &&
          matchesSpecies &&
          matchesSize &&
          matchesAge &&
          matchesCity &&
          matchesStatus &&
          matchesCare &&
          matchesSex
        );
      })
      .sort((a, b) =>
        sort === "name"
          ? a.name.localeCompare(b.name)
          : Number(b.urgent) - Number(a.urgent),
      );
  }, [pets, query, filters, sort]);

  function clearFilters() {
    setFilters(createInitialFilters());
  }

  const activeFilters = [
    ...filters.species,
    ...filters.size,
    ...filters.sex,
    filters.city !== "Todas as cidades" ? filters.city : "",
    filters.urgent ? "Urgentes" : "",
    filters.castrado ? "Castrados" : "",
    filters.vacinado ? "Vacinados" : "",
  ].filter(Boolean);

  async function sharePet(pet) {
    if (navigator.share) {
      await navigator.share({
        title: `${pet.name} espera por um lar`,
        text: `Conheça ${pet.name} na Patas em Casa.`,
      });
    } else {
      navigator.clipboard?.writeText(window.location.href);
    }
  }

  return (
    <main className={`catalog-page ${selectedPet ? "has-detail" : ""}`}>
      <div className="catalog-wrap">
        <a className="catalog-breadcrumb" href="/">
          Início <span>/</span> Adotar
        </a>
        <div className="catalog-header">
          <div>
            <span className="catalog-eyebrow">Adoção responsável</span>
            <h1>Encontre seu novo melhor amigo</h1>
            <p>
              <strong>{filteredPets.length}</strong> animais esperando por um
              lar cheio de carinho.
            </p>
          </div>
          <PawPrint className="header-paw" size={71} />
        </div>

        <section className="catalog-toolbar">
          <label className="catalog-search">
            <Search size={19} />
            <input
              value={inputQuery}
              onChange={(event) => setInputQuery(event.target.value)}
              placeholder="Busque por nome, raça ou ID..."
            />
          </label>
          <button
            type="button"
            className="filter-trigger"
            onClick={() => setDrawerOpen(true)}
          >
            <SlidersHorizontal size={18} /> Filtros
            {activeFilters.length > 0 && <b>{activeFilters.length}</b>}
          </button>
          <label className="sort-select">
            <span>Ordenar por</span>
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value)}
            >
              <option value="recent">Mais recentes</option>
              <option value="urgent">Mais urgentes</option>
              <option value="name">Nome (A-Z)</option>
            </select>
            <ChevronDown size={16} />
          </label>
        </section>

        {activeFilters.length > 0 && (
          <div className="active-filters">
            {activeFilters.map((filter) => (
              <button type="button" key={filter} onClick={clearFilters}>
                {filter} <X size={13} />
              </button>
            ))}
            <button type="button" className="clear-all" onClick={clearFilters}>
              Limpar tudo
            </button>
          </div>
        )}

        {loading ? (
          <div className="catalog-grid">
            {Array.from({ length: PAGE_SIZE }).map((_, index) => (
              <div className="catalog-skeleton" key={index} />
            ))}
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            <div className="catalog-grid">
              {filteredPets.slice(0, visibleCount).map((pet, index) => (
                <PetCard
                  key={pet.code || `${pet.name}-${index}`}
                  pet={pet}
                  onOpen={setSelectedPet}
                  onShare={sharePet}
                />
              ))}
            </div>
          </AnimatePresence>
        )}

        {!loading && filteredPets.length === 0 && (
          <div className="catalog-empty">
            <PawPrint size={34} />
            <h2>Nenhum animal encontrado</h2>
            <p>
              Não encontramos um perfil com esses filtros. Que tal ver todos?
            </p>
            <button
              type="button"
              className="catalog-primary-button"
              onClick={() => {
                setInputQuery("");
                setQuery("");
                clearFilters();
              }}
            >
              Limpar filtros
            </button>
          </div>
        )}

        <div ref={loadMoreRef} className="catalog-load-more">
          {visibleCount < filteredPets.length && (
            <>
              <span />
              Carregando mais amigos...
            </>
          )}
        </div>
      </div>

      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.button
              type="button"
              className="drawer-overlay"
              aria-label="Fechar filtros"
              onClick={() => setDrawerOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            <FilterDrawer
              filters={filters}
              setFilters={setFilters}
              onClose={() => setDrawerOpen(false)}
              onClear={clearFilters}
            />
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedPet && (
          <PetDetail
            pet={selectedPet}
            onClose={() => setSelectedPet(null)}
            onAdopt={(pet) => {
              setSelectedPet(null);
              setAdoptionPet(pet);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {adoptionPet && (
          <AdoptionFormModal
            pet={adoptionPet}
            onClose={() => setAdoptionPet(null)}
          />
        )}
      </AnimatePresence>
    </main>
  );
}
