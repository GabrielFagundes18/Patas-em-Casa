/*
 * ============================================================================
 * ARQUIVO: useAdoptionSteps.js
 * ============================================================================
 *
 * PARA QUE SERVE:
 *   Hook personalizado que fornece as ETAPAS do processo de adoção ("Encontre",
 *   "Conecte-se"...). Começa com etapas padrão (escritas no código) e, quando a
 *   API responde, troca pelas etapas cadastradas pela equipe no painel.
 *
 * PRINCIPAIS ITENS:
 *   - defaultSteps (exportado): etapas padrão, usadas enquanto a API não responde
 *     ou se ela falhar.
 *   - useAdoptionSteps() (exportado): o hook; devolve a lista de etapas.
 *
 * CONEXÕES COM OUTROS ARQUIVOS:
 *   - react          → useEffect e useState.
 *   - api/content.js → buscarEtapasAdocao (rota pública /api/v1/public/adoption-steps).
 *   - Usado por: features/home/LandingPage.jsx (seção "Como funciona" da home) e
 *     features/adoption/HowAdoptionWorksPage.jsx (página "Como funciona").
 * ============================================================================
 */

// Hooks do React usados aqui.
import { useEffect, useState } from 'react';
// Função que busca as etapas na API pública.
import { buscarEtapasAdocao } from 'api/content';

// O quê: etapas padrão, usadas enquanto a API responde ou se ela estiver indisponível.
// Cada etapa tem título, descrição e o nome de um ícone (usado pelos componentes que desenham as etapas).
export const defaultSteps = [
  { title: 'Encontre', description: 'Navegue pelos pets disponíveis perto de você.', icon: 'search' },
  { title: 'Conecte-se', description: 'Converse com o abrigo e conheça a história dele.', icon: 'heart' },
  { title: 'Cadastre-se', description: 'Preencha um formulário rápido de responsabilidade.', icon: 'clipboard' },
  { title: 'Leve para casa', description: 'Combine a retirada e comece a nova vida juntos.', icon: 'home' },
];

/*
 * HOOK: useAdoptionSteps
 * O que faz: devolve as etapas de adoção, trocando as padrão pelas da API quando chegarem.
 * Parâmetros: nenhum.
 * Retorno (array): lista de etapas no formato { title, description } (as padrão também têm "icon").
 * Onde é usado: LandingPage.jsx e HowAdoptionWorksPage.jsx.
 */
// O quê: etapas oficiais do processo de adoção (tabela adoption_steps, via API pública).
// Como: começa pelas etapas padrão e troca pelas da API quando chegam; cancela a requisição ao desmontar.
// Para quê: a Home e a página "Como funciona" mostram sempre o mesmo passo a passo.
export function useAdoptionSteps() {
  // Estado com a lista de etapas; começa com as etapas padrão (a tela nunca fica vazia).
  const [steps, setSteps] = useState(defaultSteps);

  // Efeito que busca as etapas na API, uma vez ao montar ([] = sem dependências).
  useEffect(() => {
    // Controlador para cancelar a requisição se o componente sair da tela.
    const controller = new AbortController();
    buscarEtapasAdocao({ signal: controller.signal })
      .then((etapas) => {
        // Só troca se a busca não foi cancelada E se a API mandou pelo menos uma etapa.
        if (!controller.signal.aborted && etapas.length > 0) {
          // Converte os campos da API (titulo, descricao) para os nomes usados na interface
          // (title, description). Os parênteses em ({ ... }) fazem a arrow function devolver um objeto.
          setSteps(etapas.map((etapa) => ({ title: etapa.titulo, description: etapa.descricao })));
        }
      })
      // Em caso de erro, não faz nada: as etapas padrão continuam aparecendo.
      .catch(() => {});
    // Limpeza: cancela a requisição ao desmontar.
    return () => controller.abort();
  }, []);

  // Devolve a lista atual de etapas.
  return steps;
}

/*
 * ============================================================================
 * RESUMO DO ARQUIVO
 * ============================================================================
 *
 * COMO O FLUXO FUNCIONA:
 *   1. O componente chama useAdoptionSteps() e recebe imediatamente as etapas padrão.
 *   2. Em paralelo, o useEffect busca as etapas na API.
 *   3. Se vierem etapas, o estado é atualizado e o componente redesenha com elas.
 *   4. Se a API falhar ou vier vazia, as etapas padrão permanecem.
 *   5. Se o componente sair da tela antes da resposta, a requisição é cancelada.
 *
 * CONCEITOS IMPORTANTES PARA ESTUDAR:
 *   - Hooks personalizados.
 *   - Valor inicial "otimista"/padrão (fallback) para não deixar a tela vazia.
 *   - useEffect com [] (roda uma vez) e cancelamento com AbortController.
 *   - Conversão de formato com .map e arrow function devolvendo objeto: (x) => ({ ... }).
 *   - Tratamento silencioso de erro (.catch(() => {})) e quando isso faz sentido.
 * ============================================================================
 */
