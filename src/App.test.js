import '@testing-library/jest-dom';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';
import Hero from './components/Hero';

test('renders the landing page hero and opens the adoption form', () => {
  render(
    <MemoryRouter initialEntries={['/']}>
      <App />
    </MemoryRouter>
  );

  expect(
    screen.getByRole('heading', { name: /Cada focinho tem uma/i })
  ).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: /Quero adotar/i }));

  expect(
    screen.getByRole('heading', { name: /Formulário de pré-adoção/i })
  ).toBeInTheDocument();
});

test('opens the admin panel without crashing when storage is unavailable', () => {
  render(
    <MemoryRouter initialEntries={['/']}>
      <App />
    </MemoryRouter>
  );

  fireEvent.click(screen.getByRole('button', { name: /Painel admin/i }));

  expect(screen.getByRole('heading', { name: /Visão geral/i })).toBeInTheDocument();
});

test('rotates the hero story automatically', () => {
  jest.useFakeTimers();

  render(<Hero />);

  expect(screen.getByText(/Bento/i)).toBeInTheDocument();

  act(() => {
    jest.advanceTimersByTime(3500);
  });

  expect(screen.getByText(/Luna/i)).toBeInTheDocument();

  act(() => {
    jest.advanceTimersByTime(3500);
  });

  expect(screen.getByText(/Milo/i)).toBeInTheDocument();

  jest.useRealTimers();
});
