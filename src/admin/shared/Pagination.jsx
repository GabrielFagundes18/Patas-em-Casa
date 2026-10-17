/*
 * ============================================================================
 * ARQUIVO: Pagination.jsx
 * ============================================================================
 *
 * PARA QUE SERVE:
 *   Barra de PAGINAÇÃO das listas do painel: mostra "Página X de Y · N registros"
 *   e os botões "Anterior" e "Próxima".
 *
 * PRINCIPAIS ITENS:
 *   - Pagination({ meta, onChange }): o componente (exportado como padrão).
 *
 * CONEXÕES COM OUTROS ARQUIVOS:
 *   - Não importa nada.
 *   - Recebe o "meta" devolvido pela API ({ page, pageSize, total, totalPages }),
 *     normalmente vindo do hook admin/shared/usePaginatedList.js.
 *   - Estilo .admin-pagination em admin/styles/admin.css.
 *   - Usado pelas listagens do painel.
 * ============================================================================
 */

/*
 * COMPONENTE: Pagination
 * O que faz: mostra a página atual e os botões de navegação.
 * Parâmetros (props):
 *   - meta (objeto): { page, total, totalPages } vindos da API.
 *   - onChange (função): recebe o número da nova página.
 * Retorno: JSX de um <nav>.
 * Onde é usado: listas paginadas do painel.
 */
export default function Pagination({ meta, onChange }) {
  // Página atual (Number converte texto em número; || 1 se não houver).
  const page = Number(meta.page || 1);
  // Total de páginas, no mínimo 1 (evita "Página 1 de 0").
  const totalPages = Math.max(Number(meta.totalPages || 0), 1);

  return (
    // <nav aria-label="Paginação">: região de navegação com nome para leitores de tela.
    <nav aria-label="Paginação" className="admin-pagination">
      <p>Página {page} de {totalPages} · {meta.total || 0} registros</p>
      <div>
        {/* "Anterior" desabilitado na primeira página. */}
        <button className="admin-button" disabled={page <= 1} onClick={() => onChange(page - 1)} type="button">Anterior</button>
        {/* "Próxima" desabilitado na última página. */}
        <button className="admin-button" disabled={page >= totalPages} onClick={() => onChange(page + 1)} type="button">Próxima</button>
      </div>
    </nav>
  );
}

/*
 * ============================================================================
 * RESUMO DO ARQUIVO
 * ============================================================================
 *
 * COMO FUNCIONA:
 *   A tela passa o meta da API e uma função de troca de página. Os botões chamam
 *   onChange(page ± 1) e ficam desabilitados nos limites.
 *
 * CONCEITOS IMPORTANTES PARA ESTUDAR:
 *   - Paginação no servidor (page, pageSize, total, totalPages).
 *   - Atributo disabled e limites (primeira/última página).
 *   - Math.max para valores mínimos.
 *   - Componentes "burros" (apresentacionais) que avisam o pai por callback.
 * ============================================================================
 */
