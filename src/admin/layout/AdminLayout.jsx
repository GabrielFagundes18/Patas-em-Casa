/*
 * ============================================================================
 * ARQUIVO: AdminLayout.jsx
 * ============================================================================
 *
 * PARA QUE SERVE:
 *   É a MOLDURA do painel administrativo: menu lateral (que pode ser recolhido,
 *   e vira uma gaveta no celular), barra superior (usuário, busca no menu, avisos,
 *   configurações), trilha de navegação, título da seção e a área onde aparece o
 *   conteúdo de cada aba. Também tem a "Central de ajuda" (um <dialog>).
 *   O menu mostra só as seções que o cargo do usuário pode acessar.
 *
 * PRINCIPAIS ITENS:
 *   - navigationIcons: nome do ícone → componente do ícone.
 *   - normalizeSearch(value): prepara o texto da busca no menu (interna).
 *   - AdminLayout({ user, activeTab, onLogout, children }): o componente (exportado como padrão).
 *       Dentro dele: closeMobileMenu e renderNavigation, além de 4 useEffect
 *       (atalho Ctrl+K, detecção de celular, gaveta acessível, central de ajuda).
 *
 * CONEXÕES COM OUTROS ARQUIVOS:
 *   - react (useEffect, useRef, useState), react-router-dom (Link), lucide-react (ícones).
 *   - admin/constants/adminNavigation → grupos do menu, seções e nomes dos cargos.
 *   - admin/styles/admin.css e ./AdminLayout.css → estilos.
 *   - Quem usa: admin/AdminDashboardPage.jsx.
 * ============================================================================
 */

// Hooks do React.
import { useEffect, useRef, useState } from 'react';
// Link: navegação interna.
import { Link } from 'react-router-dom';
// Ícones usados no menu e na barra superior.
import {
  BookHeart,
  UserCheck,
  Bell,
  ChevronRight,
  CircleHelp,
  LayoutDashboard,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  PawPrint,
  Search,
  Settings,
  Users,
  Wallet,
  X,
  Heart,
} from 'lucide-react';
// Configuração do menu (grupos, seções) e nomes dos cargos.
import { adminNavigationGroups, adminSections, roleLabels } from 'admin/constants/adminNavigation';
// Estilos gerais do painel.
import 'admin/styles/admin.css';
// Estilos da moldura.
import './AdminLayout.css';

// Tabela que liga o "icon" de cada item do menu (texto) ao componente de ícone.
const navigationIcons = {
  dashboard: LayoutDashboard,
  animals: PawPrint,
  adoptions: Heart,
  adopters: UserCheck,
  people: Users,
  stories: BookHeart,
  finance: Wallet,
  settings: Settings,
};

/*
 * FUNÇÃO: normalizeSearch (interna)
 * O que faz: tira espaços das pontas e deixa minúsculo (regras do português).
 * Parâmetros: value (string). Retorno (string).
 * Onde é usada: na busca do menu.
 */
function normalizeSearch(value) {
  return value.trim().toLocaleLowerCase('pt-BR');
}

/*
 * COMPONENTE: AdminLayout
 * O que faz: desenha a estrutura do painel e controla menu, gaveta, busca, avisos e ajuda.
 * Parâmetros (props):
 *   - user (objeto | null): usuário logado (nome, role, permissions). null enquanto valida.
 *   - activeTab (string): chave da aba ativa (destaca o item do menu).
 *   - onLogout (função): chamada pelo botão "Sair".
 *   - children (JSX): conteúdo da aba.
 * Retorno: JSX da moldura completa.
 * Onde é usado: AdminDashboardPage.jsx.
 */
