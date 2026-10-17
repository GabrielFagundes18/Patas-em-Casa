/*
 * ============================================================================
 * ARQUIVO: AdopterDetailDialog.jsx
 * ============================================================================
 *
 * PARA QUE SERVE:
 *   Janela com a FICHA DO ADOTANTE no painel: dados, contatos (mascarados até
 *   serem revelados), histórico de pedidos, doações e histórias, edição do
 *   cadastro e as ações de privacidade da LGPD (exportar dados, anonimizar,
 *   excluir). As ações irreversíveis exigem digitar uma palavra de confirmação.
 *
 * PRINCIPAIS ITENS:
 *   - LGPD_ACTIONS: configuração das ações irreversíveis (palavra, título, texto).
 *   - EditForm: formulário de edição (interno).
 *   - LgpdPanel: painel de confirmação das ações LGPD (interno).
 *   - AdopterDetailDialog({ adopterId, user, onClose, onChanged }): o componente (exportado como padrão).
 *
 * CONEXÕES COM OUTROS ARQUIVOS:
 *   - react (useEffect, useState), lucide-react (ícones).
 *   - ./adopterService → getAdopter, revealAdopter, updateAdopter, exportAdopterData,
 *     anonymizeAdopter, deleteAdopter.
 *   - admin/constants/statusLabels → rótulos e formatadores.
 *   - admin/shared → AdminDialog, FormError, ListState, downloadFile, errorMessage.
 *   - Quem usa: admin/adopters/AdoptersPage.jsx.
 *   - Testado em: ./AdoptersPage.test.js.
 * ============================================================================
 */

// O quê: ficha do adotante no painel: dados, histórico (pedidos, doações, histórias), edição e ações LGPD.
// Como: contatos chegam mascarados; "Mostrar contatos" revela (auditado) e libera a edição de e-mail,
//       telefone e endereço. Ações LGPD exigem digitar a palavra de confirmação.
// Para quê: atender o adotante e os pedidos do titular (acesso, anonimização, exclusão) dentro da lei.
// Hooks do React.
import { useEffect, useState } from 'react';
// Ícones: baixar, olho e lápis.
import { Download, Eye, Pencil } from 'lucide-react';
// Funções da API de adotantes.
import { anonymizeAdopter, deleteAdopter, exportAdopterData, getAdopter, revealAdopter, updateAdopter } from './adopterService';
// Rótulos e formatadores.
import {
  adopterStatusMap,
  adoptionStatusMap,
  donationStatusMap,
  formatCurrency,
  formatDate,
  statusOf,
} from 'admin/constants/statusLabels';
// Compartilhados.
import AdminDialog from 'admin/shared/AdminDialog';
import FormError from 'admin/shared/FormError';
import ListState from 'admin/shared/ListState';
import { downloadFile } from 'admin/shared/downloadFile';
import { errorMessage } from 'admin/shared/usePaginatedList';

// Ações irreversíveis da LGPD: palavra que precisa ser digitada, título e explicação.
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

/*
 * COMPONENTE: EditForm (interno)
 * O que faz: formulário para editar o cadastro; envia só os campos que mudaram.
 * Parâmetros (props):
 *   - adopter (objeto): dados atuais (contatos mascarados).
 *   - contacts (objeto | null): contatos revelados (sem eles, e-mail/telefone/endereço não são editáveis).
 *   - onCancel (função) e onSave (função async que recebe as mudanças).
 */
function EditForm({ adopter, contacts, onCancel, onSave }) {
  // Valores iniciais: dados do adotante e, se revelados, os contatos completos.
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

  // Atualiza o campo; a UF é convertida para maiúsculas.
  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: name === 'estado' ? value.toUpperCase() : value }));
  }

  // Só vão para a API os campos que mudaram (contatos só se foram revelados).
  async function handleSubmit(event) {
    event.preventDefault();
    // Valores originais para comparar (dados + contatos revelados, se houver).
    const original = { ...adopter, ...(contacts || {}) };
    // Campos editáveis (os de contato só entram se revelados).
    const fields = ['nome', 'cidade', 'estado', 'status', ...(contacts ? ['email', 'telefone', 'endereco'] : [])];
    // Monta { campo: valor } só com o que mudou:
    //   1) cria pares [campo, valor] (textos sem espaços nas pontas);
    //   2) mantém só os diferentes do original (tratando vazio e null como iguais);
    //   3) converte vazio em null.
    const changes = Object.fromEntries(fields
      .map((field) => [field, typeof form[field] === 'string' ? form[field].trim() : form[field]])
      .filter(([field, value]) => (value || null) !== (original[field] || null))
      .map(([field, value]) => [field, value || null]));
    // Nada mudou: só fecha o formulário.
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
        {/* UF: pattern="[A-Z]{2}" exige exatamente duas letras maiúsculas. */}
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
        {/* Campos de contato só depois de revelados; senão, uma dica. */}
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

/*
 * COMPONENTE: LgpdPanel (interno)
 * O que faz: pede para digitar a palavra de confirmação antes de anonimizar/excluir.
 * Parâmetros (props): action ('anonimizar' | 'excluir'), onCancel, onConfirm (função async).
 */
function LgpdPanel({ action, onCancel, onConfirm }) {
  // Configuração da ação (palavra, título, texto).
  const config = LGPD_ACTIONS[action];
  // O que a pessoa digitou.
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
      {/* autoComplete="off": o navegador não sugere valores para este campo. */}
      <label className="admin-field">
        Digite {config.word} para confirmar
        <input autoComplete="off" autoFocus onChange={(event) => setTyped(event.target.value)} value={typed} />
      </label>
      <FormError error={error} fallback="Não foi possível concluir a ação." />
      <div className="admin-dialog-actions">
        <button className="admin-button" onClick={onCancel} type="button">Voltar</button>
        {/* O botão só habilita quando a palavra digitada é exatamente a exigida. */}
        <button className="admin-button is-danger" disabled={saving || typed !== config.word} type="submit">
          {saving ? 'Processando...' : config.title}
        </button>
      </div>
    </form>
  );
}

