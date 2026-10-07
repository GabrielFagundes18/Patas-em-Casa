import '@testing-library/jest-dom';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import HowAdoptionWorksPage from './HowAdoptionWorksPage';
import { buscarEtapasAdocao } from '../../api/content';

jest.mock('../../api/content', () => ({ buscarEtapasAdocao: jest.fn() }));

function renderAt(path, element, route) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes><Route element={element} path={route} /></Routes>
    </MemoryRouter>
  );
}

test('the how-it-works page lists steps, requirements, documents and the call to action', async () => {
  buscarEtapasAdocao.mockResolvedValue([{ titulo: 'Escolha o animal', descricao: 'Veja o catálogo.' }]);
  renderAt('/como-funciona', <HowAdoptionWorksPage />, '/como-funciona');

  expect(await screen.findByRole('heading', { name: 'Escolha o animal' })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Requisitos' })).toBeInTheDocument();
  expect(screen.getByText(/Comprovante de residência/)).toBeInTheDocument();
  expect(within(screen.getByRole('main')).getByRole('link', { name: 'Ver animais para adoção' })).toHaveAttribute('href', '/adotar');
});
