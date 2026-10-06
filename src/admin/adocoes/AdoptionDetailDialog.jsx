import { useEffect, useState } from 'react';
import { CalendarClock, Check, Eye, X } from 'lucide-react';
import {
  approveAdoptionRequest,
  getAdoptionRequest,
  rejectAdoptionRequest,
  revealAdoptionRequest,
  scheduleAdoptionRequest,
} from './adoptionService';
import { animalSpecies, animalStatusMap } from '../constants/animalOptions';
import { adoptionStatusMap, formatDate, priorityMap, statusOf } from '../constants/statusLabels';
import AdminDialog from '../shared/AdminDialog';
import FormError from '../shared/FormError';
import ListState from '../shared/ListState';
import { errorMessage } from '../shared/usePaginatedList';

const OPEN_STATUSES = ['novo', 'em_analise', 'visita_agendada'];
const APPOINTMENT_TYPES = {
  visita: { label: 'Visita', hint: 'O pedido passa para "Visita agendada".', placeLabel: 'Endereço da visita' },
  entrevista: { label: 'Entrevista', hint: 'Pedidos novos passam para "Em análise".', placeLabel: 'Local ou link da chamada' },
};

function protocolOf(id) {
  return `PAC-${String(id).slice(0, 8).toUpperCase()}`;
}

// Valor de <input type="datetime-local"> no fuso do navegador (AAAA-MM-DDTHH:mm).
function localDateTimeValue(date) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

