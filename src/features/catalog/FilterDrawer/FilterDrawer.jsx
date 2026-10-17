/*
 * ============================================================================
 * ARQUIVO: FilterDrawer.jsx
 * ============================================================================
 *
 * PARA QUE SERVE:
 *   É a GAVETA LATERAL de filtros do catálogo (abre deslizando da direita). Nela
 *   o visitante escolhe espécie, porte, idade, sexo, temperamento, cuidados
 *   (castrado/vacinado) e "apenas urgentes". A gaveta funciona como um diálogo
 *   modal acessível (foco preso dentro, Esc fecha).
 *
 * PRINCIPAIS ITENS:
 *   - FilterDrawer({ filters, setFilters, onClose, onClear, resultCount, temperamentOptions }):
 *     o componente (exportação nomeada).
 *       Dentro dele: toggleValue (liga/desliga uma opção) e renderOptions (desenha botões).
 *
 * CONEXÕES COM OUTROS ARQUIVOS:
 *   - react (useId), framer-motion (motion), lucide-react (ícones).
 *   - features/catalog/catalogOptions → opções de espécie, porte, sexo e idade.
 *   - shared/hooks/useDialog          → comportamento de modal acessível.
 *   - ./FilterGroup                   → bloco com título de cada grupo.
 *   - ./FilterDrawer.css              → estilos da gaveta.
 *   - Botões .catalog-* de styles/globals.css.
 *   - Quem usa: features/catalog/AdoptionCatalog.jsx (que guarda o estado dos filtros).
 * ============================================================================
 */

// O quê: gaveta com todos os filtros do catálogo (espécie, porte, idade, sexo, temperamento, cuidados, status).
// Como: recebe o estado controlado do catálogo e usa callbacks para alterá-lo; temperamento só aparece
// quando algum animal tem traços cadastrados.
// Para quê: encapsular todos os critérios de refinamento da busca.
// useId: gera um identificador único e estável (para ligar o título ao diálogo via aria-labelledby).
import { useId } from "react";
// Elementos animáveis.
import { motion } from "framer-motion";
// Ícones: ✓, coração e X.
import { Check, Heart, X } from "lucide-react";
// Opções fixas dos filtros.
import {
  AGE_GROUPS,
  sexOptions,
  sizeOptions,
  speciesOptions,
} from "features/catalog/catalogOptions";
// Hook de modal acessível.
import { useDialog } from "shared/hooks/useDialog";
// Bloco com título para cada grupo de filtros.
import { FilterGroup } from "./FilterGroup";
// Estilos da gaveta.
import "./FilterDrawer.css";

/*
 * COMPONENTE: FilterDrawer
 * O que faz: desenha a gaveta de filtros e altera os filtros do catálogo.
 * Parâmetros (props):
 *   - filters (objeto): filtros atuais (formato de createInitialFilters).
 *   - setFilters (função): função de estado do catálogo para alterar os filtros.
 *   - onClose (função): fecha a gaveta.
 *   - onClear (função): limpa todos os filtros.
 *   - resultCount (number): quantos animais combinam com os filtros (mostrado no botão).
 *   - temperamentOptions (array, padrão []): traços disponíveis (de collectTemperaments).
 * Retorno: JSX do <motion.aside> (a gaveta).
 * Onde é usado: AdoptionCatalog.jsx.
 */
