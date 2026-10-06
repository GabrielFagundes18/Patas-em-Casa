import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

export const ADMIN_PAGE_SIZE = 20;

export function errorMessage(error, fallback) {
  return error?.response?.data?.error?.message || fallback;
}

// Lista paginada com filtros na URL (?page=&q=&status=...), no mesmo padrão da tela de animais.
// loader(params) deve devolver { items, meta }.
export function usePaginatedList(loader, fallbackError) {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchKey = searchParams.toString();
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ page: 1, pageSize: ADMIN_PAGE_SIZE, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');

    const params = Object.fromEntries(new URLSearchParams(searchKey).entries());
    params.page ||= '1';
    params.pageSize ||= String(ADMIN_PAGE_SIZE);

    loader(params)
      .then((response) => {
        if (!active) return;
        setItems(response.items);
        setMeta(response.meta);
      })
      .catch((requestError) => {
        if (active) setError(errorMessage(requestError, fallbackError));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [loader, fallbackError, searchKey, reloadKey]);

  function setFilter(name, value) {
    const next = new URLSearchParams(searchParams);
    if (value === undefined || value === '') next.delete(name);
    else next.set(name, value);
    next.set('page', '1');
    setSearchParams(next);
  }

  function setPage(page) {
    const next = new URLSearchParams(searchParams);
    next.set('page', String(page));
    setSearchParams(next);
  }

  return {
    items,
    meta,
    loading,
    error,
    filters: Object.fromEntries(searchParams.entries()),
    setFilter,
    setPage,
    reload: () => setReloadKey((key) => key + 1),
  };
}
