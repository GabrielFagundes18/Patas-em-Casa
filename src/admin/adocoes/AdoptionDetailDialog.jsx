// O quê: detalhe do pedido de adoção no painel (dados, histórico, agenda e decisões).
// Como: carrega o pedido completo da API; cada ação abre um painel no próprio diálogo e, ao concluir,
//       atualiza o pedido e avisa a lista (onChanged).
// Para quê: triagem completa num só lugar: revelar contatos (auditado), agendar/remarcar/cancelar visita
//           ou entrevista com aviso por e-mail, aprovar ou recusar avisando o adotante.
import { useEffect, useState } from 'react';
import { CalendarCheck, CalendarClock, Check, Eye, X } from 'lucide-react';
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
import { animalSpecies, animalStatusMap } from '../constants/animalOptions';
import {
  adoptionStatusMap,
  appointmentStatusMap,
  appointmentTypeLabels,
  formatDate,
  formatDateTime,
  priorityMap,
  statusOf,
} from '../constants/statusLabels';
import AdminDialog from '../shared/AdminDialog';
import FormError from '../shared/FormError';
import ListState from '../shared/ListState';
import { errorMessage } from '../shared/usePaginatedList';

const OPEN_STATUSES = ['novo', 'em_analise', 'visita_agendada'];
const APPOINTMENT_TYPES = {
  visita: { label: 'Visita', hint: 'O pedido passa para "Visita agendada".', placeLabel: 'Endereço da visita' },
  entrevista: { label: 'Entrevista', hint: 'Pedidos novos passam para "Em análise".', placeLabel: 'Local ou link da chamada' },
};
const DURATIONS = [30, 45, 60, 90, 120];

function protocolOf(id) {
  return `PAC-${String(id).slice(0, 8).toUpperCase()}`;
}

// Valor de <input type="datetime-local"> no fuso do navegador (AAAA-MM-DDTHH:mm).
function localDateTimeValue(date) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

// Texto do aviso depois de uma ação que pode mandar e-mail ao adotante.
function emailNotice(done, email) {
  if (!email) return { variant: 'success', text: `${done}.` };
  if (email.enviado) return { variant: 'success', text: `${done}. E-mail enviado para ${email.para}.` };
  return { variant: 'warning', text: `${done}, mas o e-mail não foi enviado. ${email.motivo}` };
}

function DurationField({ value, onChange }) {
  return (
    <label>
      Duração
      <select name="duracao_minutos" onChange={(event) => onChange(Number(event.target.value))} value={value}>
        {DURATIONS.map((minutes) => <option key={minutes} value={minutes}>{minutes < 60 ? `${minutes} min` : `${minutes / 60} h`.replace('.5', ',5')}</option>)}
      </select>
    </label>
  );
}

function usePanelSubmit(onConfirm) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  async function submit(payload) {
    setSaving(true);
    setError(null);
    try {
      await onConfirm(payload);
    } catch (submitError) {
      setError(submitError);
      setSaving(false);
    }
  }

  return { saving, error, submit };
}

function DecisionPanel({ kind, animalName, adopterName, onCancel, onConfirm }) {
  const [justificativa, setJustificativa] = useState('');
  const [notify, setNotify] = useState(true);
  const [message, setMessage] = useState('');
  const { saving, error, submit } = usePanelSubmit(onConfirm);
  const approving = kind === 'aprovar';

  return (
    <form
      aria-labelledby="adoption-decision-title"
      className="admin-action-panel"
      onSubmit={(event) => {
        event.preventDefault();
        submit({ justificativa: justificativa.trim(), notificar_adotante: notify, mensagem_adotante: notify ? message.trim() : '' });
      }}
    >
      <h3 id="adoption-decision-title">{approving ? 'Aprovar adoção' : 'Recusar pedido'}</h3>
      <p>
        {approving
          ? `${animalName} será marcado como adotado e os outros pedidos abertos para ele serão recusados automaticamente.`
          : 'O pedido será encerrado como reprovado e os agendamentos em aberto, cancelados. Sem outros pedidos abertos, o animal volta a ficar disponível.'}
      </p>
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
      <div className="admin-checks">
        <label>
          <input checked={notify} onChange={(event) => setNotify(event.target.checked)} type="checkbox" />
          Avisar {adopterName} por e-mail
        </label>
      </div>
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
      <div className="admin-dialog-actions">
        <button className="admin-button" onClick={onCancel} type="button">Voltar</button>
        <button className={`admin-button ${approving ? 'is-primary' : 'is-danger'}`} disabled={saving} type="submit">
          {saving ? 'Salvando...' : approving ? 'Confirmar aprovação' : 'Confirmar recusa'}
        </button>
      </div>
    </form>
  );
}

