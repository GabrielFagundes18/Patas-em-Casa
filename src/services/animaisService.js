// O quê: importa o cliente HTTP centralizado.
// Como: o módulo reutiliza a instância Axios com baseURL e cabeçalhos definidos na camada de infraestrutura.
// Para quê: mantém o serviço focado no contrato de animais, sem conhecer detalhes do transporte.
import api from './api';

// O quê: busca todos os animais disponíveis no endpoint da aplicação.
// Como: aguarda api.get e retorna data ou uma lista vazia quando a resposta não contém dados.
// Para quê: fornece uma API simples para telas que precisam preencher o catálogo.
export async function buscarTodoAnimais() {
  const resposta = await api.get('/animais/BuscaTodoAnimais');
  return resposta.data ?? [];
}