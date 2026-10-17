/*
 * ============================================================================
 * ARQUIVO: DonationPages.test.js
 * ============================================================================
 *
 * PARA QUE SERVE:
 *   Testes automatizados das três páginas de doação: a página de doação (envio e
 *   redirecionamento ao Mercado Pago; indisponibilidade com 503), a página de
 *   retorno (confirmação) e a página de cancelamento da doação mensal.
 *
 * PRINCIPAIS ITENS:
 *   - jest.mock('api/donations') → as 4 funções de doação viram mocks.
 *   - renderAt(path, element, route): desenha uma página numa rota.
 *   - 4 testes.
 *
 * CONEXÕES COM OUTROS ARQUIVOS:
 *   - ./DonationPage.jsx (e o objeto redirectTo), ./DonationReturnPage.jsx,
 *     ./CancelSubscriptionPage.jsx → páginas testadas.
 *   - api/donations → substituído por mocks.
 * ============================================================================
 */

// Verificações extras.
import '@testing-library/jest-dom';
// Ferramentas da Testing Library.
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
// Roteador de memória e rotas.
import { MemoryRouter, Route, Routes } from 'react-router-dom';
// Páginas testadas.
import CancelSubscriptionPage from './CancelSubscriptionPage';
// Import padrão (DonationPage) e nomeado (redirectTo) do mesmo arquivo.
import DonationPage, { redirectTo } from './DonationPage';
import DonationReturnPage from './DonationReturnPage';
// Funções de API (viram mocks).
import { cancelarDoacaoMensal, consultarDoacao, iniciarDoacao, pedirLinkCancelamento } from 'api/donations';

// Substitui o módulo de doações por funções falsas.
jest.mock('api/donations', () => ({
  iniciarDoacao: jest.fn(),
  consultarDoacao: jest.fn(),
  pedirLinkCancelamento: jest.fn(),
  cancelarDoacaoMensal: jest.fn(),
}));

/*
 * FUNÇÃO AUXILIAR: renderAt
 * O que faz: desenha "element" na rota "route" a partir do endereço "path".
 */
function renderAt(path, element, route) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes><Route element={element} path={route} /></Routes>
    </MemoryRouter>
  );
}

// Teste 1: a página de doação envia os dados e redireciona ao Mercado Pago.
test('the donation page sends amount, type and donor, then goes to Mercado Pago', async () => {
  // jest.spyOn "espiona" redirectTo.go; mockImplementation troca por uma função vazia
  // (assim o teste não tenta sair da página de verdade).
  const go = jest.spyOn(redirectTo, 'go').mockImplementation(() => {});
  // A API devolve a URL do checkout.
  iniciarDoacao.mockResolvedValue({ checkout_url: 'https://mp.example/checkout' });
  renderAt('/doar', <DonationPage />, '/doar');

  // Escolhe doação mensal e valor livre de 35.
  fireEvent.click(screen.getByRole('radio', { name: 'Todo mês' }));
  fireEvent.click(screen.getByRole('radio', { name: 'Outro valor' }));
  fireEvent.change(screen.getByLabelText(/quanto você quer doar/i), { target: { value: '35' } });
  // Preenche nome e e-mail (campos de texto têm o papel "textbox").
  fireEvent.change(screen.getByRole('textbox', { name: 'Nome' }), { target: { value: 'Ana Souza' } });
  fireEvent.change(screen.getByRole('textbox', { name: 'E-mail' }), { target: { value: 'ana@example.org' } });
  // Botão "Doar R$ 35,00 por mês". \$ escapa o cifrão; \s? aceita um espaço opcional
  // (o Intl pode usar um espaço especial entre "R$" e o número).
  fireEvent.click(screen.getByRole('button', { name: /doar r\$\s?35,00 por mês/i }));

  // Espera o redirecionamento para a URL do checkout.
  await waitFor(() => expect(go).toHaveBeenCalledWith('https://mp.example/checkout'));
  // Dados enviados à API.
  expect(iniciarDoacao).toHaveBeenCalledWith({ valor: 35, nome: 'Ana Souza', email: 'ana@example.org', tipo: 'recorrente' });
  // Restaura a função original (boa prática ao usar spyOn).
  go.mockRestore();
});

