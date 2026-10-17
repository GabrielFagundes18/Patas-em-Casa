/*
 * ============================================================================
 * ARQUIVO: AdoptionFormModal.test.js
 * ============================================================================
 *
 * PARA QUE SERVE:
 *   Testes automatizados do formulário de adoção em 3 passos: caminho completo
 *   até o envio, validação de cada passo, opções exclusivas, erros vindos da API,
 *   falha de conexão, formatação do telefone e o texto "rotina" enviado.
 *
 * PRINCIPAIS ITENS:
 *   - pet: animal de exemplo (já no formato do petMapper).
 *   - renderForm(): desenha o formulário.
 *   - next(), send(): clicam em "Continuar" e "Enviar pedido".
 *   - fillStepOne/Two/Three(): preenchem cada passo.
 *   - 7 testes.
 *
 * CONEXÕES COM OUTROS ARQUIVOS:
 *   - ./AdoptionFormModal.jsx → componente e funções testadas.
 *   - api/adoptions           → enviarPedidoAdocao substituída por mock.
 * ============================================================================
 */

// Verificações extras.
import '@testing-library/jest-dom';
// Ferramentas da Testing Library.
import { fireEvent, render, screen, within } from '@testing-library/react';
// O formulário usa <Link>, então precisa de um roteador.
import { MemoryRouter } from 'react-router-dom';
// Componente e funções exportadas que serão testadas.
import { AdoptionFormModal, composeRotina, formatPhone } from './AdoptionFormModal';
// Função de envio (vira mock).
import { enviarPedidoAdocao } from 'api/adoptions';

// Substitui a API de adoções por uma função falsa.
jest.mock('api/adoptions', () => ({
  enviarPedidoAdocao: jest.fn(),
}));

// Animal de exemplo (formato da interface).
const pet = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  name: 'Nino',
  sex: 'Macho',
  meta: 'Cachorro • Vira-lata • 2 anos • Porte médio',
};

// Desenha o formulário; onClose é uma função vazia.
function renderForm() {
  return render(
    <MemoryRouter>
      <AdoptionFormModal pet={pet} onClose={() => {}} />
    </MemoryRouter>
  );
}

// Clica em "Continuar".
const next = () => fireEvent.click(screen.getByRole('button', { name: /continuar/i }));
// Clica em "Enviar pedido" (^ e $ garantem o texto exato).
const send = () => fireEvent.click(screen.getByRole('button', { name: /^enviar pedido$/i }));

// Preenche o passo 1 e avança.
function fillStepOne() {
  fireEvent.change(screen.getByLabelText('Nome completo'), { target: { value: 'Ana Souza' } });
  fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'ana@example.org' } });
  fireEvent.change(screen.getByLabelText('Telefone com DDD'), { target: { value: '(11) 98888-7777' } });
  fireEvent.change(screen.getByLabelText('Cidade'), { target: { value: 'Campinas' } });
  next();
}

// Preenche o passo 2 e avança.
function fillStepTwo() {
  fireEvent.click(screen.getByRole('radio', { name: 'Apartamento' }));
  fireEvent.click(screen.getByRole('checkbox', { name: 'Outros adultos' }));
  fireEvent.click(screen.getByRole('checkbox', { name: 'Crianças' }));
  fireEvent.click(screen.getByRole('checkbox', { name: 'Gatos' }));
  fireEvent.click(screen.getByRole('radio', { name: 'Metade do dia' }));
  fireEvent.change(screen.getByLabelText(/quer contar mais/i), { target: { value: 'Casa com tela e rotina tranquila.' } });
  next();
}

// Marca as duas confirmações do passo 3 (não envia).
function fillStepThree() {
  fireEvent.click(screen.getByRole('checkbox', { name: /ambiente seguro/i }));
  fireEvent.click(screen.getByRole('checkbox', { name: /acompanhamento pós-adoção/i }));
}

// Limpa o histórico dos mocks após cada teste.
afterEach(() => {
  jest.clearAllMocks();
});