function SchedulePanel({ adopterName, preferred, onCancel, onConfirm }) {
  const now = localDateTimeValue(new Date());
  const [form, setForm] = useState({
    tipo: 'visita',
    data_hora: preferred && preferred > now ? preferred : '',
    duracao_minutos: 60,
    local: '',
    mensagem: '',
    enviar_email: true,
  });
  const { saving, error, submit } = usePanelSubmit(onConfirm);
  const type = APPOINTMENT_TYPES[form.tipo];

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
        <label>
          Data e horário <span aria-hidden="true" className="admin-required">*</span>
          <input min={now} name="data_hora" onChange={handleChange} required type="datetime-local" value={form.data_hora} />
        </label>
        <DurationField onChange={(duracao) => setForm((current) => ({ ...current, duracao_minutos: duracao }))} value={form.duracao_minutos} />
        <label className="is-wide">
          {type.placeLabel}
          <input maxLength="300" name="local" onChange={handleChange} value={form.local} />
        </label>
        <label className="is-wide">
          Mensagem para o adotante
          <textarea maxLength="1000" name="mensagem" onChange={handleChange} placeholder="Ex.: leve um documento com foto." rows="3" value={form.mensagem} />
        </label>
      </div>
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

function ReschedulePanel({ appointment, adopterName, onCancel, onConfirm }) {
  const [form, setForm] = useState({
    data_hora: appointment.data_hora,
    duracao_minutos: appointment.duracao_minutos,
    local: appointment.local || '',
    mensagem: appointment.mensagem || '',
    enviar_email: true,
  });
  const { saving, error, submit } = usePanelSubmit(onConfirm);
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

function CancelAppointmentPanel({ appointment, adopterName, onCancel, onConfirm }) {
  const [motivo, setMotivo] = useState('');
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

export default function AdoptionDetailDialog({ requestId, user, onClose, onChanged }) {
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [contacts, setContacts] = useState(null);
  const [revealing, setRevealing] = useState(false);
  const [revealError, setRevealError] = useState(null);
  const [mode, setMode] = useState({ type: 'view' });
  const [notice, setNotice] = useState(null);

  const permissions = user?.permissions || [];
  const canDecide = permissions.includes('adoptions:approve');
  const canSchedule = permissions.includes('adoptions:update');
  const canReveal = permissions.includes('adopters:reveal');

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

  function openMode(type, appointment) {
    setNotice(null);
    setMode({ type, appointment });
  }

  // Depois de uma ação: mostra o pedido atualizado, avisa a lista e volta para a visualização.
  function finish(updated, nextNotice) {
    setRequest(updated);
    setContacts((current) => current && { ...current, observacoes: null });
    setMode({ type: 'view' });
    setNotice(nextNotice);
    onChanged?.();
  }

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

  async function reject(decision) {
    const updated = await rejectAdoptionRequest(requestId, decision);
    finish(updated, emailNotice('Pedido recusado', updated.email));
  }

  async function approve(decision) {
    const updated = await approveAdoptionRequest(requestId, decision);
    finish(updated, emailNotice('Adoção aprovada. Quando o termo for assinado, registre no pedido', updated.email));
  }

  async function schedule(payload) {
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

  async function complete(appointment) {
    setNotice(null);
    try {
      const { pedido } = await completeAppointment(requestId, appointment.id);
      finish(pedido, { variant: 'success', text: `${appointmentTypeLabels[appointment.tipo]} marcada como realizada.` });
    } catch (requestError) {
      setNotice({ variant: 'error', text: errorMessage(requestError, 'Não foi possível atualizar o agendamento.') });
    }
  }

  const title = request ? `${request.adotante.nome} quer adotar ${request.animal.nome}` : 'Pedido de adoção';

  return (
    <AdminDialog eyebrow={`Pedido de adoção · ${protocolOf(requestId)}`} id="adoption-detail" onClose={onClose} title={title} wide>
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

function AppointmentsSection({ request, canSchedule, onMode, onComplete }) {
  const appointments = request.agendamentos || [];
  const isOpen = OPEN_STATUSES.includes(request.status);

  return (
    <section aria-labelledby="adoption-detail-agenda" className="admin-detail-section admin-detail-wide">
      <h3 id="adoption-detail-agenda">Agenda</h3>
      {request.visita_preferida_em ? (
        <p className="admin-field-hint">Sugestão do adotante para a visita: {formatDateTime(`${request.visita_preferida_em}:00-03:00`)}</p>
      ) : null}
      {appointments.length === 0 ? (
        <p className="admin-detail-closed">Nenhuma visita ou entrevista marcada.</p>
      ) : (
        <ul className="admin-appointments">
          {appointments.map((appointment) => {
            const status = statusOf(appointmentStatusMap, appointment.status);
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

function AdoptionDetailBody({
  request, contacts, mode, notice, revealing, revealError,
  canDecide, canSchedule, canReveal, onMode, onReveal, actions,
}) {
  const status = statusOf(adoptionStatusMap, request.status);
  const priority = statusOf(priorityMap, request.prioridade);
  const animalStatus = statusOf(animalStatusMap, request.animal.status);
  const species = animalSpecies.find((option) => option.value === request.animal.especie)?.label || request.animal.especie;
  const isOpen = OPEN_STATUSES.includes(request.status);
  const history = contacts?.observacoes ?? request.observacoes;
  const adopterName = request.adotante.nome.split(' ')[0];
  const back = () => onMode('view');

  let panel = null;
  if (mode.type === 'agendar' && isOpen) {
    panel = <SchedulePanel adopterName={adopterName} onCancel={back} onConfirm={actions.onSchedule} preferred={request.visita_preferida_em} />;
  } else if (mode.type === 'remarcar') {
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
      <div className="admin-detail-meta">
        <span className={`admin-badge is-${status.variant}`}>{status.label}</span>
        <span className={`admin-badge is-${priority.variant}`}>Prioridade {priority.label.toLowerCase()}</span>
        <span>Recebido em {formatDate(request.data_pedido)}</span>
        <span>Responsável: {request.responsavel?.nome || 'Sem responsável'}</span>
        {request.status === 'aprovado' ? (
          <span>Termo: {request.termo_assinado ? `assinado em ${formatDate(request.termo_assinado_em)}` : 'pendente'}</span>
        ) : null}
      </div>

      <div className="admin-detail-grid">
        <section aria-labelledby="adoption-detail-adopter" className="admin-detail-section">
          <h3 id="adoption-detail-adopter">Adotante</h3>
          <dl className="admin-detail-list">
            <div><dt>Nome</dt><dd>{request.adotante.nome}</dd></div>
            <div><dt>Cidade</dt><dd>{[request.adotante.cidade, request.adotante.estado].filter(Boolean).join(' / ') || 'Não informada'}</dd></div>
            <div><dt>E-mail</dt><dd>{contacts?.email || request.adotante.email || 'Não informado'}</dd></div>
            <div><dt>Telefone</dt><dd>{contacts?.telefone || request.adotante.telefone || 'Não informado'}</dd></div>
          </dl>
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
            {request.animal.foto_url ? <img alt="" className="admin-detail-photo" src={request.animal.foto_url} /> : null}
            <dl className="admin-detail-list">
              <div><dt>Nome</dt><dd>{request.animal.nome}</dd></div>
              <div><dt>Espécie</dt><dd>{species}</dd></div>
              <div><dt>Situação</dt><dd><span className={`admin-badge is-${animalStatus.variant}`}>{animalStatus.label}</span></dd></div>
            </dl>
          </div>
        </section>
      </div>

      <AppointmentsSection canSchedule={canSchedule} onComplete={actions.onComplete} onMode={onMode} request={request} />

      <section aria-labelledby="adoption-detail-history" className="admin-detail-section">
        <h3 id="adoption-detail-history">Respostas do formulário e histórico</h3>
        {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- área rolável precisa receber foco pelo teclado */}
        <div aria-labelledby="adoption-detail-history" className="admin-history" role="region" tabIndex={0}>
          {history || 'Sem respostas ou anotações registradas.'}
        </div>
      </section>

      {notice ? <p className={`admin-alert is-${notice.variant}`} role={notice.variant === 'error' ? 'alert' : 'status'}>{notice.text}</p> : null}

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
