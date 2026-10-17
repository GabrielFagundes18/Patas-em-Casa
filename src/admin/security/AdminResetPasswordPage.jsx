/*
 * ============================================================================
 * ARQUIVO: AdminResetPasswordPage.jsx
 * ============================================================================
 *
 * PARA QUE SERVE:
 *   Tela para CRIAR ou REDEFINIR a senha do painel pelo link recebido por e-mail
 *   (/admin/redefinir-senha?token=...). Atende dois casos:
 *     - "esqueci minha senha" (redefinição);
 *     - convite de novo membro da equipe (?convite=1 muda os textos para "crie sua senha").
 *   O backend confere o token (uso único) e a política de senha.
 *
 * PRINCIPAIS ITENS:
 *   - AdminResetPasswordPage(): o componente (exportado como padrão).
 *       Dentro dele: handleSubmit e handleChange.
 *
 * CONEXÕES COM OUTROS ARQUIVOS:
 *   - react (useState), react-router-dom (Link, useNavigate, useSearchParams).
 *   - ./authService.js     → resetPassword.
 *   - ./AdminAuthShell.jsx → moldura visual.
 *   - Quem usa: app/App.js (rota /admin/redefinir-senha). O link vem por e-mail (backend).
 *   - Após o sucesso, leva ao login com o aviso "senha definida" (AdminLoginPage.jsx).
 *   - Testado em: ./AdminPasswordPages.test.js.
 * ============================================================================
 */

// O quê: criar ou redefinir a senha pelo link recebido por e-mail (/admin/redefinir-senha?token=...).
// Como: ?convite=1 muda os textos para "crie sua senha"; a API confere o token (uso único) e a política de senha.
// Para quê: concluir o "esqueci minha senha" e o convite de novos membros da equipe.
// Hook de estado.
import { useState } from 'react';
// Link, navegação pelo código e leitura da URL.
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
// Grava a nova senha na API.
import { resetPassword } from './authService';
// Moldura das telas de acesso.
import AdminAuthShell from './AdminAuthShell';

/*
 * COMPONENTE: AdminResetPasswordPage
 * O que faz: lê o token da URL, coleta a nova senha (duas vezes) e envia ao backend.
 * Parâmetros: nenhum.
 * Retorno: JSX da tela.
 * Onde é usado: App.js, rota /admin/redefinir-senha.
 */
