import { useState } from 'react';
import { KeyRound } from 'lucide-react';
import { roleLabels } from '../constants/adminNavigation';
import AdminDialog from '../shared/AdminDialog';
import FormError from '../shared/FormError';

const PASSWORD_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';

// Senha inicial forte (14 caracteres, com letras e números), sem caracteres ambíguos como 0/O e 1/l.
function generatePassword() {
  const values = window.crypto.getRandomValues(new Uint32Array(14));
  const password = Array.from(values, (value) => PASSWORD_CHARS[value % PASSWORD_CHARS.length]).join('');
  return /\d/.test(password) && /[A-Za-z]/.test(password) ? password : generatePassword();
}

export default function TeamMemberDialog({ onClose, onSubmit }) {
  const [form, setForm] = useState({ nome: '', email: '', cargo: '', senha: '', ativo: true });
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
    try {
      await onSubmit({ ...form, nome: form.nome.trim(), email: form.email.trim() });
    } catch (submitError) {
      setError(submitError);
      setSaving(false);
    }
  }

  return (
    <AdminDialog eyebrow="Equipe e acessos" id="team-member-form" onClose={onClose} title="Adicionar membro">
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
          <div className="admin-field is-wide">
            <label htmlFor="team-member-password">
              Senha inicial <span aria-hidden="true" className="admin-required">*</span>
            </label>
            <div className="admin-input-row">
              <input
                aria-describedby="team-member-password-hint"
                autoComplete="new-password"
                id="team-member-password"
                maxLength="72"
                minLength="10"
                name="senha"
                onChange={handleChange}
                required
                spellCheck="false"
                value={form.senha}
              />
              <button className="admin-button" onClick={() => setForm((current) => ({ ...current, senha: generatePassword() }))} type="button">
                <KeyRound aria-hidden="true" size={16} /> Gerar senha
              </button>
            </div>
            <small className="admin-field-hint" id="team-member-password-hint">
              Mínimo de 10 caracteres, com letras e números. Passe a senha à pessoa por um canal seguro.
            </small>
          </div>
        </div>

        <div className="admin-checks">
          <label><input checked={form.ativo} name="ativo" onChange={handleChange} type="checkbox" /> Acesso ativo desde já</label>
        </div>

        <FormError error={error} fallback="Não foi possível adicionar o membro." />

        <div className="admin-dialog-actions">
          <button className="admin-button" onClick={onClose} type="button">Cancelar</button>
          <button className="admin-button is-primary" disabled={saving} type="submit">
            {saving ? 'Adicionando...' : 'Adicionar membro'}
          </button>
        </div>
      </form>
    </AdminDialog>
  );
}
