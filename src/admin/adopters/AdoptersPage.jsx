// O quê: tela "Adotantes": candidatos que já enviaram pedido, com contatos mascarados (LGPD).
// Como: lista paginada com filtros na URL; detalhe em diálogo; exportação CSV para quem tem adopters:export.
// Para quê: acompanhar quem quer adotar, o histórico de cada pessoa e os pedidos de privacidade.
import { useState } from 'react';
import { Download, Eye } from 'lucide-react';
import { exportAdoptersCsv, listAdopters } from './adopterService';
import AdopterDetailDialog from './AdopterDetailDialog';
import { adopterStatusMap, formatDate, statusOf } from 'admin/constants/statusLabels';
import ListState from 'admin/shared/ListState';
import Pagination from 'admin/shared/Pagination';
import SearchField from 'admin/shared/SearchField';
import { downloadFile } from 'admin/shared/downloadFile';
import { errorMessage, usePaginatedList } from 'admin/shared/usePaginatedList';

const BRAZILIAN_STATES = [
  'AC', 'AL', 'AM', 'AP', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MG', 'MS', 'MT', 'PA',
  'PB', 'PE', 'PI', 'PR', 'RJ', 'RN', 'RO', 'RR', 'RS', 'SC', 'SE', 'SP', 'TO',
];

export default function AdoptersPage({ user }) {
  const { items, meta, loading, error, filters, setFilter, setPage, reload } = usePaginatedList(
    listAdopters,
    'Não foi possível carregar os adotantes.'
  );
  const [selectedId, setSelectedId] = useState(null);
  const [exportError, setExportError] = useState('');
  const canExport = user?.permissions?.includes('adopters:export');
  const hasFilters = ['q', 'status', 'estado'].some((key) => filters[key]);

  async function exportCsv() {
    setExportError('');
    try {
      const params = Object.fromEntries(['q', 'status', 'estado'].filter((key) => filters[key]).map((key) => [key, filters[key]]));
      downloadFile(await exportAdoptersCsv(params), `adotantes-${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv');
    } catch (requestError) {
      setExportError(errorMessage(requestError, 'Não foi possível exportar a lista.'));
    }
  }

  return (
    <section aria-labelledby="adopters-heading" className="admin-page">
      <div className="admin-toolbar">
        <div>
          <h2 id="adopters-heading">Adotantes</h2>
          <p>Contatos aparecem mascarados; revelar fica registrado na auditoria.</p>
        </div>
        {canExport ? (
          <div className="admin-toolbar-actions">
            <button className="admin-button" onClick={exportCsv} type="button">
              <Download aria-hidden="true" size={16} /> Exportar CSV
            </button>
          </div>
        ) : null}
      </div>
      {exportError ? <p className="admin-alert is-error" role="alert">{exportError}</p> : null}

      <div className="admin-filters">
        <SearchField label="Buscar por nome, e-mail ou telefone" onSearch={(value) => setFilter('q', value)} value={filters.q} />
        <label>
          Situação
          <select onChange={(event) => setFilter('status', event.target.value)} value={filters.status || ''}>
            <option value="">Todas</option>
            {Object.entries(adopterStatusMap).map(([value, status]) => <option key={value} value={value}>{status.label}</option>)}
          </select>
        </label>
        <label>
          UF
          <select onChange={(event) => setFilter('estado', event.target.value)} value={filters.estado || ''}>
            <option value="">Todas</option>
            {BRAZILIAN_STATES.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
          </select>
        </label>
      </div>

      <ListState
        empty={!loading && !error && items.length === 0}
        emptyText={hasFilters ? 'Altere os filtros para ver outros adotantes.' : 'Quem enviar um pedido de adoção pelo site aparece aqui.'}
        emptyTitle={hasFilters ? 'Nenhum adotante encontrado' : 'Ainda não há adotantes'}
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
                  <th scope="col">Adotante</th>
                  <th scope="col">Contato</th>
                  <th scope="col">Pedidos</th>
                  <th scope="col">Situação</th>
                  <th scope="col">Cadastro</th>
                  <th scope="col"><span className="admin-visually-hidden">Ações</span></th>
                </tr>
              </thead>
              <tbody>
                {items.map((adopter) => {
                  const status = statusOf(adopterStatusMap, adopter.status);
                  return (
                    <tr key={adopter.id}>
                      <td data-label="Adotante">
                        <span className="admin-cell-title">{adopter.nome}</span>
                        <small>{[adopter.cidade, adopter.estado].filter(Boolean).join(' / ') || 'Cidade não informada'}</small>
                      </td>
                      <td data-label="Contato">
                        <span className="admin-cell-title">{adopter.email}</span>
                        <small>{adopter.telefone || 'Sem telefone'}</small>
                      </td>
                      <td data-label="Pedidos">{adopter.total_pedidos} ({adopter.pedidos_abertos} em andamento)</td>
                      <td data-label="Situação"><span className={`admin-badge is-${status.variant}`}>{status.label}</span></td>
                      <td data-label="Cadastro">{formatDate(adopter.criado_em)}</td>
                      <td data-label="Ações">
                        <button aria-label={`Ver ficha de ${adopter.nome}`} className="admin-button is-small" onClick={() => setSelectedId(adopter.id)} type="button">
                          <Eye aria-hidden="true" size={15} /> Ficha
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

      {selectedId ? <AdopterDetailDialog adopterId={selectedId} onChanged={reload} onClose={() => setSelectedId(null)} user={user} /> : null}
    </section>
  );
}
