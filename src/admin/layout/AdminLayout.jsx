import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
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
import { adminNavigationGroups, adminSections, roleLabels } from '../constants/adminNavigation';
import '../styles/admin.css';
import './AdminLayout.css';

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

function normalizeSearch(value) {
  return value.trim().toLocaleLowerCase('pt-BR');
}

export default function AdminLayout({ user, activeTab, onLogout, children }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() => (
    window.matchMedia?.('(max-width: 900px)').matches ?? false
  ));
  const sidebarRef = useRef(null);
  const searchRef = useRef(null);
  const helpDialogRef = useRef(null);
  const previousFocusRef = useRef(null);

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

  const activeSection = adminSections[activeTab] || adminSections.dashboard;

  useEffect(() => {
    function handleShortcut(event) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        searchRef.current?.focus();
      }
    }

    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia?.('(max-width: 900px)');
    if (!mediaQuery) return undefined;

    const updateViewport = (event) => setIsMobile(event.matches);

    setIsMobile(mediaQuery.matches);
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', updateViewport);
    } else {
      mediaQuery.addListener(updateViewport);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', updateViewport);
      } else {
        mediaQuery.removeListener(updateViewport);
      }
    };
  }, []);

  useEffect(() => {
    if (!mobileOpen) return undefined;

    previousFocusRef.current = document.activeElement;
    const sidebar = sidebarRef.current;
    const getFocusable = () => Array.from(sidebar?.querySelectorAll(
      'a[href], button:not(:disabled), input:not(:disabled)'
    ) || []).filter((element) => window.getComputedStyle(element).display !== 'none');
    getFocusable()[0]?.focus();

    function handleDrawerKeyDown(event) {
      if (event.key === 'Escape') {
        setMobileOpen(false);
        return;
      }

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
    return () => {
      document.removeEventListener('keydown', handleDrawerKeyDown);
      previousFocusRef.current?.focus();
    };
  }, [mobileOpen]);

  useEffect(() => {
    const dialog = helpDialogRef.current;
    if (!dialog) return;

    if (helpOpen && !dialog.open) dialog.showModal();
    if (!helpOpen && dialog.open) dialog.close();
  }, [helpOpen]);

  function closeMobileMenu() {
    setMobileOpen(false);
  }

  function renderNavigation() {
    return visibleGroups.map((group) => (
      <div className="admin-navigation-group" key={group.label}>
        {!collapsed ? <h2>{group.label}</h2> : null}
        {group.items.map((item) => {
          const Icon = navigationIcons[item.icon];
          return (
            <Link
              aria-current={activeTab === item.key ? 'page' : undefined}
              aria-label={collapsed ? item.label : undefined}
              className={`admin-navigation-link ${activeTab === item.key ? 'is-active' : ''}`}
              key={item.key}
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
    <div className={`admin-layout ${collapsed ? 'is-collapsed' : ''}`}>
      {mobileOpen ? (
        <button
          aria-label="Fechar menu do painel"
          className="admin-mobile-backdrop"
          onClick={closeMobileMenu}
          type="button"
        />
      ) : null}

      <aside
        aria-label="Navegação administrativa"
        aria-modal={mobileOpen ? 'true' : undefined}
        aria-hidden={isMobile && !mobileOpen ? 'true' : undefined}
        className={`admin-sidebar ${mobileOpen ? 'is-mobile-open' : ''}`}
        inert={isMobile && !mobileOpen}
        ref={sidebarRef}
        role={mobileOpen ? 'dialog' : undefined}
      >
        <div className="admin-sidebar-brand">
          <Link aria-label="Patas em Casa, início do painel" className="admin-brand-link" to="/admin">
            <span aria-hidden="true" className="admin-brand-mark"><PawPrint size={20} /></span>
            {!collapsed ? <span><strong>Patas em Casa</strong><small>Administração</small></span> : null}
          </Link>
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

        <nav aria-label="Módulos do painel" className="admin-navigation">
          {renderNavigation()}
          {visibleGroups.length === 0 ? <p className="admin-navigation-empty">Nenhuma área disponível.</p> : null}
        </nav>

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

      <div className="admin-main">
        <header className="admin-topbar">
          <button
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? 'Fechar navegação' : 'Abrir navegação'}
            className="admin-mobile-menu-button"
            onClick={() => setMobileOpen((value) => !value)}
            type="button"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <div className="admin-topbar-user">
            <span aria-hidden="true" className="admin-avatar">
              {user?.nome?.trim()?.charAt(0)?.toLocaleUpperCase('pt-BR') || '?'}
            </span>
            <span className="admin-user-copy">
              <strong>{user?.nome || 'Validando sessão'}</strong>
              <small>{roleLabels[user?.role] || 'Equipe Patas em Casa'}</small>
            </span>
          </div>

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
            <kbd aria-hidden="true">Ctrl K</kbd>
          </label>

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
              {notificationsOpen ? (
                <div className="admin-popover" role="status">
                  <strong>Avisos</strong>
                  <p>Não há avisos disponíveis nesta sessão.</p>
                </div>
              ) : null}
            </div>
            {user?.permissions?.includes('team:read') ? (
              <Link aria-label="Equipe e acessos" className="admin-icon-button" to="/admin/configuracoes">
                <Settings size={19} />
              </Link>
            ) : null}
          </div>
        </header>

        <main className="admin-content-area">
          <nav aria-label="Trilha de navegação" className="admin-breadcrumbs">
            <span>Administração</span>
            <ChevronRight aria-hidden="true" size={15} />
            <span aria-current="page">{activeSection.label}</span>
          </nav>
          <div className="admin-page-heading">
            <div>
              <p className="admin-eyebrow">Painel administrativo</p>
              <h1>{activeSection.label}</h1>
              <p>{activeSection.description}</p>
            </div>
          </div>
          {children}
        </main>
      </div>

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