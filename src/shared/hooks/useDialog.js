/*
 * ============================================================================
 * ARQUIVO: useDialog.js
 * ============================================================================
 *
 * PARA QUE SERVE:
 *   Hook personalizado que dá a um elemento comportamento de JANELA MODAL
 *   acessível (que funciona bem com teclado e leitores de tela):
 *     - coloca o foco no primeiro botão/campo da janela ao abrir;
 *     - fecha com a tecla Esc;
 *     - mantém o Tab "preso" dentro da janela (não vai para a página de trás);
 *     - trava a rolagem da página enquanto a janela está aberta;
 *     - ao fechar, devolve o foco ao elemento que estava focado antes.
 *
 * PRINCIPAIS ITENS:
 *   - FOCUSABLE_SELECTOR: seletor CSS dos elementos que podem receber foco.
 *   - openDialogs / overflowBeforeDialogs: variáveis compartilhadas entre janelas.
 *   - useDialog(onClose): o hook (exportado); devolve uma "ref" para o elemento da janela.
 *
 * CONEXÕES COM OUTROS ARQUIVOS:
 *   - react → useEffect e useRef.
 *   - Usado por: features/catalog/FilterDrawer/FilterDrawer.jsx (gaveta de filtros) e
 *     features/adoption/AdoptionFormModal/AdoptionFormModal.jsx (formulário de adoção).
 * ============================================================================
 */

// useRef: cria uma "caixinha" que guarda um valor entre renderizações SEM provocar
// nova renderização quando muda. Também é usada para apontar para elementos do DOM.
import { useEffect, useRef } from 'react';

// Lista de seletores CSS de elementos "focáveis" (que recebem foco com Tab):
// links com href, botões/campos que não estão desabilitados e elementos com tabindex
// (exceto tabindex="-1", que significa "não entra na ordem do Tab").
// .join(', ') junta tudo num único seletor, ex.: "a[href], button:not([disabled]), ...".
const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

// Contador compartilhado: ficha e formulário podem coexistir durante a animação de saída,
// então a rolagem só é liberada quando o último diálogo aberto for desmontado.
// Estas variáveis ficam FORA do hook, então são compartilhadas por todas as janelas abertas.
// Quantas janelas estão abertas agora.
let openDialogs = 0;
// O valor original de "overflow" do <body>, para restaurar quando a última janela fechar.
let overflowBeforeDialogs = '';

/*
 * HOOK: useDialog
 * O que faz: aplica o comportamento de modal acessível ao elemento que receber a ref devolvida.
 * Parâmetros:
 *   - onClose (função): o que fazer para fechar a janela (chamada ao apertar Esc).
 * Retorno: dialogRef — uma ref que deve ser colocada no elemento da janela: <div ref={dialogRef}>.
 * Onde é usado: FilterDrawer.jsx e AdoptionFormModal.jsx.
 */
