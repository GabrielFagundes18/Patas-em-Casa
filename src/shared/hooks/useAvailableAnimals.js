/*
 * ============================================================================
 * ARQUIVO: useAvailableAnimals.js
 * ============================================================================
 *
 * PARA QUE SERVE:
 *   É um HOOK PERSONALIZADO do React (uma função que começa com "use" e usa
 *   outros hooks). Ele busca os animais disponíveis para adoção na API, converte
 *   para o formato dos componentes e informa o estado da busca (carregando / erro).
 *   Também oferece uma função "reload" para tentar de novo.
 *
 * PRINCIPAIS FUNÇÕES:
 *   - useAvailableAnimals() → devolve { pets, loading, error, reload }.
 *
 * CONEXÕES COM OUTROS ARQUIVOS:
 *   - react                     → useState, useEffect, useCallback.
 *   - api/animals.js            → buscarTodoAnimais (busca na API pública).
 *   - shared/utils/petMapper.js → mapPetsFromApi (converte o formato).
 *   - Usado por: features/home/LandingPage.jsx (página inicial) e
 *     features/catalog/AdoptionCatalog.jsx (catálogo).
 * ============================================================================
 */

// useCallback: "memoriza" uma função para que ela não seja recriada a cada renderização.
// useEffect: executa efeitos colaterais (como buscar dados) depois de desenhar a tela.
// useState: cria estado (dados que, ao mudar, fazem o componente redesenhar).
import { useCallback, useEffect, useState } from 'react';
// Função que busca TODOS os animais disponíveis na API pública.
import { buscarTodoAnimais } from 'api/animals';
// Função que converte a lista da API para o formato dos componentes.
import { mapPetsFromApi } from 'shared/utils/petMapper';

/*
 * HOOK: useAvailableAnimals
 * O que faz: busca os animais disponíveis e controla carregamento, erro e nova tentativa.
 * Parâmetros: nenhum.
 * Retorno (objeto):
 *   - pets (array): animais já convertidos pelo petMapper (vazio enquanto carrega ou em erro);
 *   - loading (boolean): true enquanto a busca está em andamento;
 *   - error (string | null): mensagem de erro, ou null se deu tudo certo;
 *   - reload (função): chame para buscar de novo (ex.: botão "Tentar novamente").
 * Onde é usado: LandingPage.jsx e AdoptionCatalog.jsx.
 */
// O quê: animais disponíveis para adoção, já no formato dos componentes.
// Como: uma busca ao montar; a requisição é cancelada se a página sair antes da resposta.
// Para quê: a Home usa a mesma lista no destaque do topo e na vitrine, com uma única chamada à API;
// o catálogo usa reload() no botão "Tentar novamente".
export function useAvailableAnimals() {
  // Estado agrupado em um objeto: lista de animais, se está carregando e a mensagem de erro.
  // Começa com loading: true porque a busca já começa logo ao montar.
  const [state, setState] = useState({ pets: [], loading: true, error: null });
  // Contador de tentativas: cada vez que aumenta, o useEffect abaixo roda de novo.
  const [attempt, setAttempt] = useState(0);
  // Função de recarregar: soma 1 em "attempt".
  // useCallback com lista de dependências vazia ([]) faz a função ser criada só uma vez,
  // mantendo a mesma "identidade" entre renderizações (bom para quem a recebe como prop).
  const reload = useCallback(() => setAttempt((count) => count + 1), []);

  // Efeito que busca os animais. Roda ao montar e sempre que "attempt" mudar.
  useEffect(() => {
    // AbortController permite CANCELAR a requisição. O "signal" dele é passado ao axios.
    const controller = new AbortController();
    // Marca como carregando e limpa o erro. Se já estiver carregando, devolve o mesmo objeto
    // ("current") — assim o React percebe que nada mudou e evita redesenhar à toa.
    setState((current) => (current.loading ? current : { ...current, loading: true, error: null }));
    // Faz a busca, ligando-a ao sinal de cancelamento.
    buscarTodoAnimais({ signal: controller.signal })
      // Sucesso: converte os dados e guarda no estado.
      .then((dados) => {
        // Se a busca foi cancelada (componente saiu da tela), não atualiza o estado.
        if (!controller.signal.aborted) setState({ pets: mapPetsFromApi(dados), loading: false, error: null });
      })
      // Erro: guarda uma mensagem amigável (o detalhe técnico do erro é ignorado aqui).
      .catch(() => {
        if (!controller.signal.aborted) {
          setState({ pets: [], loading: false, error: 'Não foi possível carregar os animais agora.' });
        }
      });
    // Função de limpeza: roda quando o componente sai da tela ou antes de o efeito rodar de novo.
    // controller.abort() cancela a requisição em andamento.
    return () => controller.abort();
    // Dependência: o efeito roda de novo quando "attempt" muda (ou seja, quando reload é chamado).
  }, [attempt]);

  // Devolve todos os campos do estado (pets, loading, error) e a função reload.
  // "...state" espalha as propriedades do objeto state dentro do novo objeto.
  return { ...state, reload };
}

/*
 * ============================================================================
 * RESUMO DO ARQUIVO
 * ============================================================================
 *
 * COMO O FLUXO FUNCIONA:
 *   1. Um componente chama useAvailableAnimals().
 *   2. O estado começa com loading: true.
 *   3. O useEffect cria um AbortController e chama buscarTodoAnimais.
 *   4. Quando a resposta chega, os dados são convertidos (mapPetsFromApi) e salvos;
 *      se der erro, salva uma mensagem.
 *   5. Se o componente sair da tela antes, a limpeza cancela a requisição.
 *   6. Ao chamar reload(), "attempt" aumenta e o processo recomeça do passo 3.
 *
 * CONCEITOS IMPORTANTES PARA ESTUDAR:
 *   - Hooks personalizados (custom hooks) e a regra do prefixo "use".
 *   - useState com objeto e atualização funcional (setState(current => ...)).
 *   - useEffect: dependências e função de limpeza (cleanup).
 *   - useCallback e "identidade" de funções entre renderizações.
 *   - AbortController / signal para cancelar requisições.
 *   - Promises com .then / .catch.
 *   - Padrão "tentar novamente" usando um contador como dependência.
 * ============================================================================
 */