export default function AdminResetPasswordPage() {
  // Para ir ao login depois do sucesso.
  const navigate = useNavigate();
  // Parâmetros da URL.
  const [params] = useSearchParams();
  // Token do link ('' se não houver).
  const token = params.get('token') || '';
  // É um convite? (muda os textos)
  const invite = params.get('convite') === '1';
  // Senha e confirmação.
  const [form, setForm] = useState({ senha: '', confirmacao: '' });
  // Estado da tela: 'idle', 'sending' ou 'error' (+ message, details, expired).
  const [state, setState] = useState({ status: 'idle' });

  /*
   * FUNÇÃO INTERNA: handleSubmit
   * O que faz: confere se as duas senhas são iguais, envia ao backend e trata o resultado.
   * Parâmetros: event (envio do formulário).
   */
  async function handleSubmit(event) {
    event.preventDefault();
    // Validação no navegador: as duas senhas precisam ser iguais.
    if (form.senha !== form.confirmacao) {
      setState({ status: 'error', message: 'As senhas não são iguais.', details: [] });
      return;
    }
    setState({ status: 'sending' });
    try {
      await resetPassword(token, form.senha);
      // Sucesso: vai ao login com o aviso "senha definida" (via state).
      navigate('/admin/login', { replace: true, state: { senhaDefinida: true } });
    } catch (error) {
      // Erro no formato do backend.
      const apiError = error?.response?.data?.error;
      setState({
        status: 'error',
        message: apiError?.message || 'Não foi possível definir a senha agora.',
        // Detalhes (ex.: regras da política de senha não atendidas).
        details: (apiError?.details || []).map((detail) => detail.message),
        // Link expirado/usado: mostra o atalho para pedir um novo.
        expired: apiError?.code === 'LINK_INVALIDO',
      });
    }
  }

  /*
   * FUNÇÃO INTERNA: handleChange
   * O que faz: atualiza o campo digitado (senha ou confirmacao, pelo atributo "name").
   */
  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  // Sem token na URL: o link está incompleto. Oferece pedir um novo.
  if (!token) {
    return (
      <AdminAuthShell description="Abra novamente o link recebido por e-mail ou peça um novo." title="Link incompleto" titleId="admin-reset-title">
        <Link className="admin-button is-primary admin-login-submit" to="/admin/esqueci-senha">Pedir novo link</Link>
      </AdminAuthShell>
    );
  }

  return (
    <AdminAuthShell
      // Textos diferentes para convite e para redefinição.
      description={invite
        ? 'Bem-vindo(a) à equipe! Crie a senha que você vai usar para entrar no painel.'
        : 'Escolha uma nova senha para o painel. As sessões abertas em outros dispositivos serão encerradas.'}
      eyebrow={invite ? 'Convite para a equipe' : 'Redefinição de senha'}
      title={invite ? 'Crie sua senha' : 'Criar nova senha'}
      titleId="admin-reset-title"
    >
      <form className="admin-login-form" onSubmit={handleSubmit}>
        <label className="admin-login-field" htmlFor="admin-reset-password">
          Nova senha
          {/* aria-describedby liga o campo à dica de regras abaixo (lida pelo leitor de tela).
              autoComplete="new-password" faz o navegador sugerir uma senha nova.
              minLength/maxLength: limites de tamanho (72 é o limite do algoritmo bcrypt usado no backend). */}
          <input
            aria-describedby="admin-reset-hint"
            autoComplete="new-password"
            id="admin-reset-password"
            maxLength={72}
            minLength={10}
            name="senha"
            onChange={handleChange}
            required
            type="password"
            value={form.senha}
          />
        </label>
        {/* Dica com as regras da senha. */}
        <small className="admin-field-hint" id="admin-reset-hint">Mínimo de 10 caracteres, com letras e números.</small>
        <label className="admin-login-field" htmlFor="admin-reset-confirm">
          Repita a nova senha
          <input
            autoComplete="new-password"
            id="admin-reset-confirm"
            maxLength={72}
            minLength={10}
            name="confirmacao"
            onChange={handleChange}
            required
            type="password"
            value={form.confirmacao}
          />
        </label>
        {/* Erro com detalhes (se houver). "state.details?.length" é falso para lista vazia ou ausente. */}
        {state.status === 'error' ? (
          <div className="admin-alert is-error" role="alert">
            <p>{state.message}</p>
            {state.details?.length ? <ul>{state.details.map((detail) => <li key={detail}>{detail}</li>)}</ul> : null}
          </div>
        ) : null}
        {/* Botão: "Salvando..." durante o envio; texto muda para convite. */}
        <button className="admin-button is-primary admin-login-submit" disabled={state.status === 'sending'} type="submit">
          {state.status === 'sending' ? 'Salvando...' : invite ? 'Criar senha' : 'Salvar nova senha'}
        </button>
      </form>
      {/* Link expirado: atalho para pedir outro. */}
      {state.expired ? <Link className="admin-login-link" to="/admin/esqueci-senha">Pedir um novo link</Link> : null}
    </AdminAuthShell>
  );
}

/*
 * ============================================================================
 * RESUMO DO ARQUIVO
 * ============================================================================
 *
 * COMO O FLUXO FUNCIONA:
 *   1. A pessoa abre o link do e-mail; a tela lê token e convite da URL.
 *   2. Sem token: mostra "Link incompleto" com atalho para pedir outro.
 *   3. Com token: a pessoa digita a senha duas vezes; se forem diferentes, erro local.
 *   4. resetPassword envia ao backend; sucesso → login com aviso; erro → mensagem e
 *      detalhes (e atalho se o link expirou).
 *
 * CONCEITOS IMPORTANTES PARA ESTUDAR:
 *   - Tokens de uso único em links de e-mail (redefinição e convite).
 *   - Validação local (confirmação de senha) + validação no servidor (política de senha).
 *   - Atributos de senha: type="password", autoComplete="new-password", minLength/maxLength.
 *   - Navegação com state (senhaDefinida) para mostrar avisos na próxima tela.
 *   - Textos condicionais (convite x redefinição) com ternários.
 * ============================================================================
 */
