/*
 * ============================================================================
 * ARQUIVO: Footer.jsx
 * ============================================================================
 *
 * PARA QUE SERVE:
 *   É o RODAPÉ do site público: marca e descrição da ONG, CNPJ, dois grupos de
 *   links ("Adote" e "Ajude"), informações de contato e, no final, o ano com
 *   direitos e o link "Área da equipe" (login do painel).
 *
 * PRINCIPAIS ITENS:
 *   - linkGroups: grupos de links do rodapé.
 *   - contactItems: itens de contato (ícone + texto + link opcional).
 *   - FooterLink({ link }): desenha um link (âncora <a> ou Link do roteador).
 *   - Footer(): o componente do rodapé (exportado como padrão).
 *
 * CONEXÕES COM OUTROS ARQUIVOS:
 *   - ./Footer.css                    → estilos do rodapé.
 *   - react-router-dom                → Link.
 *   - lucide-react                    → ícones de contato e da pata.
 *   - shared/constants/organization   → ORGANIZACAO (e-mail, telefone, endereço, CNPJ...).
 *   - Usado por: shared/components/layout/PublicLayout/PublicLayout.jsx e
 *     features/home/LandingPage.jsx.
 * ============================================================================
 */

// O quê: rodapé do site: marca, links (Adote / Ajude), contato e acesso da equipe.
// Como: os dados de contato vêm de ORGANIZACAO (shared/constants/organization.js), o único lugar a atualizar.
// Para quê: encerrar todas as páginas públicas com os mesmos caminhos e canais de contato.
// Estilos do rodapé.
import './Footer.css';
// Link: navegação interna sem recarregar.
import { Link } from 'react-router-dom';
// Ícones: @ (Instagram), relógio, e-mail, alfinete de mapa, pata e telefone.
import { AtSign, Clock3, Mail, MapPin, PawPrint, Phone } from 'lucide-react';
// Dados públicos da ONG.
import { ORGANIZACAO } from 'shared/constants/organization';

// Grupos de links do rodapé. Cada link tem:
//   - "to": caminho de uma PÁGINA (usa <Link>), ou
//   - "href": âncora de uma seção da home (usa <a>, para o navegador rolar até ela).
const linkGroups = [
  {
    title: 'Adote',
    links: [
      { label: 'Animais para adoção', to: '/adotar' },
      { label: 'Como funciona', to: '/como-funciona' },
      { label: 'Histórias', href: '/#historias' },
    ],
  },
  {
    title: 'Ajude',
    links: [
      { label: 'Doar agora', to: '/doar' },
      // "?tipo=recorrente" é um parâmetro de URL lido pela página de doação (já abre na doação mensal).
      { label: 'Doação mensal', to: '/doar?tipo=recorrente' },
      { label: 'Seja voluntário', href: '/#voluntariado' },
    ],
  },
];

// Itens de contato. "icon" guarda o PRÓPRIO componente do ícone (não um texto),
// que será desenhado depois como <Icon />. "href" é opcional (só o e-mail é clicável).
const contactItems = [
  // "mailto:" abre o programa de e-mail do visitante com o destinatário preenchido.
  { icon: Mail, label: ORGANIZACAO.email, href: `mailto:${ORGANIZACAO.email}` },
  { icon: Phone, label: ORGANIZACAO.telefone },
  { icon: MapPin, label: ORGANIZACAO.endereco },
  { icon: Clock3, label: ORGANIZACAO.horario },
  { icon: AtSign, label: ORGANIZACAO.instagram },
];

/*
 * COMPONENTE: FooterLink (interno)
 * O que faz: desenha um link do rodapé com a tag adequada.
 * Parâmetros (props):
 *   - link (objeto { label, to?, href? }).
 * Retorno: <a> se houver "href"; senão, <Link> com "to".
 * Onde é usado: dentro dos grupos de links do Footer.
 */
// Âncoras da Home usam <a> (o navegador rola até a seção); páginas usam Link (sem recarregar).
function FooterLink({ link }) {
  return link.href ? <a href={link.href}>{link.label}</a> : <Link to={link.to}>{link.label}</Link>;
}

