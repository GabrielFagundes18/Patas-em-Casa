// O quê: formulário de membro da equipe (cadastro e edição).
// Como: no cadastro, escolhe entre definir a senha inicial ou enviar convite por e-mail (a pessoa cria a senha);
//       na edição, altera nome, e-mail, cargo e acesso ativo.
// Para quê: o administrador gerenciar quem acessa o painel e com qual perfil.
import { useState } from 'react';
import { KeyRound } from 'lucide-react';
import { roleLabels } from 'admin/constants/adminNavigation';
import AdminDialog from 'admin/shared/AdminDialog';
import FormError from 'admin/shared/FormError';

const PASSWORD_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';

// Senha forte (14 caracteres, com letras e números), sem caracteres ambíguos como 0/O e 1/l.
export function generatePassword() {
  const values = window.crypto.getRandomValues(new Uint32Array(14));
  const password = Array.from(values, (value) => PASSWORD_CHARS[value % PASSWORD_CHARS.length]).join('');
  return /\d/.test(password) && /[A-Za-z]/.test(password) ? password : generatePassword();
}

export function PasswordField({ id, label, value, onChange, hint }) {
  return (
    <div className="admin-field is-wide">
      <label htmlFor={id}>
        {label} <span aria-hidden="true" className="admin-required">*</span>
      </label>
      <div className="admin-input-row">
        <input
          aria-describedby={`${id}-hint`}
          autoComplete="new-password"
          id={id}
          maxLength="72"
          minLength="10"
          onChange={(event) => onChange(event.target.value)}
          required
          spellCheck="false"
          value={value}
        />
        <button className="admin-button" onClick={() => onChange(generatePassword())} type="button">
          <KeyRound aria-hidden="true" size={16} /> Gerar senha
        </button>
      </div>
      <small className="admin-field-hint" id={`${id}-hint`}>{hint}</small>
    </div>
  );
}

export default function TeamMemberDialog({ member, onClose, onSubmit }) {
  const editing = Boolean(member);
  const [form, setForm] = useState({
    nome: member?.nome || '',
    email: member?.email || '',
    cargo: member?.cargo || '',
    senha: '',
    ativo: member?.ativo ?? true,
    acesso: 'convite',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  function handleChange(event) {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    const base = { nome: form.nome.trim(), email: form.email.trim(), cargo: form.cargo, ativo: form.ativo };
    try {
      if (editing) await onSubmit(base);
      else await onSubmit(form.acesso === 'convite' ? { ...base, enviar_convite: true } : { ...base, senha: form.senha });
    } catch (submitError) {
      setError(submitError);
      setSaving(false);
    }
  }

  return (
    <AdminDialog eyebrow="Equipe e acessos" id="team-member-form" onClose={onClose} title={editing ? `Editar ${member.nome}` : 'Adicionar membro'}>
      <form onSubmit={handleSubmit}>
        <div className="admin-form-grid">
          <label className="is-wide">
            Nome completo <span aria-hidden="true" className="admin-required">*</span>
            <input autoComplete="off" maxLength="150" minLength="2" name="nome" onChange={handleChange} required value={form.nome} />
          </label>
          <label>
            E-mail de acesso <span aria-hidden="true" className="admin-required">*</span>
            <input autoComplete="off" maxLength="150" name="email" onChange={handleChange} required type="email" value={form.email} />
          </label>
          <label>
            Cargo <span aria-hidden="true" className="admin-required">*</span>
            <select name="cargo" onChange={handleChange} required value={form.cargo}>
              <option disabled value="">Escolha o cargo</option>
              {Object.entries(roleLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
        </div>

        {!editing ? (
          <fieldset className="admin-fieldset">
            <legend>Como a pessoa vai entrar</legend>
            <div className="admin-choice-group">
              <label className="admin-choice">
                <input checked={form.acesso === 'convite'} name="acesso" onChange={handleChange} type="radio" value="convite" />
                Enviar convite por e-mail
              </label>
              <label className="admin-choice">
                <input checked={form.acesso === 'senha'} name="acesso" onChange={handleChange} type="radio" value="senha" />
                Definir senha inicial
              </label>
            </div>
            {form.acesso === 'convite' ? (
              <small className="admin-field-hint">A pessoa recebe um link (válido por 72 horas) para criar a própria senha.</small>
            ) : (
              <div className="admin-form-grid">
                <PasswordField
                  hint="Mínimo de 10 caracteres, com letras e números. Passe a senha à pessoa por um canal seguro."
                  id="team-member-password"
                  label="Senha inicial"
                  onChange={(senha) => setForm((current) => ({ ...current, senha }))}
                  value={form.senha}
                />
              </div>
            )}
          </fieldset>
        ) : null}

        <div className="admin-checks">
          <label>
            <input checked={form.ativo} name="ativo" onChange={handleChange} type="checkbox" /> {editing ? 'Acesso ativo' : 'Acesso ativo desde já'}
          </label>
        </div>
        {editing && member.ativo && !form.ativo ? (
          <p className="admin-alert is-warning">Ao desativar, a pessoa sai do painel na hora em todos os dispositivos.</p>
        ) : null}

        <FormError error={error} fallback={editing ? 'Não foi possível salvar as alterações.' : 'Não foi possível adicionar o membro.'} />

        <div className="admin-dialog-actions">
          <button className="admin-button" onClick={onClose} type="button">Cancelar</button>
          <button className="admin-button is-primary" disabled={saving} type="submit">
            {saving ? 'Salvando...' : editing ? 'Salvar alterações' : form.acesso === 'convite' ? 'Adicionar e enviar convite' : 'Adicionar membro'}
          </button>
        </div>
      </form>
    </AdminDialog>
  );
}
