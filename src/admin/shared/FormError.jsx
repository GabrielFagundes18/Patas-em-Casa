/*
 * ============================================================================
 * ARQUIVO: FormError.jsx
 * ============================================================================
 *
 * PARA QUE SERVE:
 *   Componente que mostra o ERRO devolvido pela API num formulário do painel:
 *   a mensagem principal e, se houver, a lista de detalhes por campo (ex.:
 *   "A senha precisa ter 12 caracteres", "E-mail já cadastrado").
 *
 * PRINCIPAIS ITENS:
 *   - FormError({ error, fallback }): o componente (exportado como padrão).
 *
 * CONEXÕES COM OUTROS ARQUIVOS:
 *   - Não importa nada.
 *   - Estilo .admin-alert.is-error em admin/styles/admin.css.
 *   - Usado pelos formulários do painel (equipe, voluntários, doações, histórias...).
 *   - Lê o formato de erro do backend: { error: { message, details: [{ field, message }] } }.
 * ============================================================================
 */

/*
 * COMPONENTE: FormError
 * O que faz: exibe a mensagem de erro da API e seus detalhes (sem repetições).
 * Parâmetros (props):
 *   - error (erro do axios | null): o erro capturado no envio do formulário.
 *   - fallback (string): mensagem usada se a API não mandar uma.
 * Retorno: JSX com o alerta, ou null se não houver erro.
 * Onde é usado: formulários do painel.
 */
// Erro devolvido pela API com os detalhes por campo (ex.: política de senha, e-mail já cadastrado).
export default function FormError({ error, fallback }) {
  // Sem erro, não mostra nada.
  if (!error) return null;

  // Objeto de erro no formato do backend (ou undefined).
  const apiError = error?.response?.data?.error;
  // Lista de mensagens de detalhe:
  //   .map pega só o texto; .filter(Boolean) remove vazios;
  //   new Set(...) remove repetidas; [...set] volta a ser array.
  const details = [...new Set((apiError?.details || []).map((detail) => detail.message).filter(Boolean))];

  return (
    // role="alert": leitores de tela anunciam o erro imediatamente.
    <div className="admin-alert is-error" role="alert">
      {/* Mensagem principal (da API ou a padrão). */}
      <p>{apiError?.message || fallback}</p>
      {/* Lista de detalhes, se houver. */}
      {details.length > 0 ? (
        <ul>
          {details.map((message) => <li key={message}>{message}</li>)}
        </ul>
      ) : null}
    </div>
  );
}

/*
 * ============================================================================
 * RESUMO DO ARQUIVO
 * ============================================================================
 *
 * COMO FUNCIONA:
 *   O formulário guarda o erro do envio num estado e desenha <FormError error={...} />.
 *   O componente extrai a mensagem e os detalhes do formato padrão do backend e os mostra.
 *
 * CONCEITOS IMPORTANTES PARA ESTUDAR:
 *   - Formato padronizado de erros numa API.
 *   - Set para remover duplicados.
 *   - Encadeamento opcional (?.) em objetos profundos.
 *   - Componentes que devolvem null.
 *   - Acessibilidade: role="alert".
 * ============================================================================
 */
