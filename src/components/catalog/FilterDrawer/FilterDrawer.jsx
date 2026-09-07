import { motion } from "framer-motion";
import { Check, Heart, X } from "lucide-react";
import {
  cityOptions,
  sexOptions,
  sizeOptions,
  speciesOptions,
} from "../../../constants/catalogOptions";
import { FilterGroup } from "./FilterGroup";
import "./FilterDrawer.css";

export function FilterDrawer({ filters, setFilters, onClose, onClear }) {
  const toggleValue = (key, value) =>
    setFilters((current) => ({
      ...current,
      [key]: current[key].includes(value)
        ? current[key].filter((item) => item !== value)
        : [...current[key], value],
    }));

  return (
    <motion.aside
      className="filter-drawer"
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="drawer-header">
        <div>
          <span className="catalog-eyebrow">Refinar busca</span>
          <h2>Encontre o perfil ideal</h2>
        </div>
        <button
          className="catalog-icon-button"
          type="button"
          onClick={onClose}
          aria-label="Fechar filtros"
        >
          <X size={20} />
        </button>
      </div>
      <div className="drawer-content">
        <FilterGroup label="Espécie">
          <div className="filter-options">
            {speciesOptions.map((option) => (
              <button
                key={option}
                type="button"
                className={
                  filters.species.includes(option)
                    ? "filter-option active"
                    : "filter-option"
                }
                onClick={() => toggleValue("species", option)}
              >
                {option}
                {filters.species.includes(option) && <Check size={14} />}
              </button>
            ))}
          </div>
        </FilterGroup>
        <FilterGroup label="Porte">
          <div className="filter-options">
            {sizeOptions.map((option) => (
              <button
                key={option}
                type="button"
                className={
                  filters.size.includes(option)
                    ? "filter-option active"
                    : "filter-option"
                }
                onClick={() => toggleValue("size", option)}
              >
                {option}
                {filters.size.includes(option) && <Check size={14} />}
              </button>
            ))}
          </div>
        </FilterGroup>
        <FilterGroup label={`Idade máxima: ${filters.age} anos`}>
          <input
            className="age-range"
            type="range"
            min="0"
            max="15"
            value={filters.age}
            onChange={(event) =>
              setFilters((current) => ({ ...current, age: event.target.value }))
            }
          />
        </FilterGroup>
        <FilterGroup label="Sexo">
          <div className="filter-options">
            {sexOptions.map((option) => (
              <button
                key={option}
                type="button"
                className={
                  filters.sex.includes(option)
                    ? "filter-option active"
                    : "filter-option"
                }
                onClick={() => toggleValue("sex", option)}
              >
                {option}
                {filters.sex.includes(option) && <Check size={14} />}
              </button>
            ))}
          </div>
        </FilterGroup>
        <FilterGroup label="Cuidados">
          <label className="check-row">
            <input
              type="checkbox"
              checked={filters.castrado}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  castrado: event.target.checked,
                }))
              }
            />
            Castrado
          </label>
          <label className="check-row">
            <input
              type="checkbox"
              checked={filters.vacinado}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  vacinado: event.target.checked,
                }))
              }
            />
            Vacinado
          </label>
        </FilterGroup>
        <FilterGroup label="Cidade / região">
          <select
            className="city-select"
            value={filters.city}
            onChange={(event) =>
              setFilters((current) => ({ ...current, city: event.target.value }))
            }
          >
            {cityOptions.map((city) => (
              <option key={city}>{city}</option>
            ))}
          </select>
        </FilterGroup>
        <FilterGroup label="Status">
          <button
            type="button"
            className={filters.urgent ? "urgent-toggle active" : "urgent-toggle"}
            onClick={() =>
              setFilters((current) => ({ ...current, urgent: !current.urgent }))
            }
          >
            <Heart size={16} /> Mostrar apenas urgentes
          </button>
        </FilterGroup>
      </div>
      <div className="drawer-footer">
        <button type="button" className="catalog-secondary-button" onClick={onClear}>
          Limpar filtros
        </button>
        <button type="button" className="catalog-primary-button" onClick={onClose}>
          Ver resultados
        </button>
      </div>
    </motion.aside>
  );
}
