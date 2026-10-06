export default function Pagination({ meta, onChange }) {
  const page = Number(meta.page || 1);
  const totalPages = Math.max(Number(meta.totalPages || 0), 1);

  return (
    <nav aria-label="Paginação" className="admin-pagination">
      <p>Página {page} de {totalPages} · {meta.total || 0} registros</p>
      <div>
        <button className="admin-button" disabled={page <= 1} onClick={() => onChange(page - 1)} type="button">Anterior</button>
        <button className="admin-button" disabled={page >= totalPages} onClick={() => onChange(page + 1)} type="button">Próxima</button>
      </div>
    </nav>
  );
}
