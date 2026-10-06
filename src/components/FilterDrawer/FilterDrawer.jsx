// O quê: importa animação, ícones, opções do domínio, grupo reutilizável, diálogo e estilos.
// Como: o drawer recebe estado controlado do catálogo e usa callbacks para alterá-lo.
// Para quê: encapsular todos os critérios de refinamento da busca.
import { useId } from "react";
import { motion } from "framer-motion";
import { Check, Heart, X } from "lucide-react";
import {
  MAX_AGE_FILTER,
  sexOptions,
  sizeOptions,
  speciesOptions,
} from "../../constants/catalogOptions";
import { useDialog } from "../../hooks/useDialog";
import { FilterGroup } from "../FilterGroup/FilterGroup";
import "./FilterDrawer.css";

export function FilterDrawer({ filters, setFilters, onClose, onClear, resultCount }) {
  const titleId = useId();
  const dialogRef = useDialog(onClose);
  const ageLimit = Number(filters.age);
  const ageLabel = ageLimit >= MAX_AGE_FILTER
    ? "Idade: qualquer idade"
    : `Idade máxima: ${ageLimit} ${ageLimit === 1 ? "ano" : "anos"}`;

  // O quê: alterna uma opção dentro de um filtro de seleção múltipla.
  // Como: atualização funcional lê o estado atual, remove o valor existente ou cria novo array com spread.
  // Para quê: evitar mutação direta e manter espécie, porte e sexo independentes.
  const toggleValue = (key, value) =>
    setFilters((current) => ({
      ...current,
      [key]: current[key].includes(value)
        ? current[key].filter((item) => item !== value)
        : [...current[key], value],
    }));

  // O quê: renderiza um grupo de botões de seleção múltipla.
  // Como: aria-pressed comunica o estado de cada opção para leitores de tela.
  // Para quê: reaproveitar a mesma marcação em espécie, porte e sexo.
  const renderOptions = (key, options) => (
    <div className="filter-options">
      {options.map((option) => {
        const active = filters[key].includes(option);
        return (
          <button
            key={option}
            type="button"
            aria-pressed={active}
            className={active ? "filter-option active" : "filter-option"}
            onClick={() => toggleValue(key, option)}
          >
            {option}
            {active && <Check size={14} aria-hidden="true" />}
          </button>
        );
      })}
    </div>
  );

  return (
    // O quê: renderiza o painel lateral de refinamento.
    // Como: motion.aside anima a entrada e os grupos mapeiam opções para controles controlados.
    // Para quê: permitir combinar critérios e aplicar a seleção ao catálogo.
    <motion.aside
      ref={dialogRef}
      className="filter-drawer"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="drawer-header">
        <div>
          <span className="catalog-eyebrow">Refinar busca</span>
          <h2 id={titleId}>Encontre o perfil ideal</h2>
        </div>
        <button
          className="catalog-icon-button"
          type="button"
          onClick={onClose}
          aria-label="Fechar filtros"
        >
          <X size={20} aria-hidden="true" />
        </button>
      </div>
      <div className="drawer-content">
        <FilterGroup label="Espécie">{renderOptions("species", speciesOptions)}</FilterGroup>
        <FilterGroup label="Porte">{renderOptions("size", sizeOptions)}</FilterGroup>
        <FilterGroup label={ageLabel}>
          <input
            className="age-range"
            type="range"
            min="1"
            max={MAX_AGE_FILTER}
            value={ageLimit}
            aria-label="Idade máxima"
            aria-valuetext={ageLimit >= MAX_AGE_FILTER ? "Qualquer idade" : `Até ${ageLimit} anos`}
            onChange={(event) =>
              setFilters((current) => ({ ...current, age: Number(event.target.value) }))
            }
          />
        </FilterGroup>
        <FilterGroup label="Sexo">{renderOptions("sex", sexOptions)}</FilterGroup>
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
        <FilterGroup label="Status">
          <button
            type="button"
            aria-pressed={filters.urgent}
            className={filters.urgent ? "urgent-toggle active" : "urgent-toggle"}
            onClick={() =>
              setFilters((current) => ({ ...current, urgent: !current.urgent }))
            }
          >
            <Heart size={16} aria-hidden="true" /> Mostrar apenas urgentes
          </button>
        </FilterGroup>
      </div>
      <div className="drawer-footer">
        <button type="button" className="catalog-secondary-button" onClick={onClear}>
          Limpar filtros
        </button>
        <button type="button" className="catalog-primary-button" onClick={onClose}>
          {resultCount === 1 ? "Ver 1 resultado" : `Ver ${resultCount} resultados`}
        </button>
      </div>
    </motion.aside>
  );
}