export function FilterDrawer({ filters, setFilters, onClose, onClear, resultCount, temperamentOptions = [] }) {
  // Id único para o título da gaveta.
  const titleId = useId();
  // Ref que dá à gaveta o comportamento de modal (foco, Esc, Tab, rolagem travada).
  const dialogRef = useDialog(onClose);

  /*
   * FUNÇÃO INTERNA: toggleValue
   * O que faz: liga/desliga um valor dentro de um filtro de lista.
   * Parâmetros: key (string — ex.: 'species') e value (string — ex.: 'Gato').
   * Retorno: nada (atualiza o estado do catálogo).
   */
  // O quê: alterna uma opção dentro de um filtro de seleção múltipla.
  // Como: atualização funcional lê o estado atual, remove o valor existente ou cria novo array com spread.
  // Para quê: evitar mutação direta e manter espécie, porte e sexo independentes.
  const toggleValue = (key, value) =>
    setFilters((current) => ({
      ...current,
      // Se já contém o valor, remove; senão, adiciona.
      [key]: current[key].includes(value)
        ? current[key].filter((item) => item !== value)
        : [...current[key], value],
    }));

  /*
   * FUNÇÃO INTERNA: renderOptions
   * O que faz: desenha um grupo de botões de seleção múltipla.
   * Parâmetros:
   *   - key (string): qual filtro (ex.: 'size').
   *   - options (array): opções em texto ("Gato") ou objetos { value, label, hint }.
   * Retorno: JSX com os botões.
   */
  // O quê: renderiza um grupo de botões de seleção múltipla.
  // Como: aria-pressed comunica o estado de cada opção para leitores de tela.
  // Para quê: reaproveitar a mesma marcação em espécie, porte, idade, sexo e temperamento.
  // Opções podem ser texto ("Gato") ou { value, label, hint } (faixas de idade).
  const renderOptions = (key, options) => (
    <div className="filter-options">
      {options.map((option) => {
        // Padroniza a opção: se for texto, vira { value: texto, label: texto }; se for objeto, usa como está.
        const { value, label, hint } = typeof option === "string" ? { value: option, label: option } : option;
        // A opção está marcada?
        const active = filters[key].includes(value);
        return (
          <button
            key={value}
            type="button"
            // aria-pressed: botão "liga/desliga" (leitores de tela anunciam "pressionado").
            aria-pressed={active}
            // Classe "active" quando marcada.
            className={active ? "filter-option active" : "filter-option"}
            onClick={() => toggleValue(key, value)}
          >
            {label}
            {/* Dica opcional (ex.: "até 1 ano" na faixa Filhote). */}
            {hint ? <small>{hint}</small> : null}
            {/* "&&": se active for true, mostra o ✓; se for false, não mostra nada. */}
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
      // Liga a gaveta ao hook useDialog.
      ref={dialogRef}
      className="filter-drawer"
      // role="dialog" + aria-modal: leitores de tela tratam como janela modal.
      role="dialog"
      aria-modal="true"
      // O nome do diálogo é o texto do título (pelo id).
      aria-labelledby={titleId}
      // Animação: entra vindo de fora da tela pela direita (x: 100%) até a posição 0.
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      // Ao sair (com AnimatePresence no pai), volta para a direita.
      exit={{ x: "100%" }}
      // Duração e curva de animação (cubic-bezier personalizado).
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* ===== Cabeçalho da gaveta ===== */}
      <div className="drawer-header">
        <div>
          <span className="catalog-eyebrow">Refinar busca</span>
          <h2 id={titleId}>Encontre o perfil ideal</h2>
        </div>
        {/* Botão de fechar (X). */}
        <button
          className="catalog-icon-button"
          type="button"
          onClick={onClose}
          aria-label="Fechar filtros"
        >
          <X size={20} aria-hidden="true" />
        </button>
      </div>
      {/* ===== Conteúdo: um grupo por filtro ===== */}
      <div className="drawer-content">
        <FilterGroup label="Espécie">{renderOptions("species", speciesOptions)}</FilterGroup>
        <FilterGroup label="Porte">{renderOptions("size", sizeOptions)}</FilterGroup>
        <FilterGroup label="Idade">{renderOptions("ages", AGE_GROUPS)}</FilterGroup>
        <FilterGroup label="Sexo">{renderOptions("sex", sexOptions)}</FilterGroup>
        {/* Temperamento só aparece se algum animal tiver traços cadastrados. */}
        {temperamentOptions.length > 0 ? (
          <FilterGroup label="Temperamento">{renderOptions("temperament", temperamentOptions)}</FilterGroup>
        ) : null}
        {/* Cuidados: duas caixas de seleção (interruptores). */}
        <FilterGroup label="Cuidados">
          <label className="check-row">
            {/* Checkbox controlado: checked vem dos filtros; onChange grava o novo valor (event.target.checked). */}
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
        {/* Status: botão liga/desliga para mostrar apenas urgentes. */}
        <FilterGroup label="Status">
          <button
            type="button"
            aria-pressed={filters.urgent}
            className={filters.urgent ? "urgent-toggle active" : "urgent-toggle"}
            // Inverte o valor de "urgent".
            onClick={() =>
              setFilters((current) => ({ ...current, urgent: !current.urgent }))
            }
          >
            <Heart size={16} aria-hidden="true" /> Mostrar apenas urgentes
          </button>
        </FilterGroup>
      </div>
      {/* ===== Rodapé: limpar e ver resultados ===== */}
      <div className="drawer-footer">
        <button type="button" className="catalog-secondary-button" onClick={onClear}>
          Limpar filtros
        </button>
        {/* Fecha a gaveta mostrando quantos resultados os filtros deram (singular/plural). */}
        <button type="button" className="catalog-primary-button" onClick={onClose}>
          {resultCount === 1 ? "Ver 1 resultado" : `Ver ${resultCount} resultados`}
        </button>
      </div>
    </motion.aside>
  );
}

/*
 * ============================================================================
 * RESUMO DO ARQUIVO
 * ============================================================================
 *
 * COMO O FLUXO FUNCIONA:
 *   1. O catálogo abre a gaveta passando os filtros e a função para alterá-los.
 *   2. A gaveta entra deslizando (Framer Motion) e o useDialog prende o foco nela.
 *   3. Cada clique muda os filtros do catálogo imediatamente (estado "controlado" pelo pai);
 *      o botão do rodapé mostra quantos resultados existem.
 *   4. "Limpar filtros" chama onClear; "Ver N resultados", o X ou Esc chamam onClose.
 *
 * CONCEITOS IMPORTANTES PARA ESTUDAR:
 *   - Componente controlado pelo pai (recebe estado + setter por props).
 *   - Funções que retornam JSX (renderOptions) para evitar repetição.
 *   - Normalizar opções de formatos diferentes (string ou objeto).
 *   - useId para ids acessíveis únicos.
 *   - Diálogos acessíveis: role="dialog", aria-modal, aria-labelledby, aria-pressed.
 *   - Framer Motion: initial/animate/exit e curvas de animação.
 *   - Operador && para renderização condicional.
 * ============================================================================
 */
