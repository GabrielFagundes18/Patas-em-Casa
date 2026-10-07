import { useCallback, useEffect, useState } from 'react';
import { buscarTodoAnimais } from '../api/animals';
import { mapPetsFromApi } from '../utils/petMapper';

// O quê: animais disponíveis para adoção, já no formato dos componentes.
// Como: uma busca ao montar; a requisição é cancelada se a página sair antes da resposta.
// Para quê: a Home usa a mesma lista no destaque do topo e na vitrine, com uma única chamada à API;
// o catálogo usa reload() no botão "Tentar novamente".
export function useAvailableAnimals() {
  const [state, setState] = useState({ pets: [], loading: true, error: null });
  const [attempt, setAttempt] = useState(0);
  const reload = useCallback(() => setAttempt((count) => count + 1), []);

  useEffect(() => {
    const controller = new AbortController();
    setState((current) => (current.loading ? current : { ...current, loading: true, error: null }));
    buscarTodoAnimais({ signal: controller.signal })
      .then((dados) => {
        if (!controller.signal.aborted) setState({ pets: mapPetsFromApi(dados), loading: false, error: null });
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setState({ pets: [], loading: false, error: 'Não foi possível carregar os animais agora.' });
        }
      });
    return () => controller.abort();
  }, [attempt]);

  return { ...state, reload };
}
