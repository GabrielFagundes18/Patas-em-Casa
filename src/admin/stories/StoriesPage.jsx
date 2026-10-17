/*
 * ============================================================================
 * ARQUIVO: StoriesPage.jsx
 * ============================================================================
 *
 * PARA QUE SERVE:
 *   Tela "Histórias" do painel: lista os depoimentos de adoção (publicados e
 *   rascunhos), com filtro de situação, e permite criar, editar, publicar/
 *   despublicar e excluir, conforme as permissões do usuário.
 *   Só as histórias publicadas aparecem na página inicial do site.
 *
 * PRINCIPAIS ITENS:
 *   - StoriesPage({ user }): o componente (exportado como padrão).
 *       Dentro dele: save, run e remove.
 *
 * CONEXÕES COM OUTROS ARQUIVOS:
 *   - react (useState), lucide-react (ícones).
 *   - ./storyService → createStory, deleteStory, listStories, updateStory.
 *   - ./StoryFormDialog → formulário.
 *   - admin/constants/statusLabels (formatDate) e admin/shared (ListState, Pagination, usePaginatedList).
 *   - Quem usa: admin/AdminDashboardPage.jsx (aba "historias").
 *   - Testado em: ./StoriesPage.test.js.
 * ============================================================================
 */

// O quê: tela "Histórias": depoimentos de adoção mostrados na Home.
// Como: lista paginada (filtro publicada/rascunho na URL); criar, editar, publicar/despublicar e excluir
//       conforme as permissões stories:create, stories:update e stories:delete.
// Para quê: a equipe revisar o que vai ao ar antes de publicar.
// Hook de estado.
import { useState } from 'react';
// Ícones: lápis, mais e lixeira.
import { Pencil, Plus, Trash2 } from 'lucide-react';
// Funções da API.
import { createStory, deleteStory, listStories, updateStory } from './storyService';
// Formulário.
import StoryFormDialog from './StoryFormDialog';
// Formatação de data.
import { formatDate } from 'admin/constants/statusLabels';
// Compartilhados.
import ListState from 'admin/shared/ListState';
import Pagination from 'admin/shared/Pagination';
import { errorMessage, usePaginatedList } from 'admin/shared/usePaginatedList';

/*
 * COMPONENTE: StoriesPage
 * O que faz: lista e gerencia as histórias.
 * Parâmetros (props): user (objeto) — permissões.
 * Retorno: JSX da tela.
 * Onde é usado: AdminDashboardPage.jsx.
 */
export default function StoriesPage({ user }) {
  // Lista paginada com filtros na URL.
  const { items, meta, loading, error, filters, setFilter, setPage, reload } = usePaginatedList(
    listStories,
    'Não foi possível carregar as histórias.'
  );
  // Janela: null ou { story } (story null = nova).
  const [dialog, setDialog] = useState(null);
  // Aviso após ações.
  const [notice, setNotice] = useState(null);
  // Permissões.
  const permissions = user?.permissions || [];
  const canCreate = permissions.includes('stories:create');
  const canUpdate = permissions.includes('stories:update');
  const canDelete = permissions.includes('stories:delete');

  /*
   * FUNÇÃO INTERNA: save
   * O que faz: cria ou atualiza a história do formulário, avisa e recarrega.
   */
  async function save(payload) {
    if (dialog.story) await updateStory(dialog.story.id, payload);
    else await createStory(payload);
    // A mensagem depende de ter sido publicada ou salva como rascunho.
    setNotice({ variant: 'success', text: payload.publicado ? 'História salva e publicada no site.' : 'História salva como rascunho.' });
    setDialog(null);
    reload();
  }

  /*
   * FUNÇÃO INTERNA: run
   * O que faz: executa uma ação rápida (publicar/despublicar/excluir), mostra o aviso e recarrega.
   * Parâmetros: action (função async) e successText (string).
   */
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

  /*
   * FUNÇÃO INTERNA: remove
   * O que faz: pede confirmação e exclui a história.
   */
  function remove(story) {
    if (!window.confirm(`Excluir a história de ${story.autor_nome}? Esta ação não pode ser desfeita.`)) return;
    run(() => deleteStory(story.id), 'História excluída.');
  }

  return (
    <section aria-labelledby="stories-heading" className="admin-page">
      {/* Cabeçalho com "Nova história" (só com permissão). */}
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

      {/* Aviso. */}
      {notice ? <p className={`admin-alert is-${notice.variant}`} role={notice.variant === 'error' ? 'alert' : 'status'}>{notice.text}</p> : null}

      {/* Filtro de situação (valores "true"/"false" em texto, pois vão para a URL). */}
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

      {/* Estados da lista. */}
      <ListState
        empty={!loading && !error && items.length === 0}
        emptyText={filters.publicado ? 'Altere o filtro para ver outras histórias.' : 'Cadastre o depoimento de uma família que adotou.'}
        emptyTitle={filters.publicado ? 'Nenhuma história encontrada' : 'Ainda não há histórias'}
        error={error}
        loading={loading}
        onRetry={reload}
      />

      {/* Tabela e paginação. */}
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
                      {/* Trecho do texto: até 90 caracteres, com "…" se for maior. */}
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
                              {/* Inverte "publicado" (publicar ↔ despublicar). */}
                              <button
                                className="admin-button is-small"
                                onClick={() => run(() => updateStory(story.id, { publicado: !story.publicado }), story.publicado ? 'História retirada do site.' : 'História publicada no site.')}
                                type="button"
                              >
                                {story.publicado ? 'Despublicar' : 'Publicar'}
                              </button>
                              {/* Editar: abre o formulário com a história. */}
                              <button aria-label={`Editar a história de ${story.autor_nome}`} className="admin-icon-button is-small" onClick={() => { setNotice(null); setDialog({ story }); }} type="button">
                                <Pencil size={15} />
                              </button>
                            </>
                          ) : null}
                          {/* Excluir (com confirmação). */}
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

      {/* Formulário. */}
      {dialog ? <StoryFormDialog onClose={() => setDialog(null)} onSubmit={save} story={dialog.story} /> : null}
    </section>
  );
}

/*
 * ============================================================================
 * RESUMO DO ARQUIVO
 * ============================================================================
 *
 * COMO O FLUXO FUNCIONA:
 *   1. usePaginatedList busca as histórias (com o filtro publicada/rascunho da URL).
 *   2. A tabela mostra autor, trecho, animal, situação e data.
 *   3. Conforme as permissões: "Nova história"/lápis abrem o formulário (save);
 *      "Publicar/Despublicar" e lixeira usam run (com confirmação para excluir).
 *   4. Toda ação mostra um aviso e recarrega a lista.
 *
 * CONCEITOS IMPORTANTES PARA ESTUDAR:
 *   - CRUD completo numa tela de listagem.
 *   - Permissões granulares (criar, editar, excluir).
 *   - Função genérica "run" para ações com aviso e tratamento de erro.
 *   - Truncar textos com slice e reticências.
 *   - Fluxo editorial (rascunho → publicado).
 * ============================================================================
 */
