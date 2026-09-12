// O quê: define o contêiner reutilizável de uma seção de filtros.
// Como: recebe label e children e os compõe em título e conteúdo sem impor um tipo de controle.
// Para quê: padronizar espaçamento e semântica para opções, ranges, checkboxes e selects.
export function FilterGroup({ label, children }) {
  return (
    <div className="filter-group">
      <h3>{label}</h3>
      {children}
    </div>
  );
}
