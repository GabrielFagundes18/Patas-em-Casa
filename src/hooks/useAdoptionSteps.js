import { useEffect, useState } from 'react';
import { buscarEtapasAdocao } from '../api/content';

// O quê: etapas padrão, usadas enquanto a API responde ou se ela estiver indisponível.
export const defaultSteps = [
  { title: 'Encontre', description: 'Navegue pelos pets disponíveis perto de você.', icon: 'search' },
  { title: 'Conecte-se', description: 'Converse com o abrigo e conheça a história dele.', icon: 'heart' },
  { title: 'Cadastre-se', description: 'Preencha um formulário rápido de responsabilidade.', icon: 'clipboard' },
  { title: 'Leve para casa', description: 'Combine a retirada e comece a nova vida juntos.', icon: 'home' },
];

// O quê: etapas oficiais do processo de adoção (tabela adoption_steps, via API pública).
// Como: começa pelas etapas padrão e troca pelas da API quando chegam; cancela a requisição ao desmontar.
// Para quê: a Home e a página "Como funciona" mostram sempre o mesmo passo a passo.
export function useAdoptionSteps() {
  const [steps, setSteps] = useState(defaultSteps);

  useEffect(() => {
    const controller = new AbortController();
    buscarEtapasAdocao({ signal: controller.signal })
      .then((etapas) => {
        if (!controller.signal.aborted && etapas.length > 0) {
          setSteps(etapas.map((etapa) => ({ title: etapa.titulo, description: etapa.descricao })));
        }
      })
      .catch(() => {});
    return () => controller.abort();
  }, []);

  return steps;
}
