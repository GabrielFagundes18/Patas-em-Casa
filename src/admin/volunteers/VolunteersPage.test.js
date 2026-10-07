import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import VolunteersPage from './VolunteersPage';
import { createVolunteer, listVolunteers } from './volunteerService';

jest.mock('./volunteerService', () => ({ createVolunteer: jest.fn(), listVolunteers: jest.fn() }));

test('adds a volunteer with contact, start date and areas', async () => {
  listVolunteers.mockResolvedValue({ items: [], meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 } });
  createVolunteer.mockResolvedValue({ id: 'v1', nome: 'Rita Alves' });
  render(<MemoryRouter><VolunteersPage user={{ permissions: ['volunteers:read', 'volunteers:create'] }} /></MemoryRouter>);

  fireEvent.click(await screen.findByRole('button', { name: /adicionar voluntário/i }));
  const form = within(screen.getByRole('dialog'));
  fireEvent.change(form.getByRole('textbox', { name: /nome completo/i }), { target: { value: 'Rita Alves' } });
  fireEvent.change(form.getByRole('textbox', { name: /e-mail/i }), { target: { value: 'rita@example.org' } });
  fireEvent.change(form.getByRole('textbox', { name: /telefone/i }), { target: { value: '(11) 98888-7777' } });
  fireEvent.change(form.getByLabelText(/início/i), { target: { value: '2026-10-01' } });
  fireEvent.click(form.getByRole('checkbox', { name: 'Passeios' }));
  fireEvent.click(form.getByRole('checkbox', { name: 'Fotografia' }));
  fireEvent.click(form.getByRole('button', { name: 'Adicionar voluntário' }));

  expect(await screen.findByText('Rita Alves agora está na lista de voluntários.')).toBeInTheDocument();
  expect(createVolunteer).toHaveBeenCalledWith({
    nome: 'Rita Alves',
    email: 'rita@example.org',
    telefone: '(11) 98888-7777',
    status: 'ativo',
    data_inicio: '2026-10-01',
    areas: ['passeios', 'fotografia'],
  });
  await waitFor(() => expect(listVolunteers).toHaveBeenCalledTimes(2));
});
