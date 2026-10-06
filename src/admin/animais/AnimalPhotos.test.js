import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import AnimalPhotos from './AnimalPhotos';
import { deleteAnimalPhoto, getAnimal, setMainAnimalPhoto, uploadAnimalPhotos } from './animalService';

jest.mock('./animalService', () => ({ getAnimal: jest.fn(), uploadAnimalPhotos: jest.fn(), setMainAnimalPhoto: jest.fn(), deleteAnimalPhoto: jest.fn() }));

const photos = [
  { id: 'f1', url: 'https://api.example/a.jpg', principal: true },
  { id: 'f2', url: 'https://api.example/b.jpg', principal: false },
];

test('uploads photos, changes the main one and removes, reporting the new main URL', async () => {
  getAnimal.mockResolvedValue({ id: 'a1', fotos: [] });
  uploadAnimalPhotos.mockResolvedValue({ id: 'a1', foto_url: photos[0].url, fotos: photos });
  setMainAnimalPhoto.mockResolvedValue({ id: 'a1', foto_url: photos[1].url, fotos: [{ ...photos[1], principal: true }, { ...photos[0], principal: false }] });
  deleteAnimalPhoto.mockResolvedValue({ id: 'a1', foto_url: photos[1].url, fotos: [{ ...photos[1], principal: true }] });
  const onChanged = jest.fn();
  render(<AnimalPhotos animalId="a1" animalName="Nino" onChanged={onChanged} />);

  expect(await screen.findByText(/A primeira enviada vira a foto principal/)).toBeInTheDocument();
  const files = [new File(['x'], 'a.png', { type: 'image/png' }), new File(['y'], 'b.png', { type: 'image/png' })];
  fireEvent.change(screen.getByLabelText(/enviar fotos/i), { target: { files } });

  expect(await screen.findByRole('img', { name: 'Nino, foto 1 (principal)' })).toBeInTheDocument();
  expect(uploadAnimalPhotos).toHaveBeenCalledWith('a1', files);
  expect(onChanged).toHaveBeenLastCalledWith(expect.objectContaining({ foto_url: photos[0].url }));

  fireEvent.click(screen.getByRole('button', { name: 'Usar a foto 2 como principal' }));
  await waitFor(() => expect(setMainAnimalPhoto).toHaveBeenCalledWith('a1', 'f2'));
  expect(onChanged).toHaveBeenLastCalledWith(expect.objectContaining({ foto_url: photos[1].url }));

  await waitFor(() => expect(screen.getByRole('img', { name: 'Nino, foto 2' })).toHaveAttribute('src', photos[0].url));
  fireEvent.click(screen.getByRole('button', { name: 'Remover a foto 2' }));
  await waitFor(() => expect(deleteAnimalPhoto).toHaveBeenCalledWith('a1', 'f1'));
  expect(await screen.findByText(/Restam 11 de 12 fotos/)).toBeInTheDocument();
});

test('upload errors from the API are shown', async () => {
  getAnimal.mockResolvedValue({ id: 'a1', fotos: [] });
  uploadAnimalPhotos.mockRejectedValue({ response: { data: { error: { message: 'Envie fotos em JPG, PNG ou WebP.', details: [{ field: 'fotos', message: '"x.gif" não é uma imagem JPG, PNG ou WebP.' }] } } } });
  render(<AnimalPhotos animalId="a1" animalName="Nino" />);

  await screen.findByText(/Restam 12 de 12/);
  fireEvent.change(screen.getByLabelText(/enviar fotos/i), { target: { files: [new File(['g'], 'x.gif', { type: 'image/gif' })] } });
  expect(await screen.findByRole('alert')).toHaveTextContent('"x.gif" não é uma imagem JPG, PNG ou WebP.');
});
