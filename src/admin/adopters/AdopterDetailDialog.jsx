// O quê: ficha do adotante no painel: dados, histórico (pedidos, doações, histórias), edição e ações LGPD.
// Como: contatos chegam mascarados; "Mostrar contatos" revela (auditado) e libera a edição de e-mail,
//       telefone e endereço. Ações LGPD exigem digitar a palavra de confirmação.
// Para quê: atender o adotante e os pedidos do titular (acesso, anonimização, exclusão) dentro da lei.
import { useEffect, useState } from 'react';
import { Download, Eye, Pencil } from 'lucide-react';
import { anonymizeAdopter, deleteAdopter, exportAdopterData, getAdopter, revealAdopter, updateAdopter } from './adopterService';
import {
  adopterStatusMap,
  adoptionStatusMap,
  donationStatusMap,
  formatCurrency,
  formatDate,
  statusOf,
} from '../constants/statusLabels';
import AdminDialog from '../shared/AdminDialog';
import FormError from '../shared/FormError';
import ListState from '../shared/ListState';
import { downloadFile } from '../shared/downloadFile';
import { errorMessage } from '../shared/usePaginatedList';

const LGPD_ACTIONS = {
  anonimizar: {
    word: 'ANONIMIZAR',
    title: 'Anonimizar titular',
    text: 'Nome e contatos são trocados por dados anônimos. Pedidos e doações continuam nas estatísticas, sem identificar a pessoa. Não dá para desfazer.',
  },
  excluir: {
    word: 'EXCLUIR',
    title: 'Excluir titular',
    text: 'Apaga o cadastro e os pedidos de adoção da pessoa. Doações ficam sem vínculo. Não dá para desfazer.',
  },
};

function EditForm({ adopter, contacts, onCancel, onSave }) {
  const [form, setForm] = useState({
    nome: adopter.nome,
    cidade: adopter.cidade || '',
    estado: adopter.estado || '',
    status: adopter.status,
    email: contacts?.email || '',
    telefone: contacts?.telefone || '',
    endereco: contacts?.endereco || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: name === 'estado' ? value.toUpperCase() : value }));
  }

  // Só vão para a API os campos que mudaram (contatos só se foram revelados).
  async function handleSubmit(event) {
    event.preventDefault();
    const original = { ...adopter, ...(contacts || {}) };
    const fields = ['nome', 'cidade', 'estado', 'status', ...(contacts ? ['email', 'telefone', 'endereco'] : [])];
    const changes = Object.fromEntries(fields
      .map((field) => [field, typeof form[field] === 'string' ? form[field].trim() : form[field]])
      .filter(([field, value]) => (value || null) !== (original[field] || null))
      .map(([field, value]) => [field, value || null]));
    if (Object.keys(changes).length === 0) {
      onCancel();
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave(changes);
    } catch (saveError) {
      setError(saveError);
      setSaving(false);
    }
  }

  return (
    <form aria-labelledby="adopter-edit-title" className="admin-action-panel" onSubmit={handleSubmit}>
      <h3 id="adopter-edit-title">Editar cadastro</h3>
      <div className="admin-form-grid">
        <label className="is-wide">
          Nome <span aria-hidden="true" className="admin-required">*</span>
          <input autoFocus maxLength="150" minLength="2" name="nome" onChange={handleChange} required value={form.nome} />
        </label>
        <label>
          Cidade
          <input maxLength="100" name="cidade" onChange={handleChange} value={form.cidade} />
        </label>
        <label>
          UF
          <input maxLength="2" name="estado" onChange={handleChange} pattern="[A-Z]{2}" value={form.estado} />
        </label>
        <label>
          Situação
          <select name="status" onChange={handleChange} value={form.status}>
            {Object.entries(adopterStatusMap).map(([value, status]) => <option key={value} value={value}>{status.label}</option>)}
          </select>
        </label>
        {contacts ? (
          <>
            <label>
              E-mail
              <input maxLength="150" name="email" onChange={handleChange} required type="email" value={form.email} />
            </label>
            <label>
              Telefone
              <input maxLength="20" name="telefone" onChange={handleChange} type="tel" value={form.telefone} />
            </label>
            <label className="is-wide">
              Endereço
              <input maxLength="500" name="endereco" onChange={handleChange} value={form.endereco} />
            </label>
          </>
        ) : (
          <small className="admin-field-hint is-wide">Para editar e-mail, telefone e endereço, use antes "Mostrar contatos".</small>
        )}
      </div>
      <FormError error={error} fallback="Não foi possível salvar o cadastro." />
      <div className="admin-dialog-actions">
        <button className="admin-button" onClick={onCancel} type="button">Voltar</button>
        <button className="admin-button is-primary" disabled={saving} type="submit">{saving ? 'Salvando...' : 'Salvar'}</button>
      </div>
    </form>
  );
}

