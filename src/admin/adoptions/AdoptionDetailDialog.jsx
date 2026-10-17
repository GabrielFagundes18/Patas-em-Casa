/*
 * ============================================================================
 * ARQUIVO: AdoptionDetailDialog.jsx
 * ============================================================================
 *
 * PARA QUE SERVE:
 *   Janela de DETALHES e TRIAGEM de um pedido de adoção no painel. Mostra os
 *   dados do adotante e do animal, a agenda, as respostas do formulário e o
 *   histórico, e permite (conforme as permissões do usuário):
 *     - revelar os contatos completos (acesso registrado em auditoria);
 *     - agendar, remarcar, cancelar ou concluir visitas/entrevistas (com e-mail);
 *     - aprovar ou recusar o pedido (com justificativa e aviso por e-mail).
 *   Cada ação abre um "painel" dentro da própria janela.
 *
 * PRINCIPAIS ITENS:
 *   - OPEN_STATUSES, APPOINTMENT_TYPES, DURATIONS: configurações.
 *   - protocolOf(id), localDateTimeValue(date), emailNotice(done, email): auxiliares.
 *   - DurationField: seletor de duração.
 *   - usePanelSubmit(onConfirm): hook de envio dos painéis.
 *   - DecisionPanel, SchedulePanel, ReschedulePanel, CancelAppointmentPanel: painéis de ação.
 *   - AdoptionDetailDialog (exportado como padrão): carrega o pedido e coordena as ações.
 *   - AppointmentsSection, AdoptionDetailBody: partes da tela.
 *
 * CONEXÕES COM OUTROS ARQUIVOS:
 *   - react (useEffect, useState), lucide-react (ícones).
 *   - ./adoptionService → todas as ações do pedido.
 *   - admin/constants/animalOptions e statusLabels → rótulos, cores e formatadores.
 *   - admin/shared → AdminDialog, FormError, ListState, errorMessage.
 *   - Quem usa: admin/adoptions/AdoptionsPage.jsx.
 *   - Testado em: ./AdoptionsPage.test.js.
 * ============================================================================
 */

// O quê: detalhe do pedido de adoção no painel (dados, histórico, agenda e decisões).
// Como: carrega o pedido completo da API; cada ação abre um painel no próprio diálogo e, ao concluir,
//       atualiza o pedido e avisa a lista (onChanged).
// Para quê: triagem completa num só lugar: revelar contatos (auditado), agendar/remarcar/cancelar visita
//           ou entrevista com aviso por e-mail, aprovar ou recusar avisando o adotante.
// Hooks do React.
import { useEffect, useState } from 'react';
// Ícones.
import { CalendarCheck, CalendarClock, Check, Eye, X } from 'lucide-react';
// Ações do pedido na API.
import {
  approveAdoptionRequest,
  cancelAppointment,
  completeAppointment,
  getAdoptionRequest,
  rejectAdoptionRequest,
  rescheduleAppointment,
  revealAdoptionRequest,
  scheduleAdoptionRequest,
} from './adoptionService';
// Rótulos dos animais.
import { animalSpecies, animalStatusMap } from 'admin/constants/animalOptions';
// Rótulos, cores e formatadores.
import {
  adoptionStatusMap,
  appointmentStatusMap,
  appointmentTypeLabels,
  formatDate,
  formatDateTime,
  priorityMap,
  statusOf,
} from 'admin/constants/statusLabels';
// Componentes compartilhados.
import AdminDialog from 'admin/shared/AdminDialog';
import FormError from 'admin/shared/FormError';
import ListState from 'admin/shared/ListState';
import { errorMessage } from 'admin/shared/usePaginatedList';

// Status em que o pedido ainda está "aberto" (dá para agendar/decidir).
const OPEN_STATUSES = ['novo', 'em_analise', 'visita_agendada'];
// Tipos de agendamento: rótulo, dica sobre o efeito no status e rótulo do campo de local.
const APPOINTMENT_TYPES = {
  visita: { label: 'Visita', hint: 'O pedido passa para "Visita agendada".', placeLabel: 'Endereço da visita' },
  entrevista: { label: 'Entrevista', hint: 'Pedidos novos passam para "Em análise".', placeLabel: 'Local ou link da chamada' },
};
// Durações possíveis (em minutos).
const DURATIONS = [30, 45, 60, 90, 120];

/*
 * FUNÇÃO: protocolOf (interna)
 * O que faz: monta o número de protocolo a partir do id (ex.: "PAC-550E8400").
 * Parâmetros: id (string). Retorno (string).
 */
function protocolOf(id) {
  return `PAC-${String(id).slice(0, 8).toUpperCase()}`;
}

/*
 * FUNÇÃO: localDateTimeValue (interna)
 * O que faz: converte uma data no formato do <input type="datetime-local"> no fuso do navegador.
 * Parâmetros: date (Date). Retorno (string) "AAAA-MM-DDTHH:mm".
 */
