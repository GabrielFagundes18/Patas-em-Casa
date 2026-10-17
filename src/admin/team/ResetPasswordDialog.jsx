/*
 * ============================================================================
 * ARQUIVO: ResetPasswordDialog.jsx
 * ============================================================================
 *
 * PARA QUE SERVE:
 *   Janela em que o ADMINISTRADOR define uma nova senha para um membro da
 *   equipe (digitada ou gerada). O backend aplica a política de senha e encerra
 *   todas as sessões da pessoa. Útil quando o e-mail não está disponível (ex.:
 *   servidor sem SMTP configurado).
 *
 * PRINCIPAIS ITENS:
 *   - ResetPasswordDialog({ member, onClose, onSubmit }): o componente (exportado como padrão).
 *
 * CONEXÕES COM OUTROS ARQUIVOS:
 *   - react (useState).
 *   - admin/shared/AdminDialog e FormError.
 *   - ./TeamMemberDialog → PasswordField (campo com gerador de senha).
 *   - Quem usa: admin/team/TeamPage.jsx.
 * ============================================================================
 */

// O quê: o administrador define uma nova senha para um membro da equipe.
// Como: senha digitada ou gerada; a API aplica a política de senha e encerra todas as sessões da pessoa.
// Para quê: devolver o acesso quando o e-mail não está disponível (sem SMTP, por exemplo).
// Hook de estado.
import { useState } from 'react';
// Moldura e erros.
import AdminDialog from 'admin/shared/AdminDialog';
import FormError from 'admin/shared/FormError';
// Campo de senha com gerador (reaproveitado do formulário de membro).
import { PasswordField } from './TeamMemberDialog';

/*
 * COMPONENTE: ResetPasswordDialog
 * O que faz: coleta a nova senha e chama onSubmit.
 * Parâmetros (props):
 *   - member (objeto): o membro (usa o nome no título).
 *   - onClose (função) e onSubmit (função async que recebe a senha).
 * Retorno: JSX da janela.
 * Onde é usado: TeamPage.jsx.
 */
export default function ResetPasswordDialog({ member, onClose, onSubmit }) {
  // Senha digitada/gerada.
  const [senha, setSenha] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Envia a senha; em erro, mostra a mensagem (ex.: não cumpre a política) e reabilita o botão.
  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await onSubmit(senha);
    } catch (submitError) {
      setError(submitError);
      setSaving(false);
    }
  }

  return (
    <AdminDialog eyebrow="Equipe e acessos" id="team-reset-password" onClose={onClose} title={`Nova senha para ${member.nome}`}>
      <form onSubmit={handleSubmit}>
        <div className="admin-form-grid">
          {/* onChange={setSenha}: a própria função de estado recebe o novo valor. */}
          <PasswordField
            hint="A pessoa sai do painel em todos os dispositivos. Passe a nova senha por um canal seguro."
            id="team-reset-password-input"
            label="Nova senha"
            onChange={setSenha}
            value={senha}
          />
        </div>
        <FormError error={error} fallback="Não foi possível redefinir a senha." />
        <div className="admin-dialog-actions">
          <button className="admin-button" onClick={onClose} type="button">Cancelar</button>
          <button className="admin-button is-primary" disabled={saving} type="submit">{saving ? 'Salvando...' : 'Definir nova senha'}</button>
        </div>
      </form>
    </AdminDialog>
  );
}

/*
 * ============================================================================
 * RESUMO DO ARQUIVO
 * ============================================================================
 *
 * COMO O FLUXO FUNCIONA:
 *   A TeamPage abre a janela para um membro; o administrador digita ou gera a
 *   senha e confirma; onSubmit chama a API. Em erro, a mensagem aparece.
 *
 * CONCEITOS IMPORTANTES PARA ESTUDAR:
 *   - Reaproveitar componentes entre arquivos (PasswordField).
 *   - Passar a função de estado diretamente como callback (onChange={setSenha}).
 *   - Segurança: encerrar sessões ao trocar senha e repassar senhas por canal seguro.
 * ============================================================================
 */
