export function FilterGroup({ label, children }) {
  return (
    <div className="filter-group">
      <h3>{label}</h3>
      {children}
    </div>
  );
}