// Valor de <input type="datetime-local"> no fuso do navegador (AAAA-MM-DDTHH:mm).
function localDateTimeValue(date) {
  // Compensa o fuso (toISOString usa UTC) e corta segundos e "Z".
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

/*
 * FUNÇÃO: emailNotice (interna)
 * O que faz: monta o aviso exibido depois de uma ação que pode enviar e-mail.
 * Parâmetros:
 *   - done (string): o que foi feito (ex.: "Visita agendada").
 *   - email (objeto | null): resultado do envio { enviado, para, motivo } ou null (não pedido).
 * Retorno (objeto): { variant: 'success' | 'warning', text }.
 */
// Texto do aviso depois de uma ação que pode mandar e-mail ao adotante.
function emailNotice(done, email) {
  // Sem envio pedido.
  if (!email) return { variant: 'success', text: `${done}.` };
  // Enviado com sucesso.
  if (email.enviado) return { variant: 'success', text: `${done}. E-mail enviado para ${email.para}.` };
  // A ação deu certo, mas o e-mail falhou (aviso amarelo com o motivo).
  return { variant: 'warning', text: `${done}, mas o e-mail não foi enviado. ${email.motivo}` };
}

/*
 * COMPONENTE: DurationField (interno)
 * O que faz: <select> de duração (30 min ... 2 h).
 * Parâmetros (props): value (number, minutos) e onChange (função que recebe o número).
 */
function DurationField({ value, onChange }) {
  return (
    <label>
      Duração
      {/* Number(...) converte o texto do select em número antes de avisar o pai. */}
      <select name="duracao_minutos" onChange={(event) => onChange(Number(event.target.value))} value={value}>
        {/* Menos de 60: "45 min"; 60 ou mais: horas ("1 h", "1,5 h" — troca ponto por vírgula). */}
        {DURATIONS.map((minutes) => <option key={minutes} value={minutes}>{minutes < 60 ? `${minutes} min` : `${minutes / 60} h`.replace('.5', ',5')}</option>)}
      </select>
    </label>
  );
}

/*
 * HOOK: usePanelSubmit (interno)
 * O que faz: controla o envio de um painel (salvando/erro).
 * Parâmetros: onConfirm (função async) — a ação a executar com os dados do painel.
 * Retorno (objeto): { saving, error, submit(payload) }.
 * Detalhe: em caso de sucesso, não desliga "saving" porque o painel será fechado pelo pai.
 */
function usePanelSubmit(onConfirm) {
  // Enviando?
  const [saving, setSaving] = useState(false);
  // Erro do envio (objeto do axios) ou null.
  const [error, setError] = useState(null);

  async function submit(payload) {
    setSaving(true);
    setError(null);
    try {
      await onConfirm(payload);
    } catch (submitError) {
      // Só em erro o painel continua aberto: mostra o erro e reabilita o botão.
      setError(submitError);
      setSaving(false);
    }
  }

  return { saving, error, submit };
}

/*
 * COMPONENTE: DecisionPanel (interno)
 * O que faz: painel para aprovar ou recusar o pedido, com justificativa interna e aviso opcional por e-mail.
 * Parâmetros (props):
 *   - kind ('aprovar' | 'recusar'), animalName, adopterName (strings),
 *   - onCancel (voltar), onConfirm (ação async que recebe a decisão).
 */
function DecisionPanel({ kind, animalName, adopterName, onCancel, onConfirm }) {
  // Justificativa (vai para o histórico, não para o adotante).
  const [justificativa, setJustificativa] = useState('');
  // Avisar o adotante por e-mail?
  const [notify, setNotify] = useState(true);
  // Mensagem opcional para o adotante.
  const [message, setMessage] = useState('');
  // Estado do envio.
  const { saving, error, submit } = usePanelSubmit(onConfirm);
  // É aprovação?
  const approving = kind === 'aprovar';

  return (
    <form
      aria-labelledby="adoption-decision-title"
      className="admin-action-panel"
      // Envia no formato da API; sem aviso, a mensagem vai vazia.
      onSubmit={(event) => {
        event.preventDefault();
        submit({ justificativa: justificativa.trim(), notificar_adotante: notify, mensagem_adotante: notify ? message.trim() : '' });
      }}
    >
      <h3 id="adoption-decision-title">{approving ? 'Aprovar adoção' : 'Recusar pedido'}</h3>
      {/* Explica as consequências de cada decisão. */}
      <p>
        {approving
          ? `${animalName} será marcado como adotado e os outros pedidos abertos para ele serão recusados automaticamente.`
          : 'O pedido será encerrado como reprovado e os agendamentos em aberto, cancelados. Sem outros pedidos abertos, o animal volta a ficar disponível.'}
      </p>
      {/* Justificativa obrigatória (mínimo 10 caracteres); autoFocus coloca o cursor nela. */}
      <label className="admin-field">
        Justificativa (interna) <span aria-hidden="true" className="admin-required">*</span>
        <textarea
          aria-describedby="adoption-decision-hint"
          autoFocus
          maxLength="2000"
          minLength="10"
          onChange={(event) => setJustificativa(event.target.value)}
          required
          rows="3"
          value={justificativa}
        />
      </label>
      <small className="admin-field-hint" id="adoption-decision-hint">Mínimo de 10 caracteres. Fica no histórico do pedido e não vai para o adotante.</small>
      {/* Avisar por e-mail. */}
      <div className="admin-checks">
        <label>
          <input checked={notify} onChange={(event) => setNotify(event.target.checked)} type="checkbox" />
          Avisar {adopterName} por e-mail
        </label>
      </div>
      {/* Mensagem opcional (só aparece se for avisar). Placeholder diferente para aprovar/recusar. */}
      {notify ? (
        <label className="admin-field">
          Mensagem para o adotante (opcional)
          <textarea
            maxLength="1000"
            onChange={(event) => setMessage(event.target.value)}
            placeholder={approving ? 'Ex.: vamos combinar a entrega na próxima semana.' : 'Ex.: obrigado pelo carinho; outros animais esperam por você.'}
            rows="2"
            value={message}
          />
        </label>
      ) : null}
      <FormError error={error} fallback="Não foi possível registrar a decisão." />
      {/* Voltar / confirmar (botão vermelho para recusar). */}
      <div className="admin-dialog-actions">
        <button className="admin-button" onClick={onCancel} type="button">Voltar</button>
        <button className={`admin-button ${approving ? 'is-primary' : 'is-danger'}`} disabled={saving} type="submit">
          {saving ? 'Salvando...' : approving ? 'Confirmar aprovação' : 'Confirmar recusa'}
        </button>
      </div>
    </form>
  );
}

/*
 * COMPONENTE: SchedulePanel (interno)
 * O que faz: painel para agendar uma visita ou entrevista.
 * Parâmetros (props):
 *   - adopterName (string), preferred (string | null — sugestão de data do adotante),
 *   - onCancel (voltar), onConfirm (ação async com os dados do agendamento).
 */
function SchedulePanel({ adopterName, preferred, onCancel, onConfirm }) {
  // "Agora" no formato do campo (usado como mínimo e para validar a sugestão).
  const now = localDateTimeValue(new Date());
  // Campos do agendamento. A data começa com a sugestão do adotante, se for futura.
  const [form, setForm] = useState({
    tipo: 'visita',
    data_hora: preferred && preferred > now ? preferred : '',
    duracao_minutos: 60,
    local: '',
    mensagem: '',
    enviar_email: true,
  });
  const { saving, error, submit } = usePanelSubmit(onConfirm);
  // Configuração do tipo escolhido (dica e rótulo do local).
  const type = APPOINTMENT_TYPES[form.tipo];

  // Atualiza qualquer campo (checkbox usa "checked"). "type: inputType" renomeia para não colidir com "type" acima.
  function handleChange(event) {
    const { name, value, type: inputType, checked } = event.target;
    setForm((current) => ({ ...current, [name]: inputType === 'checkbox' ? checked : value }));
  }

  return (
    <form
      aria-labelledby="adoption-schedule-title"
      className="admin-action-panel"
      onSubmit={(event) => {
        event.preventDefault();
        submit({ ...form, local: form.local.trim(), mensagem: form.mensagem.trim() });
      }}
    >
      <h3 id="adoption-schedule-title">Agendar visita ou entrevista</h3>
      {/* Tipo de agendamento (rádios). */}
      <fieldset className="admin-fieldset">
        <legend>Tipo de agendamento</legend>
        <div className="admin-choice-group">
          {Object.entries(APPOINTMENT_TYPES).map(([value, option]) => (
            <label className="admin-choice" key={value}>
              <input autoFocus={value === 'visita'} checked={form.tipo === value} name="tipo" onChange={handleChange} type="radio" value={value} />
              {option.label}
            </label>
          ))}
        </div>
        <small className="admin-field-hint">{type.hint} O mesmo responsável não pode ter dois compromissos no mesmo horário.</small>
      </fieldset>
      <div className="admin-form-grid">
        {/* Data e hora (não aceita passado: min={now}). */}
        <label>
          Data e horário <span aria-hidden="true" className="admin-required">*</span>
          <input min={now} name="data_hora" onChange={handleChange} required type="datetime-local" value={form.data_hora} />
        </label>
        {/* Duração. */}
        <DurationField onChange={(duracao) => setForm((current) => ({ ...current, duracao_minutos: duracao }))} value={form.duracao_minutos} />
        {/* Local (rótulo depende do tipo). */}
        <label className="is-wide">
          {type.placeLabel}
          <input maxLength="300" name="local" onChange={handleChange} value={form.local} />
        </label>
        {/* Mensagem para o adotante. */}
        <label className="is-wide">
          Mensagem para o adotante
          <textarea maxLength="1000" name="mensagem" onChange={handleChange} placeholder="Ex.: leve um documento com foto." rows="3" value={form.mensagem} />
        </label>
      </div>
      {/* Enviar e-mail? */}
      <div className="admin-checks">
        <label>
          <input checked={form.enviar_email} name="enviar_email" onChange={handleChange} type="checkbox" />
          Enviar e-mail a {adopterName} com data, horário, local e a mensagem
        </label>
      </div>
      <FormError error={error} fallback="Não foi possível salvar o agendamento." />
      <div className="admin-dialog-actions">
        <button className="admin-button" onClick={onCancel} type="button">Voltar</button>
        <button className="admin-button is-primary" disabled={saving} type="submit">
          {saving ? 'Agendando...' : form.enviar_email ? 'Agendar e enviar e-mail' : 'Agendar'}
        </button>
      </div>
    </form>
  );
}

/*
 * COMPONENTE: ReschedulePanel (interno)
 * O que faz: painel para remarcar um compromisso existente.
 * Parâmetros (props): appointment (compromisso), adopterName, onCancel, onConfirm.
 */
function ReschedulePanel({ appointment, adopterName, onCancel, onConfirm }) {
  // Campos começam com os dados atuais do compromisso.
  const [form, setForm] = useState({
    data_hora: appointment.data_hora,
    duracao_minutos: appointment.duracao_minutos,
    local: appointment.local || '',
    mensagem: appointment.mensagem || '',
    enviar_email: true,
  });
  const { saving, error, submit } = usePanelSubmit(onConfirm);
  // "Visita" ou "Entrevista".
  const label = appointmentTypeLabels[appointment.tipo];

  function handleChange(event) {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }));
  }

  return (
    <form
      aria-labelledby="adoption-reschedule-title"
      className="admin-action-panel"
      onSubmit={(event) => {
        event.preventDefault();
        submit({ ...form, local: form.local.trim(), mensagem: form.mensagem.trim() });
      }}
    >
      <h3 id="adoption-reschedule-title">Remarcar {label.toLowerCase()} de {formatDateTime(appointment.previsto_em)}</h3>
      <div className="admin-form-grid">
        {/* Novo horário (a partir de agora). */}
        <label>
          Novo horário <span aria-hidden="true" className="admin-required">*</span>
          <input autoFocus min={localDateTimeValue(new Date())} name="data_hora" onChange={handleChange} required type="datetime-local" value={form.data_hora} />
        </label>
        <DurationField onChange={(duracao) => setForm((current) => ({ ...current, duracao_minutos: duracao }))} value={form.duracao_minutos} />
        <label className="is-wide">
          {APPOINTMENT_TYPES[appointment.tipo].placeLabel}
          <input maxLength="300" name="local" onChange={handleChange} value={form.local} />
        </label>
        <label className="is-wide">
          Mensagem para o adotante
          <textarea maxLength="1000" name="mensagem" onChange={handleChange} rows="2" value={form.mensagem} />
        </label>
      </div>
      <div className="admin-checks">
        <label>
          <input checked={form.enviar_email} name="enviar_email" onChange={handleChange} type="checkbox" />
          Avisar {adopterName} do novo horário por e-mail
        </label>
      </div>
      <FormError error={error} fallback="Não foi possível remarcar." />
      <div className="admin-dialog-actions">
        <button className="admin-button" onClick={onCancel} type="button">Voltar</button>
        <button className="admin-button is-primary" disabled={saving} type="submit">{saving ? 'Salvando...' : 'Salvar novo horário'}</button>
      </div>
    </form>
  );
}

