/*
 * ============================================================================
 * ARQUIVO: ListState.jsx
 * ============================================================================
 *
 * PARA QUE SERVE:
 *   Componente que mostra os ESTADOS comuns das listas do painel:
 *     - carregando (com "esqueletos" animados);
 *     - erro (com botão "Tentar novamente");
 *     - vazio (com título e texto explicativo).
 *   Quando nenhum desses estados se aplica, não mostra nada (a lista aparece).
 *
 * PRINCIPAIS ITENS:
 *   - ListState({ loading, error, empty, emptyTitle, emptyText, onRetry }): o componente.
 *
 * CONEXÕES COM OUTROS ARQUIVOS:
 *   - Não importa nada.
 *   - Estilos .admin-list-loading, .admin-skeleton, .admin-state em admin/styles/admin.css.
 *   - Usado pelas listagens do painel (adoções, adotantes, doações, voluntários, histórias, equipe).
 * ============================================================================
 */

/*
 * COMPONENTE: ListState
 * O que faz: escolhe e desenha o estado da lista (carregando, erro ou vazio).
 * Parâmetros (props):
 *   - loading (boolean): está carregando?
 *   - error (string): mensagem de erro ('' = sem erro).
 *   - empty (boolean): a lista está vazia?
 *   - emptyTitle (string), emptyText (string): textos do estado vazio.
 *   - onRetry (função): chamada pelo botão "Tentar novamente".
 * Retorno: JSX do estado, ou null.
 * Onde é usado: telas de listagem do painel.
 */
// Estados comuns das listas do painel: carregando (esqueleto), erro com nova tentativa e vazio.
export default function ListState({ loading, error, empty, emptyTitle, emptyText, onRetry }) {
  // 1) Carregando: 4 "esqueletos" (barras cinzas animadas). A ordem dos "if" define a prioridade.
  if (loading) {
    return (
      // role="status" + aria-label: o leitor de tela anuncia "Carregando dados".
      <div aria-label="Carregando dados" className="admin-list-loading" role="status">
        {/* Array.from({ length: 4 }) cria 4 posições; "_" = item não usado, só o índice. */}
        {Array.from({ length: 4 }).map((_, index) => <span className="admin-skeleton" key={index} />)}
      </div>
    );
  }

  // 2) Erro: mensagem + botão para tentar de novo.
  if (error) {
    return (
      <div className="admin-state is-error" role="alert">
        <strong>Não foi possível carregar</strong>
        <p>{error}</p>
        <button className="admin-button is-primary" onClick={onRetry} type="button">Tentar novamente</button>
      </div>
    );
  }

  // 3) Vazio: título e texto explicativo.
  if (empty) {
    return (
      <div className="admin-state">
        <strong>{emptyTitle}</strong>
        <p>{emptyText}</p>
      </div>
    );
  }

  // 4) Nenhum estado especial: não desenha nada (a tela mostra a lista normalmente).
  return null;
}

/*
 * ============================================================================
 * RESUMO DO ARQUIVO
 * ============================================================================
 *
 * COMO FUNCIONA:
 *   A tela passa loading/error/empty; o componente verifica nessa ordem e mostra o
 *   primeiro estado verdadeiro. Assim todas as listas do painel têm o mesmo visual
 *   e o mesmo comportamento para carregando, erro e vazio.
 *
 * CONCEITOS IMPORTANTES PARA ESTUDAR:
 *   - "Return antecipado" para escolher o que renderizar.
 *   - Componente reutilizável de estados de interface.
 *   - Skeleton screens (esqueletos de carregamento).
 *   - Acessibilidade: role="status" x role="alert".
 * ============================================================================
 */
