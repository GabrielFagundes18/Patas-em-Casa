/*
 * ============================================================================
 * ARQUIVO: Hero.jsx
 * ============================================================================
 *
 * PARA QUE SERVE:
 *   É o TOPO da página inicial (a "hero section", a primeira coisa que o visitante
 *   vê). Mostra a frase principal da ONG, os botões "Quero adotar" e "Quero doar",
 *   uma imagem ilustrativa e um ANIMAL EM DESTAQUE (de preferência um caso urgente),
 *   com link para o perfil dele.
 *
 * PRINCIPAIS ITENS:
 *   - pickHighlight(pets): escolhe o animal em destaque (exportada).
 *   - HighlightThumb({ pet }): miniatura da foto do destaque (interna).
 *   - Hero({ pets }): o componente da seção (exportado como padrão).
 *
 * CONEXÕES COM OUTROS ARQUIVOS:
 *   - react (useState), framer-motion (motion), lucide-react (ícones), react-router-dom (Link).
 *   - assets/fundo.webp                → imagem do topo.
 *   - shared/constants/organization    → ano de fundação.
 *   - shared/utils/petText             → artigo ("o"/"a").
 *   - ./Hero.css                       → estilos da seção.
 *   - Classes home-* vêm de features/home/LandingPage.css.
 *   - Quem usa: features/home/LandingPage.jsx (passa a lista de animais).
 *   - Testado em: app/App.test.js ("the hero highlights the first urgent animal").
 * ============================================================================
 */

// O quê: topo da Home: chamada principal, os dois caminhos (adotar e doar) e um animal em destaque.
// Como: o destaque é o primeiro caso urgente da lista (ou o primeiro animal, se não houver urgente).
// Para quê: apresentar a ONG em uma frase e levar o visitante direto a quem precisa de um lar.
// Hook de estado.
import { useState } from 'react';
// motion: elementos animáveis do Framer Motion.
import { motion } from 'framer-motion';
// Ícones: seta, coração e pata.
import { ArrowRight, Heart, PawPrint } from 'lucide-react';
// Link: navegação interna.
import { Link } from 'react-router-dom';
// Importar uma imagem devolve o ENDEREÇO dela (gerado pelo bundler), usado no src da <img>.
import Fundo from 'assets/fundo.webp';
// Dados da ONG (ano de fundação).
import { ORGANIZACAO } from 'shared/constants/organization';
// Artigo "o"/"a" conforme o sexo do animal.
import { artigo } from 'shared/utils/petText';
// Estilos da seção.
import './Hero.css';

/*
 * FUNÇÃO: pickHighlight (exportada)
 * O que faz: escolhe qual animal será destacado no topo.
 * Parâmetros:
 *   - pets (array): animais no formato do petMapper.
 * Retorno: o primeiro animal urgente; se não houver, o primeiro da lista; se a lista
 *   estiver vazia, null.
 * Onde é usada: dentro do Hero, logo abaixo.
 */
export function pickHighlight(pets) {
  // .find devolve o primeiro item que satisfaz a condição (ou undefined).
  // "??" passa para a próxima opção quando a anterior é null/undefined.
  return pets.find((pet) => pet.urgent) ?? pets[0] ?? null;
}

/*
 * COMPONENTE: HighlightThumb (interno)
 * O que faz: mostra a miniatura da foto do animal em destaque ou, sem foto, o ícone de pata.
 * Parâmetros (props): pet (objeto do petMapper; usa pet.image).
 * Retorno: <img> com a foto ou <span> com o ícone.
 * Onde é usado: dentro do cartão de destaque do Hero.
 */
// Miniatura do destaque: a foto do animal ou, sem foto (ou com link quebrado), a pata da marca.
function HighlightThumb({ pet }) {
  // failed vira true se a imagem não carregar.
  const [failed, setFailed] = useState(false);
  // Sem imagem ou com erro: mostra a pata.
  if (!pet.image || failed) {
    return (
      <span className="home-hero-thumb" aria-hidden="true">
        <PawPrint size={24} />
      </span>
    );
  }
  // alt="" (vazio) indica imagem decorativa: o nome do animal já está escrito ao lado.
  return <img className="home-hero-thumb" src={pet.image} alt="" onError={() => setFailed(true)} />;
}

/*
 * COMPONENTE: Hero
 * O que faz: desenha o topo da página inicial.
 * Parâmetros (props):
 *   - pets (array, padrão []): animais disponíveis (já convertidos), usados no contador e no destaque.
 * Retorno: JSX da <section> do topo.
 * Onde é usado: LandingPage.jsx.
 */