/*
 * COMPONENTE: CancelAppointmentPanel (interno)
 * O que faz: painel para cancelar um compromisso, com motivo e aviso opcional.
 * Parâmetros (props): appointment, adopterName, onCancel, onConfirm.
 */
function CancelAppointmentPanel({ appointment, adopterName, onCancel, onConfirm }) {
  // Motivo do cancelamento.
  const [motivo, setMotivo] = useState('');
  // Avisar por e-mail?
  const [notify, setNotify] = useState(true);
  const { saving, error, submit } = usePanelSubmit(onConfirm);
  const label = appointmentTypeLabels[appointment.tipo];

  return (
    <form
      aria-labelledby="adoption-cancel-appointment-title"
      className="admin-action-panel"
      onSubmit={(event) => {
        event.preventDefault();
        submit({ motivo: motivo.trim(), enviar_email: notify });
      }}
    >
      <h3 id="adoption-cancel-appointment-title">Cancelar {label.toLowerCase()} de {formatDateTime(appointment.previsto_em)}</h3>
      {/* Aviso sobre o efeito no status (só para visitas). */}
      {appointment.tipo === 'visita' ? <p>Se for a única visita marcada, o pedido volta para "Em análise".</p> : null}
      <label className="admin-field">
        Motivo (vai no histórico e no e-mail)
        <textarea autoFocus maxLength="500" onChange={(event) => setMotivo(event.target.value)} rows="2" value={motivo} />
      </label>
      <div className="admin-checks">
        <label>
          <input checked={notify} onChange={(event) => setNotify(event.target.checked)} type="checkbox" />
          Avisar {adopterName} por e-mail
        </label>
      </div>
      <FormError error={error} fallback="Não foi possível cancelar o agendamento." />
      <div className="admin-dialog-actions">
        <button className="admin-button" onClick={onCancel} type="button">Voltar</button>
        <button className="admin-button is-danger" disabled={saving} type="submit">{saving ? 'Cancelando...' : 'Cancelar agendamento'}</button>
      </div>
    </form>
  );
}

