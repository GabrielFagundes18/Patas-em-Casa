/*
 * ============================================================================
 * ARQUIVO: VolunteerFormDialog.jsx
 * ============================================================================
 *
 * PARA QUE SERVE:
 *   Janela com o FORMULÁRIO para cadastrar um voluntário pelo painel: nome,
 *   e-mail, telefone, situação, data de início e áreas de interesse.
 *
 * PRINCIPAIS ITENS:
 *   - today(): data de hoje (AAAA-MM-DD) no fuso local (interna).
 *   - VolunteerFormDialog({ onClose, onSubmit }): o componente (exportado como padrão).
 *       Dentro dele: handleChange, toggleArea, handleSubmit.
 *
 * CONEXÕES COM OUTROS ARQUIVOS:
 *   - react (useState).
 *   - admin/constants/statusLabels → volunteerAreaLabels e volunteerStatusMap.
 *   - admin/shared/AdminDialog e FormError.
 *   - Quem usa: admin/volunteers/VolunteersPage.jsx.
 * ============================================================================
 */

// Hook de estado.
import { useState } from 'react';
// Rótulos das áreas e das situações.
import { volunteerAreaLabels, volunteerStatusMap } from 'admin/constants/statusLabels';
// Moldura e erros.
import AdminDialog from 'admin/shared/AdminDialog';
import FormError from 'admin/shared/FormError';

/*
 * FUNÇÃO: today (interna)
 * O que faz: data de hoje no formato AAAA-MM-DD, no fuso do navegador (padrão do campo "Início").
 */
function today() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

/*
 * COMPONENTE: VolunteerFormDialog
 * O que faz: formulário de cadastro de voluntário.
 * Parâmetros (props): onClose (fecha) e onSubmit (função async que recebe os dados).
 * Retorno: JSX da janela.
 * Onde é usado: VolunteersPage.jsx.
 */
export default function VolunteerFormDialog({ onClose, onSubmit }) {
  // Valores iniciais (situação "ativo" e início hoje).
  const [form, setForm] = useState({ nome: '', email: '', telefone: '', status: 'ativo', data_inicio: today(), areas: [] });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Atualiza campos de texto/select pelo "name".
  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  // Marca/desmarca uma área (adiciona ou remove da lista).
  function toggleArea(area) {
    setForm((current) => ({
      ...current,
      areas: current.areas.includes(area) ? current.areas.filter((item) => item !== area) : [...current.areas, area],
    }));
  }

  /*
   * FUNÇÃO INTERNA: handleSubmit
   * O que faz: limpa os textos, converte vazios em null e chama onSubmit.
   */
  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await onSubmit({
        nome: form.nome.trim(),
        email: form.email.trim(),
        // Telefone e data vazios viram null.
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
          {/* autoComplete="off": o navegador não preenche com os dados de quem está usando o painel. */}
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

        {/* Áreas de interesse: uma caixa de seleção por área. */}
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

        {/* Erro do envio. */}
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

/*
 * ============================================================================
 * RESUMO DO ARQUIVO
 * ============================================================================
 *
 * COMO O FLUXO FUNCIONA:
 *   A VolunteersPage abre a janela; a pessoa preenche os dados e marca as áreas;
 *   ao enviar, os valores são limpos e passados para onSubmit (que chama a API).
 *   Em erro, a mensagem aparece e o botão é reabilitado.
 *
 * CONCEITOS IMPORTANTES PARA ESTUDAR:
 *   - Formulário controlado com campos de texto, select, date e checkboxes.
 *   - Lista de selecionados no estado (includes, filter, spread).
 *   - fieldset/legend para agrupar opções.
 *   - autoComplete="off" em formulários de cadastro de terceiros.
 * ============================================================================
 */
