import { useState } from 'react';
import { Eye } from 'lucide-react';
import { listAdoptionRequests } from './adoptionService';
import AdoptionDetailDialog from './AdoptionDetailDialog';
import { adoptionStatusMap, formatDate, priorityMap, statusOf } from 'admin/constants/statusLabels';
import ListState from 'admin/shared/ListState';
import Pagination from 'admin/shared/Pagination';
import SearchField from 'admin/shared/SearchField';
import { usePaginatedList } from 'admin/shared/usePaginatedList';

export default function AdoptionsPage({ user }) {
  const { items, meta, loading, error, filters, setFilter, setPage, reload } = usePaginatedList(
    listAdoptionRequests,
    'Não foi possível carregar os pedidos de adoção.'
  );
  const hasFilters = ['q', 'status', 'prioridade'].some((key) => filters[key]);
  const [selectedId, setSelectedId] = useState(null);

  return (
    <section aria-labelledby="adoptions-heading" className="admin-page">
      <div className="admin-toolbar">
        <div>
          <h2 id="adoptions-heading">Pedidos de adoção</h2>
          <p>Contatos aparecem mascarados para proteger os candidatos.</p>
        </div>
      </div>

      <div className="admin-filters">
        <SearchField label="Buscar por adotante ou animal" onSearch={(value) => setFilter('q', value)} value={filters.q} />
        <label>
          Status
          <select onChange={(event) => setFilter('status', event.target.value)} value={filters.status || ''}>
            <option value="">Todos</option>
            {Object.entries(adoptionStatusMap).map(([value, status]) => <option key={value} value={value}>{status.label}</option>)}
          </select>
        </label>
        <label>
          Prioridade
          <select onChange={(event) => setFilter('prioridade', event.target.value)} value={filters.prioridade || ''}>
            <option value="">Todas</option>
            {Object.entries(priorityMap).map(([value, priority]) => <option key={value} value={value}>{priority.label}</option>)}
          </select>
        </label>
      </div>

      <ListState
        empty={!loading && !error && items.length === 0}
        emptyText={hasFilters ? 'Altere os filtros para ver outros pedidos.' : 'Os pedidos enviados pelo site aparecerão aqui.'}
        emptyTitle={hasFilters ? 'Nenhum pedido encontrado' : 'Ainda não há pedidos de adoção'}
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
                  <th scope="col">Data</th>
                  <th scope="col">Animal</th>
                  <th scope="col">Adotante</th>
                  <th scope="col">Status</th>
                  <th scope="col">Prioridade</th>
                  <th scope="col">Responsável</th>
                  <th scope="col">Termo</th>
                  <th scope="col"><span className="admin-visually-hidden">Ações</span></th>
                </tr>
              </thead>
              <tbody>
                {items.map((request) => {
                  const status = statusOf(adoptionStatusMap, request.status);
                  const priority = statusOf(priorityMap, request.prioridade);
                  return (
                    <tr key={request.id}>
                      <td data-label="Data">{formatDate(request.data_pedido)}</td>
                      <td data-label="Animal">
                        <span className="admin-cell-title">{request.animal.nome}</span>
                        <small>{request.animal.especie}</small>
                      </td>
                      <td data-label="Adotante">
                        <span className="admin-cell-title">{request.adotante.nome}</span>
                        <small>{[request.adotante.cidade, request.adotante.estado].filter(Boolean).join(' / ') || request.adotante.email}</small>
                      </td>
                      <td data-label="Status"><span className={`admin-badge is-${status.variant}`}>{status.label}</span></td>
                      <td data-label="Prioridade"><span className={`admin-badge is-${priority.variant}`}>{priority.label}</span></td>
                      <td data-label="Responsável">{request.responsavel?.nome || 'Sem responsável'}</td>
                      <td data-label="Termo">{request.status === 'aprovado' ? (request.termo_assinado ? 'Assinado' : 'Pendente') : '—'}</td>
                      <td data-label="Ações">
                        <button
                          aria-label={`Ver detalhes do pedido de ${request.adotante.nome} para ${request.animal.nome}`}
                          className="admin-button is-small"
                          onClick={() => setSelectedId(request.id)}
                          type="button"
                        >
                          <Eye aria-hidden="true" size={15} /> Detalhes
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Pagination meta={meta} onChange={setPage} />
        </>
      ) : null}

      {selectedId ? (
        <AdoptionDetailDialog onChanged={reload} onClose={() => setSelectedId(null)} requestId={selectedId} user={user} />
      ) : null}
    </section>
  );
}
