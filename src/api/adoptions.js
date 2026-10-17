/*
 * ============================================================================
 * ARQUIVO: adoptions.js (pasta api)
 * ============================================================================
 *
 * PARA QUE SERVE:
 *   Envia ao backend o pedido de pré-adoção que o visitante preenche no site.
 *
 * PRINCIPAIS FUNÇÕES:
 *   - enviarPedidoAdocao(pedido) → registra o pedido de adoção.
 *
 * CONEXÕES COM OUTROS ARQUIVOS:
 *   - ./client.js → instância do axios configurada.
 *   - Usado por: features/adoption/AdoptionFormModal/AdoptionFormModal.jsx (formulário de adoção).
 *   - No backend: rota POST /api/v1/public/adoption-requests.
 * ============================================================================
 */

// O quê: importa o cliente HTTP centralizado.
// Como: reutiliza a instância Axios com baseURL definida em services/api.js.
// Para quê: manter o envio do pedido desacoplado do componente de formulário.
// (Observação: o comentário acima cita "services/api.js", mas o arquivo real é ./client.js.)
import api from './client';

/*
 * FUNÇÃO: enviarPedidoAdocao
 * O que faz: envia os dados do formulário de adoção para o backend.
 * Parâmetros:
 *   - pedido (objeto): dados do adotante e do animal escolhido (nome, contato,
 *     moradia, respostas do questionário, id do animal etc.).
 * Retorno (Promise → objeto): o que o backend devolve em "data" — o protocolo do pedido,
 *   o status e o animal. Se o envio falhar, a Promise é rejeitada com o erro.
 * Onde é usada: no envio do AdoptionFormModal.jsx.
 */
// O quê: envia uma solicitação de pré-adoção para o backend.
// Como: faz POST em /api/v1/public/adoption-requests e devolve o conteúdo de data (protocolo, status e animal).
// Para quê: registrar o pedido no banco para que a equipe possa fazer a triagem.
export async function enviarPedidoAdocao(pedido) {
  // POST cria um novo registro. O objeto "pedido" é enviado como JSON no corpo da requisição.
  const resposta = await api.post('/api/v1/public/adoption-requests', pedido);
  // Devolve só a parte útil da resposta.
  return resposta.data.data;
}

/*
 * ============================================================================
 * RESUMO DO ARQUIVO
 * ============================================================================
 *
 * COMO O FLUXO FUNCIONA:
 *   O formulário de adoção chama enviarPedidoAdocao(pedido) → a função faz um POST
 *   para o backend → espera a resposta → devolve o protocolo/status para a tela
 *   mostrar a confirmação ao visitante.
 *
 * CONCEITOS IMPORTANTES PARA ESTUDAR:
 *   - Requisição POST com corpo JSON.
 *   - async/await.
 *   - Camada de serviço: separar "falar com a API" de "mostrar a tela".
 * ============================================================================
 */
