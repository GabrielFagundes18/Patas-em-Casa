// O quê: registro e edição de doação feita fora do site (Pix direto, transferência, dinheiro em evento).
// Como: doador, tipo, valor, método, situação e data; doações online (Mercado Pago) não passam por aqui.
// Para quê: as contas da ONG refletirem todas as entradas, não só as do site.
import { useState } from 'react';
import { donationMethodLabels, donationStatusMap, donationTypeLabels } from '../constants/statusLabels';
import AdminDialog from '../shared/AdminDialog';
import FormError from '../shared/FormError';

const MANUAL_METHODS = ['pix', 'cartao', 'boleto', 'transferencia'];
const MANUAL_STATUSES = ['confirmada', 'pendente', 'cancelada'];

function today() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

export default function DonationFormDialog({ donation, onClose, onSubmit }) {
  const editing = Boolean(donation);
  const [form, setForm] = useState({
    doador_nome: donation?.doador_nome || '',
    doador_email: donation?.doador_email && !donation.doador_email.includes('***') ? donation.doador_email : '',
    tipo: donation?.tipo || 'unica',
    valor: donation ? String(donation.valor) : '',
    metodo: donation?.metodo || 'pix',
    status: donation?.status || 'confirmada',
    data: donation?.data ? String(donation.data).slice(0, 10) : today(),
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    const payload = {
      doador_nome: form.doador_nome.trim(),
      tipo: form.tipo,
      valor: Number(form.valor.replace(',', '.')),
      metodo: form.metodo,
      status: form.status,
      // Meio-dia de Brasília: a data escolhida não muda de dia por causa do fuso.
      data: `${form.data}T12:00:00-03:00`,
      ...(form.doador_email.trim() || !editing ? { doador_email: form.doador_email.trim() || null } : {}),
    };
    try {
      await onSubmit(payload);
    } catch (submitError) {
      setError(submitError);
      setSaving(false);
    }
  }

  return (
    <AdminDialog eyebrow="Doações" id="donation-form" onClose={onClose} title={editing ? 'Editar doação' : 'Registrar doação'}>
      <form onSubmit={handleSubmit}>
        <div className="admin-form-grid">
          <label>
            Doador <span aria-hidden="true" className="admin-required">*</span>
            <input maxLength="150" minLength="2" name="doador_nome" onChange={handleChange} required value={form.doador_nome} />
          </label>
          <label>
            E-mail do doador
            <input maxLength="150" name="doador_email" onChange={handleChange} placeholder={editing ? 'Mantém o atual se ficar em branco' : ''} type="email" value={form.doador_email} />
          </label>
          <label>
            Valor (R$) <span aria-hidden="true" className="admin-required">*</span>
            <input inputMode="decimal" min="0.01" name="valor" onChange={handleChange} required step="0.01" type="number" value={form.valor} />
          </label>
          <label>
            Data <span aria-hidden="true" className="admin-required">*</span>
            <input max={today()} name="data" onChange={handleChange} required type="date" value={form.data} />
          </label>
          <label>
            Tipo
            <select name="tipo" onChange={handleChange} value={form.tipo}>
              {Object.entries(donationTypeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <label>
            Método
            <select name="metodo" onChange={handleChange} value={form.metodo}>
              {MANUAL_METHODS.map((value) => <option key={value} value={value}>{donationMethodLabels[value]}</option>)}
            </select>
          </label>
          <label>
            Situação
            <select name="status" onChange={handleChange} value={form.status}>
              {MANUAL_STATUSES.map((value) => <option key={value} value={value}>{donationStatusMap[value].label}</option>)}
            </select>
          </label>
        </div>
        {form.status === 'cancelada' ? <p className="admin-alert is-warning">Doação cancelada não pode mais ser editada.</p> : null}
        <FormError error={error} fallback="Não foi possível salvar a doação." />
        <div className="admin-dialog-actions">
          <button className="admin-button" onClick={onClose} type="button">Cancelar</button>
          <button className="admin-button is-primary" disabled={saving} type="submit">{saving ? 'Salvando...' : editing ? 'Salvar alterações' : 'Registrar doação'}</button>
        </div>
      </form>
    </AdminDialog>
  );
}