export default function AdminLayout({ user, activeTab, onLogout, children }) {
  // Menu lateral recolhido (só ícones)?
  const [collapsed, setCollapsed] = useState(false);
  // Gaveta do menu aberta no celular?
  const [mobileOpen, setMobileOpen] = useState(false);
  // Texto da busca no menu.
  const [search, setSearch] = useState('');
  // Caixinha de avisos aberta?
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  // Central de ajuda aberta?
  const [helpOpen, setHelpOpen] = useState(false);
  // A tela é de celular (até 900px)? Valor inicial calculado uma vez.
  // window.matchMedia?.(...) — o "?." chama só se matchMedia existir; "?? false" é o padrão.
  const [isMobile, setIsMobile] = useState(() => (
    window.matchMedia?.('(max-width: 900px)').matches ?? false
  ));
  // Referências a elementos: menu lateral, campo de busca, diálogo de ajuda.
  const sidebarRef = useRef(null);
  const searchRef = useRef(null);
  const helpDialogRef = useRef(null);
  // Elemento que tinha o foco antes de abrir a gaveta (para devolver depois).
  const previousFocusRef = useRef(null);

  // Grupos visíveis do menu, em duas etapas de filtro:
  //   1) remove itens sem permissão (itens sem "permission" ficam);
  //   2) remove itens que não combinam com a busca;
  //   e por fim remove grupos que ficaram vazios.
  const visibleGroups = adminNavigationGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => (
        !item.permission || user?.permissions?.includes(item.permission)
      )),
    }))
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => (
        !normalizeSearch(search) || normalizeSearch(item.label).includes(normalizeSearch(search))
      )),
    }))
    .filter((group) => group.items.length > 0);

  // Dados da seção ativa (título e descrição do topo).
  const activeSection = adminSections[activeTab] || adminSections.dashboard;

  // Atalho Ctrl+K (ou Cmd+K no Mac) foca a busca do menu.
  useEffect(() => {
    function handleShortcut(event) {
      // metaKey = tecla Cmd (Mac); ctrlKey = Ctrl.
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        // Impede a ação padrão do navegador para Ctrl+K.
        event.preventDefault();
        searchRef.current?.focus();
      }
    }

    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, []);

  // Acompanha se a tela é de celular (até 900px) quando a janela muda de tamanho.
  useEffect(() => {
    const mediaQuery = window.matchMedia?.('(max-width: 900px)');
    if (!mediaQuery) return undefined;

    // Atualiza o estado quando a condição muda.
    const updateViewport = (event) => setIsMobile(event.matches);

    setIsMobile(mediaQuery.matches);
    // Navegadores novos usam addEventListener; antigos, addListener (por isso o if/else).
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', updateViewport);
    } else {
      mediaQuery.addListener(updateViewport);
    }

    // Limpeza com a mesma lógica.
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', updateViewport);
      } else {
        mediaQuery.removeListener(updateViewport);
      }
    };
  }, []);

  // Gaveta do celular acessível: foco no primeiro item, Esc fecha, Tab preso dentro, foco devolvido ao fechar.
  useEffect(() => {
    // Só age quando a gaveta abre.
    if (!mobileOpen) return undefined;

    // Guarda quem estava focado.
    previousFocusRef.current = document.activeElement;
    const sidebar = sidebarRef.current;
    // Lista os elementos focáveis visíveis do menu (getComputedStyle confere se não estão com display: none).
    const getFocusable = () => Array.from(sidebar?.querySelectorAll(
      'a[href], button:not(:disabled), input:not(:disabled)'
    ) || []).filter((element) => window.getComputedStyle(element).display !== 'none');
    // Foca o primeiro.
    getFocusable()[0]?.focus();

    // Teclado dentro da gaveta.
    function handleDrawerKeyDown(event) {
      // Esc fecha.
      if (event.key === 'Escape') {
        setMobileOpen(false);
        return;
      }

      // Tab dá a volta dentro da gaveta (mesma lógica do hook useDialog).
      if (event.key !== 'Tab') return;
      const focusable = getFocusable();
      if (focusable.length === 0) return;

      if (event.shiftKey && document.activeElement === focusable[0]) {
        event.preventDefault();
        focusable[focusable.length - 1].focus();
      } else if (!event.shiftKey && document.activeElement === focusable[focusable.length - 1]) {
        event.preventDefault();
        focusable[0].focus();
      }
    }

    document.addEventListener('keydown', handleDrawerKeyDown);
    // Ao fechar: para de escutar e devolve o foco.
    return () => {
      document.removeEventListener('keydown', handleDrawerKeyDown);
      previousFocusRef.current?.focus();
    };
  }, [mobileOpen]);

  // Abre/fecha o <dialog> da central de ajuda conforme o estado helpOpen.
  useEffect(() => {
    const dialog = helpDialogRef.current;
    if (!dialog) return;

    if (helpOpen && !dialog.open) dialog.showModal();
    if (!helpOpen && dialog.open) dialog.close();
  }, [helpOpen]);

  /*
   * FUNÇÃO INTERNA: closeMobileMenu
   * O que faz: fecha a gaveta do celular (usada ao clicar num item ou no fundo).
   */
  function closeMobileMenu() {
    setMobileOpen(false);
  }

  /*
   * FUNÇÃO INTERNA: renderNavigation
   * O que faz: desenha os grupos e links do menu.
   * Retorno: JSX (lista de grupos).
   */
  function renderNavigation() {
    return visibleGroups.map((group) => (
      <div className="admin-navigation-group" key={group.label}>
        {/* Nome do grupo (escondido com o menu recolhido). */}
        {!collapsed ? <h2>{group.label}</h2> : null}
        {group.items.map((item) => {
          // Componente do ícone deste item (com maiúscula para usar como <Icon />).
          const Icon = navigationIcons[item.icon];
          return (
            <Link
              // aria-current="page" marca o item da página atual.
              aria-current={activeTab === item.key ? 'page' : undefined}
              // Recolhido: só o ícone aparece, então o nome vai no aria-label e no title (dica).
              aria-label={collapsed ? item.label : undefined}
              className={`admin-navigation-link ${activeTab === item.key ? 'is-active' : ''}`}
              key={item.key}
              // No celular, clicar fecha a gaveta.
              onClick={closeMobileMenu}
              title={collapsed ? item.label : undefined}
              to={item.path}
            >
              <Icon aria-hidden="true" size={19} />
              {!collapsed ? <span>{item.label}</span> : null}
            </Link>
          );
        })}
      </div>
    ));
  }

  return (
    // Classe "is-collapsed" muda a largura do menu (CSS).
    <div className={`admin-layout ${collapsed ? 'is-collapsed' : ''}`}>
      {/* Fundo escuro clicável atrás da gaveta (só no celular com a gaveta aberta). */}
      {mobileOpen ? (
        <button
          aria-label="Fechar menu do painel"
          className="admin-mobile-backdrop"
          onClick={closeMobileMenu}
          type="button"
        />
      ) : null}

      {/* ===== Menu lateral =====
          No celular fechado: aria-hidden + inert escondem e desativam o menu (não recebe foco nem cliques).
          No celular aberto: vira um diálogo modal (role="dialog" + aria-modal). */}
      <aside
        aria-label="Navegação administrativa"
        aria-modal={mobileOpen ? 'true' : undefined}
        aria-hidden={isMobile && !mobileOpen ? 'true' : undefined}
        className={`admin-sidebar ${mobileOpen ? 'is-mobile-open' : ''}`}
        inert={isMobile && !mobileOpen}
        ref={sidebarRef}
        role={mobileOpen ? 'dialog' : undefined}
      >
        {/* Marca e botão de recolher. */}
        <div className="admin-sidebar-brand">
          <Link aria-label="Patas em Casa, início do painel" className="admin-brand-link" to="/admin">
            <span aria-hidden="true" className="admin-brand-mark"><PawPrint size={20} /></span>
            {!collapsed ? <span><strong>Patas em Casa</strong><small>Administração</small></span> : null}
          </Link>
          {/* Recolher/expandir o menu (inverte o estado). */}
          <button
            aria-label={collapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'}
            className="admin-collapse-button"
            onClick={() => setCollapsed((value) => !value)}
            title={collapsed ? 'Expandir menu' : 'Recolher menu'}
            type="button"
          >
            {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </button>
        </div>

        {/* Links do menu (ou aviso se nenhuma área estiver disponível/encontrada). */}
        <nav aria-label="Módulos do painel" className="admin-navigation">
          {renderNavigation()}
          {visibleGroups.length === 0 ? <p className="admin-navigation-empty">Nenhuma área disponível.</p> : null}
        </nav>

        {/* Rodapé do menu: ajuda e sair. */}
        <div className="admin-sidebar-footer">
          <button className="admin-sidebar-action" onClick={() => setHelpOpen(true)} type="button">
            <CircleHelp aria-hidden="true" size={19} />
            {!collapsed ? <span>Central de ajuda</span> : null}
          </button>
          <button className="admin-sidebar-action is-logout" onClick={onLogout} type="button">
            <LogOut aria-hidden="true" size={19} />
            {!collapsed ? <span>Sair</span> : null}
          </button>
        </div>
      </aside>

      {/* ===== Área principal ===== */}
      <div className="admin-main">
        {/* Barra superior. */}
        <header className="admin-topbar">
          {/* Botão do menu no celular (abre/fecha a gaveta). */}
          <button
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? 'Fechar navegação' : 'Abrir navegação'}
            className="admin-mobile-menu-button"
            onClick={() => setMobileOpen((value) => !value)}
            type="button"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          {/* Usuário logado: avatar com a inicial, nome e cargo. */}
          <div className="admin-topbar-user">
            <span aria-hidden="true" className="admin-avatar">
              {/* Primeira letra do nome em maiúscula (ou "?" se ainda não carregou). */}
              {user?.nome?.trim()?.charAt(0)?.toLocaleUpperCase('pt-BR') || '?'}
            </span>
            <span className="admin-user-copy">
              <strong>{user?.nome || 'Validando sessão'}</strong>
              <small>{roleLabels[user?.role] || 'Equipe Patas em Casa'}</small>
            </span>
          </div>

          {/* Busca no menu (Ctrl+K). */}
          <label className="admin-global-search">
            <Search aria-hidden="true" size={18} />
            <input
              aria-label="Buscar módulos do painel"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar no menu"
              ref={searchRef}
              type="search"
              value={search}
            />
            {/* <kbd> representa uma tecla do teclado. */}
            <kbd aria-hidden="true">Ctrl K</kbd>
          </label>

          {/* Ações: avisos e configurações. */}
          <div className="admin-topbar-actions">
            <div className="admin-notification-wrap">
              <button
                aria-expanded={notificationsOpen}
                aria-label="Avisos do painel"
                className="admin-icon-button"
                onClick={() => setNotificationsOpen((value) => !value)}
                type="button"
              >
                <Bell size={19} />
              </button>
              {/* Caixinha de avisos (ainda sem avisos reais). */}
              {notificationsOpen ? (
                <div className="admin-popover" role="status">
                  <strong>Avisos</strong>
                  <p>Não há avisos disponíveis nesta sessão.</p>
                </div>
              ) : null}
            </div>
            {/* Atalho para "Equipe e acessos", só para quem tem permissão. */}
            {user?.permissions?.includes('team:read') ? (
              <Link aria-label="Equipe e acessos" className="admin-icon-button" to="/admin/configuracoes">
                <Settings size={19} />
              </Link>
            ) : null}
          </div>
        </header>

        {/* Conteúdo. */}
        <main className="admin-content-area">
          {/* Trilha: Administração > Seção atual. */}
          <nav aria-label="Trilha de navegação" className="admin-breadcrumbs">
            <span>Administração</span>
            <ChevronRight aria-hidden="true" size={15} />
            <span aria-current="page">{activeSection.label}</span>
          </nav>
          {/* Título e descrição da seção. */}
          <div className="admin-page-heading">
            <div>
              <p className="admin-eyebrow">Painel administrativo</p>
              <h1>{activeSection.label}</h1>
              <p>{activeSection.description}</p>
            </div>
          </div>
          {/* Tela da aba. */}
          {children}
        </main>
      </div>

      {/* ===== Central de ajuda (diálogo nativo) =====
          onCancel (Esc) e onClose sincronizam o estado helpOpen com o diálogo. */}
      <dialog
        aria-labelledby="admin-help-title"
        className="admin-help-dialog"
        onCancel={() => setHelpOpen(false)}
        onClose={() => setHelpOpen(false)}
        ref={helpDialogRef}
      >
        <div>
          <h2 id="admin-help-title">Central de ajuda</h2>
          <p>O canal de atendimento ainda não está configurado.</p>
        </div>
        <button aria-label="Fechar central de ajuda" className="admin-icon-button" onClick={() => setHelpOpen(false)} type="button">
          <X size={19} />
        </button>
      </dialog>
    </div>
  );
}