/*
 * COMPONENTE: AdopterDetailDialog
 * O que faz: carrega a ficha e coordena revelar, editar e as ações LGPD.
 * Parâmetros (props):
 *   - adopterId (string), user (objeto com permissões),
 *   - onClose (fecha a janela), onChanged (avisa a lista para recarregar).
 * Retorno: JSX da janela.
 * Onde é usado: AdoptersPage.jsx.
 */
export default function AdopterDetailDialog({ adopterId, user, onClose, onChanged }) {
  // Ficha carregada (null enquanto carrega).
  const [adopter, setAdopter] = useState(null);
  // Erro de carga e contador para recarregar.
  const [loadError, setLoadError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  // Contatos revelados (null = mascarados).
  const [contacts, setContacts] = useState(null);
  // Modo: 'view', 'editar', 'anonimizar' ou 'excluir'.
  const [mode, setMode] = useState('view');
  // Aviso após uma ação.
  const [notice, setNotice] = useState(null);
  // Permissões.
  const permissions = user?.permissions || [];
  const canReveal = permissions.includes('adopters:reveal');
  const canUpdate = permissions.includes('adopters:update');
  const canLgpd = permissions.includes('lgpd:approve');

  // Carrega a ficha (ao abrir e ao recarregar).
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

  /*
   * FUNÇÃO INTERNA: act
   * O que faz: executa uma ação simples e mostra aviso de sucesso (opcional) ou erro.
   * Parâmetros: action (função async) e successText (string | undefined).
   */
  async function act(action, successText) {
    setNotice(null);
    try {
      await action();
      if (successText) setNotice({ variant: 'success', text: successText });
    } catch (error) {
      setNotice({ variant: 'error', text: errorMessage(error, 'Não foi possível concluir a ação.') });
    }
  }

  /*
   * FUNÇÃO INTERNA: save
   * O que faz: salva as mudanças do EditForm, atualiza os contatos revelados e recarrega a ficha.
   * Parâmetros: changes (objeto só com os campos alterados).
   */
  async function save(changes) {
    await updateAdopter(adopterId, changes);
    // Se os contatos estão revelados, aplica as mudanças de contato que vieram em "changes":
    // filtra os 3 campos de contato presentes ("f in changes") e mescla com os atuais.
    if (contacts) setContacts((current) => ({ ...current, ...Object.fromEntries(['email', 'telefone', 'endereco'].filter((f) => f in changes).map((f) => [f, changes[f]])) }));
    setMode('view');
    setNotice({ variant: 'success', text: 'Cadastro atualizado.' });
    setReloadKey((key) => key + 1);
    onChanged?.();
  }

  /*
   * FUNÇÃO INTERNA: runLgpd
   * O que faz: executa a ação LGPD confirmada.
   *   - anonimizar: limpa os contatos revelados, recarrega e avisa;
   *   - excluir: avisa a lista e fecha a janela (o cadastro deixou de existir).
   */
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

  // Ainda sem ficha: janela com carregando/erro. "loading={!loadError}" = carregando enquanto não houver erro.
  if (!adopter) {
    return (
      <AdminDialog eyebrow="Adotantes" id="adopter-detail" onClose={onClose} title="Adotante" wide>
        <ListState error={loadError} loading={!loadError} onRetry={() => setReloadKey((key) => key + 1)} />
      </AdminDialog>
    );
  }

  // Rótulo/cor da situação.
  const status = statusOf(adopterStatusMap, adopter.status);
  // Histórico com valores padrão: "|| {}" se não houver histórico; "= []" se faltar alguma lista.
  const { pedidos = [], doacoes = [], historias = [] } = adopter.historico || {};

  return (
    <AdminDialog eyebrow="Adotantes" id="adopter-detail" onClose={onClose} title={adopter.nome} wide>
      <div className="admin-detail">
        {/* Resumo. */}
        <div className="admin-detail-meta">
          <span className={`admin-badge is-${status.variant}`}>{status.label}</span>
          <span>Cadastro em {formatDate(adopter.criado_em)}</span>
          <span>{[adopter.cidade, adopter.estado].filter(Boolean).join(' / ') || 'Cidade não informada'}</span>
        </div>

        {/* Contatos (mascarados ou revelados). */}
        <section aria-labelledby="adopter-contacts" className="admin-detail-section admin-detail-wide">
          <h3 id="adopter-contacts">Contatos</h3>
          <dl className="admin-detail-list">
            <div><dt>E-mail</dt><dd>{contacts?.email || adopter.email || 'Não informado'}</dd></div>
            <div><dt>Telefone</dt><dd>{contacts?.telefone || adopter.telefone || 'Não informado'}</dd></div>
            {/* Endereço: revelado → mostra; mascarado → só diz se existe ("Cadastrado (oculto)"). */}
            <div><dt>Endereço</dt><dd>{contacts ? contacts.endereco || 'Não informado' : adopter.possui_endereco ? 'Cadastrado (oculto)' : 'Não informado'}</dd></div>
          </dl>
          <div className="admin-row-actions">
            {/* Revelar contatos: chama a API e guarda o resultado em "contacts". */}
            {canReveal && !contacts ? (
              <button className="admin-button is-small" onClick={() => act(async () => setContacts(await revealAdopter(adopterId)))} type="button">
                <Eye aria-hidden="true" size={15} /> Mostrar contatos
              </button>
            ) : null}
            {/* Editar (com permissão e sem outro painel aberto). */}
            {canUpdate && mode === 'view' ? (
              <button className="admin-button is-small" onClick={() => setMode('editar')} type="button">
                <Pencil aria-hidden="true" size={15} /> Editar cadastro
              </button>
            ) : null}
          </div>
          {contacts ? <small className="admin-field-hint">Contatos completos visíveis. O acesso fica registrado na auditoria.</small> : null}
        </section>

        {/* Histórico: pedidos, doações e histórias. */}
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
          {/* Doações (só se houver). */}
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

        {/* Aviso após ação. */}
        {notice ? <p className={`admin-alert is-${notice.variant}`} role={notice.variant === 'error' ? 'alert' : 'status'}>{notice.text}</p> : null}

        {/* Painéis: edição ou LGPD ("mode in LGPD_ACTIONS" verifica se o modo é 'anonimizar' ou 'excluir'). */}
        {mode === 'editar' ? <EditForm adopter={adopter} contacts={contacts} onCancel={() => setMode('view')} onSave={save} /> : null}
        {mode in LGPD_ACTIONS ? <LgpdPanel action={mode} onCancel={() => setMode('view')} onConfirm={() => runLgpd(mode)} /> : null}

        {/* Seção LGPD (com permissão e sem painel aberto). */}
        {canLgpd && mode === 'view' ? (
          <section aria-labelledby="adopter-lgpd" className="admin-detail-section admin-detail-wide">
            <h3 id="adopter-lgpd">Privacidade (LGPD)</h3>
            <p className="admin-field-hint">Pedidos do titular: cópia dos dados, anonimização ou exclusão. Pedidos de adoção em andamento precisam ser encerrados antes.</p>
            <div className="admin-row-actions">
              {/* Exportar: busca os dados e baixa como JSON formatado (JSON.stringify com 2 espaços de recuo). */}
              <button
                className="admin-button is-small"
                onClick={() => act(async () => downloadFile(JSON.stringify(await exportAdopterData(adopterId), null, 2), `titular-${adopterId}.json`, 'application/json'), 'Arquivo com os dados do titular baixado.')}
                type="button"
              >
                <Download aria-hidden="true" size={15} /> Exportar dados do titular
              </button>
              {/* Abrem o painel de confirmação. */}
              <button className="admin-button is-small is-danger" onClick={() => setMode('anonimizar')} type="button">Anonimizar</button>
              <button className="admin-button is-small is-danger" onClick={() => setMode('excluir')} type="button">Excluir</button>
            </div>
          </section>
        ) : null}
      </div>
    </AdminDialog>
  );
}

/*
 * ============================================================================
 * RESUMO DO ARQUIVO
 * ============================================================================
 *
 * COMO O FLUXO FUNCIONA:
 *   1. A janela carrega a ficha (contatos mascarados) e mostra resumo, contatos e histórico.
 *   2. "Mostrar contatos" revela os dados (ação auditada) e libera a edição dos contatos.
 *   3. "Editar cadastro" abre o EditForm, que envia só os campos alterados.
 *   4. Na seção LGPD: exportar baixa um JSON; anonimizar/excluir pedem a palavra de
 *      confirmação. Excluir fecha a janela; anonimizar recarrega a ficha.
 *
 * CONCEITOS IMPORTANTES PARA ESTUDAR:
 *   - LGPD: direitos do titular (acesso, anonimização, exclusão) e auditoria.
 *   - Enviar só as mudanças (diff) com map/filter e Object.fromEntries.
 *   - Confirmação explícita digitando uma palavra para ações destrutivas.
 *   - Desestruturação com valores padrão ({ pedidos = [] } = obj || {}).
 *   - Operador "in" para checar chaves de objeto.
 *   - JSON.stringify com formatação e download de arquivos.
 *   - pattern em inputs (validação com expressão regular no HTML).
 * ============================================================================
 */
