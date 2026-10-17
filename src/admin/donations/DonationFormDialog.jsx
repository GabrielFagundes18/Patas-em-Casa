/*
 * ============================================================================
 * ARQUIVO: DonationFormDialog.jsx
 * ============================================================================
 *
 * PARA QUE SERVE:
 *   Janela com o FORMULÁRIO para registrar ou editar uma doação feita FORA do
 *   site (Pix direto, transferência, dinheiro em evento...). Doações online
 *   (Mercado Pago) são registradas automaticamente e não passam por aqui.
 *
 * PRINCIPAIS ITENS:
 *   - MANUAL_METHODS, MANUAL_STATUSES: opções permitidas no registro manual.
 *   - today(): data de hoje (AAAA-MM-DD) no fuso local (interna).
 *   - DonationFormDialog({ donation, onClose, onSubmit }): o componente (exportado como padrão).
 *
 * CONEXÕES COM OUTROS ARQUIVOS:
 *   - react (useState).
 *   - admin/constants/statusLabels → rótulos de método, status e tipo.
 *   - admin/shared/AdminDialog e FormError.
 *   - Quem usa: admin/donations/DonationsPage.jsx.
 * ============================================================================
 */

// O quê: registro e edição de doação feita fora do site (Pix direto, transferência, dinheiro em evento).
// Como: doador, tipo, valor, método, situação e data; doações online (Mercado Pago) não passam por aqui.
// Para quê: as contas da ONG refletirem todas as entradas, não só as do site.
// Hook de estado.
import { useState } from 'react';
// Rótulos de método, situação e tipo.
import { donationMethodLabels, donationStatusMap, donationTypeLabels } from 'admin/constants/statusLabels';
// Moldura e erros.
import AdminDialog from 'admin/shared/AdminDialog';
import FormError from 'admin/shared/FormError';

// Métodos aceitos no registro manual.
const MANUAL_METHODS = ['pix', 'cartao', 'boleto', 'transferencia'];
// Situações aceitas no registro manual.
const MANUAL_STATUSES = ['confirmada', 'pendente', 'cancelada'];

/*
 * FUNÇÃO: today (interna)
 * O que faz: devolve a data de hoje no formato AAAA-MM-DD, no fuso do navegador.
 * Retorno (string). Usada como padrão e como data máxima do campo.
 */
function today() {
  const now = new Date();
  // Compensa o fuso (toISOString usa UTC) e pega só a data.
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

/*
 * COMPONENTE: DonationFormDialog
 * O que faz: formulário de registro/edição de doação manual.
 * Parâmetros (props):
 *   - donation (objeto | null): doação em edição (null = registro novo).
 *   - onClose (função): fecha a janela.
 *   - onSubmit (função async): recebe os dados no formato da API.
 * Retorno: JSX da janela.
 * Onde é usado: DonationsPage.jsx.
 */
export default function DonationFormDialog({ donation, onClose, onSubmit }) {
  // Editando?
  const editing = Boolean(donation);
  // Valores iniciais. O e-mail mascarado (com "***") NÃO é colocado no campo: fica vazio
  // (e, se continuar vazio na edição, o e-mail atual é mantido — veja o payload abaixo).
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

  // Atualiza o campo pelo "name".
  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  /*
   * FUNÇÃO INTERNA: handleSubmit
   * O que faz: monta o payload no formato da API e chama onSubmit.
   */
  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    const payload = {
      doador_nome: form.doador_nome.trim(),
      tipo: form.tipo,
      // Aceita vírgula como separador decimal: "50,5" → 50.5.
      valor: Number(form.valor.replace(',', '.')),
      metodo: form.metodo,
      status: form.status,
      // Meio-dia de Brasília: a data escolhida não muda de dia por causa do fuso.
      data: `${form.data}T12:00:00-03:00`,
      // Spread condicional: inclui doador_email se foi digitado OU se é registro novo;
      // na edição com o campo vazio, não envia nada (mantém o e-mail atual).
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
          {/* Nome do doador (obrigatório). */}
          <label>
            Doador <span aria-hidden="true" className="admin-required">*</span>
            <input maxLength="150" minLength="2" name="doador_nome" onChange={handleChange} required value={form.doador_nome} />
          </label>
          {/* E-mail (opcional; na edição, vazio mantém o atual). */}
          <label>
            E-mail do doador
            <input maxLength="150" name="doador_email" onChange={handleChange} placeholder={editing ? 'Mantém o atual se ficar em branco' : ''} type="email" value={form.doador_email} />
          </label>
          {/* Valor em reais (mínimo 1 centavo). */}
          <label>
            Valor (R$) <span aria-hidden="true" className="admin-required">*</span>
            <input inputMode="decimal" min="0.01" name="valor" onChange={handleChange} required step="0.01" type="number" value={form.valor} />
          </label>
          {/* Data (não pode ser no futuro: max = hoje). */}
          <label>
            Data <span aria-hidden="true" className="admin-required">*</span>
            <input max={today()} name="data" onChange={handleChange} required type="date" value={form.data} />
          </label>
          {/* Tipo: única ou recorrente. */}
          <label>
            Tipo
            <select name="tipo" onChange={handleChange} value={form.tipo}>
              {Object.entries(donationTypeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          {/* Método de pagamento. */}
          <label>
            Método
            <select name="metodo" onChange={handleChange} value={form.metodo}>
              {MANUAL_METHODS.map((value) => <option key={value} value={value}>{donationMethodLabels[value]}</option>)}
            </select>
          </label>
          {/* Situação. */}
          <label>
            Situação
            <select name="status" onChange={handleChange} value={form.status}>
              {MANUAL_STATUSES.map((value) => <option key={value} value={value}>{donationStatusMap[value].label}</option>)}
            </select>
          </label>
        </div>
        {/* Aviso ao escolher "cancelada": depois disso, a doação não pode ser editada. */}
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

/*
 * ============================================================================
 * RESUMO DO ARQUIVO
 * ============================================================================
 *
 * COMO O FLUXO FUNCIONA:
 *   1. A DonationsPage abre a janela (com uma doação para editar, ou vazia).
 *   2. Os campos são preenchidos (e-mail mascarado não é exibido).
 *   3. Ao salvar, o payload converte o valor, fixa a data ao meio-dia de Brasília e
 *      decide se envia o e-mail; onSubmit chama a API.
 *   4. Em erro, a mensagem aparece na janela e o botão é reabilitado.
 *
 * CONCEITOS IMPORTANTES PARA ESTUDAR:
 *   - Spread condicional em objetos: ...(condição ? { campo } : {}).
 *   - Fusos horários em datas (meio-dia com -03:00 evita "mudar de dia").
 *   - Dados mascarados e como não sobrescrevê-los sem querer.
 *   - Inputs: number com step/min, date com max, email, inputMode.
 * ============================================================================
 */
