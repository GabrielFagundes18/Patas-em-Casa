// O quê: o administrador define uma nova senha para um membro da equipe.
// Como: senha digitada ou gerada; a API aplica a política de senha e encerra todas as sessões da pessoa.
// Para quê: devolver o acesso quando o e-mail não está disponível (sem SMTP, por exemplo).
import { useState } from 'react';
import AdminDialog from 'admin/shared/AdminDialog';
import FormError from 'admin/shared/FormError';
import { PasswordField } from './TeamMemberDialog';

export default function ResetPasswordDialog({ member, onClose, onSubmit }) {
  const [senha, setSenha] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

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
