import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowDown, ArrowUp, Plus, RotateCw, Search, SlidersHorizontal, Trash2 } from 'lucide-react';
import AnimalFormDialog from './AnimalFormDialog';
import {
  animalPageSize,
  animalSizes,
  animalSpecies,
  animalStatusMap,
  animalSexes,
} from '../constants/animalOptions';
import {
  createAnimal,
  deleteAnimal,
  listAnimals,
  updateAnimal,
  updateAnimalStatus,
} from './animalService';

function formatAge(value) {
  if (value === null || value === undefined || value === '') return 'Não informada';
  const age = Number(value);
  return `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(age)} ${age === 1 ? 'ano' : 'anos'}`;
}

function errorMessage(error) {
  return error?.response?.data?.error?.message
    || error?.response?.data?.message
    || 'Não foi possível carregar os animais.';
}

export default function AnimalsPage({ user }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchKey = searchParams.toString();
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ page: 1, pageSize: animalPageSize, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const [editingAnimal, setEditingAnimal] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formNotice, setFormNotice] = useState('');
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState('');
  const [draft, setDraft] = useState(() => Object.fromEntries(searchParams.entries()));

  const canCreate = user?.permissions?.includes('animals:create');
  const canWrite = user?.permissions?.includes('animals:update');
  const canDelete = user?.permissions?.includes('animals:delete');
  const activeFilters = ['q', 'status', 'especie', 'sexo', 'porte', 'castrado', 'vacinado', 'idadeMin', 'idadeMax']
    .some((key) => searchParams.has(key));

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');

    async function loadAnimals() {
      try {
        const params = Object.fromEntries(searchParams.entries());
        params.page ||= '1';
        params.pageSize ||= String(animalPageSize);
        const response = await listAnimals(params);
        if (!active) return;
        setItems(response.items);
        setMeta(response.meta);
        setDraft(Object.fromEntries(searchParams.entries()));
      } catch (requestError) {
        if (active) setError(errorMessage(requestError));
      } finally {
        if (active) setLoading(false);
      }
    }

    loadAnimals();
    return () => {
      active = false;
    };
  }, [retryCount, searchKey, searchParams]);

  function setDraftValue(name, value) {
    setDraft((current) => ({ ...current, [name]: value }));
  }

  function applyFilters(event) {
    event.preventDefault();
    const next = new URLSearchParams();
    for (const key of ['q', 'status', 'especie', 'sexo', 'porte', 'castrado', 'vacinado', 'idadeMin', 'idadeMax']) {
      const value = draft[key];
      if (value !== undefined && value !== '') next.set(key, value);
    }
    next.set('page', '1');
    next.set('pageSize', String(animalPageSize));
    setSearchParams(next);
  }

  function clearFilters() {
    const next = new URLSearchParams({ page: '1', pageSize: String(animalPageSize) });
    setDraft({});
    setSearchParams(next);
  }

  function setPage(page) {
    const next = new URLSearchParams(searchParams);
    next.set('page', String(page));
    if (!next.has('pageSize')) next.set('pageSize', String(animalPageSize));
    setSearchParams(next);
  }

  function sortBy(sort) {
    const next = new URLSearchParams(searchParams);
    const currentSort = next.get('sort');
    const currentOrder = next.get('order') || 'desc';
    next.set('sort', sort);
    next.set('order', currentSort === sort && currentOrder === 'asc' ? 'desc' : 'asc');
    next.set('page', '1');
    if (!next.has('pageSize')) next.set('pageSize', String(animalPageSize));
    setSearchParams(next);
  }

  // Depois de cadastrar, o formulário continua aberto em modo edição para enviar as fotos.
  async function saveAnimal(payload) {
    setSaving(true);
    setActionError('');
    try {
      if (editingAnimal) {
        await updateAnimal(editingAnimal.id, payload);
        setFormOpen(false);
        setEditingAnimal(null);
        setFormNotice('');
      } else {
        const created = await createAnimal(payload);
        setEditingAnimal(created);
        setFormNotice(`${created.nome} foi cadastrado. Agora envie as fotos.`);
      }
      setRetryCount((count) => count + 1);
    } catch (requestError) {
      setActionError(errorMessage(requestError));
      throw requestError;
    } finally {
      setSaving(false);
    }
  }

  async function changeStatus(animal, status, motivo) {
    setActionError('');
    try {
      await updateAnimalStatus(animal.id, status, motivo);
      setRetryCount((count) => count + 1);
    } catch (requestError) {
      // Algumas transições (ex.: inativar, devolução) exigem motivo registrado na auditoria.
      if (requestError?.response?.data?.error?.code === 'MOTIVO_OBRIGATORIO' && motivo === undefined) {
        const informed = window.prompt(`Informe o motivo para mudar o status de ${animal.nome}:`);
        if (informed?.trim()) await changeStatus(animal, status, informed.trim());
        return;
      }
      setActionError(errorMessage(requestError));
    }
  }

  async function removeAnimal(animal) {
    const confirmed = window.confirm(`Excluir ${animal.nome}? Esta ação não pode ser desfeita.`);
    if (!confirmed) return;

    setActionError('');
    try {
      await deleteAnimal(animal.id);
      setRetryCount((count) => count + 1);
    } catch (requestError) {
      setActionError(errorMessage(requestError));
    }
  }

  function openCreateForm() {
    setEditingAnimal(null);
    setFormNotice('');
    setFormOpen(true);
  }

  function openEditForm(animal) {
    setEditingAnimal(animal);
    setFormNotice('');
    setFormOpen(true);
  }

  const currentPage = Number(meta.page || searchParams.get('page') || 1);
  const totalPages = Number(meta.totalPages || 0);

  return (
    <section aria-labelledby="animals-heading" className="admin-page">
      <div className="admin-toolbar">
        <div>
          <h2 id="animals-heading">Animais cadastrados</h2>
          <p>{meta.total || 0} registros</p>
        </div>
        <div className="admin-toolbar-actions">
          <button
            aria-label="Atualizar lista de animais"
            className="admin-icon-button"
            onClick={() => setRetryCount((count) => count + 1)}
            type="button"
          >
            <RotateCw size={18} />
          </button>
          {canCreate ? (
            <button className="admin-button is-primary" onClick={openCreateForm} type="button">
              <Plus aria-hidden="true" size={18} />
              Cadastrar animal
            </button>
          ) : null}
        </div>
      </div>

      <form className="admin-filters" onSubmit={applyFilters}>
        <label className="admin-search">
          <Search aria-hidden="true" size={18} />
          <input
            aria-label="Buscar por nome"
            maxLength="120"
            onChange={(event) => setDraftValue('q', event.target.value)}
            placeholder="Buscar por nome"
            value={draft.q || ''}
          />
        </label>

        <label>
          Status
          <select onChange={(event) => setDraftValue('status', event.target.value)} value={draft.status || ''}>
            <option value="">Todos</option>
            {Object.entries(animalStatusMap).map(([value, status]) => (
              <option key={value} value={value}>{status.label}</option>
            ))}
          </select>
        </label>

        <label>
          Espécie
          <select onChange={(event) => setDraftValue('especie', event.target.value)} value={draft.especie || ''}>
            <option value="">Todas</option>
            {animalSpecies.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>

        <label>
          Porte
          <select onChange={(event) => setDraftValue('porte', event.target.value)} value={draft.porte || ''}>
            <option value="">Todos</option>
            {animalSizes.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>

        <label>
          Sexo
          <select onChange={(event) => setDraftValue('sexo', event.target.value)} value={draft.sexo || ''}>
            <option value="">Todos</option>
            {animalSexes.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>

        <label>
          Idade mínima
          <input min="0" max="999.9" onChange={(event) => setDraftValue('idadeMin', event.target.value)} step="0.1" type="number" value={draft.idadeMin || ''} />
        </label>

        <label>
          Idade máxima
          <input min="0" max="999.9" onChange={(event) => setDraftValue('idadeMax', event.target.value)} step="0.1" type="number" value={draft.idadeMax || ''} />
        </label>

        <label>
          Castrado
          <select onChange={(event) => setDraftValue('castrado', event.target.value)} value={draft.castrado || ''}>
            <option value="">Todos</option>
            <option value="true">Sim</option>
            <option value="false">Não</option>
          </select>
        </label>

        <label>
          Vacinado
          <select onChange={(event) => setDraftValue('vacinado', event.target.value)} value={draft.vacinado || ''}>
            <option value="">Todos</option>
            <option value="true">Sim</option>
            <option value="false">Não</option>
          </select>
        </label>

        <div className="admin-filters-actions">
          <button className="admin-button" type="submit">
            <SlidersHorizontal aria-hidden="true" size={16} /> Filtrar
          </button>
          {activeFilters ? <button className="admin-button is-ghost" onClick={clearFilters} type="button">Limpar</button> : null}
        </div>
      </form>

      {actionError ? <p className="admin-alert is-error" role="alert">{actionError}</p> : null}

      {loading ? (
        <div className="admin-state" role="status">
          <strong>Carregando animais</strong>
          <p>Aguarde enquanto consultamos o cadastro.</p>
        </div>
      ) : null}

      {!loading && error ? (
        <div className="admin-state is-error" role="alert">
          <strong>Não foi possível carregar os animais</strong>
          <p>{error}</p>
          <button className="admin-button is-primary" onClick={() => setRetryCount((count) => count + 1)} type="button">Tentar novamente</button>
        </div>
      ) : null}

      {!loading && !error && items.length === 0 ? (
        <div className="admin-state">
          <strong>{activeFilters ? 'Nenhum animal encontrado' : 'Ainda não há animais cadastrados'}</strong>
          <p>{activeFilters ? 'Altere os filtros ou limpe a busca.' : 'Os animais cadastrados aparecerão nesta lista.'}</p>
          {activeFilters ? <button className="admin-button" onClick={clearFilters} type="button">Limpar filtros</button> : null}
        </div>
      ) : null}

      {!loading && !error && items.length > 0 ? (
        <>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th aria-sort={searchParams.get('sort') === 'nome' ? (searchParams.get('order') === 'asc' ? 'ascending' : 'descending') : 'none'}>
                    <button onClick={() => sortBy('nome')} type="button">Animal {searchParams.get('sort') === 'nome' && searchParams.get('order') === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />}</button>
                  </th>
                  <th>Espécie</th>
                  <th>Idade</th>
                  <th>Porte</th>
                  <th>Status</th>
                  <th>Cuidados</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {items.map((animal) => {
                  const status = animalStatusMap[animal.status] || { label: animal.status, variant: 'muted' };
                  return (
                    <tr key={animal.id}>
                      <td data-label="Animal">
                        <span className="admin-cell-title">{animal.nome}</span>
                        <small>{animal.raca || 'Raça não informada'}</small>
                      </td>
                      <td data-label="Espécie">{animalSpecies.find((option) => option.value === animal.especie)?.label || animal.especie}</td>
                      <td data-label="Idade">{formatAge(animal.idade_anos)}</td>
                      <td data-label="Porte">{animalSizes.find((option) => option.value === animal.porte)?.label || 'Não informado'}</td>
                      <td data-label="Status">
                        {canWrite ? (
                          <label className="admin-status-control">
                            <span className={`admin-badge is-${status.variant}`}>{status.label}</span>
                            <select
                              aria-label={`Alterar status de ${animal.nome}`}
                              onChange={(event) => changeStatus(animal, event.target.value)}
                              value={animal.status}
                            >
                              {Object.entries(animalStatusMap).map(([value, option]) => (
                                <option key={value} value={value}>{option.label}</option>
                              ))}
                            </select>
                          </label>
                        ) : <span className={`admin-badge is-${status.variant}`}>{status.label}</span>}
                      </td>
                      <td data-label="Cuidados">{[animal.castrado && 'Castrado', animal.vacinado && 'Vacinado'].filter(Boolean).join(', ') || 'Não informados'}</td>
                      <td data-label="Ações">
                        <div className="admin-row-actions">
                          {canWrite ? <button aria-label={`Editar ${animal.nome}`} className="admin-button is-small" onClick={() => openEditForm(animal)} type="button">Editar</button> : null}
                          {canDelete ? (
                            <button aria-label={`Excluir ${animal.nome}`} className="admin-icon-button is-small is-danger" onClick={() => removeAnimal(animal)} type="button">
                              <Trash2 aria-hidden="true" size={16} />
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="admin-pagination">
            <p>Página {currentPage} de {Math.max(totalPages, 1)}</p>
            <div>
              <button className="admin-button" disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)} type="button">Anterior</button>
              <button className="admin-button" disabled={currentPage >= totalPages} onClick={() => setPage(currentPage + 1)} type="button">Próxima</button>
            </div>
          </div>
        </>
      ) : null}

      {formOpen ? (
        <AnimalFormDialog
          animal={editingAnimal}
          key={editingAnimal?.id || 'novo'}
          notice={formNotice}
          onClose={() => { setFormOpen(false); setEditingAnimal(null); setFormNotice(''); }}
          onPhotosChanged={() => setRetryCount((count) => count + 1)}
          onSubmit={saveAnimal}
          saving={saving}
        />
      ) : null}
    </section>
  );
}