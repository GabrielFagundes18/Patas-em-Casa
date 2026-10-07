import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'patas:favoritos';

// Leitura e escrita protegidas: em janela anônima ou com o armazenamento bloqueado, os favoritos
// funcionam só enquanto a página está aberta, sem quebrar o catálogo.
function readStored() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

function writeStored(ids) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // Sem armazenamento disponível: mantém só na memória.
  }
}

// O quê: animais marcados com o coração no catálogo.
// Como: lista de ids salva no próprio navegador (localStorage); outras abas são atualizadas pelo evento "storage".
// Para quê: a pessoa separa os animais de que gostou e compara depois, sem precisar de cadastro.
export function useFavorites() {
  const [favoriteIds, setFavoriteIds] = useState(readStored);

  useEffect(() => {
    function handleStorage(event) {
      if (event.key === STORAGE_KEY) setFavoriteIds(readStored());
    }
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const toggleFavorite = useCallback((id) => {
    if (!id) return;
    setFavoriteIds((current) => {
      const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
      writeStored(next);
      return next;
    });
  }, []);

  const isFavorite = useCallback((id) => favoriteIds.includes(id), [favoriteIds]);

  return { favoriteIds, isFavorite, toggleFavorite };
}
