import { useState } from 'react';
import { volunteerAreaLabels, volunteerStatusMap } from 'admin/constants/statusLabels';
import AdminDialog from 'admin/shared/AdminDialog';
import FormError from 'admin/shared/FormError';

function today() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

export default function VolunteerFormDialog({ onClose, onSubmit }) {
  const [form, setForm] = useState({ nome: '', email: '', telefone: '', status: 'ativo', data_inicio: today(), areas: [] });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function toggleArea(area) {
    setForm((current) => ({
      ...current,
      areas: current.areas.includes(area) ? current.areas.filter((item) => item !== area) : [...current.areas, area],
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await onSubmit({
        nome: form.nome.trim(),
        email: form.email.trim(),
        telefone: form.telefone.trim() || null,
        status: form.status,
        data_inicio: form.data_inicio || null,
        areas: form.areas,
      });
    } catch (submitError) {
      setError(submitError);
      setSaving(false);
    }
  }

  return (
    <AdminDialog eyebrow="Voluntários" id="volunteer-form" onClose={onClose} title="Adicionar voluntário">
      <form onSubmit={handleSubmit}>
        <div className="admin-form-grid">
          <label className="is-wide">
            Nome completo <span aria-hidden="true" className="admin-required">*</span>
            <input autoComplete="off" maxLength="150" minLength="2" name="nome" onChange={handleChange} required value={form.nome} />
          </label>
          <label>
            E-mail <span aria-hidden="true" className="admin-required">*</span>
            <input autoComplete="off" maxLength="150" name="email" onChange={handleChange} required type="email" value={form.email} />
          </label>
          <label>
            Telefone com DDD
            <input autoComplete="off" inputMode="tel" maxLength="20" name="telefone" onChange={handleChange} placeholder="(11) 98888-7777" type="tel" value={form.telefone} />
          </label>
          <label>
            Situação
            <select name="status" onChange={handleChange} value={form.status}>
              {Object.entries(volunteerStatusMap).map(([value, status]) => <option key={value} value={value}>{status.label}</option>)}
            </select>
          </label>
          <label>
            Início
            <input name="data_inicio" onChange={handleChange} type="date" value={form.data_inicio} />
          </label>
        </div>

        <fieldset className="admin-fieldset">
          <legend>Áreas de interesse</legend>
          <div className="admin-checks">
            {Object.entries(volunteerAreaLabels).map(([value, label]) => (
              <label key={value}>
                <input checked={form.areas.includes(value)} onChange={() => toggleArea(value)} type="checkbox" /> {label}
              </label>
            ))}
          </div>
        </fieldset>

        <FormError error={error} fallback="Não foi possível adicionar o voluntário." />

        <div className="admin-dialog-actions">
          <button className="admin-button" onClick={onClose} type="button">Cancelar</button>
          <button className="admin-button is-primary" disabled={saving} type="submit">
            {saving ? 'Adicionando...' : 'Adicionar voluntário'}
          </button>
        </div>
      </form>
    </AdminDialog>
  );
}
