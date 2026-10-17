/*
 * ============================================================================
 * ARQUIVO: useFavorites.js
 * ============================================================================
 *
 * PARA QUE SERVE:
 *   Hook personalizado dos FAVORITOS do catálogo (o coração nos cartões). Guarda
 *   a lista de ids favoritados no próprio navegador (localStorage), sem precisar
 *   de login. Se o visitante tiver o site aberto em duas abas, as duas ficam
 *   sincronizadas.
 *
 * PRINCIPAIS ITENS:
 *   - STORAGE_KEY: nome da chave no localStorage.
 *   - readStored() / writeStored(ids): leitura e escrita protegidas (internas).
 *   - useFavorites(): o hook; devolve { favoriteIds, isFavorite, toggleFavorite }.
 *
 * CONEXÕES COM OUTROS ARQUIVOS:
 *   - react → useCallback, useEffect, useState.
 *   - Usado por: features/catalog/AdoptionCatalog.jsx.
 *   - Os ids são usados por filterPets (catalogFilters.js) no filtro "Meus favoritos".
 * ============================================================================
 */

// Hooks do React.
import { useCallback, useEffect, useState } from 'react';

// Chave usada para guardar os favoritos no localStorage.
const STORAGE_KEY = 'patas:favoritos';

/*
 * FUNÇÃO: readStored (interna)
 * O que faz: lê a lista de ids favoritos salva no navegador.
 * Parâmetros: nenhum.
 * Retorno (array de strings): os ids salvos; [] se não houver nada, se o conteúdo for
 *   inválido ou se o armazenamento estiver bloqueado.
 * Onde é usada: no valor inicial do estado e quando outra aba muda os favoritos.
 */
// Leitura e escrita protegidas: em janela anônima ou com o armazenamento bloqueado, os favoritos
// funcionam só enquanto a página está aberta, sem quebrar o catálogo.
function readStored() {
  try {
    // getItem devolve o texto salvo (ou null → usamos '[]'). JSON.parse transforma o texto em array.
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]');
    // Confere se é mesmo um array e mantém só os itens que são texto (proteção contra dados estranhos).
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'string') : [];
  } catch {
    // JSON inválido ou localStorage bloqueado → lista vazia.
    return [];
  }
}

/*
 * FUNÇÃO: writeStored (interna)
 * O que faz: salva a lista de ids no navegador.
 * Parâmetros: ids (array de strings).
 * Retorno: nada.
 * Onde é usada: em toggleFavorite.
 */
function writeStored(ids) {
  try {
    // JSON.stringify transforma o array em texto (o localStorage só guarda texto).
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // Sem armazenamento disponível: mantém só na memória.
  }
}

/*
 * HOOK: useFavorites
 * O que faz: gerencia a lista de favoritos do visitante.
 * Parâmetros: nenhum.
 * Retorno (objeto):
 *   - favoriteIds (array): ids favoritados;
 *   - isFavorite(id) (função): true se o id está nos favoritos;
 *   - toggleFavorite(id) (função): adiciona ou remove o id.
 * Onde é usado: AdoptionCatalog.jsx.
 */
// O quê: animais marcados com o coração no catálogo.
// Como: lista de ids salva no próprio navegador (localStorage); outras abas são atualizadas pelo evento "storage".
// Para quê: a pessoa separa os animais de que gostou e compara depois, sem precisar de cadastro.
export function useFavorites() {
  // Passar a FUNÇÃO readStored (sem parênteses) faz o React chamá-la só na primeira renderização.
  const [favoriteIds, setFavoriteIds] = useState(readStored);

  // Sincronização entre abas: o navegador dispara o evento "storage" nas OUTRAS abas
  // quando o localStorage muda.
  useEffect(() => {
    // Se a chave alterada for a dos favoritos, relê a lista.
    function handleStorage(event) {
      if (event.key === STORAGE_KEY) setFavoriteIds(readStored());
    }
    // Começa a escutar.
    window.addEventListener('storage', handleStorage);
    // Limpeza: para de escutar.
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Adiciona/remove um id. useCallback com [] mantém a mesma função entre renderizações.
  const toggleFavorite = useCallback((id) => {
    // Sem id (animal sem identificador), não faz nada.
    if (!id) return;
    // Atualização funcional: "current" é a lista atual.
    setFavoriteIds((current) => {
      // Se já está, remove; senão, adiciona.
      const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
      // Salva no navegador.
      writeStored(next);
      // A lista nova vira o estado.
      return next;
    });
  }, []);

  // Verifica se um id é favorito. Recriada quando a lista muda (dependência [favoriteIds]).
  const isFavorite = useCallback((id) => favoriteIds.includes(id), [favoriteIds]);

  // Devolve os dados e as funções.
  return { favoriteIds, isFavorite, toggleFavorite };
}

/*
 * ============================================================================
 * RESUMO DO ARQUIVO
 * ============================================================================
 *
 * COMO O FLUXO FUNCIONA:
 *   1. Ao montar, o hook lê os favoritos salvos (readStored).
 *   2. Clicar no coração chama toggleFavorite(id), que atualiza o estado e salva.
 *   3. Se outra aba mudar os favoritos, o evento "storage" faz esta aba reler a lista.
 *   4. O catálogo usa isFavorite para pintar o coração e favoriteIds no filtro "Meus favoritos".
 *
 * CONCEITOS IMPORTANTES PARA ESTUDAR:
 *   - localStorage com JSON.stringify/JSON.parse e try/catch.
 *   - Validar dados vindos do armazenamento (Array.isArray, typeof).
 *   - useState com inicialização preguiçosa (passando a função).
 *   - Evento "storage" para sincronizar abas.
 *   - useCallback e lista de dependências.
 *   - Atualização funcional do estado (setState(current => ...)).
 * ============================================================================
 */