// O quê: aplica comportamento de diálogo modal ao elemento que receber a ref retornada.
// Como: foca o primeiro controle, fecha com Escape, mantém o Tab dentro do diálogo,
//       trava a rolagem da página e devolve o foco ao elemento anterior ao fechar.
// Para quê: tornar ficha, formulário e filtros utilizáveis por teclado e leitores de tela.
export function useDialog(onClose) {
  // Ref que vai apontar para o elemento HTML da janela (preenchida pelo React).
  const dialogRef = useRef(null);
  // Guarda sempre a versão mais recente de onClose. Usamos uma ref para que o efeito
  // principal (que roda uma vez só) consiga chamar o onClose atual sem precisar rodar de novo.
  const onCloseRef = useRef(onClose);

  // Sempre que onClose mudar, atualiza a ref.
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // Efeito principal: roda uma vez quando a janela aparece (dependências vazias []).
  useEffect(() => {
    // O elemento da janela (ou null se a ref não foi ligada a nenhum elemento).
    const dialog = dialogRef.current;
    // Sem elemento, não há o que fazer. "return undefined" = sem função de limpeza.
    if (!dialog) return undefined;

    // Guarda qual elemento estava focado ANTES de abrir (ex.: o botão que abriu a janela).
    const previousFocus = document.activeElement;
    // Função que lista os elementos focáveis dentro da janela.
    // querySelectorAll devolve uma NodeList; Array.from transforma em array.
    const getFocusable = () => Array.from(dialog.querySelectorAll(FOCUSABLE_SELECTOR));

    // Se esta é a PRIMEIRA janela aberta, guarda o overflow atual e trava a rolagem da página.
    if (openDialogs === 0) {
      overflowBeforeDialogs = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    }
    // Conta mais uma janela aberta.
    openDialogs += 1;

    // Foca o primeiro elemento focável; se não houver nenhum, foca a própria janela.
    (getFocusable()[0] || dialog).focus();

    /*
     * FUNÇÃO INTERNA: handleKeyDown
     * O que faz: trata as teclas Esc (fechar) e Tab (manter o foco dentro da janela).
     * Parâmetros: event (KeyboardEvent) — o evento de tecla pressionada.
     * Retorno: nada.
     */
    function handleKeyDown(event) {
      // Esc: chama o onClose mais recente ("?.()" só chama se existir).
      if (event.key === 'Escape') {
        onCloseRef.current?.();
        return;
      }

      // Só nos interessa a tecla Tab, e só quando o foco está dentro desta janela.
      if (event.key !== 'Tab' || !dialog.contains(document.activeElement)) return;

      // Elementos focáveis no momento (podem mudar, ex.: um botão desabilitado).
      const focusable = getFocusable();
      // Nenhum elemento focável: não há o que controlar.
      if (focusable.length === 0) return;

      // Primeiro e último elementos focáveis.
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      // Shift+Tab no PRIMEIRO elemento: em vez de sair da janela, vai para o ÚLTIMO.
      if (event.shiftKey && document.activeElement === first) {
        // preventDefault impede o comportamento normal do Tab.
        event.preventDefault();
        last.focus();
      // Tab no ÚLTIMO elemento: em vez de sair da janela, volta para o PRIMEIRO.
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    // Começa a "escutar" as teclas pressionadas na página inteira.
    document.addEventListener('keydown', handleKeyDown);

    // Função de limpeza: roda quando a janela sai da tela (é desmontada).
    return () => {
      // Para de escutar as teclas (evita "vazamento" de listeners).
      document.removeEventListener('keydown', handleKeyDown);

      // Conta uma janela a menos.
      openDialogs -= 1;
      // Se não sobrou nenhuma janela, restaura a rolagem original da página.
      if (openDialogs === 0) document.body.style.overflow = overflowBeforeDialogs;

      // Só devolve o foco se ninguém o assumiu (ex.: o formulário que abriu no lugar da ficha).
      // O foco está "livre" se ainda está dentro da janela que está fechando, ou no <body>.
      const focusIsFree = dialog.contains(document.activeElement) || document.activeElement === document.body;
      // Devolve o foco ao elemento anterior, se ele ainda existir na página (isConnected)
      // e se tiver o método focus.
      if (focusIsFree && previousFocus?.isConnected && typeof previousFocus.focus === 'function') {
        previousFocus.focus();
      }
    };
  }, []);

  // Devolve a ref para o componente colocar no elemento da janela.
  return dialogRef;
}

/*
 * ============================================================================
 * RESUMO DO ARQUIVO
 * ============================================================================
 *
 * COMO O FLUXO FUNCIONA:
 *   1. O componente da janela chama const ref = useDialog(fechar) e usa <div ref={ref}>.
 *   2. Quando a janela aparece, o efeito principal:
 *        - guarda quem estava focado; trava a rolagem (se for a primeira janela);
 *        - foca o primeiro controle; começa a escutar o teclado.
 *   3. Enquanto aberta: Esc fecha; Tab e Shift+Tab "dão a volta" dentro da janela.
 *   4. Quando a janela some, a limpeza: para de escutar o teclado, libera a rolagem
 *      (se era a última janela) e devolve o foco ao elemento anterior.
 *
 * CONCEITOS IMPORTANTES PARA ESTUDAR:
 *   - Acessibilidade de modais: "focus trap", tecla Esc e retorno do foco.
 *   - useRef para elementos do DOM e para guardar valores sem redesenhar.
 *   - Padrão "ref com a última versão do callback" (onCloseRef).
 *   - useEffect com [] e a função de limpeza.
 *   - Eventos de teclado (keydown, event.key, event.shiftKey, preventDefault).
 *   - document.activeElement, element.contains, element.focus, isConnected.
 *   - Seletores CSS (:not, [atributo]) e querySelectorAll.
 *   - Variáveis de módulo compartilhadas entre várias instâncias de um hook.
 * ============================================================================
 */
