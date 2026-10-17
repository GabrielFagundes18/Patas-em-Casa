/*
 * ============================================================================
 * ARQUIVO: VolunteersPage.jsx
 * ============================================================================
 *
 * PARA QUE SERVE:
 *   Tela "Voluntários" do painel: lista os voluntários (inclusive as inscrições
 *   feitas pelo site, que chegam como inativas aguardando triagem), com busca,
 *   filtros de situação e área, paginação e o botão "Adicionar voluntário".
 *
 * PRINCIPAIS ITENS:
 *   - VolunteersPage({ user }): o componente (exportado como padrão).
 *       Dentro dele: addVolunteer.
 *
 * CONEXÕES COM OUTROS ARQUIVOS:
 *   - react (useState), lucide-react (UserPlus).
 *   - ./volunteerService → createVolunteer, listVolunteers.
 *   - ./VolunteerFormDialog → formulário de cadastro.
 *   - admin/constants/statusLabels e admin/shared (ListState, Pagination, SearchField, usePaginatedList).
 *   - Quem usa: admin/AdminDashboardPage.jsx (aba "voluntarios").
 *   - Testado em: ./VolunteersPage.test.js.
 * ============================================================================
 */

// Hook de estado.
import { useState } from 'react';
// Ícone de "adicionar pessoa".
import { UserPlus } from 'lucide-react';
// Funções da API.
import { createVolunteer, listVolunteers } from './volunteerService';
// Formulário de cadastro.
import VolunteerFormDialog from './VolunteerFormDialog';
// Rótulos e formatação.
import { formatDate, statusOf, volunteerAreaLabels, volunteerStatusMap } from 'admin/constants/statusLabels';
// Compartilhados.
import ListState from 'admin/shared/ListState';
import Pagination from 'admin/shared/Pagination';
import SearchField from 'admin/shared/SearchField';
import { usePaginatedList } from 'admin/shared/usePaginatedList';

/*
 * COMPONENTE: VolunteersPage
 * O que faz: lista os voluntários e permite cadastrar novos.
 * Parâmetros (props): user (objeto) — permissões.
 * Retorno: JSX da tela.
 * Onde é usado: AdminDashboardPage.jsx.
 */
export default function VolunteersPage({ user }) {
  // Lista paginada com filtros na URL.
  const { items, meta, loading, error, filters, setFilter, setPage, reload } = usePaginatedList(
    listVolunteers,
    'Não foi possível carregar os voluntários.'
  );
  // Há filtros ativos?
  const hasFilters = ['q', 'status', 'area'].some((key) => filters[key]);
  // Formulário aberto?
  const [formOpen, setFormOpen] = useState(false);
  // Aviso de sucesso.
  const [notice, setNotice] = useState('');
  // Pode cadastrar?
  const canCreate = user?.permissions?.includes('volunteers:create');

  /*
   * FUNÇÃO INTERNA: addVolunteer
   * O que faz: cadastra, fecha o formulário, mostra o aviso e recarrega a lista.
   * Parâmetros: payload (dados do formulário). Erros sobem para o formulário.
   */
  async function addVolunteer(payload) {
    const volunteer = await createVolunteer(payload);
    setFormOpen(false);
    setNotice(`${volunteer.nome} agora está na lista de voluntários.`);
    reload();
  }

  return (
    <section aria-labelledby="volunteers-heading" className="admin-page">
      {/* Cabeçalho com o botão de adicionar (só com permissão). */}
      <div className="admin-toolbar">
        <div>
          <h2 id="volunteers-heading">Voluntários</h2>
          <p>Inscrições feitas pelo site chegam como inativas, aguardando triagem.</p>
        </div>
        {canCreate ? (
          <div className="admin-toolbar-actions">
            <button className="admin-button is-primary" onClick={() => { setNotice(''); setFormOpen(true); }} type="button">
              <UserPlus aria-hidden="true" size={18} /> Adicionar voluntário
            </button>
          </div>
        ) : null}
      </div>

      {/* Aviso de sucesso. */}
      {notice ? <p className="admin-alert is-success" role="status">{notice}</p> : null}

      {/* Filtros: busca, situação e área. */}
      <div className="admin-filters">
        <SearchField label="Buscar por nome ou e-mail" onSearch={(value) => setFilter('q', value)} value={filters.q} />
        <label>
          Situação
          <select onChange={(event) => setFilter('status', event.target.value)} value={filters.status || ''}>
            <option value="">Todas</option>
            {Object.entries(volunteerStatusMap).map(([value, status]) => <option key={value} value={value}>{status.label}</option>)}
          </select>
        </label>
        <label>
          Área
          <select onChange={(event) => setFilter('area', event.target.value)} value={filters.area || ''}>
            <option value="">Todas</option>
            {Object.entries(volunteerAreaLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
      </div>

      {/* Estados da lista. */}
      <ListState
        empty={!loading && !error && items.length === 0}
        emptyText={hasFilters ? 'Altere os filtros para ver outros voluntários.' : 'Os voluntários cadastrados aparecerão aqui.'}
        emptyTitle={hasFilters ? 'Nenhum voluntário encontrado' : 'Ainda não há voluntários'}
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
                  <th scope="col">Voluntário</th>
                  <th scope="col">Telefone</th>
                  <th scope="col">Áreas</th>
                  <th scope="col">Situação</th>
                  <th scope="col">Desde</th>
                </tr>
              </thead>
              <tbody>
                {items.map((volunteer) => {
                  const status = statusOf(volunteerStatusMap, volunteer.status);
                  return (
                    <tr key={volunteer.id}>
                      <td data-label="Voluntário">
                        <span className="admin-cell-title">{volunteer.nome}</span>
                        <small>{volunteer.email}</small>
                      </td>
                      <td data-label="Telefone">{volunteer.telefone || 'Não informado'}</td>
                      {/* Traduz cada código de área e junta com vírgula (ou "Nenhuma"). */}
                      <td data-label="Áreas">{volunteer.areas.map((area) => volunteerAreaLabels[area] || area).join(', ') || 'Nenhuma'}</td>
                      <td data-label="Situação"><span className={`admin-badge is-${status.variant}`}>{status.label}</span></td>
                      <td data-label="Desde">{formatDate(volunteer.data_inicio)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Pagination meta={meta} onChange={setPage} />
        </>
      ) : null}

      {/* Formulário de cadastro. */}
      {formOpen ? <VolunteerFormDialog onClose={() => setFormOpen(false)} onSubmit={addVolunteer} /> : null}
    </section>
  );
}

/*
 * ============================================================================
 * RESUMO DO ARQUIVO
 * ============================================================================
 *
 * COMO O FLUXO FUNCIONA:
 *   usePaginatedList busca os voluntários conforme a URL; a tela mostra filtros,
 *   estados, tabela e paginação. Com permissão, "Adicionar voluntário" abre o
 *   formulário; ao salvar, addVolunteer cadastra, avisa e recarrega a lista.
 *
 * CONCEITOS IMPORTANTES PARA ESTUDAR:
 *   - Padrão de tela de listagem reaproveitável (hook + componentes compartilhados).
 *   - Traduzir listas de códigos em textos (map + join).
 *   - Permissões controlando botões.
 *   - Comunicação pai → filho por callbacks (onSubmit).
 * ============================================================================
 */