// Teste 2: com a doação online indisponível (503), a página aponta para o Pix.
test('when online donation is unavailable the page points to the Pix key', async () => {
  iniciarDoacao.mockRejectedValue({ response: { status: 503, data: { error: { message: 'A doação online está temporariamente indisponível. Use a chave Pix da página.' } } } });
  renderAt('/doar', <DonationPage />, '/doar');

  fireEvent.change(screen.getByRole('textbox', { name: 'Nome' }), { target: { value: 'Ana Souza' } });
  fireEvent.change(screen.getByRole('textbox', { name: 'E-mail' }), { target: { value: 'ana@example.org' } });
  // Valor padrão: R$ 50,00.
  fireEvent.click(screen.getByRole('button', { name: /doar r\$\s?50,00/i }));

  // Alerta com a mensagem e título da coluna lateral trocado.
  expect(await screen.findByRole('alert')).toHaveTextContent('temporariamente indisponível');
  expect(screen.getByRole('heading', { name: 'Doe agora pelo Pix' })).toBeInTheDocument();
});

// Teste 3: a página de retorno confirma a doação.
test('the return page confirms the donation', async () => {
  consultarDoacao.mockResolvedValue({ tipo: 'unica', status: 'confirmada', valor: 50 });
  renderAt('/doar/retorno?ref=abc', <DonationReturnPage />, '/doar/retorno');

  expect(await screen.findByRole('heading', { name: 'Muito obrigado!' })).toBeInTheDocument();
  expect(screen.getByText(/Valor: R\$\s?50,00/)).toBeInTheDocument();
  // Consultou com a referência da URL.
  expect(consultarDoacao).toHaveBeenCalledWith('abc', expect.anything());
});

// Teste 4: cancelamento com token e pedido de novo link sem token.
test('the cancellation page cancels with the e-mailed token, or sends a new link', async () => {
  // --- Parte 1: com token ---
  cancelarDoacaoMensal.mockResolvedValue({ status: 'cancelada', valor: 25 });
  // render devolve utilidades; "unmount" desmonta a página (para desenhar outra depois).
  const { unmount } = renderAt('/doar/cancelar?token=tok-123456789012345678901', <CancelSubscriptionPage />, '/doar/cancelar');
  fireEvent.click(screen.getByRole('button', { name: 'Sim, cancelar' }));
  expect(await screen.findByRole('heading', { name: 'Doação mensal cancelada' })).toBeInTheDocument();
  expect(cancelarDoacaoMensal).toHaveBeenCalledWith('tok-123456789012345678901');
  unmount();

  // --- Parte 2: sem token (pede o link por e-mail) ---
  pedirLinkCancelamento.mockResolvedValue({ mensagem: 'Se houver doação mensal ativa com este e-mail, enviaremos o link de cancelamento.' });
  renderAt('/doar/cancelar', <CancelSubscriptionPage />, '/doar/cancelar');
  fireEvent.change(screen.getByRole('textbox', { name: 'E-mail' }), { target: { value: 'ana@example.org' } });
  fireEvent.click(screen.getByRole('button', { name: 'Enviar link de cancelamento' }));
  expect(await screen.findByRole('heading', { name: 'Confira seu e-mail' })).toBeInTheDocument();
});

/*
 * ============================================================================
 * RESUMO DO ARQUIVO
 * ============================================================================
 *
 * COMO O FLUXO FUNCIONA:
 *   As funções de API são mocks programados em cada teste. As páginas são
 *   desenhadas em suas rotas, preenchidas como um usuário faria, e os testes
 *   conferem as chamadas à API, o redirecionamento e as mensagens na tela.
 *
 * CONCEITOS IMPORTANTES PARA ESTUDAR:
 *   - jest.spyOn + mockImplementation + mockRestore (espionar e substituir uma função).
 *   - Por que isolar efeitos como window.location em objetos (redirectTo).
 *   - Expressões regulares com caracteres especiais escapados (\$) e espaços opcionais (\s?).
 *   - unmount para testar dois cenários no mesmo teste.
 *   - waitFor e findBy* para efeitos assíncronos.
 * ============================================================================
 */