function Hero({ pets = [] }) {
  // Animal a ser destacado (ou null).
  const highlight = pickHighlight(pets);

  return (
    // aria-labelledby liga a seção ao título (id="hero-title") para leitores de tela.
    <section className="home-hero" aria-labelledby="hero-title">
      {/* Grade com duas colunas: texto à esquerda e imagem à direita. */}
      <div className="wrap home-hero-grid">
        {/* ===== Coluna de texto =====
            motion.div anima a entrada: começa transparente e 16px abaixo (initial)
            e vai para opaco e na posição (animate), em 0,5 s (transition). */}
        <motion.div
          className="home-hero-copy"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          {/* Rótulo com o ano de fundação. */}
          <p className="home-eyebrow">ONG de proteção animal · desde {ORGANIZACAO.fundacao}</p>
          {/* Título principal da página (o único <h1> da home). <em> dá ênfase (itálico pelo CSS). */}
          <h1 id="hero-title" className="home-hero-title">
            Cada focinho tem uma <em>história.</em>
          </h1>
          {/* Texto de apresentação. */}
          <p className="home-hero-lead">
            Resgatamos, tratamos e preparamos cães e gatos para um lar de verdade. A adoção é gratuita, e a equipe
            acompanha você do primeiro contato até as primeiras semanas em casa.
          </p>
          {/* Os dois caminhos principais: adotar e doar. */}
          <div className="home-hero-actions">
            <Link to="/adotar" className="home-btn home-btn--primary">
              Quero adotar <ArrowRight size={18} aria-hidden="true" />
            </Link>
            <Link to="/doar" className="home-btn home-btn--outline">
              <Heart size={18} aria-hidden="true" /> Quero doar
            </Link>
          </div>
          {/* Link para a página que explica o processo. */}
          <Link to="/como-funciona" className="home-link">Entender o processo de adoção</Link>
        </motion.div>

        {/* ===== Coluna visual ===== (animação com um pequeno atraso: delay 0.1 s) */}
        <motion.div
          className="home-hero-visual"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
        >
          {/* Moldura da imagem, com dois círculos decorativos ("orbs") ao fundo. */}
          <div className="home-hero-frame">
            <span className="home-hero-orb home-hero-orb--amber" aria-hidden="true" />
            <span className="home-hero-orb home-hero-orb--sage" aria-hidden="true" />
            {/* Imagem principal.
                width/height informam a proporção real, evitando "pulos" no layout enquanto carrega.
                fetchPriority="high" pede ao navegador que baixe esta imagem primeiro (é a mais importante). */}
            <img
              src={Fundo}
              alt="Um cachorro e um gato acenando com a pata"
              className="home-hero-img"
              width="1400"
              height="763"
              fetchPriority="high"
            />
          </div>

          {/* Etiqueta com quantos animais esperam um lar (só se houver algum). */}
          {pets.length > 0 ? (
            <p className="home-hero-chip">
              {/* Bolinha verde decorativa. */}
              <span aria-hidden="true" />
              {pets.length} aguardando um lar
            </p>
          ) : null}

          {/* Cartão do animal em destaque: link para o perfil dele. */}
          {highlight ? (
            <Link
              to={highlight.id ? `/animais/${encodeURIComponent(highlight.id)}` : '/adotar'}
              className="home-hero-highlight"
            >
              {/* Miniatura da foto. */}
              <HighlightThumb pet={highlight} />
              <span className="home-hero-highlight-text">
                {/* Selo "Urgente", se for o caso. */}
                {highlight.urgent ? <span className="home-badge-urgent">Urgente</span> : null}
                {/* Frase muda conforme a urgência. */}
                <strong>
                  {highlight.name} {highlight.urgent ? 'precisa de um lar' : 'está esperando por você'}
                </strong>
                {/* "Ver perfil do Duque" / "Ver perfil da Mel": "d" + artigo. */}
                <span className="home-hero-highlight-cta">Ver perfil d{artigo(highlight)} {highlight.name}</span>
              </span>
            </Link>
          ) : null}
        </motion.div>
      </div>
    </section>
  );
}

// Exporta a seção como padrão do arquivo.
export default Hero;

/*
 * ============================================================================
 * RESUMO DO ARQUIVO
 * ============================================================================
 *
 * COMO O FLUXO FUNCIONA:
 *   1. A LandingPage passa a lista de animais para o Hero.
 *   2. pickHighlight escolhe o destaque (urgente primeiro).
 *   3. O Hero desenha o texto (com animação de entrada), os botões de adotar/doar,
 *      a imagem, o contador de animais e o cartão do destaque.
 *   4. Se o destaque não tiver foto (ou a foto falhar), aparece a pata no lugar.
 *
 * CONCEITOS IMPORTANTES PARA ESTUDAR:
 *   - Funções auxiliares exportadas para teste/reuso (pickHighlight).
 *   - Array.find e encadeamento de "??".
 *   - Importar imagens no React (o import devolve a URL).
 *   - Framer Motion: initial, animate e transition.
 *   - Desempenho de imagens: width/height, fetchPriority, alt vazio para decorativas.
 *   - Acessibilidade: um único <h1>, aria-labelledby, aria-hidden.
 *   - Renderização condicional e textos com concordância de gênero.
 * ============================================================================
 */