function LgpdPanel({ action, onCancel, onConfirm }) {
  const config = LGPD_ACTIONS[action];
  const [typed, setTyped] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await onConfirm();
    } catch (actionError) {
      setError(actionError);
      setSaving(false);
    }
  }

  return (
    <form aria-labelledby="adopter-lgpd-title" className="admin-action-panel" onSubmit={handleSubmit}>
      <h3 id="adopter-lgpd-title">{config.title}</h3>
      <p>{config.text}</p>
      <label className="admin-field">
        Digite {config.word} para confirmar
        <input autoComplete="off" autoFocus onChange={(event) => setTyped(event.target.value)} value={typed} />
      </label>
      <FormError error={error} fallback="Não foi possível concluir a ação." />
      <div className="admin-dialog-actions">
        <button className="admin-button" onClick={onCancel} type="button">Voltar</button>
        <button className="admin-button is-danger" disabled={saving || typed !== config.word} type="submit">
          {saving ? 'Processando...' : config.title}
        </button>
      </div>
    </form>
  );
}

export default function AdopterDetailDialog({ adopterId, user, onClose, onChanged }) {
  const [adopter, setAdopter] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [contacts, setContacts] = useState(null);
  const [mode, setMode] = useState('view');
  const [notice, setNotice] = useState(null);
  const permissions = user?.permissions || [];
  const canReveal = permissions.includes('adopters:reveal');
  const canUpdate = permissions.includes('adopters:update');
  const canLgpd = permissions.includes('lgpd:approve');

  useEffect(() => {
    let active = true;
    setLoadError('');
    getAdopter(adopterId)
      .then((data) => {
        if (active) setAdopter(data);
      })
      .catch((error) => {
        if (active) setLoadError(errorMessage(error, 'Não foi possível carregar o adotante.'));
      });
    return () => {
      active = false;
    };
  }, [adopterId, reloadKey]);

  async function act(action, successText) {
    setNotice(null);
    try {
      await action();
      if (successText) setNotice({ variant: 'success', text: successText });
    } catch (error) {
      setNotice({ variant: 'error', text: errorMessage(error, 'Não foi possível concluir a ação.') });
    }
  }

  async function save(changes) {
    await updateAdopter(adopterId, changes);
    if (contacts) setContacts((current) => ({ ...current, ...Object.fromEntries(['email', 'telefone', 'endereco'].filter((f) => f in changes).map((f) => [f, changes[f]])) }));
    setMode('view');
    setNotice({ variant: 'success', text: 'Cadastro atualizado.' });
    setReloadKey((key) => key + 1);
    onChanged?.();
  }

  async function runLgpd(action) {
    if (action === 'anonimizar') {
      await anonymizeAdopter(adopterId);
      setContacts(null);
      setMode('view');
      setNotice({ variant: 'success', text: 'Titular anonimizado.' });
      setReloadKey((key) => key + 1);
      onChanged?.();
    } else {
      await deleteAdopter(adopterId);
      onChanged?.();
      onClose();
    }
  }

  if (!adopter) {
    return (
      <AdminDialog eyebrow="Adotantes" id="adopter-detail" onClose={onClose} title="Adotante" wide>
        <ListState error={loadError} loading={!loadError} onRetry={() => setReloadKey((key) => key + 1)} />
      </AdminDialog>
    );
  }

  const status = statusOf(adopterStatusMap, adopter.status);
  const { pedidos = [], doacoes = [], historias = [] } = adopter.historico || {};

  return (
    <AdminDialog eyebrow="Adotantes" id="adopter-detail" onClose={onClose} title={adopter.nome} wide>
      <div className="admin-detail">
        <div className="admin-detail-meta">
          <span className={`admin-badge is-${status.variant}`}>{status.label}</span>
          <span>Cadastro em {formatDate(adopter.criado_em)}</span>
          <span>{[adopter.cidade, adopter.estado].filter(Boolean).join(' / ') || 'Cidade não informada'}</span>
        </div>

        <section aria-labelledby="adopter-contacts" className="admin-detail-section admin-detail-wide">
          <h3 id="adopter-contacts">Contatos</h3>
          <dl className="admin-detail-list">
            <div><dt>E-mail</dt><dd>{contacts?.email || adopter.email || 'Não informado'}</dd></div>
            <div><dt>Telefone</dt><dd>{contacts?.telefone || adopter.telefone || 'Não informado'}</dd></div>
            <div><dt>Endereço</dt><dd>{contacts ? contacts.endereco || 'Não informado' : adopter.possui_endereco ? 'Cadastrado (oculto)' : 'Não informado'}</dd></div>
          </dl>
          <div className="admin-row-actions">
            {canReveal && !contacts ? (
              <button className="admin-button is-small" onClick={() => act(async () => setContacts(await revealAdopter(adopterId)))} type="button">
                <Eye aria-hidden="true" size={15} /> Mostrar contatos
              </button>
            ) : null}
            {canUpdate && mode === 'view' ? (
              <button className="admin-button is-small" onClick={() => setMode('editar')} type="button">
                <Pencil aria-hidden="true" size={15} /> Editar cadastro
              </button>
            ) : null}
          </div>
          {contacts ? <small className="admin-field-hint">Contatos completos visíveis. O acesso fica registrado na auditoria.</small> : null}
        </section>

        <section aria-labelledby="adopter-history" className="admin-detail-section admin-detail-wide">
          <h3 id="adopter-history">Pedidos de adoção ({pedidos.length})</h3>
          {pedidos.length === 0 ? <p className="admin-detail-closed">Nenhum pedido.</p> : (
            <ul className="admin-appointments">
              {pedidos.map((pedido) => {
                const pedidoStatus = statusOf(adoptionStatusMap, pedido.status);
                return (
                  <li key={pedido.id}>
                    <div><strong>{pedido.animal_nome}</strong><small>Pedido de {formatDate(pedido.data_pedido)}</small></div>
                    <span className={`admin-badge is-${pedidoStatus.variant}`}>{pedidoStatus.label}</span>
                  </li>
                );
              })}
            </ul>
          )}
          {doacoes.length > 0 ? (
            <>
              <h3>Doações ({doacoes.length})</h3>
              <ul className="admin-appointments">
                {doacoes.map((doacao) => {
                  const doacaoStatus = statusOf(donationStatusMap, doacao.status);
                  return (
                    <li key={doacao.id}>
                      <div><strong>{formatCurrency(doacao.valor)}</strong><small>{formatDate(doacao.data)}</small></div>
                      <span className={`admin-badge is-${doacaoStatus.variant}`}>{doacaoStatus.label}</span>
                    </li>
                  );
                })}
              </ul>
            </>
          ) : null}
          {historias.length > 0 ? <p className="admin-field-hint">Histórias enviadas: {historias.length}</p> : null}
        </section>

        {notice ? <p className={`admin-alert is-${notice.variant}`} role={notice.variant === 'error' ? 'alert' : 'status'}>{notice.text}</p> : null}

        {mode === 'editar' ? <EditForm adopter={adopter} contacts={contacts} onCancel={() => setMode('view')} onSave={save} /> : null}
        {mode in LGPD_ACTIONS ? <LgpdPanel action={mode} onCancel={() => setMode('view')} onConfirm={() => runLgpd(mode)} /> : null}

        {canLgpd && mode === 'view' ? (
          <section aria-labelledby="adopter-lgpd" className="admin-detail-section admin-detail-wide">
            <h3 id="adopter-lgpd">Privacidade (LGPD)</h3>
            <p className="admin-field-hint">Pedidos do titular: cópia dos dados, anonimização ou exclusão. Pedidos de adoção em andamento precisam ser encerrados antes.</p>
            <div className="admin-row-actions">
              <button
                className="admin-button is-small"
                onClick={() => act(async () => downloadFile(JSON.stringify(await exportAdopterData(adopterId), null, 2), `titular-${adopterId}.json`, 'application/json'), 'Arquivo com os dados do titular baixado.')}
                type="button"
              >
                <Download aria-hidden="true" size={15} /> Exportar dados do titular
              </button>
              <button className="admin-button is-small is-danger" onClick={() => setMode('anonimizar')} type="button">Anonimizar</button>
              <button className="admin-button is-small is-danger" onClick={() => setMode('excluir')} type="button">Excluir</button>
            </div>
          </section>
        ) : null}
      </div>
    </AdminDialog>
  );
}