// Teste 1: caminho completo — 3 passos, revisão e envio no formato da API.
test('goes through the three steps, reviews the data and sends the request in the API format', async () => {
  // A API responde com um protocolo.
  enviarPedidoAdocao.mockResolvedValueOnce({ protocolo: 'PAC-A1B2C3D4', status: 'novo' });
  renderForm();

  // Avança pelos passos conferindo o indicador.
  expect(screen.getByText('Passo 1 de 3')).toBeInTheDocument();
  fillStepOne();
  expect(screen.getByText('Passo 2 de 3')).toBeInTheDocument();
  fillStepTwo();
  expect(screen.getByText('Passo 3 de 3')).toBeInTheDocument();

  // A revisão mostra os dados (os parênteses do telefone estão escapados na regex).
  expect(screen.getByText(/Ana Souza · ana@example.org · \(11\) 98888-7777 · Campinas/)).toBeInTheDocument();
  expect(screen.getByText(/Apartamento · Outros adultos, Crianças · Metade do dia/)).toBeInTheDocument();
  fillStepThree();
  send();

  // Tela de sucesso com o protocolo e o link para outros animais.
  expect(await screen.findByText('PAC-A1B2C3D4')).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Pedido enviado!' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Ver outros animais' })).toHaveAttribute('href', '/adotar');
  // O corpo enviado à API: repare no texto "rotina" montado pelo composeRotina
  // e na ausência de visita_preferida_em (vazia → undefined → não enviada).
  expect(enviarPedidoAdocao).toHaveBeenCalledWith({
    animal_id: pet.id,
    nome: 'Ana Souza',
    email: 'ana@example.org',
    telefone: '(11) 98888-7777',
    cidade: 'Campinas',
    rotina: 'Moradia: Apartamento\nMora com: Outros adultos, Crianças\nOutros animais: Gatos\nTempo em casa: Metade do dia\n\nCasa com tela e rotina tranquila.',
    ambiente_seguro: true,
    ciente_pos_adocao: true,
    website: '',
  });
});

// Teste 2: cada passo mostra o que falta ao lado do campo e não avança.
test('each step shows what is missing next to the field and does not move on', () => {
  renderForm();

  // Continuar sem preencher nada: continua no passo 1, com erros.
  next();
  expect(screen.getByText('Passo 1 de 3')).toBeInTheDocument();
  expect(screen.getByLabelText('Nome completo')).toHaveAttribute('aria-invalid', 'true');
  expect(screen.getByText('Informe seu nome completo.')).toBeInTheDocument();
  expect(screen.getByText('Informe um telefone com DDD.')).toBeInTheDocument();

  // Preenche o passo 1; no passo 2, continuar sem escolher nada dá erro.
  fillStepOne();
  next();
  expect(screen.getByText('Passo 2 de 3')).toBeInTheDocument();
  expect(screen.getByText('Escolha o tipo de moradia.')).toBeInTheDocument();
  // Um <fieldset> com <legend> tem o papel "group" com o nome da legenda.
  expect(screen.getByRole('group', { name: 'Onde você mora?' })).toHaveAttribute('aria-invalid', 'true');

  // Preenche o passo 2; no passo 3, enviar sem confirmar dá erro e a API não é chamada.
  fillStepTwo();
  send();
  expect(screen.getByText('Confirme que você tem um ambiente seguro para o animal.')).toBeInTheDocument();
  expect(enviarPedidoAdocao).not.toHaveBeenCalled();
});

// Teste 3: opções "nenhum" excluem as outras da mesma pergunta.
test('"none" options exclude the others in the same question', () => {
  renderForm();
  fillStepOne();

  // Marca "Cães" e depois "Não tenho": "Cães" é desmarcado.
  fireEvent.click(screen.getByRole('checkbox', { name: 'Cães' }));
  fireEvent.click(screen.getByRole('checkbox', { name: 'Não tenho' }));
  expect(screen.getByRole('checkbox', { name: 'Cães' })).not.toBeChecked();
  expect(screen.getByRole('checkbox', { name: 'Não tenho' })).toBeChecked();

  // Marca "Gatos": "Não tenho" é desmarcado.
  fireEvent.click(screen.getByRole('checkbox', { name: 'Gatos' }));
  expect(screen.getByRole('checkbox', { name: 'Não tenho' })).not.toBeChecked();
});

