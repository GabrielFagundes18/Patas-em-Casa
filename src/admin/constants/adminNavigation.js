export const roleLabels = {
  administrador: 'Super Admin',
  gestor_animais: 'Veterinário / Cuidador',
  financeiro: 'Atendimento e Doações',
  voluntariado: 'Voluntário',
};

export const adminNavigationGroups = [
  {
    label: 'Visão geral',
    items: [
      {
        key: 'dashboard',
        label: 'Visão geral',
        path: '/admin',
        icon: 'dashboard',
        description: 'Indicadores e atividades da organização.',
      },
    ],
  },
  {
    label: 'Animais e adoções',
    items: [
      {
        key: 'animais',
        label: 'Animais',
        path: '/admin/animais',
        permission: 'animals:read',
        icon: 'animals',
        description: 'Cadastro e acompanhamento dos animais.',
      },
      {
        key: 'adocoes',
        label: 'Adoções',
        path: '/admin/adocoes',
        permission: 'adoptions:read',
        icon: 'adoptions',
        description: 'Triagem e acompanhamento de pedidos.',
      },
    ],
  },
  {
    label: 'Pessoas',
    items: [
      {
        key: 'voluntarios',
        label: 'Voluntários',
        path: '/admin/voluntarios',
        permission: 'volunteers:read',
        icon: 'people',
        description: 'Inscrições e disponibilidade da equipe voluntária.',
      },
    ],
  },
  {
    label: 'Financeiro',
    items: [
      {
        key: 'doacoes',
        label: 'Doações',
        path: '/admin/doacoes',
        permission: 'donations:read',
        icon: 'finance',
        description: 'Acompanhamento das contribuições recebidas.',
      },
    ],
  },
  {
    label: 'Administração',
    items: [
      {
        key: 'configuracoes',
        label: 'Equipe e acessos',
        path: '/admin/configuracoes',
        permission: 'team:read',
        icon: 'settings',
        description: 'Usuários do painel, cargos e situação de acesso.',
      },
    ],
  },
];

export const adminSections = Object.fromEntries(
  adminNavigationGroups.flatMap((group) => group.items.map((item) => [item.key, item]))
);