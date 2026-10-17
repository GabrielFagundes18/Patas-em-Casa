/*
 * ============================================================================
 * ARQUIVO: usePaginatedList.js
 * ============================================================================
 *
 * PARA QUE SERVE:
 *   Hook personalizado que concentra a lógica das LISTAS PAGINADAS do painel:
 *   lê os filtros e a página da URL (?page=2&q=ana&status=ativo), chama a função
 *   que busca os dados, controla carregando/erro e oferece funções para mudar
 *   filtros, página e recarregar. Assim cada tela de listagem fica bem mais curta.
 *
 * PRINCIPAIS ITENS:
 *   - ADMIN_PAGE_SIZE: itens por página (20).
 *   - errorMessage(error, fallback): mensagem de erro da API (exportada).
 *   - usePaginatedList(loader, fallbackError): o hook.
 *
 * CONEXÕES COM OUTROS ARQUIVOS:
 *   - react (useEffect, useState), react-router-dom (useSearchParams).
 *   - Usado por: admin/adoptions, adopters, donations, volunteers, stories, team
 *     (cada tela passa a função de seu "service", ex.: listDonations).
 *   - Segue o mesmo padrão da tela admin/animals/AnimalsPage.jsx.
 * ============================================================================
 */

// Hooks do React.
import { useEffect, useState } from 'react';
// Ler e escrever os parâmetros da URL.
import { useSearchParams } from 'react-router-dom';

// Quantidade padrão de itens por página.
export const ADMIN_PAGE_SIZE = 20;

/*
 * FUNÇÃO: errorMessage (exportada)
 * O que faz: devolve a mensagem de erro do backend ou um texto padrão.
 * Parâmetros: error (erro do axios) e fallback (string padrão).
 * Retorno (string).
 * Onde é usada: aqui no hook e em telas do painel.
 */
export function errorMessage(error, fallback) {
  return error?.response?.data?.error?.message || fallback;
}

/*
 * HOOK: usePaginatedList
 * O que faz: busca uma lista paginada usando os filtros da URL.
 * Parâmetros:
 *   - loader (função async): recebe os parâmetros (objeto) e devolve { items, meta }.
 *     IMPORTANTE: deve ser uma função "estável" (definida fora do componente ou com useCallback),
 *     senão o efeito rodaria a cada renderização.
 *   - fallbackError (string): mensagem padrão de erro.
 * Retorno (objeto):
 *   - items (array), meta ({ page, pageSize, total, totalPages }), loading (boolean), error (string);
 *   - filters (objeto com os parâmetros atuais da URL);
 *   - setFilter(name, value), setPage(page), reload().
 * Onde é usado: telas de listagem do painel.
 */
// Lista paginada com filtros na URL (?page=&q=&status=...), no mesmo padrão da tela de animais.
// loader(params) deve devolver { items, meta }.
export function usePaginatedList(loader, fallbackError) {
  // Parâmetros da URL e função para trocá-los.
  const [searchParams, setSearchParams] = useSearchParams();
  // Versão em texto dos parâmetros (comparação simples para o useEffect).
  const searchKey = searchParams.toString();
  // Itens da página atual.
  const [items, setItems] = useState([]);
  // Dados de paginação.
  const [meta, setMeta] = useState({ page: 1, pageSize: ADMIN_PAGE_SIZE, total: 0, totalPages: 0 });
  // Carregando?
  const [loading, setLoading] = useState(true);
  // Mensagem de erro ('' = sem erro).
  const [error, setError] = useState('');
  // Contador para forçar recarga.
  const [reloadKey, setReloadKey] = useState(0);

  // Busca os dados sempre que os filtros (URL) mudam ou reload é chamado.
  useEffect(() => {
    // Trava contra respostas antigas (se os filtros mudarem antes da resposta chegar).
    let active = true;
    setLoading(true);
    setError('');

    // Converte a URL num objeto de parâmetros.
    const params = Object.fromEntries(new URLSearchParams(searchKey).entries());
    // Garante página e tamanho de página ("||=" só atribui se estiver vazio).
    params.page ||= '1';
    params.pageSize ||= String(ADMIN_PAGE_SIZE);

    // Chama a função de busca da tela.
    loader(params)
      .then((response) => {
        // Resposta antiga: ignora.
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

    // Limpeza: desliga a trava.
    return () => {
      active = false;
    };
  }, [loader, fallbackError, searchKey, reloadKey]);

  /*
   * FUNÇÃO INTERNA: setFilter
   * O que faz: define (ou remove, se vazio) um filtro na URL e volta para a página 1.
   * Parâmetros: name (ex.: 'status') e value (ex.: 'ativo' ou '').
   */
  function setFilter(name, value) {
    // Copia os parâmetros atuais.
    const next = new URLSearchParams(searchParams);
    // Valor vazio remove o filtro; senão, define.
    if (value === undefined || value === '') next.delete(name);
    else next.set(name, value);
    // Novo filtro → primeira página.
    next.set('page', '1');
    // Grava na URL (o efeito acima busca de novo).
    setSearchParams(next);
  }

  /*
   * FUNÇÃO INTERNA: setPage
   * O que faz: troca a página mantendo os filtros.
   * Parâmetros: page (number).
   */
  function setPage(page) {
    const next = new URLSearchParams(searchParams);
    next.set('page', String(page));
    setSearchParams(next);
  }

  // Devolve os dados e as funções para a tela.
  return {
    items,
    meta,
    loading,
    error,
    // Filtros atuais como objeto (ex.: { q: 'ana', status: 'ativo', page: '2' }).
    filters: Object.fromEntries(searchParams.entries()),
    setFilter,
    setPage,
    // Recarregar: soma 1 no contador (o efeito roda de novo).
    reload: () => setReloadKey((key) => key + 1),
  };
}

/*
 * ============================================================================
 * RESUMO DO ARQUIVO
 * ============================================================================
 *
 * COMO O FLUXO FUNCIONA:
 *   1. A tela chama usePaginatedList(listarAlgo, 'mensagem de erro').
 *   2. O hook lê a URL, completa page/pageSize e chama listarAlgo(params).
 *   3. Guarda items e meta (ou a mensagem de erro) e controla o "carregando".
 *   4. A tela usa setFilter/setPage para mudar a URL → o efeito busca de novo;
 *      reload() força nova busca com os mesmos filtros.
 *
 * CONCEITOS IMPORTANTES PARA ESTUDAR:
 *   - Hooks personalizados para reaproveitar lógica entre telas.
 *   - Estado na URL (useSearchParams) e paginação no servidor.
 *   - Promises com then/catch/finally e a "trava" contra respostas antigas.
 *   - Funções como parâmetro (loader) e a importância de referências estáveis em dependências.
 *   - Operador "||=".
 * ============================================================================
 */