/*
 * COMPONENTE: AdoptionDetailDialog (exportado como padrão)
 * O que faz: carrega o pedido, guarda o estado da janela e define as ações (revelar, decidir, agendar...).
 * Parâmetros (props):
 *   - requestId (string): id do pedido.
 *   - user (objeto): usuário logado (permissões).
 *   - onClose (função): fecha a janela.
 *   - onChanged (função | undefined): avisa a lista para recarregar após uma ação.
 * Retorno: JSX da janela.
 * Onde é usado: AdoptionsPage.jsx.
 */
export default function AdoptionDetailDialog({ requestId, user, onClose, onChanged }) {
  // Pedido carregado (null enquanto carrega).
  const [request, setRequest] = useState(null);
  // Carregando? / erro de carga / contador para tentar de novo.
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  // Contatos revelados (null = ainda mascarados).
  const [contacts, setContacts] = useState(null);
  // Revelando? / erro ao revelar.
  const [revealing, setRevealing] = useState(false);
  const [revealError, setRevealError] = useState(null);
  // Modo da janela: 'view' (visualização) ou o painel aberto ('agendar', 'remarcar', 'aprovar'...).
  const [mode, setMode] = useState({ type: 'view' });
  // Aviso depois de uma ação ({ variant, text }) ou null.
  const [notice, setNotice] = useState(null);

  // Permissões do usuário (lista vazia se não houver).
  const permissions = user?.permissions || [];
  // Pode aprovar/recusar?
  const canDecide = permissions.includes('adoptions:approve');
  // Pode agendar/remarcar/cancelar?
  const canSchedule = permissions.includes('adoptions:update');
  // Pode ver contatos completos?
  const canReveal = permissions.includes('adopters:reveal');

  // Carrega o pedido ao abrir (e ao tentar de novo).
  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError('');

    getAdoptionRequest(requestId)
      .then((result) => {
        if (active) setRequest(result);
      })
      .catch((requestError) => {
        if (active) setLoadError(errorMessage(requestError, 'Não foi possível carregar o pedido.'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [requestId, reloadKey]);

  /*
   * FUNÇÃO INTERNA: openMode
   * O que faz: abre um painel (ou volta à visualização), limpando o aviso anterior.
   * Parâmetros: type (string) e appointment (compromisso, quando o painel precisa de um).
   */
  function openMode(type, appointment) {
    setNotice(null);
    setMode({ type, appointment });
  }

  /*
   * FUNÇÃO INTERNA: finish
   * O que faz: depois de uma ação bem-sucedida, atualiza o pedido, fecha o painel, mostra o aviso
   *   e avisa a lista.
   */
  // Depois de uma ação: mostra o pedido atualizado, avisa a lista e volta para a visualização.
  function finish(updated, nextNotice) {
    setRequest(updated);
    // Se os contatos estavam revelados, descarta as observações reveladas (o histórico mudou):
    // "current && {...}" só cria o objeto novo se current existir.
    setContacts((current) => current && { ...current, observacoes: null });
    setMode({ type: 'view' });
    setNotice(nextNotice);
    onChanged?.();
  }

  /*
   * FUNÇÃO INTERNA: reveal
   * O que faz: busca os contatos completos (ação auditada no backend).
   */
  async function reveal() {
    setRevealing(true);
    setRevealError(null);
    try {
      const data = await revealAdoptionRequest(requestId);
      setContacts({ email: data.adotante.email, telefone: data.adotante.telefone, observacoes: data.observacoes });
    } catch (requestError) {
      setRevealError(requestError);
    } finally {
      setRevealing(false);
    }
  }

  // Ações dos painéis: chamam a API e, em sucesso, "finish". Erros sobem para o painel (usePanelSubmit).
  async function reject(decision) {
    const updated = await rejectAdoptionRequest(requestId, decision);
    finish(updated, emailNotice('Pedido recusado', updated.email));
  }

  async function approve(decision) {
    const updated = await approveAdoptionRequest(requestId, decision);
    finish(updated, emailNotice('Adoção aprovada. Quando o termo for assinado, registre no pedido', updated.email));
  }

  async function schedule(payload) {
    // A API devolve { pedido, email }.
    const { pedido, email } = await scheduleAdoptionRequest(requestId, payload);
    finish(pedido, emailNotice(`${APPOINTMENT_TYPES[payload.tipo].label} agendada`, email));
  }

  async function reschedule(appointment, payload) {
    const { pedido, email } = await rescheduleAppointment(requestId, appointment.id, payload);
    finish(pedido, emailNotice(`${appointmentTypeLabels[appointment.tipo]} remarcada`, email));
  }

  async function cancel(appointment, payload) {
    const { pedido, email } = await cancelAppointment(requestId, appointment.id, payload);
    finish(pedido, emailNotice(`${appointmentTypeLabels[appointment.tipo]} cancelada`, email));
  }

  // "Realizada" não abre painel: trata o erro aqui mesmo, num aviso.
  async function complete(appointment) {
    setNotice(null);
    try {
      const { pedido } = await completeAppointment(requestId, appointment.id);
      finish(pedido, { variant: 'success', text: `${appointmentTypeLabels[appointment.tipo]} marcada como realizada.` });
    } catch (requestError) {
      setNotice({ variant: 'error', text: errorMessage(requestError, 'Não foi possível atualizar o agendamento.') });
    }
  }

  // Título da janela.
  const title = request ? `${request.adotante.nome} quer adotar ${request.animal.nome}` : 'Pedido de adoção';

  return (
    // Janela larga, com o protocolo no rótulo.
    <AdminDialog eyebrow={`Pedido de adoção · ${protocolOf(requestId)}`} id="adoption-detail" onClose={onClose} title={title} wide>
      {/* Sem pedido: carregando/erro. Com pedido: o corpo com todas as informações e ações. */}
      {!request ? (
        <ListState error={loadError} loading={loading} onRetry={() => setReloadKey((key) => key + 1)} />
      ) : (
        <AdoptionDetailBody
          actions={{ onApprove: approve, onReject: reject, onSchedule: schedule, onReschedule: reschedule, onCancelAppointment: cancel, onComplete: complete }}
          canDecide={canDecide}
          canReveal={canReveal}
          canSchedule={canSchedule}
          contacts={contacts}
          mode={mode}
          notice={notice}
          onMode={openMode}
          onReveal={reveal}
          request={request}
          revealError={revealError}
          revealing={revealing}
        />
      )}
    </AdminDialog>
  );
}

/*
 * COMPONENTE: AppointmentsSection (interno)
 * O que faz: mostra a agenda do pedido (compromissos com status e ações).
 * Parâmetros (props): request, canSchedule (boolean), onMode (abre painéis), onComplete (marca realizada).
 */
function AppointmentsSection({ request, canSchedule, onMode, onComplete }) {
  // Compromissos (lista vazia se não houver).
  const appointments = request.agendamentos || [];
  // O pedido ainda está aberto?
  const isOpen = OPEN_STATUSES.includes(request.status);

  return (
    <section aria-labelledby="adoption-detail-agenda" className="admin-detail-section admin-detail-wide">
      <h3 id="adoption-detail-agenda">Agenda</h3>
      {/* Sugestão de data do adotante (guardada sem fuso; ":00-03:00" acrescenta segundos e o fuso de Brasília). */}
      {request.visita_preferida_em ? (
        <p className="admin-field-hint">Sugestão do adotante para a visita: {formatDateTime(`${request.visita_preferida_em}:00-03:00`)}</p>
      ) : null}
      {appointments.length === 0 ? (
        <p className="admin-detail-closed">Nenhuma visita ou entrevista marcada.</p>
      ) : (
        <ul className="admin-appointments">
          {appointments.map((appointment) => {
            const status = statusOf(appointmentStatusMap, appointment.status);
            // Só compromissos "agendado" aceitam ações.
            const active = appointment.status === 'agendado';
            return (
              <li key={appointment.id}>
                <div>
                  <strong>{appointmentTypeLabels[appointment.tipo]} · {formatDateTime(appointment.previsto_em)}</strong>
                  <small>
                    {appointment.duracao_minutos} min
                    {appointment.local ? ` · ${appointment.local}` : ''}
                    {appointment.responsavel ? ` · com ${appointment.responsavel.nome}` : ''}
                  </small>
                </div>
                <span className={`admin-badge is-${status.variant}`}>{status.label}</span>
                {/* Ações (para compromissos ativos e quem pode agendar). Remarcar só com o pedido aberto. */}
                {active && canSchedule ? (
                  <div className="admin-row-actions">
                    {isOpen ? (
                      <button className="admin-button is-small" onClick={() => onMode('remarcar', appointment)} type="button">Remarcar</button>
                    ) : null}
                    <button className="admin-button is-small" onClick={() => onComplete(appointment)} type="button">
                      <CalendarCheck aria-hidden="true" size={14} /> Realizada
                    </button>
                    <button className="admin-button is-small is-danger" onClick={() => onMode('cancelar-agendamento', appointment)} type="button">Cancelar</button>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

/*
 * COMPONENTE: AdoptionDetailBody (interno)
 * O que faz: desenha o conteúdo da janela (resumo, adotante, animal, agenda, histórico, avisos e
 *   o painel aberto ou os botões de ação).
 * Parâmetros (props): request, contacts, mode, notice, revealing, revealError, canDecide,
 *   canSchedule, canReveal, onMode, onReveal, actions (funções de ação).
 */
function AdoptionDetailBody({
  request, contacts, mode, notice, revealing, revealError,
  canDecide, canSchedule, canReveal, onMode, onReveal, actions,
}) {
  // Rótulos e cores de status, prioridade e situação do animal.
  const status = statusOf(adoptionStatusMap, request.status);
  const priority = statusOf(priorityMap, request.prioridade);
  const animalStatus = statusOf(animalStatusMap, request.animal.status);
  // Nome da espécie ("Cachorro") ou o código, se desconhecido.
  const species = animalSpecies.find((option) => option.value === request.animal.especie)?.label || request.animal.especie;
  // Pedido aberto?
  const isOpen = OPEN_STATUSES.includes(request.status);
  // Histórico: o revelado (sem máscara), se houver; senão, o mascarado do pedido.
  const history = contacts?.observacoes ?? request.observacoes;
  // Primeiro nome do adotante (usado nos textos "Avisar Ana por e-mail").
  const adopterName = request.adotante.nome.split(' ')[0];
  // Volta à visualização.
  const back = () => onMode('view');

  // Escolhe o painel conforme o modo (null = nenhum painel aberto).
  let panel = null;
  if (mode.type === 'agendar' && isOpen) {
    panel = <SchedulePanel adopterName={adopterName} onCancel={back} onConfirm={actions.onSchedule} preferred={request.visita_preferida_em} />;
  } else if (mode.type === 'remarcar') {
    // A ação recebe o compromisso + os dados do painel.
    panel = <ReschedulePanel adopterName={adopterName} appointment={mode.appointment} onCancel={back} onConfirm={(payload) => actions.onReschedule(mode.appointment, payload)} />;
  } else if (mode.type === 'cancelar-agendamento') {
    panel = <CancelAppointmentPanel adopterName={adopterName} appointment={mode.appointment} onCancel={back} onConfirm={(payload) => actions.onCancelAppointment(mode.appointment, payload)} />;
  } else if ((mode.type === 'recusar' || mode.type === 'aprovar') && isOpen) {
    panel = (
      <DecisionPanel
        adopterName={adopterName}
        animalName={request.animal.nome}
        kind={mode.type}
        onCancel={back}
        onConfirm={mode.type === 'aprovar' ? actions.onApprove : actions.onReject}
      />
    );
  }

  return (
    <div className="admin-detail">
      {/* Linha de resumo: status, prioridade, data, responsável e termo. */}
      <div className="admin-detail-meta">
        <span className={`admin-badge is-${status.variant}`}>{status.label}</span>
        <span className={`admin-badge is-${priority.variant}`}>Prioridade {priority.label.toLowerCase()}</span>
        <span>Recebido em {formatDate(request.data_pedido)}</span>
        <span>Responsável: {request.responsavel?.nome || 'Sem responsável'}</span>
        {request.status === 'aprovado' ? (
          <span>Termo: {request.termo_assinado ? `assinado em ${formatDate(request.termo_assinado_em)}` : 'pendente'}</span>
        ) : null}
      </div>

      {/* Adotante e animal lado a lado. */}
      <div className="admin-detail-grid">
        <section aria-labelledby="adoption-detail-adopter" className="admin-detail-section">
          <h3 id="adoption-detail-adopter">Adotante</h3>
          <dl className="admin-detail-list">
            <div><dt>Nome</dt><dd>{request.adotante.nome}</dd></div>
            <div><dt>Cidade</dt><dd>{[request.adotante.cidade, request.adotante.estado].filter(Boolean).join(' / ') || 'Não informada'}</dd></div>
            {/* Contato revelado (se houver) ou o mascarado. */}
            <div><dt>E-mail</dt><dd>{contacts?.email || request.adotante.email || 'Não informado'}</dd></div>
            <div><dt>Telefone</dt><dd>{contacts?.telefone || request.adotante.telefone || 'Não informado'}</dd></div>
          </dl>
          {/* Botão de revelar: só com permissão e enquanto não revelado. */}
          {canReveal && !contacts ? (
            <button className="admin-button is-small" disabled={revealing} onClick={onReveal} type="button">
              <Eye aria-hidden="true" size={15} /> {revealing ? 'Carregando...' : 'Mostrar contatos completos'}
            </button>
          ) : null}
          {contacts ? <small className="admin-field-hint">Contatos completos visíveis. O acesso fica registrado na auditoria.</small> : null}
          <FormError error={revealError} fallback="Não foi possível mostrar os contatos." />
        </section>

        <section aria-labelledby="adoption-detail-animal" className="admin-detail-section">
          <h3 id="adoption-detail-animal">Animal</h3>
          <div className="admin-detail-animal">
            {/* Foto decorativa (alt="": o nome já está ao lado). */}
            {request.animal.foto_url ? <img alt="" className="admin-detail-photo" src={request.animal.foto_url} /> : null}
            <dl className="admin-detail-list">
              <div><dt>Nome</dt><dd>{request.animal.nome}</dd></div>
              <div><dt>Espécie</dt><dd>{species}</dd></div>
              <div><dt>Situação</dt><dd><span className={`admin-badge is-${animalStatus.variant}`}>{animalStatus.label}</span></dd></div>
            </dl>
          </div>
        </section>
      </div>

      {/* Agenda. */}
      <AppointmentsSection canSchedule={canSchedule} onComplete={actions.onComplete} onMode={onMode} request={request} />

      {/* Respostas do formulário e histórico. */}
      <section aria-labelledby="adoption-detail-history" className="admin-detail-section">
        <h3 id="adoption-detail-history">Respostas do formulário e histórico</h3>
        {/* Área rolável com role="region" e tabIndex={0} (pode receber foco pelo teclado para rolar).
            A linha a seguir desliga, só para a <div> logo abaixo, uma regra do ESLint sobre tabIndex. */}
        {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- área rolável precisa receber foco pelo teclado */}
        <div aria-labelledby="adoption-detail-history" className="admin-history" role="region" tabIndex={0}>
          {history || 'Sem respostas ou anotações registradas.'}
        </div>
      </section>

      {/* Aviso depois de uma ação (erro → alert; sucesso/atenção → status). */}
      {notice ? <p className={`admin-alert is-${notice.variant}`} role={notice.variant === 'error' ? 'alert' : 'status'}>{notice.text}</p> : null}

      {/* Rodapé: o painel aberto; ou, sem painel: aviso de pedido decidido, ou os botões de ação
          (conforme as permissões), ou nada. */}
      {panel || (!isOpen ? (
        <p className="admin-detail-closed">Este pedido já foi decidido ({status.label.toLowerCase()}).</p>
      ) : canDecide || canSchedule ? (
        <div className="admin-dialog-actions">
          {canDecide ? (
            <button className="admin-button is-danger" onClick={() => onMode('recusar')} type="button">
              <X aria-hidden="true" size={16} /> Recusar
            </button>
          ) : null}
          {canSchedule ? (
            <button className="admin-button" onClick={() => onMode('agendar')} type="button">
              <CalendarClock aria-hidden="true" size={16} /> Agendar visita ou entrevista
            </button>
          ) : null}
          {canDecide ? (
            <button className="admin-button is-primary" onClick={() => onMode('aprovar')} type="button">
              <Check aria-hidden="true" size={16} /> Aprovar
            </button>
          ) : null}
        </div>
      ) : null)}
    </div>
  );
}

/*
 * ============================================================================
 * RESUMO DO ARQUIVO
 * ============================================================================
 *
 * COMO O FLUXO FUNCIONA:
 *   1. A janela abre com o id do pedido e o carrega da API (ListState enquanto isso).
 *   2. O corpo mostra resumo, adotante (contatos mascarados), animal, agenda e histórico.
 *   3. Com permissão, "Mostrar contatos completos" chama reveal (ação auditada).
 *   4. Os botões abrem painéis (mode): agendar, remarcar, cancelar, aprovar ou recusar.
 *      Cada painel usa usePanelSubmit; em sucesso, finish atualiza o pedido, fecha o painel,
 *      mostra o aviso (inclusive se o e-mail falhou) e avisa a lista.
 *   5. Pedidos já decididos mostram apenas a mensagem de encerramento.
 *
 * CONCEITOS IMPORTANTES PARA ESTUDAR:
 *   - Interfaces com "modos" (máquina de estados simples com mode.type).
 *   - Hooks personalizados internos (usePanelSubmit) para reaproveitar lógica de envio.
 *   - Elevação de estado: o pai define as ações e passa para os filhos via props.
 *   - Controle de acesso por permissões na interface.
 *   - LGPD: mascaramento e revelação auditada de dados pessoais.
 *   - Datas: datetime-local, fuso horário e formatação.
 *   - Diretivas do ESLint em JSX ({/* eslint-disable-next-line ... *\/}).
 *   - Formulários com textarea, rádios, checkboxes, minLength/required.
 * ============================================================================
 */
