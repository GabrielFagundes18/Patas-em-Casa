/*
 * ============================================================================
 * ARQUIVO: TeamPage.test.js
 * ============================================================================
 *
 * PARA QUE SERVE:
 *   Testes automatizados da tela "Equipe e acessos": adicionar membro com senha
 *   inicial, mostrar a política de senha devolvida pela API, esconder o botão sem
 *   permissão, convidar por e-mail (avisando se o envio falhou) e editar/redefinir
 *   senha/reenviar convite.
 *
 * PRINCIPAIS ITENS:
 *   - admin: usuário com permissões de equipe.
 *   - member: membro de exemplo.
 *   - 5 testes.
 *
 * CONEXÕES COM OUTROS ARQUIVOS:
 *   - ./TeamPage.jsx (e TeamMemberDialog, ResetPasswordDialog) → telas testadas.
 *   - ./teamService → substituído por mocks.
 * ============================================================================
 */

// Verificações extras.
import '@testing-library/jest-dom';
// Ferramentas da Testing Library.
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
// Roteador de memória.
import { MemoryRouter } from 'react-router-dom';
// Tela testada.
import TeamPage from './TeamPage';
// Funções de API (viram mocks).
import { createTeamMember, listTeam, resetTeamMemberPassword, sendTeamInvite, updateTeamMember } from './teamService';

// Substitui o service.
jest.mock('./teamService', () => ({
  createTeamMember: jest.fn(),
  listTeam: jest.fn(),
  resetTeamMemberPassword: jest.fn(),
  sendTeamInvite: jest.fn(),
  updateTeamMember: jest.fn(),
}));

// Administrador e membro de exemplo.
const admin = { permissions: ['team:read', 'team:create', 'team:update'] };
const member = { id: 'u1', nome: 'Carla Lima', email: 'carla@example.org', cargo: 'gestor_animais', ativo: true, criado_em: '2026-09-01T12:00:00.000Z' };

// Antes de cada teste: a lista tem a Carla.
beforeEach(() => {
  listTeam.mockResolvedValue({ items: [member], meta: { page: 1, pageSize: 20, total: 1, totalPages: 1 } });
});

// Teste 1: adicionar membro com cargo e senha inicial.
test('adds a team member with role and initial password', async () => {
  createTeamMember.mockResolvedValue({ ...member, id: 'u2', nome: 'Davi Rocha', cargo: 'financeiro' });
  render(<MemoryRouter><TeamPage user={admin} /></MemoryRouter>);

  fireEvent.click(await screen.findByRole('button', { name: /adicionar membro/i }));
  const form = within(screen.getByRole('dialog'));
  // Escolhe "Definir senha inicial" (o padrão é convite).
  fireEvent.click(form.getByRole('radio', { name: /definir senha inicial/i }));
  // Nome com espaços nas pontas (devem ser removidos).
  fireEvent.change(form.getByRole('textbox', { name: /nome completo/i }), { target: { value: ' Davi Rocha ' } });
  fireEvent.change(form.getByRole('textbox', { name: /e-mail de acesso/i }), { target: { value: 'davi@example.org' } });
  fireEvent.change(form.getByRole('combobox', { name: /cargo/i }), { target: { value: 'financeiro' } });
  fireEvent.change(form.getByLabelText(/^senha inicial/i), { target: { value: 'SenhaForte2026' } });
  fireEvent.click(form.getByRole('button', { name: 'Adicionar membro' }));

  // Aviso com o nome do cargo traduzido.
  expect(await screen.findByText(/Davi Rocha agora faz parte da equipe como Atendimento e Doações/)).toBeInTheDocument();
  expect(createTeamMember).toHaveBeenCalledWith({ nome: 'Davi Rocha', email: 'davi@example.org', cargo: 'financeiro', senha: 'SenhaForte2026', ativo: true });
  // A lista foi recarregada.
  await waitFor(() => expect(listTeam).toHaveBeenCalledTimes(2));
});

// Teste 2: detalhes da política de senha vindos da API; e o gerador de senhas.
test('shows the password policy details returned by the API', async () => {
  createTeamMember.mockRejectedValue({
    response: { data: { error: { message: 'A senha não atende à política de senha.', details: [{ field: 'senha', message: 'Inclua ao menos um número.' }] } } },
  });
  render(<MemoryRouter><TeamPage user={admin} /></MemoryRouter>);

  fireEvent.click(await screen.findByRole('button', { name: /adicionar membro/i }));
  const form = within(screen.getByRole('dialog'));
  fireEvent.click(form.getByRole('radio', { name: /definir senha inicial/i }));
  // "Gerar senha" preenche 14 caracteres com pelo menos um dígito e uma letra.
  // (?=.*\d) e (?=.*[A-Za-z]) são "lookaheads": exigem que exista um dígito e uma letra em algum lugar.
  fireEvent.click(form.getByRole('button', { name: /gerar senha/i }));
  expect(form.getByLabelText(/^senha inicial/i).value).toMatch(/^(?=.*\d)(?=.*[A-Za-z])[A-Za-z0-9]{14}$/);

  fireEvent.change(form.getByRole('textbox', { name: /nome completo/i }), { target: { value: 'Davi Rocha' } });
  fireEvent.change(form.getByRole('textbox', { name: /e-mail de acesso/i }), { target: { value: 'davi@example.org' } });
  fireEvent.change(form.getByRole('combobox', { name: /cargo/i }), { target: { value: 'financeiro' } });
  fireEvent.click(form.getByRole('button', { name: 'Adicionar membro' }));

  // O detalhe aparece e a janela continua aberta.
  expect(await screen.findByText('Inclua ao menos um número.')).toBeInTheDocument();
  expect(screen.getByRole('dialog')).toBeInTheDocument();
});

