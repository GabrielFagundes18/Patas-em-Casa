import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';

// Campo de busca que só aplica o filtro ao enviar (Enter ou botão), sem consultar a cada tecla.
export default function SearchField({ value = '', onSearch, label }) {
  const [draft, setDraft] = useState(value);

  useEffect(() => setDraft(value), [value]);

  return (
    <form
      className="admin-search"
      onSubmit={(event) => {
        event.preventDefault();
        onSearch(draft.trim());
      }}
      role="search"
    >
      <Search aria-hidden="true" size={18} />
      <input aria-label={label} maxLength="120" onChange={(event) => setDraft(event.target.value)} placeholder={label} value={draft} />
    </form>
  );
}
