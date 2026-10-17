/*
 * ============================================================================
 * ARQUIVO: AnimalPhotos.test.js
 * ============================================================================
 *
 * PARA QUE SERVE:
 *   Testes automatizados da galeria de fotos do painel: enviar fotos, trocar a
 *   principal, remover (avisando a nova foto principal) e mostrar erros da API.
 *
 * PRINCIPAIS ITENS:
 *   - photos: duas fotos de exemplo.
 *   - 2 testes.
 *
 * CONEXÕES COM OUTROS ARQUIVOS:
 *   - ./AnimalPhotos.jsx → componente testado.
 *   - ./animalService    → funções de fotos substituídas por mocks.
 * ============================================================================
 */

// Verificações extras.
import '@testing-library/jest-dom';
// Ferramentas da Testing Library.
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
// Componente testado.
import AnimalPhotos from './AnimalPhotos';
// Funções de API (viram mocks).
import { deleteAnimalPhoto, getAnimal, setMainAnimalPhoto, uploadAnimalPhotos } from './animalService';

// Substitui o service por funções falsas.
jest.mock('./animalService', () => ({ getAnimal: jest.fn(), uploadAnimalPhotos: jest.fn(), setMainAnimalPhoto: jest.fn(), deleteAnimalPhoto: jest.fn() }));

// Duas fotos de exemplo (a primeira é a principal).
const photos = [
  { id: 'f1', url: 'https://api.example/a.jpg', principal: true },
  { id: 'f2', url: 'https://api.example/b.jpg', principal: false },
];

// Teste 1: enviar, trocar a principal e remover, avisando a URL principal nova.
test('uploads photos, changes the main one and removes, reporting the new main URL', async () => {
  // Respostas programadas de cada função (cada uma devolve o animal atualizado).
  getAnimal.mockResolvedValue({ id: 'a1', fotos: [] });
  uploadAnimalPhotos.mockResolvedValue({ id: 'a1', foto_url: photos[0].url, fotos: photos });
  // Depois de trocar a principal: f2 vira principal e vem primeiro.
  setMainAnimalPhoto.mockResolvedValue({ id: 'a1', foto_url: photos[1].url, fotos: [{ ...photos[1], principal: true }, { ...photos[0], principal: false }] });
  // Depois de remover f1: sobra só f2.
  deleteAnimalPhoto.mockResolvedValue({ id: 'a1', foto_url: photos[1].url, fotos: [{ ...photos[1], principal: true }] });
  // Função espiã para conferir os avisos ao formulário.
  const onChanged = jest.fn();
  render(<AnimalPhotos animalId="a1" animalName="Nino" onChanged={onChanged} />);

  // Galeria vazia no início.
  expect(await screen.findByText(/A primeira enviada vira a foto principal/)).toBeInTheDocument();
  // "Escolhe" dois arquivos: new File(conteúdo, nome, { type }) cria um arquivo falso.
  const files = [new File(['x'], 'a.png', { type: 'image/png' }), new File(['y'], 'b.png', { type: 'image/png' })];
  // O <input type="file"> está dentro do <label> "Enviar fotos"; mudamos sua lista de arquivos.
  fireEvent.change(screen.getByLabelText(/enviar fotos/i), { target: { files } });

  // A primeira foto aparece como principal.
  expect(await screen.findByRole('img', { name: 'Nino, foto 1 (principal)' })).toBeInTheDocument();
  expect(uploadAnimalPhotos).toHaveBeenCalledWith('a1', files);
  // toHaveBeenLastCalledWith: confere a ÚLTIMA chamada do espião.
  expect(onChanged).toHaveBeenLastCalledWith(expect.objectContaining({ foto_url: photos[0].url }));

  // Torna a foto 2 principal.
  fireEvent.click(screen.getByRole('button', { name: 'Usar a foto 2 como principal' }));
  await waitFor(() => expect(setMainAnimalPhoto).toHaveBeenCalledWith('a1', 'f2'));
  expect(onChanged).toHaveBeenLastCalledWith(expect.objectContaining({ foto_url: photos[1].url }));

  // Agora a foto 2 (na tela) é a antiga f1; remove-a.
  await waitFor(() => expect(screen.getByRole('img', { name: 'Nino, foto 2' })).toHaveAttribute('src', photos[0].url));
  fireEvent.click(screen.getByRole('button', { name: 'Remover a foto 2' }));
  await waitFor(() => expect(deleteAnimalPhoto).toHaveBeenCalledWith('a1', 'f1'));
  // Sobrou 1 foto → restam 11.
  expect(await screen.findByText(/Restam 11 de 12 fotos/)).toBeInTheDocument();
});

// Teste 2: erro da API no envio aparece com o detalhe.
test('upload errors from the API are shown', async () => {
  getAnimal.mockResolvedValue({ id: 'a1', fotos: [] });
  uploadAnimalPhotos.mockRejectedValue({ response: { data: { error: { message: 'Envie fotos em JPG, PNG ou WebP.', details: [{ field: 'fotos', message: '"x.gif" não é uma imagem JPG, PNG ou WebP.' }] } } } });
  render(<AnimalPhotos animalId="a1" animalName="Nino" />);

  // Espera carregar (sem fotos: restam 12).
  await screen.findByText(/Restam 12 de 12/);
  // Envia um GIF (tipo não aceito).
  fireEvent.change(screen.getByLabelText(/enviar fotos/i), { target: { files: [new File(['g'], 'x.gif', { type: 'image/gif' })] } });
  // O FormError mostra o detalhe vindo da API.
  expect(await screen.findByRole('alert')).toHaveTextContent('"x.gif" não é uma imagem JPG, PNG ou WebP.');
});

/*
 * ============================================================================
 * RESUMO DO ARQUIVO
 * ============================================================================
 *
 * COMO O FLUXO FUNCIONA:
 *   As funções de foto são mocks que devolvem o "animal atualizado". O teste
 *   simula a escolha de arquivos e os cliques e confere a galeria, as chamadas e
 *   os avisos ao componente pai (onChanged).
 *
 * CONCEITOS IMPORTANTES PARA ESTUDAR:
 *   - Simular upload: new File(...) e fireEvent.change com { target: { files } }.
 *   - Funções espiãs (jest.fn) e toHaveBeenLastCalledWith.
 *   - expect.objectContaining para conferir só parte de um objeto.
 *   - waitFor para ações assíncronas em sequência.
 * ============================================================================
 */
