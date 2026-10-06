// O quê: criar ou redefinir a senha pelo link recebido por e-mail (/admin/redefinir-senha?token=...).
// Como: ?convite=1 muda os textos para "crie sua senha"; a API confere o token (uso único) e a política de senha.
// Para quê: concluir o "esqueci minha senha" e o convite de novos membros da equipe.
import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { resetPassword } from '../../services/adminService';
import AdminAuthShell from './AdminAuthShell';

export default function AdminResetPasswordPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const invite = params.get('convite') === '1';
  const [form, setForm] = useState({ senha: '', confirmacao: '' });
  const [state, setState] = useState({ status: 'idle' });

  async function handleSubmit(event) {
    event.preventDefault();
    if (form.senha !== form.confirmacao) {
      setState({ status: 'error', message: 'As senhas não são iguais.', details: [] });
      return;
    }
    setState({ status: 'sending' });
    try {
      await resetPassword(token, form.senha);
      navigate('/admin/login', { replace: true, state: { senhaDefinida: true } });
    } catch (error) {
      const apiError = error?.response?.data?.error;
      setState({
        status: 'error',
        message: apiError?.message || 'Não foi possível definir a senha agora.',
        details: (apiError?.details || []).map((detail) => detail.message),
        expired: apiError?.code === 'LINK_INVALIDO',
      });
    }
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  if (!token) {
    return (
      <AdminAuthShell description="Abra novamente o link recebido por e-mail ou peça um novo." title="Link incompleto" titleId="admin-reset-title">
        <Link className="admin-button is-primary admin-login-submit" to="/admin/esqueci-senha">Pedir novo link</Link>
      </AdminAuthShell>
    );
  }

  return (
    <AdminAuthShell
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
        {state.status === 'error' ? (
          <div className="admin-alert is-error" role="alert">
            <p>{state.message}</p>
            {state.details?.length ? <ul>{state.details.map((detail) => <li key={detail}>{detail}</li>)}</ul> : null}
          </div>
        ) : null}
        <button className="admin-button is-primary admin-login-submit" disabled={state.status === 'sending'} type="submit">
          {state.status === 'sending' ? 'Salvando...' : invite ? 'Criar senha' : 'Salvar nova senha'}
        </button>
      </form>
      {state.expired ? <Link className="admin-login-link" to="/admin/esqueci-senha">Pedir um novo link</Link> : null}
    </AdminAuthShell>
  );
}