/*
 * ============================================================================
 * RESUMO DO ARQUIVO
 * ============================================================================
 *
 * COMO O FLUXO FUNCIONA:
 *   1. O AdminDashboardPage desenha <AdminLayout user activeTab onLogout>tela da aba</AdminLayout>.
 *   2. O menu é filtrado pelas permissões do usuário e pela busca (Ctrl+K foca a busca).
 *   3. No computador, o menu pode ser recolhido (só ícones). No celular (≤ 900px), ele
 *      vira uma gaveta acessível: foco preso, Esc fecha, foco devolvido.
 *   4. O topo mostra o usuário, avisos e o atalho para a equipe; o conteúdo mostra
 *      trilha, título, descrição e a tela da aba.
 *   5. A central de ajuda é um <dialog> controlado pelo estado helpOpen.
 *
 * CONCEITOS IMPORTANTES PARA ESTUDAR:
 *   - Layout de painel (sidebar + topbar + conteúdo) e composição com children.
 *   - Filtrar menus por permissão (map/filter encadeados).
 *   - Atalhos de teclado globais (keydown, metaKey/ctrlKey).
 *   - matchMedia no JavaScript e compatibilidade com navegadores antigos.
 *   - Acessibilidade: inert, aria-hidden, aria-modal, aria-current, aria-expanded, focus trap.
 *   - <dialog> nativo controlado por estado (showModal/close).
 *   - Encadeamento opcional longo (user?.nome?.trim()?.charAt(0)...).
 * ============================================================================
 */
