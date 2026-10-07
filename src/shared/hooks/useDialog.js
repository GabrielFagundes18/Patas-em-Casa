import { useEffect, useRef } from 'react';

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
let openDialogs = 0;
let overflowBeforeDialogs = '';

// O quê: aplica comportamento de diálogo modal ao elemento que receber a ref retornada.
// Como: foca o primeiro controle, fecha com Escape, mantém o Tab dentro do diálogo,
//       trava a rolagem da página e devolve o foco ao elemento anterior ao fechar.
// Para quê: tornar ficha, formulário e filtros utilizáveis por teclado e leitores de tela.
export function useDialog(onClose) {
  const dialogRef = useRef(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return undefined;

    const previousFocus = document.activeElement;
    const getFocusable = () => Array.from(dialog.querySelectorAll(FOCUSABLE_SELECTOR));

    if (openDialogs === 0) {
      overflowBeforeDialogs = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    }
    openDialogs += 1;

    (getFocusable()[0] || dialog).focus();

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        onCloseRef.current?.();
        return;
      }

      if (event.key !== 'Tab' || !dialog.contains(document.activeElement)) return;

      const focusable = getFocusable();
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);

      openDialogs -= 1;
      if (openDialogs === 0) document.body.style.overflow = overflowBeforeDialogs;

      // Só devolve o foco se ninguém o assumiu (ex.: o formulário que abriu no lugar da ficha).
      const focusIsFree = dialog.contains(document.activeElement) || document.activeElement === document.body;
      if (focusIsFree && previousFocus?.isConnected && typeof previousFocus.focus === 'function') {
        previousFocus.focus();
      }
    };
  }, []);

  return dialogRef;
}
