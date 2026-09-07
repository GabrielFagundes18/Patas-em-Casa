import api from './api';

export async function buscarTodoAnimais() {
  const resposta = await api.get('/animais/BuscaTodoAnimais');
  return resposta.data ?? [];
}