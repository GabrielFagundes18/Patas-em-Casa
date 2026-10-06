import { useEffect, useState } from 'react';
import { buscarTodoAnimais } from '../services/animaisService';
import { mapPetsFromApi } from '../utils/petMapper';

// O quê: animais disponíveis para adoção, já no formato dos componentes.
// Como: uma busca ao montar; a requisição é cancelada se a página sair antes da resposta.
// Para quê: a Home usa a mesma lista no destaque do topo e na vitrine, com uma única chamada à API.
export function useAvailableAnimals() {
  const [state, setState] = useState({ pets: [], loading: true, error: null });

  useEffect(() => {
    const controller = new AbortController();
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
  }, []);

  return state;
}