/*
 * COMPONENTE: Footer
 * O que faz: desenha o rodapé completo.
 * Parâmetros: nenhum.
 * Retorno: JSX do <footer>.
 * Onde é usado: PublicLayout.jsx e LandingPage.jsx.
 */
function Footer() {
  return (
    // <footer> é a tag semântica do rodapé.
    <footer className="footer">
      {/* "wrap" limita a largura e centraliza o conteúdo. */}
      <div className="wrap">
        {/* Parte de cima: marca, links e contato. */}
        <div className="footer-top">
          {/* ----- Marca ----- */}
          <div className="footer-brand">
            {/* Logotipo que leva à página inicial. */}
            <Link to="/" className="footer-logo" aria-label="Patas em Casa — página inicial">
              <span className="footer-logo-mark" aria-hidden="true">
                <PawPrint size={20} />
              </span>
              Patas em Casa
            </Link>
            {/* Descrição com o ano de fundação vindo de ORGANIZACAO. */}
            <p>Resgate, tratamento e adoção responsável de cães e gatos desde {ORGANIZACAO.fundacao}.</p>
            <p className="footer-cnpj">CNPJ {ORGANIZACAO.cnpj}</p>
          </div>

          {/* ----- Grupos de links ----- aria-label dá um nome a esta navegação ("Rodapé"). */}
          <nav className="footer-nav" aria-label="Rodapé">
            {/* Um bloco para cada grupo (Adote, Ajude). */}
            {linkGroups.map((group) => (
              <div key={group.title}>
                <h2 className="footer-heading">{group.title}</h2>
                <ul>
                  {/* Um item de lista para cada link do grupo. */}
                  {group.links.map((link) => (
                    <li key={link.label}><FooterLink link={link} /></li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>

          {/* ----- Contato ----- */}
          <div className="footer-contact">
            <h2 className="footer-heading">Contato</h2>
            <ul>
              {/* Desestruturação com renomeação: { icon: Icon } pega a propriedade "icon"
                  e a guarda na variável "Icon" (com maiúscula, para poder usar como <Icon />). */}
              {contactItems.map(({ icon: Icon, label, href }) => (
                <li key={label}>
                  <Icon size={16} aria-hidden="true" />
                  {/* Se houver href, o texto é um link; senão, só texto. */}
                  {href ? <a href={href}>{label}</a> : <span>{label}</span>}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Parte de baixo: direitos e acesso da equipe. */}
        <div className="footer-bottom">
          {/* new Date().getFullYear() pega o ano atual: o rodapé nunca fica com o ano desatualizado. */}
          <span>© {new Date().getFullYear()} Patas em Casa</span>
          {/* Link para o login do painel administrativo. */}
          <Link to="/admin/login">Área da equipe</Link>
        </div>
      </div>
    </footer>
  );
}

// Exporta o rodapé como padrão do arquivo.
export default Footer;

/*
 * ============================================================================
 * RESUMO DO ARQUIVO
 * ============================================================================
 *
 * COMO O FLUXO FUNCIONA:
 *   1. Os dados do rodapé ficam em duas listas (linkGroups e contactItems).
 *   2. O Footer percorre essas listas com .map para gerar os links e os contatos.
 *   3. Cada link escolhe a tag certa via FooterLink (<a> para âncoras, <Link> para páginas).
 *   4. Os textos de contato vêm de ORGANIZACAO; o ano é calculado na hora.
 *
 * CONCEITOS IMPORTANTES PARA ESTUDAR:
 *   - Interface "guiada por dados": listas de configuração + .map para gerar o JSX.
 *   - Guardar componentes em variáveis/objetos (icon: Mail) e renderizar com <Icon />.
 *   - Desestruturação com renomeação ({ icon: Icon }).
 *   - Listas aninhadas com .map e a prop key.
 *   - Links mailto: e âncoras (/#secao) x Link do React Router.
 *   - HTML semântico: <footer>, <nav aria-label>, títulos e listas.
 *   - Date().getFullYear().
 * ============================================================================
 */
