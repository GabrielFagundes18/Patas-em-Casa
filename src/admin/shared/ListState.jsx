// Estados comuns das listas do painel: carregando (esqueleto), erro com nova tentativa e vazio.
export default function ListState({ loading, error, empty, emptyTitle, emptyText, onRetry }) {
  if (loading) {
    return (
      <div aria-label="Carregando dados" className="admin-list-loading" role="status">
        {Array.from({ length: 4 }).map((_, index) => <span className="admin-skeleton" key={index} />)}
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-state is-error" role="alert">
        <strong>Não foi possível carregar</strong>
        <p>{error}</p>
        <button className="admin-button is-primary" onClick={onRetry} type="button">Tentar novamente</button>
      </div>
    );
  }

  if (empty) {
    return (
      <div className="admin-state">
        <strong>{emptyTitle}</strong>
        <p>{emptyText}</p>
      </div>
    );
  }

  return null;
}