// Teste 3: sem team:create, o botão de adicionar não aparece.
test('hides the add button without the team:create permission', async () => {
  render(<MemoryRouter><TeamPage user={{ permissions: ['team:read'] }} /></MemoryRouter>);

  expect(await screen.findByText('Carla Lima')).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /adicionar membro/i })).not.toBeInTheDocument();
});

// Teste 4: convite por e-mail (padrão) e aviso quando o envio falha.
test('invites a new member by e-mail and warns when the invite could not be sent', async () => {
  createTeamMember.mockResolvedValue({ ...member, id: 'u3', nome: 'Eva Lopes', cargo: 'gestor_ong', convite: { enviado: false, motivo: 'O envio de e-mails não está configurado no servidor (SMTP).' } });
  render(<MemoryRouter><TeamPage user={admin} /></MemoryRouter>);

  fireEvent.click(await screen.findByRole('button', { name: /adicionar membro/i }));
  const form = within(screen.getByRole('dialog'));
  // O convite já vem marcado e o campo de senha não aparece.
  expect(form.getByRole('radio', { name: /enviar convite por e-mail/i })).toBeChecked();
  expect(form.queryByLabelText(/^senha inicial/i)).not.toBeInTheDocument();
  fireEvent.change(form.getByRole('textbox', { name: /nome completo/i }), { target: { value: 'Eva Lopes' } });
  fireEvent.change(form.getByRole('textbox', { name: /e-mail de acesso/i }), { target: { value: 'eva@example.org' } });
  fireEvent.change(form.getByRole('combobox', { name: /cargo/i }), { target: { value: 'gestor_ong' } });
  fireEvent.click(form.getByRole('button', { name: 'Adicionar e enviar convite' }));

  // Aviso de atenção e corpo com enviar_convite: true.
  expect(await screen.findByText(/O convite para Eva Lopes não foi enviado/)).toBeInTheDocument();
  expect(createTeamMember).toHaveBeenCalledWith({ nome: 'Eva Lopes', email: 'eva@example.org', cargo: 'gestor_ong', ativo: true, enviar_convite: true });
});

// Teste 5: editar, redefinir senha e reenviar convite.
test('edits, resets the password and resends the invite of a member', async () => {
  updateTeamMember.mockResolvedValue({ ...member, cargo: 'gestor_ong' });
  resetTeamMemberPassword.mockResolvedValue();
  sendTeamInvite.mockResolvedValue({ enviado: true });
  render(<MemoryRouter><TeamPage user={admin} /></MemoryRouter>);

  // --- Editar o cargo ---
  fireEvent.click(await screen.findByRole('button', { name: 'Editar Carla Lima' }));
  // "let" porque "form" será reatribuído para a próxima janela.
  let form = within(screen.getByRole('dialog'));
  fireEvent.change(form.getByRole('combobox', { name: /cargo/i }), { target: { value: 'gestor_ong' } });
  fireEvent.click(form.getByRole('button', { name: 'Salvar alterações' }));
  expect(await screen.findByText('Dados de Carla Lima atualizados.')).toBeInTheDocument();
  expect(updateTeamMember).toHaveBeenCalledWith('u1', { nome: 'Carla Lima', email: 'carla@example.org', cargo: 'gestor_ong', ativo: true });

  // --- Nova senha ---
  fireEvent.click(await screen.findByRole('button', { name: 'Nova senha para Carla Lima' }));
  form = within(screen.getByRole('dialog'));
  fireEvent.change(form.getByLabelText(/nova senha/i), { target: { value: 'OutraSenha2026' } });
  fireEvent.click(form.getByRole('button', { name: 'Definir nova senha' }));
  expect(await screen.findByText(/Nova senha definida para Carla Lima/)).toBeInTheDocument();
  expect(resetTeamMemberPassword).toHaveBeenCalledWith('u1', 'OutraSenha2026');

  // --- Reenviar convite ---
  fireEvent.click(screen.getByRole('button', { name: 'Enviar convite para Carla Lima' }));
  expect(await screen.findByText('Convite enviado para Carla Lima. O link vale por 72 horas.')).toBeInTheDocument();
});

/*
 * ============================================================================
 * RESUMO DO ARQUIVO
 * ============================================================================
 *
 * COMO O FLUXO FUNCIONA:
 *   Com o service falso, os testes percorrem os fluxos de gestão da equipe como
 *   administrador (e como leitor) e conferem os dados enviados, os avisos e o
 *   efeito das permissões.
 *
 * CONCEITOS IMPORTANTES PARA ESTUDAR:
 *   - Expressões regulares com lookahead (?=...) para validar senhas.
 *   - toBeChecked, queryByLabelText e testes de campos condicionais.
 *   - Vários fluxos no mesmo teste reaproveitando a tela (let form = ...).
 *   - Testar mensagens de erro detalhadas vindas da API.
 * ============================================================================
 */
