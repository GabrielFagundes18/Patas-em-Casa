/*
 * ============================================================================
 * ARQUIVO: AdminAuthShell.jsx
 * ============================================================================
 *
 * PARA QUE SERVE:
 *   "Moldura" visual das telas de ACESSO ao painel: entrar, esqueci a senha e
 *   criar/redefinir senha. Mostra um painel lateral com a marca e um cartão com
 *   título, descrição e o formulário (que cada tela passa como children).
 *
 * PRINCIPAIS ITENS:
 *   - AdminAuthShell({ titleId, eyebrow, title, description, children }): o componente.
 *
 * CONEXÕES COM OUTROS ARQUIVOS:
 *   - lucide-react (ícone PawPrint).
 *   - admin/styles/admin.css e ./AdminLoginPage.css → estilos.
 *   - Usado por: AdminLoginPage.jsx, AdminForgotPasswordPage.jsx, AdminResetPasswordPage.jsx.
 * ============================================================================
 */

// O quê: moldura das telas de acesso ao painel (entrar, esqueci a senha, criar/redefinir senha).
// Como: painel lateral com a marca e um cartão com título, descrição e o formulário passado em children.
// Para quê: as três telas têm a mesma aparência sem repetir a estrutura.
// Ícone de pata (marca).
import { PawPrint } from 'lucide-react';
// Estilos gerais do painel (variáveis, botões, alertas).
import 'admin/styles/admin.css';
// Estilos específicos das telas de acesso.
import './AdminLoginPage.css';

/*
 * COMPONENTE: AdminAuthShell
 * O que faz: desenha a estrutura comum das telas de acesso.
 * Parâmetros (props):
 *   - titleId (string): id do título (para aria-labelledby).
 *   - eyebrow (string, padrão 'Área administrativa'): texto pequeno acima do título.
 *   - title (string): título da tela.
 *   - description (string | undefined): texto explicativo (opcional).
 *   - children (JSX): o formulário da tela.
 * Retorno: JSX da página (<main>).
 * Onde é usado: telas de login e de senha.
 */
export default function AdminAuthShell({ titleId, eyebrow = 'Área administrativa', title, description, children }) {
  return (
    // <main>: conteúdo principal da página.
    <main className="admin-login-page">
      <div className="admin-login-shell">
        {/* Painel lateral com a marca (texto institucional). */}
        <aside className="admin-login-aside">
          <span aria-hidden="true" className="admin-login-mark"><PawPrint size={26} /></span>
          <p className="admin-login-aside-title">Painel Patas em Casa</p>
          <p>Animais, adoções, doações e voluntários da ONG em um só lugar.</p>
        </aside>
        {/* Cartão principal, nomeado pelo título. */}
        <section aria-labelledby={titleId} className="admin-login-card">
          {/* Link para o site público (um <a> simples: sai do painel e recarrega a página). */}
          <a aria-label="Patas em Casa, página inicial" className="admin-login-brand" href="/">
            <PawPrint aria-hidden="true" size={21} />
            <span>Patas em Casa</span>
          </a>

          {/* Cabeçalho do cartão. */}
          <div className="admin-login-heading">
            <p className="admin-login-eyebrow">{eyebrow}</p>
            <h1 id={titleId}>{title}</h1>
            {/* Descrição opcional. */}
            {description ? <p>{description}</p> : null}
          </div>

          {/* Formulário da tela. */}
          {children}
        </section>
      </div>
    </main>
  );
}

/*
 * ============================================================================
 * RESUMO DO ARQUIVO
 * ============================================================================
 *
 * COMO FUNCIONA:
 *   Cada tela de acesso escreve <AdminAuthShell title="..." ...> <form>...</form> </AdminAuthShell>.
 *   O componente desenha a mesma estrutura (lateral + cartão) e coloca o formulário
 *   no lugar de {children}.
 *
 * CONCEITOS IMPORTANTES PARA ESTUDAR:
 *   - Componente de layout com children (composição).
 *   - Props com valor padrão.
 *   - Importar CSS em componentes.
 *   - HTML semântico (<main>, <aside>, <section>) e aria-labelledby.
 * ============================================================================
 */