function DecisionPanel({ kind, animalName, onCancel, onConfirm }) {
  const [justificativa, setJustificativa] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const approving = kind === 'aprovar';

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await onConfirm(justificativa.trim());
    } catch (submitError) {
      setError(submitError);
      setSaving(false);
    }
  }

  return (
    <form aria-labelledby="adoption-decision-title" className="admin-action-panel" onSubmit={handleSubmit}>
      <h3 id="adoption-decision-title">{approving ? 'Aprovar adoção' : 'Recusar pedido'}</h3>
      <p>
        {approving
          ? `${animalName} será marcado como adotado e os outros pedidos abertos para ele serão recusados automaticamente.`
          : 'O pedido será encerrado como reprovado. Sem outros pedidos abertos, o animal volta a ficar disponível.'}
      </p>
      <label className="admin-field">
        Justificativa <span aria-hidden="true" className="admin-required">*</span>
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
      <small className="admin-field-hint" id="adoption-decision-hint">Mínimo de 10 caracteres. Fica registrada no histórico do pedido.</small>
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

function SchedulePanel({ adopterName, onCancel, onConfirm }) {
  const [form, setForm] = useState({ tipo: 'visita', data_hora: '', local: '', mensagem: '', enviar_email: true });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const type = APPOINTMENT_TYPES[form.tipo];

  function handleChange(event) {
    const { name, value, type: inputType, checked } = event.target;
    setForm((current) => ({ ...current, [name]: inputType === 'checkbox' ? checked : value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await onConfirm({ ...form, local: form.local.trim(), mensagem: form.mensagem.trim() });
    } catch (submitError) {
      setError(submitError);
      setSaving(false);
    }
  }

  return (
    <form aria-labelledby="adoption-schedule-title" className="admin-action-panel" onSubmit={handleSubmit}>
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
        <small className="admin-field-hint">{type.hint}</small>
      </fieldset>
      <div className="admin-form-grid">
        <label>
          Data e horário <span aria-hidden="true" className="admin-required">*</span>
          <input min={localDateTimeValue(new Date())} name="data_hora" onChange={handleChange} required type="datetime-local" value={form.data_hora} />
        </label>
        <label>
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

export default function AdoptionDetailDialog({ requestId, user, onClose, onChanged }) {
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [contacts, setContacts] = useState(null);
  const [revealing, setRevealing] = useState(false);
  const [revealError, setRevealError] = useState(null);
  const [mode, setMode] = useState('view');
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

  function openMode(nextMode) {
    setNotice(null);
    setMode(nextMode);
  }

  // Depois de uma ação: mostra o pedido atualizado, avisa a lista e volta para a visualização.
  function finish(updated, nextNotice) {
    setRequest(updated);
    setContacts((current) => current && { ...current, observacoes: null });
    setMode('view');
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

  async function reject(justificativa) {
    finish(await rejectAdoptionRequest(requestId, justificativa), { variant: 'success', text: 'Pedido recusado.' });
  }

  async function approve(justificativa) {
    finish(await approveAdoptionRequest(requestId, justificativa), {
      variant: 'success',
      text: 'Adoção aprovada. Quando o termo for assinado, registre no pedido.',
    });
  }

  async function schedule(payload) {
    const { pedido, email } = await scheduleAdoptionRequest(requestId, payload);
    const done = `${APPOINTMENT_TYPES[payload.tipo].label} agendada`;
    if (!email) finish(pedido, { variant: 'success', text: `${done}.` });
    else if (email.enviado) finish(pedido, { variant: 'success', text: `${done}. E-mail enviado para ${email.para}.` });
    else finish(pedido, { variant: 'warning', text: `${done}, mas o e-mail não foi enviado. ${email.motivo}` });
  }

  const title = request ? `${request.adotante.nome} quer adotar ${request.animal.nome}` : 'Pedido de adoção';

  return (
    <AdminDialog eyebrow={`Pedido de adoção · ${protocolOf(requestId)}`} id="adoption-detail" onClose={onClose} title={title} wide>
      {!request ? (
        <ListState error={loadError} loading={loading} onRetry={() => setReloadKey((key) => key + 1)} />
      ) : (
        <AdoptionDetailBody
          canDecide={canDecide}
          canReveal={canReveal}
          canSchedule={canSchedule}
          contacts={contacts}
          mode={mode}
          notice={notice}
          onApprove={approve}
          onMode={openMode}
          onReject={reject}
          onReveal={reveal}
          onSchedule={schedule}
          request={request}
          revealError={revealError}
          revealing={revealing}
        />
      )}
    </AdminDialog>
  );
}

function AdoptionDetailBody({
  request, contacts, mode, notice, revealing, revealError,
  canDecide, canSchedule, canReveal, onMode, onReveal, onReject, onApprove, onSchedule,
}) {
  const status = statusOf(adoptionStatusMap, request.status);
  const priority = statusOf(priorityMap, request.prioridade);
  const animalStatus = statusOf(animalStatusMap, request.animal.status);
  const species = animalSpecies.find((option) => option.value === request.animal.especie)?.label || request.animal.especie;
  const isOpen = OPEN_STATUSES.includes(request.status);
  const history = contacts?.observacoes ?? request.observacoes;

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

      <section aria-labelledby="adoption-detail-history" className="admin-detail-section">
        <h3 id="adoption-detail-history">Respostas do formulário e histórico</h3>
        {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- área rolável precisa receber foco pelo teclado */}
        <div aria-labelledby="adoption-detail-history" className="admin-history" role="region" tabIndex={0}>
          {history || 'Sem respostas ou anotações registradas.'}
        </div>
      </section>

      {notice ? <p className={`admin-alert is-${notice.variant}`} role="status">{notice.text}</p> : null}

      {!isOpen ? (
        <p className="admin-detail-closed">Este pedido já foi decidido ({status.label.toLowerCase()}).</p>
      ) : mode === 'agendar' ? (
        <SchedulePanel adopterName={request.adotante.nome.split(' ')[0]} onCancel={() => onMode('view')} onConfirm={onSchedule} />
      ) : mode === 'recusar' || mode === 'aprovar' ? (
        <DecisionPanel
          animalName={request.animal.nome}
          kind={mode}
          onCancel={() => onMode('view')}
          onConfirm={mode === 'aprovar' ? onApprove : onReject}
        />
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
      ) : null}
    </div>
  );
}
