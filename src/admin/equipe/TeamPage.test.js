import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import TeamPage from './TeamPage';
import { createTeamMember, listTeam } from './teamService';

jest.mock('./teamService', () => ({ createTeamMember: jest.fn(), listTeam: jest.fn() }));

const admin = { permissions: ['team:read', 'team:create', 'team:update'] };
const member = { id: 'u1', nome: 'Carla Lima', email: 'carla@example.org', cargo: 'gestor_animais', ativo: true, criado_em: '2026-09-01T12:00:00.000Z' };

beforeEach(() => {
  listTeam.mockResolvedValue({ items: [member], meta: { page: 1, pageSize: 20, total: 1, totalPages: 1 } });
});

test('adds a team member with role and initial password', async () => {
  createTeamMember.mockResolvedValue({ ...member, id: 'u2', nome: 'Davi Rocha', cargo: 'financeiro' });
  render(<MemoryRouter><TeamPage user={admin} /></MemoryRouter>);

  fireEvent.click(await screen.findByRole('button', { name: /adicionar membro/i }));
  const form = within(screen.getByRole('dialog'));
  fireEvent.change(form.getByRole('textbox', { name: /nome completo/i }), { target: { value: ' Davi Rocha ' } });
  fireEvent.change(form.getByRole('textbox', { name: /e-mail de acesso/i }), { target: { value: 'davi@example.org' } });
  fireEvent.change(form.getByRole('combobox', { name: /cargo/i }), { target: { value: 'financeiro' } });
  fireEvent.change(form.getByLabelText(/senha inicial/i), { target: { value: 'SenhaForte2026' } });
  fireEvent.click(form.getByRole('button', { name: 'Adicionar membro' }));

  expect(await screen.findByText(/Davi Rocha agora faz parte da equipe como Atendimento e Doações/)).toBeInTheDocument();
  expect(createTeamMember).toHaveBeenCalledWith({ nome: 'Davi Rocha', email: 'davi@example.org', cargo: 'financeiro', senha: 'SenhaForte2026', ativo: true });
  await waitFor(() => expect(listTeam).toHaveBeenCalledTimes(2));
});

test('shows the password policy details returned by the API', async () => {
  createTeamMember.mockRejectedValue({
    response: { data: { error: { message: 'A senha não atende à política de senha.', details: [{ field: 'senha', message: 'Inclua ao menos um número.' }] } } },
  });
  render(<MemoryRouter><TeamPage user={admin} /></MemoryRouter>);

  fireEvent.click(await screen.findByRole('button', { name: /adicionar membro/i }));
  const form = within(screen.getByRole('dialog'));
  fireEvent.click(form.getByRole('button', { name: /gerar senha/i }));
  expect(form.getByLabelText(/senha inicial/i).value).toMatch(/^(?=.*\d)(?=.*[A-Za-z])[A-Za-z0-9]{14}$/);

  fireEvent.change(form.getByRole('textbox', { name: /nome completo/i }), { target: { value: 'Davi Rocha' } });
  fireEvent.change(form.getByRole('textbox', { name: /e-mail de acesso/i }), { target: { value: 'davi@example.org' } });
  fireEvent.change(form.getByRole('combobox', { name: /cargo/i }), { target: { value: 'financeiro' } });
  fireEvent.click(form.getByRole('button', { name: 'Adicionar membro' }));

  expect(await screen.findByText('Inclua ao menos um número.')).toBeInTheDocument();
  expect(screen.getByRole('dialog')).toBeInTheDocument();
});

test('hides the add button without the team:create permission', async () => {
  render(<MemoryRouter><TeamPage user={{ permissions: ['team:read'] }} /></MemoryRouter>);

  expect(await screen.findByText('Carla Lima')).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /adicionar membro/i })).not.toBeInTheDocument();
});