// Teste 4: erro da API num campo leva de volta ao passo desse campo.
test('an API error on a field takes the person back to that step with the message', async () => {
  // A API recusa com 422 apontando o campo "telefone" (que está no passo 1).
  enviarPedidoAdocao.mockRejectedValueOnce({
    response: {
      status: 422,
      data: {
        error: {
          code: 'VALIDACAO_INVALIDA',
          message: 'Verifique os campos informados.',
          details: [{ field: 'telefone', message: 'Informe um telefone com DDD.' }],
        },
      },
    },
  });
  renderForm();
  fillStepOne();
  fillStepTwo();
  fillStepThree();
  send();

  // Alerta com a mensagem geral...
  const alert = await screen.findByRole('alert');
  expect(alert).toHaveTextContent('Verifique os campos informados.');
  // ...volta ao passo 1, com o telefone marcado como inválido, e sem tela de sucesso.
  expect(screen.getByText('Passo 1 de 3')).toBeInTheDocument();
  expect(screen.getByLabelText('Telefone com DDD')).toHaveAttribute('aria-invalid', 'true');
  expect(screen.queryByRole('heading', { name: 'Pedido enviado!' })).not.toBeInTheDocument();
});

// Teste 5: falha de conexão mostra mensagem amigável (sem detalhes técnicos).
test('explains connection failures without exposing technical details', async () => {
  // Erro sem "response" = falha de rede.
  enviarPedidoAdocao.mockRejectedValueOnce(new Error('Network Error'));
  renderForm();
  fillStepOne();
  fillStepTwo();
  fillStepThree();
  send();

  expect(await screen.findByRole('alert')).toHaveTextContent(/não foi possível conectar ao servidor/i);
  // O botão volta a ficar habilitado para tentar de novo.
  expect(screen.getByRole('button', { name: /^enviar pedido$/i })).toBeEnabled();
});

// Teste 6: telefone formatado ao sair do campo; formatPhone em outros casos.
test('the phone is formatted when leaving the field', () => {
  renderForm();
  const phone = screen.getByLabelText('Telefone com DDD');
  // Digita só números e sai do campo (blur).
  fireEvent.change(phone, { target: { value: '11988887777' } });
  fireEvent.blur(phone);
  expect(phone).toHaveValue('(11) 98888-7777');

  // Telefone fixo (10 dígitos).
  expect(formatPhone('1140000000')).toBe('(11) 4000-0000');
  // Com código do país (mais de 11 dígitos): fica como digitado.
  expect(formatPhone('+55 11 98888-7777')).toBe('+55 11 98888-7777');
});

// Teste 7: o texto "rotina" segue uma ordem fixa e ignora texto livre vazio.
test('the routine text sent to the API lists the answers in a fixed order', () => {
  const rotina = composeRotina({
    moradia: 'Casa',
    moradores: ['Só eu'],
    outrosAnimais: ['Não tenho'],
    tempoEmCasa: 'Quase o dia todo',
    rotinaLivre: '   ', // só espaços → tratado como vazio
  });
  expect(rotina).toBe('Moradia: Casa\nMora com: Só eu\nOutros animais: Não tenho\nTempo em casa: Quase o dia todo');
  // Nenhum diálogo aberto neste teste (não desenhamos o componente).
  expect(within(document.body).queryByRole('dialog')).not.toBeInTheDocument();
});

/*
 * ============================================================================
 * RESUMO DO ARQUIVO
 * ============================================================================
 *
 * COMO O FLUXO FUNCIONA:
 *   Funções auxiliares preenchem cada passo como um usuário faria. Os testes
 *   cobrem o caminho feliz (até o protocolo), validações por passo, regras das
 *   opções exclusivas, erros da API (por campo e de conexão) e as funções puras
 *   formatPhone e composeRotina.
 *
 * CONCEITOS IMPORTANTES PARA ESTUDAR:
 *   - Testar formulários de várias etapas com funções auxiliares reutilizáveis.
 *   - getByLabelText, getByRole('radio'|'checkbox'|'group'), toBeChecked, toBeEnabled.
 *   - Verificar atributos de acessibilidade (aria-invalid).
 *   - fireEvent.change / click / blur.
 *   - Simular respostas de erro (422) e falhas de rede.
 *   - Testar funções puras exportadas junto do componente.
 * ============================================================================
 */
