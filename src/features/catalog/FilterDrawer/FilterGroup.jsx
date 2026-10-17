/*
 * ============================================================================
 * ARQUIVO: FilterGroup.jsx
 * ============================================================================
 *
 * PARA QUE SERVE:
 *   Pequeno componente que agrupa um conjunto de filtros com um título
 *   (ex.: "Espécie", "Porte", "Idade") dentro da gaveta de filtros do catálogo.
 *   Ele não decide qual controle mostrar: só dá o título e o espaçamento padrão.
 *
 * PRINCIPAIS ITENS:
 *   - FilterGroup({ label, children }): o componente (exportação nomeada).
 *
 * CONEXÕES COM OUTROS ARQUIVOS:
 *   - Usado por: features/catalog/FilterDrawer/FilterDrawer.jsx.
 *   - Estilizado por .filter-group em FilterDrawer/FilterDrawer.css.
 * ============================================================================
 */

/*
 * COMPONENTE: FilterGroup
 * O que faz: desenha um bloco com título e o conteúdo recebido.
 * Parâmetros (props):
 *   - label (string): o título do grupo (ex.: "Porte").
 *   - children (JSX): os controles de filtro colocados entre <FilterGroup> e </FilterGroup>.
 * Retorno: JSX de um <div> com <h3> e o conteúdo.
 * Onde é usado: FilterDrawer.jsx.
 */
// O quê: define o contêiner reutilizável de uma seção de filtros.
// Como: recebe label e children e os compõe em título e conteúdo sem impor um tipo de controle.
// Para quê: padronizar espaçamento e semântica para opções, ranges, checkboxes e selects.
export function FilterGroup({ label, children }) {
  return (
    <div className="filter-group">
      {/* Título do grupo. */}
      <h3>{label}</h3>
      {/* Os controles passados pelo componente pai. */}
      {children}
    </div>
  );
}

/*
 * ============================================================================
 * RESUMO DO ARQUIVO
 * ============================================================================
 *
 * COMO FUNCIONA:
 *   O FilterDrawer escreve, por exemplo:
 *     <FilterGroup label="Porte"> ...botões de porte... </FilterGroup>
 *   e este componente desenha o título "Porte" seguido dos botões.
 *
 * CONCEITOS IMPORTANTES PARA ESTUDAR:
 *   - Composição com a prop "children".
 *   - Componentes pequenos e reutilizáveis ("wrappers").
 *   - Semântica de títulos (h3 dentro da gaveta).
 * ============================================================================
 */
