/*
 * ============================================================================
 * ARQUIVO: SearchField.jsx
 * ============================================================================
 *
 * PARA QUE SERVE:
 *   Campo de BUSCA das listas do painel. Diferente de uma busca "ao digitar", ele
 *   só aplica o filtro quando a pessoa aperta Enter (envio do formulário), para
 *   não fazer uma requisição à API a cada tecla.
 *
 * PRINCIPAIS ITENS:
 *   - SearchField({ value, onSearch, label }): o componente (exportado como padrão).
 *
 * CONEXÕES COM OUTROS ARQUIVOS:
 *   - react (useEffect, useState), lucide-react (ícone Search).
 *   - Estilo .admin-search em admin/styles/admin.css.
 *   - Usado pelas listagens do painel (adoções, adotantes, doações, voluntários, histórias, equipe).
 * ============================================================================
 */

// Hooks do React.
import { useEffect, useState } from 'react';
// Ícone de lupa.
import { Search } from 'lucide-react';

/*
 * COMPONENTE: SearchField
 * O que faz: mostra um campo de texto e avisa a busca só ao enviar.
 * Parâmetros (props):
 *   - value (string, padrão ''): busca atualmente aplicada (vinda da URL/filtros).
 *   - onSearch (função): recebe o texto buscado (sem espaços nas pontas).
 *   - label (string): texto do rótulo acessível e do placeholder.
 * Retorno: JSX de um <form role="search">.
 * Onde é usado: telas de listagem do painel.
 */
// Campo de busca que só aplica o filtro ao enviar (Enter ou botão), sem consultar a cada tecla.
export default function SearchField({ value = '', onSearch, label }) {
  // "Rascunho": o que está sendo digitado (ainda não aplicado).
  const [draft, setDraft] = useState(value);

  // Se a busca aplicada mudar por fora (ex.: "Limpar filtros", voltar no navegador), o campo acompanha.
  useEffect(() => setDraft(value), [value]);

  return (
    <form
      className="admin-search"
      // Ao enviar (Enter): impede o recarregamento e aplica a busca.
      onSubmit={(event) => {
        event.preventDefault();
        onSearch(draft.trim());
      }}
      // role="search" identifica a região de busca para leitores de tela.
      role="search"
    >
      {/* Lupa decorativa. */}
      <Search aria-hidden="true" size={18} />
      {/* Campo controlado pelo rascunho. maxLength limita o tamanho da busca. */}
      <input aria-label={label} maxLength="120" onChange={(event) => setDraft(event.target.value)} placeholder={label} value={draft} />
    </form>
  );
}

/*
 * ============================================================================
 * RESUMO DO ARQUIVO
 * ============================================================================
 *
 * COMO FUNCIONA:
 *   O texto digitado fica no estado "draft". Ao apertar Enter, o formulário chama
 *   onSearch(draft) — a tela então grava a busca na URL e recarrega a lista.
 *   Se a busca mudar de fora, o useEffect atualiza o campo.
 *
 * CONCEITOS IMPORTANTES PARA ESTUDAR:
 *   - Estado de rascunho x valor aplicado.
 *   - Sincronizar estado local com props (useEffect com dependência).
 *   - Formulário com um único campo (Enter envia).
 *   - Evitar requisições excessivas (alternativa ao "debounce").
 *   - role="search" e aria-label.
 * ============================================================================
 */
