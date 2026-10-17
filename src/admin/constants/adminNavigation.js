/*
 * ============================================================================
 * ARQUIVO: adminNavigation.js
 * ============================================================================
 *
 * PARA QUE SERVE:
 *   Define o MENU do painel administrativo: os grupos, as seções (abas), seus
 *   caminhos, ícones, descrições e a PERMISSÃO necessária para ver cada uma.
 *   Também traz os nomes amigáveis dos cargos (perfis de acesso).
 *
 * PRINCIPAIS ITENS:
 *   - roleLabels: código do cargo → nome exibido.
 *   - adminNavigationGroups: lista de grupos, cada um com seus itens de menu.
 *   - adminSections: as mesmas seções num objeto indexado pela chave (ex.: adminSections.animais).
 *
 * CONEXÕES COM OUTROS ARQUIVOS:
 *   - Não importa nada.
 *   - Usado por: admin/layout/AdminLayout.jsx (desenha o menu e filtra por permissão),
 *     admin/AdminDashboardPage.jsx (título e permissão da aba aberta) e
 *     admin/team (nomes dos cargos).
 *   - As permissões (ex.: 'animals:read') são as mesmas do backend
 *     (Patas-em-Casa-BackEnd/src/config/permissions.js).
 *   - As rotas /admin/... são declaradas em app/App.js.
 * ============================================================================
 */

// Nome exibido para cada cargo (o código é o que vem do backend em user.role).
export const roleLabels = {
  administrador: 'Super Admin',
  gestor_ong: 'Gestor da ONG',
  gestor_animais: 'Veterinário / Cuidador',
  financeiro: 'Atendimento e Doações',
  voluntariado: 'Voluntário',
};

// Grupos do menu lateral. Cada item tem:
//   key         → identificador da seção (o mesmo usado em ADMIN_TABS no App.js e em AdminDashboardPage);
//   label       → texto do menu;
//   path        → endereço da seção;
//   permission  → permissão exigida (sem ela, o item some do menu). Itens sem "permission" aparecem para todos;
//   icon        → nome do ícone (traduzido para um componente no AdminLayout);
//   description → texto curto mostrado no topo da seção.
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
      {
        key: 'adotantes',
        label: 'Adotantes',
        path: '/admin/adotantes',
        permission: 'adopters:read',
        icon: 'adopters',
        description: 'Cadastro dos candidatos, histórico e pedidos de privacidade (LGPD).',
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
      {
        key: 'historias',
        label: 'Histórias',
        path: '/admin/historias',
        permission: 'stories:read',
        icon: 'stories',
        description: 'Depoimentos de adoção publicados no site.',
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

// Converte os grupos num objeto { chave: item } para acesso direto (ex.: adminSections['doacoes']).
// flatMap: percorre os grupos e "achata" num único array os pares [chave, item] de todos os grupos.
// Object.fromEntries transforma a lista de pares num objeto.
export const adminSections = Object.fromEntries(
  adminNavigationGroups.flatMap((group) => group.items.map((item) => [item.key, item]))
);

/*
 * ============================================================================
 * RESUMO DO ARQUIVO
 * ============================================================================
 *
 * COMO FUNCIONA:
 *   O AdminLayout percorre adminNavigationGroups para desenhar o menu, escondendo
 *   os itens cuja "permission" o usuário não tem. A página do painel usa
 *   adminSections[aba] para saber título, descrição e permissão da aba aberta.
 *
 * CONCEITOS IMPORTANTES PARA ESTUDAR:
 *   - Menu "guiado por dados" (configuração em vez de JSX repetido).
 *   - Controle de acesso por permissões (RBAC — controle baseado em papéis).
 *   - Array.flatMap e Object.fromEntries.
 *   - Manter front-end e back-end com os mesmos nomes de permissão.
 * ============================================================================
 */
