const stories = [
  {
    image:
      'https://images.unsplash.com/photo-1601979031925-424e53b6caaa?q=80&w=500&auto=format&fit=crop',
    alt: 'Cachorra adotada no novo lar',
    quote: '"A Mel chegou assustada e hoje dorme na cama, esperando o café da manhã."',
    author: '— Fernanda, adotou em jun/2026',
  },
  {
    image:
      'https://images.unsplash.com/photo-1450778869180-41d0601e046e?q=80&w=500&auto=format&fit=crop',
    alt: 'Gato adotado em novo lar',
    quote: '"O processo foi simples e a equipe acompanhou cada etapa com muito cuidado."',
    author: '— Rafael, adotou em mai/2026',
  },
  {
    image:
      'https://images.unsplash.com/photo-1568640347023-a616a30bc3bd?q=80&w=500&auto=format&fit=crop',
    alt: 'Cachorro brincando no quintal',
    quote: '"Apadrinhar o Duque virou rotina. Ver as fotos dele todo mês não tem preço."',
    author: '— Camila, madrinha desde 2025',
  },
];

function Stories() {
  return (
    <section id="historias">
      <div className="wrap">
        <div className="section-head">
          <span className="eyebrow">Mural do impacto</span>
          <h2>Histórias de quem já tem um novo lar</h2>
        </div>
        <div className="impact-grid">
          {stories.map((story) => (
            <div className="impact-card" key={story.author}>
              <div className="impact-photo">
                <img src={story.image} alt={story.alt} loading="lazy" decoding="async" />
              </div>
              <div className="impact-body">
                <p className="impact-quote">{story.quote}</p>
                <p className="impact-who">{story.author}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Stories;
