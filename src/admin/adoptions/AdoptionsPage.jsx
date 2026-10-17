/*
 * ============================================================================
 * ARQUIVO: AdoptionsPage.jsx
 * ============================================================================
 *
 * PARA QUE SERVE:
 *   Tela "Adoções" do painel: lista os PEDIDOS DE ADOÇÃO enviados pelo site, com
 *   busca, filtros (status e prioridade), paginação e um botão "Detalhes" que
 *   abre a janela de triagem (AdoptionDetailDialog). Os contatos aparecem
 *   mascarados para proteger os candidatos.
 *
 * PRINCIPAIS ITENS:
 *   - AdoptionsPage({ user }): o componente (exportado como padrão).
 *
 * CONEXÕES COM OUTROS ARQUIVOS:
 *   - react (useState), lucide-react (ícone Eye).
 *   - ./adoptionService → listAdoptionRequests.
 *   - ./AdoptionDetailDialog → janela de detalhes/triagem.
 *   - admin/constants/statusLabels → rótulos de status e prioridade, formatDate, statusOf.
 *   - admin/shared → ListState, Pagination, SearchField, usePaginatedList.
 *   - Quem usa: admin/AdminDashboardPage.jsx (aba "adocoes").
 *   - Testado em: ./AdoptionsPage.test.js.
 * ============================================================================
 */

// Hook de estado.
import { useState } from 'react';
// Ícone de olho ("ver detalhes").
import { Eye } from 'lucide-react';
// Função que lista os pedidos na API.
import { listAdoptionRequests } from './adoptionService';
// Janela de detalhes.
import AdoptionDetailDialog from './AdoptionDetailDialog';
// Rótulos, cores e formatação.
import { adoptionStatusMap, formatDate, priorityMap, statusOf } from 'admin/constants/statusLabels';
// Componentes e hook compartilhados das listas.
import ListState from 'admin/shared/ListState';
import Pagination from 'admin/shared/Pagination';
import SearchField from 'admin/shared/SearchField';
import { usePaginatedList } from 'admin/shared/usePaginatedList';

/*
 * COMPONENTE: AdoptionsPage
 * O que faz: lista os pedidos com filtros e abre a janela de detalhes.
 * Parâmetros (props): user (objeto) — usuário logado (repassado à janela, que usa as permissões).
 * Retorno: JSX da tela.
 * Onde é usado: AdminDashboardPage.jsx.
 */
export default function AdoptionsPage({ user }) {
  // O hook cuida da busca paginada usando os filtros da URL.
  const { items, meta, loading, error, filters, setFilter, setPage, reload } = usePaginatedList(
    listAdoptionRequests,
    'Não foi possível carregar os pedidos de adoção.'
  );
  // Há algum filtro ativo? (muda a mensagem de lista vazia)
  const hasFilters = ['q', 'status', 'prioridade'].some((key) => filters[key]);
  // Id do pedido aberto na janela de detalhes (null = janela fechada).
  const [selectedId, setSelectedId] = useState(null);

  return (
    <section aria-labelledby="adoptions-heading" className="admin-page">
      {/* Cabeçalho da tela. */}
      <div className="admin-toolbar">
        <div>
          <h2 id="adoptions-heading">Pedidos de adoção</h2>
          <p>Contatos aparecem mascarados para proteger os candidatos.</p>
        </div>
      </div>

      {/* Filtros: busca (aplicada ao apertar Enter), status e prioridade (aplicados ao escolher). */}
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

      {/* Estados da lista: carregando, erro (com tentar novamente) ou vazia (texto depende dos filtros). */}
      <ListState
        empty={!loading && !error && items.length === 0}
        emptyText={hasFilters ? 'Altere os filtros para ver outros pedidos.' : 'Os pedidos enviados pelo site aparecerão aqui.'}
        emptyTitle={hasFilters ? 'Nenhum pedido encontrado' : 'Ainda não há pedidos de adoção'}
        error={error}
        loading={loading}
        onRetry={reload}
      />

      {/* Tabela e paginação (quando há pedidos). */}
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
                  {/* Cabeçalho da coluna de ações: texto só para leitores de tela. */}
                  <th scope="col"><span className="admin-visually-hidden">Ações</span></th>
                </tr>
              </thead>
              <tbody>
                {items.map((request) => {
                  // Rótulo e cor do status e da prioridade (statusOf tem padrão para valores desconhecidos).
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
                        {/* "Cidade / UF" (o que existir); se não houver nenhum, mostra o e-mail (mascarado). */}
                        <small>{[request.adotante.cidade, request.adotante.estado].filter(Boolean).join(' / ') || request.adotante.email}</small>
                      </td>
                      <td data-label="Status"><span className={`admin-badge is-${status.variant}`}>{status.label}</span></td>
                      <td data-label="Prioridade"><span className={`admin-badge is-${priority.variant}`}>{priority.label}</span></td>
                      <td data-label="Responsável">{request.responsavel?.nome || 'Sem responsável'}</td>
                      {/* Termo só faz sentido para pedidos aprovados: "Assinado" ou "Pendente". */}
                      <td data-label="Termo">{request.status === 'aprovado' ? (request.termo_assinado ? 'Assinado' : 'Pendente') : '—'}</td>
                      <td data-label="Ações">
                        {/* Abre a janela de detalhes deste pedido. */}
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
          {/* setPage vem do hook: muda a página na URL. */}
          <Pagination meta={meta} onChange={setPage} />
        </>
      ) : null}

      {/* Janela de detalhes. onChanged recarrega a lista depois de uma decisão/agendamento. */}
      {selectedId ? (
        <AdoptionDetailDialog onChanged={reload} onClose={() => setSelectedId(null)} requestId={selectedId} user={user} />
      ) : null}
    </section>
  );
}

/*
 * ============================================================================
 * RESUMO DO ARQUIVO
 * ============================================================================
 *
 * COMO O FLUXO FUNCIONA:
 *   1. usePaginatedList lê os filtros da URL e busca os pedidos.
 *   2. A tela mostra filtros, estados (carregando/erro/vazio), a tabela e a paginação.
 *   3. "Detalhes" guarda o id e abre a AdoptionDetailDialog; ao fechar, o id volta a null.
 *   4. Mudanças feitas na janela chamam reload para atualizar a lista.
 *
 * CONCEITOS IMPORTANTES PARA ESTUDAR:
 *   - Reaproveitamento de lógica com um hook (usePaginatedList) e componentes compartilhados.
 *   - Filtros na URL e paginação no servidor.
 *   - Tabela acessível (scope, rótulos ocultos, aria-label descritivo nos botões).
 *   - Ternários aninhados para estados derivados (termo assinado/pendente).
 *   - Padrão "lista + janela de detalhes" com um id no estado.
 * ============================================================================
 */
