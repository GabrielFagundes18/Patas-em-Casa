// O quê: tela "Histórias": depoimentos de adoção mostrados na Home.
// Como: lista paginada (filtro publicada/rascunho na URL); criar, editar, publicar/despublicar e excluir
//       conforme as permissões stories:create, stories:update e stories:delete.
// Para quê: a equipe revisar o que vai ao ar antes de publicar.
import { useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { createStory, deleteStory, listStories, updateStory } from './storyService';
import StoryFormDialog from './StoryFormDialog';
import { formatDate } from 'admin/constants/statusLabels';
import ListState from 'admin/shared/ListState';
import Pagination from 'admin/shared/Pagination';
import { errorMessage, usePaginatedList } from 'admin/shared/usePaginatedList';

export default function StoriesPage({ user }) {
  const { items, meta, loading, error, filters, setFilter, setPage, reload } = usePaginatedList(
    listStories,
    'Não foi possível carregar as histórias.'
  );
  const [dialog, setDialog] = useState(null);
  const [notice, setNotice] = useState(null);
  const permissions = user?.permissions || [];
  const canCreate = permissions.includes('stories:create');
  const canUpdate = permissions.includes('stories:update');
  const canDelete = permissions.includes('stories:delete');

  async function save(payload) {
    if (dialog.story) await updateStory(dialog.story.id, payload);
    else await createStory(payload);
    setNotice({ variant: 'success', text: payload.publicado ? 'História salva e publicada no site.' : 'História salva como rascunho.' });
    setDialog(null);
    reload();
  }

  async function run(action, successText) {
    setNotice(null);
    try {
      await action();
      setNotice({ variant: 'success', text: successText });
      reload();
    } catch (requestError) {
      setNotice({ variant: 'error', text: errorMessage(requestError, 'Não foi possível concluir a ação.') });
    }
  }

  function remove(story) {
    if (!window.confirm(`Excluir a história de ${story.autor_nome}? Esta ação não pode ser desfeita.`)) return;
    run(() => deleteStory(story.id), 'História excluída.');
  }

  return (
    <section aria-labelledby="stories-heading" className="admin-page">
      <div className="admin-toolbar">
        <div>
          <h2 id="stories-heading">Histórias</h2>
          <p>Só as publicadas aparecem no site.</p>
        </div>
        {canCreate ? (
          <div className="admin-toolbar-actions">
            <button className="admin-button is-primary" onClick={() => { setNotice(null); setDialog({ story: null }); }} type="button">
              <Plus aria-hidden="true" size={18} /> Nova história
            </button>
          </div>
        ) : null}
      </div>

      {notice ? <p className={`admin-alert is-${notice.variant}`} role={notice.variant === 'error' ? 'alert' : 'status'}>{notice.text}</p> : null}

      <div className="admin-filters">
        <label>
          Situação
          <select onChange={(event) => setFilter('publicado', event.target.value)} value={filters.publicado || ''}>
            <option value="">Todas</option>
            <option value="true">Publicadas</option>
            <option value="false">Rascunhos</option>
          </select>
        </label>
      </div>

      <ListState
        empty={!loading && !error && items.length === 0}
        emptyText={filters.publicado ? 'Altere o filtro para ver outras histórias.' : 'Cadastre o depoimento de uma família que adotou.'}
        emptyTitle={filters.publicado ? 'Nenhuma história encontrada' : 'Ainda não há histórias'}
        error={error}
        loading={loading}
        onRetry={reload}
      />

      {!loading && !error && items.length > 0 ? (
        <>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th scope="col">História</th>
                  <th scope="col">Animal</th>
                  <th scope="col">Situação</th>
                  <th scope="col">Criada em</th>
                  {canUpdate || canDelete ? <th scope="col"><span className="admin-visually-hidden">Ações</span></th> : null}
                </tr>
              </thead>
              <tbody>
                {items.map((story) => (
                  <tr key={story.id}>
                    <td data-label="História">
                      <span className="admin-cell-title">{story.autor_nome}</span>
                      <small>{story.texto.length > 90 ? `${story.texto.slice(0, 90)}…` : story.texto}</small>
                    </td>
                    <td data-label="Animal">{story.animal_nome || '—'}</td>
                    <td data-label="Situação">
                      <span className={`admin-badge is-${story.publicado ? 'success' : 'muted'}`}>{story.publicado ? 'Publicada' : 'Rascunho'}</span>
                    </td>
                    <td data-label="Criada em">{formatDate(story.criado_em)}</td>
                    {canUpdate || canDelete ? (
                      <td data-label="Ações">
                        <div className="admin-row-actions">
                          {canUpdate ? (
                            <>
                              <button
                                className="admin-button is-small"
                                onClick={() => run(() => updateStory(story.id, { publicado: !story.publicado }), story.publicado ? 'História retirada do site.' : 'História publicada no site.')}
                                type="button"
                              >
                                {story.publicado ? 'Despublicar' : 'Publicar'}
                              </button>
                              <button aria-label={`Editar a história de ${story.autor_nome}`} className="admin-icon-button is-small" onClick={() => { setNotice(null); setDialog({ story }); }} type="button">
                                <Pencil size={15} />
                              </button>
                            </>
                          ) : null}
                          {canDelete ? (
                            <button aria-label={`Excluir a história de ${story.autor_nome}`} className="admin-icon-button is-small is-danger" onClick={() => remove(story)} type="button">
                              <Trash2 size={15} />
                            </button>
                          ) : null}
                        </div>
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination meta={meta} onChange={setPage} />
        </>
      ) : null}

      {dialog ? <StoryFormDialog onClose={() => setDialog(null)} onSubmit={save} story={dialog.story} /> : null}
    </section>
  );
}
