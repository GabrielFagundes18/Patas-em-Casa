/*
 * ============================================================================
 * ARQUIVO: AdminDialog.jsx
 * ============================================================================
 *
 * PARA QUE SERVE:
 *   Janela (modal) padrão do painel administrativo. Usa o elemento nativo
 *   <dialog> do HTML com showModal(), que já cuida de prender o foco dentro da
 *   janela, escurecer o fundo e tratar a tecla Esc. Todas as janelas de
 *   formulário do painel (animal, voluntário, doação, história, equipe...) usam
 *   este componente como "moldura".
 *
 * PRINCIPAIS ITENS:
 *   - AdminDialog({ id, eyebrow, title, onClose, wide, children }): o componente (exportado como padrão).
 *
 * CONEXÕES COM OUTROS ARQUIVOS:
 *   - react (useEffect, useRef), lucide-react (ícone X).
 *   - Estilos .admin-dialog em admin/styles/admin.css.
 *   - Usado por: AnimalFormDialog, VolunteerFormDialog, DonationFormDialog, StoryFormDialog,
 *     TeamMemberDialog, ResetPasswordDialog, AdopterDetailDialog, AdoptionDetailDialog.
 *   - Nos testes, setupTests.js cria versões simples de showModal/close (o jsdom não tem).
 * ============================================================================
 */

// useEffect: abrir/fechar o diálogo; useRef: guardar a referência ao elemento <dialog>.
import { useEffect, useRef } from 'react';
// Ícone X (fechar).
import { X } from 'lucide-react';

/*
 * COMPONENTE: AdminDialog
 * O que faz: desenha uma janela modal com cabeçalho (rótulo, título e botão de fechar) e conteúdo.
 * Parâmetros (props):
 *   - id (string): prefixo usado para o id do título (ligado via aria-labelledby).
 *   - eyebrow (string | undefined): texto pequeno acima do título (opcional).
 *   - title (string): título da janela.
 *   - onClose (função): chamada para fechar (botão X ou tecla Esc).
 *   - wide (boolean, padrão false): janela mais larga (classe "is-wide").
 *   - children (JSX): o conteúdo (geralmente um formulário).
 * Retorno: JSX do <dialog>.
 * Onde é usado: em todas as janelas de formulário/detalhe do painel.
 */
// Diálogo modal nativo do painel: showModal() prende o foco e trata o Esc; quem abre decide quando fechar.
export default function AdminDialog({ id, eyebrow, title, onClose, wide = false, children }) {
  // Referência ao elemento <dialog> real na página.
  const dialogRef = useRef(null);

  // Ao montar: abre o diálogo como modal. Ao desmontar: fecha.
  useEffect(() => {
    const dialog = dialogRef.current;
    // showModal() abre o <dialog> no modo modal (fundo bloqueado). Só abre se ainda não estiver aberto.
    if (dialog && !dialog.open) dialog.showModal();
    // Limpeza: quando o componente sai da tela, fecha o diálogo (se ainda estiver aberto).
    return () => {
      if (dialog?.open) dialog.close();
    };
  }, []);

  return (
    <dialog
      // O nome acessível da janela é o texto do título.
      aria-labelledby={`${id}-title`}
      // Classe base + " is-wide" quando wide for true.
      className={`admin-dialog${wide ? ' is-wide' : ''}`}
      // "cancel" é disparado pelo navegador quando a pessoa aperta Esc.
      // preventDefault impede o fechamento automático: quem decide fechar é o componente pai (onClose).
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      ref={dialogRef}
    >
      {/* Cabeçalho: textos à esquerda, botão X à direita. */}
      <div className="admin-dialog-header">
        <div>
          {/* Rótulo opcional. */}
          {eyebrow ? <p className="admin-eyebrow">{eyebrow}</p> : null}
          <h2 id={`${id}-title`}>{title}</h2>
        </div>
        <button aria-label="Fechar" className="admin-icon-button" onClick={onClose} type="button">
          <X size={19} />
        </button>
      </div>
      {/* Conteúdo passado pelo componente pai. */}
      {children}
    </dialog>
  );
}

/*
 * ============================================================================
 * RESUMO DO ARQUIVO
 * ============================================================================
 *
 * COMO O FLUXO FUNCIONA:
 *   1. O componente pai desenha <AdminDialog ...> quando quer abrir a janela.
 *   2. O useEffect chama showModal(): o navegador mostra a janela por cima de tudo.
 *   3. Esc ou o botão X chamam onClose; o pai deixa de desenhar o AdminDialog.
 *   4. Ao sair da tela, a limpeza do useEffect fecha o <dialog>.
 *
 * CONCEITOS IMPORTANTES PARA ESTUDAR:
 *   - Elemento nativo <dialog>, showModal(), close() e o evento "cancel".
 *   - useRef para acessar elementos do DOM.
 *   - useEffect com limpeza (montar/desmontar).
 *   - Componente "controlado pelo pai" (quem abre decide quando fechar).
 *   - Composição com children e acessibilidade (aria-labelledby, aria-label).
 * ============================================================================
 */
