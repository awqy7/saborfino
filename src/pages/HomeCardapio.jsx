import { useNavigate } from "react-router-dom";
import CARDAPIO from "../data/cardapio";

const navItems = ["In\u00edcio", "Card\u00e1pio", "Sobre n\u00f3s", "Unidades", "Contato"];

const features = [
  { title: "Qualidade Premium", body: "Carnes selecionadas e de proced\u00eancia", icon: "seal" },
  { title: "Sabor Incompar\u00e1vel", body: "Tempero exclusivo e preparo artesanal", icon: "skewer" },
  { title: "Entrega R\u00e1pida", body: "Seu pedido com rapidez e seguran\u00e7a", icon: "cloche" },
  { title: "Atendimento Especial", body: "Suporte dedicado para voc\u00ea", icon: "heart" },
];

function Icon({ name, className = "" }) {
  const common = {
    className,
    viewBox: "0 0 24 24",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    "aria-hidden": true,
  };
  switch (name) {
    case "logo":
      return (
        <svg {...common} viewBox="0 0 48 48">
          <path d="M9 40L39 10" />
          <path d="M17.5 7.5l23 23" />
          <path d="M10.8 8.4l7 7M7.5 12l7 7M6.4 17.2l6.5 6.5" />
          <path d="M31.2 9.8l7.1 7.1M27.5 13.5l7.1 7.1" />
          <path d="M32.6 32.7l7.6 7.6" />
        </svg>
      );
    case "bag":
      return (
        <svg {...common}>
          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
          <path d="M3 6h18" />
          <path d="M16 10a4 4 0 0 1-8 0" />
        </svg>
      );
    case "login":
      return (
        <svg {...common}>
          <path d="M14.3 6.7l5.1 5.1-5.1 5.1" />
          <path d="M19.1 11.8H8.8" />
          <path d="M11.2 4.6H5.6v14.8h5.6" />
        </svg>
      );
    case "arrow":
      return (
        <svg {...common}>
          <path d="M5 12h13.2" />
          <path d="M13.4 6.9l5.1 5.1-5.1 5.1" />
        </svg>
      );
    case "chevron":
      return (
        <svg {...common}>
          <path d="M7 9.3l5 5 5-5" />
        </svg>
      );
    case "tag":
      return (
        <svg {...common}>
          <path d="M4.3 11.2l6.9-6.9h6.1l2.4 2.4v6.1l-6.9 6.9L4.3 11.2Z" />
          <path d="M14.7 7.5h.1" />
          <path d="M9.1 12.3l2.6 2.6 4-4" />
        </svg>
      );
    case "seal":
      return (
        <svg {...common}>
          <path d="M12 3.5l2 1.7 2.7-.2.8 2.5 2.3 1.5-.9 2.5.9 2.5-2.3 1.5-.8 2.5-2.7-.2-2 1.7-2-1.7-2.7.2-.8-2.5-2.3-1.5.9-2.5-.9-2.5 2.3-1.5.8-2.5 2.7.2 2-1.7Z" />
          <path d="M8.3 12.3l2.4 2.3 5-5.2" />
        </svg>
      );
    case "truck":
      return (
        <svg {...common}>
          <path d="M3.5 6.8h10.7v8.8H3.5V6.8Z" />
          <path d="M14.2 10h3.1l3.2 3.1v2.5h-6.3V10Z" />
          <path d="M7.1 18.2a1.7 1.7 0 1 0 0-3.4 1.7 1.7 0 0 0 0 3.4ZM17.4 18.2a1.7 1.7 0 1 0 0-3.4 1.7 1.7 0 0 0 0 3.4Z" />
        </svg>
      );
    case "pot":
      return (
        <svg {...common}>
          <path d="M5.3 10.2h13.4l-1.1 7.1a2.4 2.4 0 0 1-2.4 2H8.8a2.4 2.4 0 0 1-2.4-2l-1.1-7.1Z" />
          <path d="M8.2 10.1V8.9a3.8 3.8 0 0 1 7.6 0v1.2" />
          <path d="M3.5 10.2h17M9.1 5.1c.4-.8 1.4-1.5 2.9-1.5s2.5.7 2.9 1.5" />
        </svg>
      );
    case "flame":
      return (
        <svg {...common}>
          <path d="M12.3 21c4.2-1.5 6-4.1 6-7.1 0-3.4-2.4-5.4-4.5-7.6-.6 2.8-2.3 4.2-4 5.6.1-2 .5-3.5 1.2-5.4-2.8 2.1-5.3 4.7-5.3 8.1 0 3.1 2 5.2 5.1 6.4-.8-1-.9-2.1-.5-3.2.4-1.2 1.4-2.2 2.3-3.3.5 1.5 1.6 2.3 1.6 3.8 0 1.1-.6 2-1.9 2.7Z" />
        </svg>
      );
    case "skewer":
      return (
        <svg {...common}>
          <path d="M4 20L20 4" />
          <path d="M8.3 8.4l3.3 3.3M12.5 6.3l5.2 5.2M6.3 12.5l5.2 5.2" />
          <path d="M8.7 5.2c.9-.9 2.3-.9 3.2 0s.9 2.3 0 3.2M15.6 12.1c.9-.9 2.3-.9 3.2 0s.9 2.3 0 3.2M5.2 8.7c-.9.9-.9 2.3 0 3.2s2.3.9 3.2 0" />
        </svg>
      );
    case "cloche":
      return (
        <svg {...common}>
          <path d="M5 15.8a7 7 0 0 1 14 0H5Z" />
          <path d="M4 18.4h16M12 6.1v2.4M9.3 6.1h5.4" />
          <path d="M9.1 13.2c.8-1.6 2.2-2.4 4.1-2.4" />
        </svg>
      );
    case "heart":
      return (
        <svg {...common}>
          <path d="M12 20.1s-7.6-4.3-7.6-10A4.2 4.2 0 0 1 12 7.5a4.2 4.2 0 0 1 7.6 2.6c0 5.7-7.6 10-7.6 10Z" />
        </svg>
      );
    default:
      return null;
  }
}

function formatPrice(price) {
  return "";
}

function DishCard({ item, index }) {
  return (
    <article className="dish-card">
      <span className="dish-number">{String(index + 1).padStart(2, "0")}</span>
      <div
        className="dish-shot"
        style={{ backgroundImage: `url(${item.image})` }}
        aria-hidden="true"
      />
      <button className="dish-flame" aria-label="Prato em destaque">
        <Icon name="flame" />
      </button>
      <div className="dish-copy">
        <h3>{item.name}</h3>
        {item.desc && <p>{item.desc}</p>}
        <strong>{formatPrice(item.price)}</strong>
      </div>
    </article>
  );
}

function MenuCategory({ section, isFirst = false, onCategoryClick }) {
  return (
    <div className="category-block" style={{ marginBottom: isFirst ? 0 : 30 }}>
      <div className="category-panel" style={{
        backgroundImage: `
          linear-gradient(90deg, rgba(12,12,12,0.91) 0%, rgba(12,12,12,0.48) 27%, rgba(12,12,12,0) 52%, rgba(12,12,12,0.4) 78%, rgba(12,12,12,0.9) 100%),
          url(${section.image}),
          radial-gradient(ellipse at 52% 54%, rgba(165,75,24,0.7) 0 18%, rgba(61,24,7,0.7) 32%, transparent 55%),
          linear-gradient(90deg, #130f0d 0%, #2a160c 48%, #0b0b0b 100%)
        `,
        backgroundSize: "100% 100%, auto 100%, 100% 100%, 100% 100%",
        backgroundPosition: "center, center, center, center",
        backgroundRepeat: "no-repeat",
      }}>
        <div className="category-flame">
          <Icon name="flame" />
        </div>
        <div className="category-copy">
          <Icon name="pot" />
          <div>
            <h3>{section.category}</h3>
            <p>{section.items.length} {section.items.length === 1 ? "opção" : "opções"} disponíve{section.items.length === 1 ? "l" : "is"}</p>
          </div>
        </div>
        <button className="category-button" type="button" onClick={onCategoryClick}>
          Ver categoria
          <Icon name="arrow" />
        </button>
      </div>

      <div className="dish-grid" style={{ marginTop: 13 }}>
        {section.items.map((item, idx) => (
          <DishCard item={item} index={idx} key={item.id} />
        ))}
      </div>
    </div>
  );
}

export default function HomeCardapio() {
  const navigate = useNavigate();

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  const handleNav = (item) => {
    if (item === "In\u00edcio") window.scrollTo({ top: 0, behavior: "smooth" });
    else if (item === "Card\u00e1pio") scrollTo("cardapio");
  };

  return (
    <main className="fs-page">
      <section className="hero">
        <div className="hero-photo" />
        <header className="topbar">
          <a className="brand" href="/" aria-label="Fino Sabor" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
            <Icon name="logo" className="brand-mark" />
            <span>
              <b>Fino Sabor</b>
              <small>CHURRASCARIA</small>
            </span>
          </a>

          <nav className="nav-links" aria-label="Navegação principal">
            {navItems.map((item, index) => (
              <a
                className={index === 0 ? "active" : ""}
                href={`#${item.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")}`}
                key={item}
                onClick={(e) => { e.preventDefault(); handleNav(item); }}
              >
                {item}
              </a>
            ))}
          </nav>

          <div className="top-actions">
            <button className="order-button" onClick={() => navigate("/order")}>
              <Icon name="bag" />
              Pedir
            </button>
            <button className="system-button" onClick={() => navigate("/login")}>
              <Icon name="login" />
              Sistema
            </button>
          </div>
        </header>

        <div className="hero-inner">
          <div className="hero-copy">
            <div className="eyebrow">
              <span>DESDE 2010</span>
              <i />
            </div>
            <h1>
              Churrascaria
              <span>Fino Sabor</span>
            </h1>
            <p>
              Prazer em servi-los, onde a qualidade faz a diferen&ccedil;a.
            </p>

            <div className="hero-actions">
              <button className="cta-primary" onClick={() => navigate("/order")}>
                <Icon name="bag" />
                Fazer Pedido
                <Icon name="arrow" />
              </button>
              <button className="cta-secondary" onClick={() => scrollTo("cardapio")}>
                Ver Card&aacute;pio
                <Icon name="chevron" />
              </button>
            </div>

            <div className="hero-badges">
              <span>
                <Icon name="tag" />
                Carnes
                <br />
                Selecionadas
              </span>
              <span>
                <Icon name="seal" />
                Preparo
                <br />
                Artesanal
              </span>
              <span>
                <Icon name="truck" />
                Entrega
                <br />
                R&aacute;pida
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="menu-section" id="cardapio">
        <div className="section-title">
          <span>NOSSO CARD&Aacute;PIO</span>
          <h2>
            <i />
            Escolha sua experi&ecirc;ncia
            <i />
          </h2>
        </div>

        {CARDAPIO.slice(0, 1).map((section) => (
          <div key={section.category} style={{ marginBottom: 0 }}>
            <div className="category-panel" style={{
              backgroundImage: `
                linear-gradient(90deg, rgba(12,12,12,0.91) 0%, rgba(12,12,12,0.48) 27%, rgba(12,12,12,0) 52%, rgba(12,12,12,0.4) 78%, rgba(12,12,12,0.9) 100%),
                url(${section.image}),
                radial-gradient(ellipse at 52% 54%, rgba(165,75,24,0.7) 0 18%, rgba(61,24,7,0.7) 32%, transparent 55%),
                linear-gradient(90deg, #130f0d 0%, #2a160c 48%, #0b0b0b 100%)
              `,
              backgroundSize: "100% 100%, auto 100%, 100% 100%, 100% 100%",
              backgroundPosition: "center, center, center, center",
              backgroundRepeat: "no-repeat",
            }}>
              <div className="category-flame">
                <Icon name="flame" />
              </div>
              <div className="category-copy">
                <Icon name="pot" />
                <div>
                  <h3>{section.category}</h3>
                  <p>{section.items.length} {section.items.length === 1 ? "opção" : "opções"} disponíve{section.items.length === 1 ? "l" : "is"}</p>
                </div>
              </div>
              <button className="category-button" onClick={() => navigate("/order")}>
                Ver categoria
                <Icon name="arrow" />
              </button>
            </div>

            <div className="dish-grid" style={{ marginTop: 13 }}>
              {section.items.map((item, idx) => (
                <DishCard item={item} index={idx} key={item.id} />
              ))}
            </div>
          </div>
        ))}

        <div className="features-row">
          {features.map((feature) => (
            <div className="feature" key={feature.title}>
              <span className="feature-icon">
                <Icon name={feature.icon} />
              </span>
              <span>
                <b>{feature.title}</b>
                <small>{feature.body}</small>
              </span>
            </div>
          ))}
        </div>

        <div className="menu-rest">
          {CARDAPIO.slice(1).map((section) => (
            <MenuCategory
              section={section}
              onCategoryClick={() => navigate("/order")}
              key={section.category}
            />
          ))}
        </div>
      </section>

      <style>{`
        html,
        body {
          margin: 0;
          background: #111211;
        }
        .fs-page,
        .fs-page * {
          box-sizing: border-box;
        }
        .fs-page {
          --orange: #ff8507;
          --orange-hot: #ff6b00;
          --orange-soft: #c87517;
          --line: rgba(255, 136, 12, 0.34);
          --text: #f4f0e9;
          --muted: #beb9b2;
          --panel: rgba(12, 12, 12, 0.92);
          min-height: 100vh;
          color: var(--text);
          overflow-x: hidden;
          background:
            radial-gradient(circle at 44% -12%, rgba(255, 119, 0, 0.12), transparent 24%),
            linear-gradient(180deg, #080808 0%, #111211 52%, #0e0f0f 100%);
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }
        .fs-page button {
          font-family: inherit;
        }
        .fs-page a {
          color: inherit;
          text-decoration: none;
        }
        .fs-page svg {
          width: 1em;
          height: 1em;
          stroke: currentColor;
          stroke-width: 1.9;
          stroke-linecap: round;
          stroke-linejoin: round;
        }
        .hero {
          position: relative;
          min-height: 502px;
          isolation: isolate;
          background:
            radial-gradient(circle at 78% 38%, rgba(255, 132, 14, 0.16), transparent 27%),
            radial-gradient(circle at 13% 26%, rgba(255, 103, 0, 0.16), transparent 23%),
            linear-gradient(180deg, #030303 0%, #090909 100%);
          overflow: hidden;
        }
        .hero::before {
          content: "";
          position: absolute;
          inset: 0;
          z-index: -3;
          background:
            radial-gradient(circle at 50% 20%, rgba(74, 38, 16, 0.52), transparent 24%),
            radial-gradient(circle at 14% 38%, rgba(123, 42, 6, 0.28), transparent 19%),
            linear-gradient(90deg, #030303 0%, #0a0806 42%, #060606 100%);
          filter: saturate(1.05);
        }
        .hero::after {
          content: "";
          position: absolute;
          inset: 0;
          z-index: -1;
          background:
            linear-gradient(90deg, rgba(0, 0, 0, 0.52) 0%, rgba(0, 0, 0, 0.02) 38%, rgba(0, 0, 0, 0) 68%, rgba(0, 0, 0, 0.42) 100%),
            linear-gradient(180deg, rgba(0, 0, 0, 0.28) 0%, rgba(0, 0, 0, 0) 39%, rgba(0, 0, 0, 0.04) 78%, rgba(0, 0, 0, 0.58) 100%);
        }
        .hero-photo {
          position: absolute;
          top: 80px;
          left: 0;
          right: 0;
          bottom: -3px;
          width: 100%;
          z-index: -2;
          opacity: 1;
          filter: brightness(1.13) saturate(1.16) contrast(1.03);
          background-image:
            linear-gradient(90deg, rgba(5, 5, 5, 0.12) 0%, rgba(5, 5, 5, 0) 24%, rgba(5, 5, 5, 0) 72%, rgba(5, 5, 5, 0.1) 100%),
            linear-gradient(180deg, rgba(0, 0, 0, 0), rgba(0, 0, 0, 0.06)),
            url('/images/fino-sabor-hero-wide.png'),
            linear-gradient(122deg, #1a0f0a 0%, #3a1a0b 44%, #070707 100%);
          background-size:
            100% 100%,
            100% 100%,
            cover,
            100% 100%;
          background-position:
            center,
            center,
            center,
            center;
          background-repeat: no-repeat;
        }
        .topbar {
          position: relative;
          z-index: 5;
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: min(1348px, calc(100% - 48px));
          height: 68px;
          margin: 15px auto 0;
          padding: 0 24px 0 27px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 30px;
          background: rgba(7, 7, 7, 0.86);
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.04),
            0 24px 60px rgba(0, 0, 0, 0.35);
          backdrop-filter: blur(14px);
        }
        .brand {
          display: inline-flex;
          align-items: center;
          gap: 15px;
          min-width: 220px;
          cursor: pointer;
        }
        .brand .brand-mark {
          width: 39px;
          height: 39px;
          color: var(--orange);
          stroke-width: 2.65;
          filter: drop-shadow(0 0 9px rgba(255, 119, 0, 0.34));
        }
        .brand b {
          display: block;
          margin-top: -1px;
          font-family: Georgia, "Times New Roman", serif;
          font-size: 24px;
          line-height: 23px;
          letter-spacing: 0;
        }
        .brand small {
          display: block;
          margin-top: 5px;
          color: var(--orange);
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 3.5px;
        }
        .nav-links {
          position: absolute;
          left: 50%;
          top: 50%;
          display: flex;
          align-items: center;
          gap: 50px;
          transform: translate(-50%, -50%);
          color: #b6b1ad;
          font-size: 13.5px;
          font-weight: 500;
        }
        .nav-links a {
          transition: color 160ms ease;
          cursor: pointer;
        }
        .nav-links a.active,
        .nav-links a:hover {
          color: var(--orange);
        }
        .top-actions {
          display: inline-flex;
          align-items: center;
          gap: 12px;
        }
        .order-button,
        .system-button,
        .cta-primary,
        .cta-secondary,
        .category-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          white-space: nowrap;
          font-weight: 800;
          cursor: pointer;
          border: none;
        }
        .order-button {
          gap: 10px;
          height: 44px;
          min-width: 97px;
          border-radius: 10px;
          background: linear-gradient(180deg, #ff9016 0%, #ff6600 100%);
          box-shadow:
            0 0 0 1px rgba(255, 158, 52, 0.58),
            0 8px 22px rgba(255, 103, 0, 0.48);
          color: white;
          font-size: inherit;
        }
        .order-button svg,
        .system-button svg {
          width: 20px;
          height: 20px;
        }
        .system-button {
          gap: 9px;
          height: 44px;
          min-width: 114px;
          color: #d7d1cc;
          border: 1px solid rgba(255, 132, 14, 0.58);
          border-radius: 10px;
          background: rgba(5, 5, 5, 0.45);
          font-size: inherit;
        }
        .hero-inner {
          width: min(1348px, calc(100% - 48px));
          margin: 0 auto;
        }
        .hero-copy {
          width: 410px;
          padding-top: 58px;
          margin-left: 20px;
        }
        .eyebrow {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 7px;
          color: var(--orange);
          font-size: 12px;
          font-weight: 900;
          letter-spacing: 2px;
        }
        .eyebrow i {
          display: block;
          width: 45px;
          height: 1px;
          background: linear-gradient(90deg, rgba(255, 132, 14, 0.65), rgba(255, 132, 14, 0));
        }
        .hero h1 {
          margin: 0;
          font-family: Georgia, "Times New Roman", serif;
          font-size: clamp(50px, 3.9vw, 65px);
          line-height: 0.98;
          letter-spacing: 0;
          color: #f8f4ef;
          text-shadow: 0 4px 22px rgba(0, 0, 0, 0.46);
        }
        .hero h1 span {
          display: block;
          margin-top: 6px;
          color: var(--orange);
        }
        .hero p {
          margin: 17px 0 0;
          color: #d1ccc6;
          font-size: 16px;
          line-height: 1.45;
          font-weight: 600;
        }
        .hero-actions {
          display: flex;
          align-items: center;
          gap: 18px;
          margin-top: 24px;
        }
        .cta-primary {
          gap: 13px;
          height: 42px;
          min-width: 166px;
          padding: 0 18px;
          border-radius: 10px;
          background: linear-gradient(180deg, #ff9015 0%, #ff6600 100%);
          box-shadow:
            0 0 0 1px rgba(255, 158, 52, 0.45),
            0 12px 26px rgba(255, 103, 0, 0.36);
          font-size: 13.5px;
          color: white;
        }
        .cta-primary svg:first-child,
        .cta-secondary svg {
          width: 19px;
          height: 19px;
        }
        .cta-primary svg:last-child {
          width: 18px;
          height: 18px;
        }
        .cta-secondary {
          gap: 13px;
          height: 42px;
          min-width: 126px;
          padding: 0 17px;
          color: #f4f0e9;
          border: 1px solid rgba(255, 255, 255, 0.27);
          border-radius: 10px;
          background: rgba(10, 10, 10, 0.58);
          box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.4);
          font-size: 13.5px;
        }
        .hero-badges {
          display: flex;
          align-items: center;
          gap: 34px;
          margin-top: 35px;
          color: #c9c3bd;
          font-size: 12.5px;
          line-height: 1.18;
        }
        .hero-badges span {
          display: grid;
          grid-template-columns: 24px auto;
          column-gap: 10px;
          align-items: center;
        }
        .hero-badges svg {
          grid-row: span 2;
          width: 24px;
          height: 24px;
          color: var(--orange);
          stroke-width: 1.7;
        }
        .menu-section {
          position: relative;
          padding: 18px 0 5px;
          background:
            radial-gradient(circle at 50% 10%, rgba(255, 255, 255, 0.035), transparent 27%),
            radial-gradient(circle at 18% 50%, rgba(255, 132, 14, 0.06), transparent 28%),
            linear-gradient(180deg, #111312 0%, #0d0e0e 100%);
          border-top: 1px solid rgba(255, 255, 255, 0.06);
        }
        .section-title {
          width: min(1348px, calc(100% - 48px));
          margin: 0 auto 24px;
          text-align: center;
        }
        .section-title > span {
          display: block;
          color: var(--orange);
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 2px;
        }
        .section-title h2 {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 17px;
          margin: 4px 0 0;
          font-family: Georgia, "Times New Roman", serif;
          font-size: 31px;
          line-height: 1.05;
          letter-spacing: 1.1px;
          color: #f3eee9;
        }
        .section-title h2 i {
          width: 41px;
          height: 1px;
          background: linear-gradient(90deg, rgba(255, 132, 14, 0), rgba(255, 132, 14, 0.9), rgba(255, 132, 14, 0));
        }
        .category-panel {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: min(1348px, calc(100% - 48px));
          height: 102px;
          margin: 0 auto 13px;
          padding: 0 34px;
          overflow: hidden;
          border: 1px solid rgba(255, 132, 14, 0.3);
          border-radius: 10px;
          background-image:
            linear-gradient(90deg, rgba(12, 12, 12, 0.91) 0%, rgba(12, 12, 12, 0.48) 27%, rgba(12, 12, 12, 0) 52%, rgba(12, 12, 12, 0.4) 78%, rgba(12, 12, 12, 0.9) 100%),
            url('/images/fino-sabor-category-background.png'),
            url('/images/fino-sabor-reference.png'),
            radial-gradient(ellipse at 52% 54%, rgba(165, 75, 24, 0.7) 0 18%, rgba(61, 24, 7, 0.7) 32%, transparent 55%),
            linear-gradient(90deg, #130f0d 0%, #2a160c 48%, #0b0b0b 100%);
          background-size:
            100% 100%,
            auto 100%,
            1672px 941px,
            100% 100%,
            100% 100%;
          background-position:
            center,
            center,
            -162px -578px,
            center,
            center;
          background-repeat: no-repeat;
        }
        .category-panel::after {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.045), rgba(0, 0, 0, 0.18));
        }
        .category-flame {
          position: absolute;
          left: 50%;
          top: -7px;
          z-index: 2;
          display: grid;
          width: 30px;
          height: 30px;
          place-items: center;
          color: var(--orange);
          transform: translateX(-50%);
          border-radius: 999px;
          background: rgba(20, 13, 8, 0.86);
          box-shadow: 0 0 18px rgba(255, 113, 0, 0.32);
        }
        .category-flame svg {
          width: 18px;
          height: 18px;
          fill: rgba(255, 132, 14, 0.14);
        }
        .category-copy {
          position: relative;
          z-index: 2;
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .category-copy > svg {
          width: 39px;
          height: 39px;
          color: var(--orange);
          stroke-width: 1.7;
        }
        .category-copy h3 {
          margin: 0;
          font-family: Georgia, "Times New Roman", serif;
          font-size: 31px;
          line-height: 1;
          letter-spacing: 0;
          color: #f5eee8;
          text-shadow: 0 4px 16px rgba(0, 0, 0, 0.64);
        }
        .category-copy p {
          margin: 7px 0 0;
          color: #d2cbc5;
          font-size: 13.5px;
        }
        .category-button {
          position: relative;
          z-index: 2;
          gap: 14px;
          height: 34px;
          min-width: 124px;
          padding: 0 15px;
          color: #f2ebe5;
          border: 1px solid rgba(255, 132, 14, 0.5);
          border-radius: 999px;
          background: rgba(8, 8, 8, 0.5);
          font-size: 11.5px;
        }
        .category-button svg {
          width: 14px;
          height: 14px;
          color: var(--orange);
        }
        .dish-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 17px;
          width: min(1348px, calc(100% - 48px));
          margin: 0 auto;
        }
        .dish-card {
          position: relative;
          height: 158px;
          padding: 28px 18px 14px 137px;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.16);
          border-radius: 10px;
          background:
            linear-gradient(180deg, rgba(255, 255, 255, 0.035), rgba(255, 255, 255, 0)),
            linear-gradient(110deg, rgba(18, 18, 18, 0.95), rgba(10, 10, 10, 0.98));
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
        }
        .dish-card::after {
          content: "";
          position: absolute;
          inset: auto 0 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255, 132, 14, 0.13), transparent);
        }
        .dish-number {
          position: absolute;
          left: 14px;
          top: 12px;
          z-index: 2;
          display: inline-grid;
          width: 27px;
          height: 22px;
          place-items: center;
          color: var(--orange);
          border: 1px solid var(--orange);
          border-radius: 6px;
          background: #12100d;
          font-size: 11.5px;
          font-weight: 800;
        }
        .dish-shot {
          position: absolute;
          left: 13px;
          bottom: 13px;
          width: 122px;
          height: 111px;
          overflow: hidden;
          border-radius: 8px;
          background-image:
            linear-gradient(180deg, rgba(0, 0, 0, 0.03), rgba(0, 0, 0, 0.25)),
            radial-gradient(ellipse at 64% 60%, rgba(191, 112, 26, 0.72) 0 18%, transparent 42%),
            radial-gradient(ellipse at 35% 45%, rgba(96, 42, 19, 0.9) 0 16%, transparent 39%),
            linear-gradient(135deg, #1d120d, #59351d 42%, #0a0a0a);
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          box-shadow: 14px 0 24px rgba(0, 0, 0, 0.36);
        }
        .dish-flame {
          position: absolute;
          right: 15px;
          top: 13px;
          display: grid;
          width: 27px;
          height: 27px;
          place-items: center;
          color: var(--orange);
          border: 1px solid rgba(255, 132, 14, 0.55);
          border-radius: 999px;
          background: rgba(9, 9, 9, 0.68);
          cursor: pointer;
        }
        .dish-flame svg {
          width: 15px;
          height: 15px;
          fill: rgba(255, 132, 14, 0.12);
        }
        .dish-copy h3 {
          margin: 0 0 7px;
          font-family: Georgia, "Times New Roman", serif;
          font-size: 15.8px;
          line-height: 1.04;
          letter-spacing: 0;
          color: #f5eee8;
          text-shadow: 0 3px 14px rgba(0, 0, 0, 0.55);
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .dish-copy p {
          margin: 0;
          color: #c0bbb7;
          font-size: 11.2px;
          line-height: 1.18;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .dish-copy strong {
          display: block;
          margin-top: 7px;
          color: var(--orange);
          font-size: 15px;
          line-height: 1;
        }
        .features-row {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          width: min(1348px, calc(100% - 48px));
          min-height: 75px;
          margin: 11px auto 0;
          border: 1px solid rgba(255, 132, 14, 0.24);
          border-radius: 10px;
          background:
            linear-gradient(180deg, rgba(255, 255, 255, 0.03), rgba(255, 255, 255, 0)),
            rgba(10, 10, 10, 0.74);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.035);
        }
        .menu-rest {
          margin-top: 26px;
        }
        .feature {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 15px;
          padding: 10px 21px;
        }
        .feature:not(:last-child)::after {
          content: "";
          position: absolute;
          right: 0;
          top: 30%;
          width: 1px;
          height: 40%;
          background: rgba(255, 132, 14, 0.22);
        }
        .feature-icon {
          display: grid;
          flex: 0 0 44px;
          width: 44px;
          height: 44px;
          place-items: center;
          color: var(--orange);
          border: 1px solid rgba(255, 132, 14, 0.38);
          border-radius: 16px;
          background: rgba(255, 132, 14, 0.1);
        }
        .feature-icon svg {
          width: 24px;
          height: 24px;
          stroke-width: 1.7;
        }
        .feature b {
          display: block;
          margin-bottom: 4px;
          color: #f0ebe6;
          font-size: 12.5px;
          line-height: 1.05;
        }
        .feature small {
          display: block;
          max-width: 157px;
          color: #aba59f;
          font-size: 11.5px;
          line-height: 1.18;
        }
        @media (max-width: 1240px) {
          .topbar,
          .hero-inner,
          .section-title,
          .category-panel,
          .dish-grid,
          .features-row {
            width: min(100% - 32px, 980px);
          }
          .nav-links {
            display: none;
          }
          .hero-photo {
            width: 100%;
            opacity: 0.95;
          }
          .hero-copy {
            width: min(100%, 500px);
          }
          .dish-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .features-row {
            grid-template-columns: repeat(2, 1fr);
          }
          .feature:nth-child(2)::after {
            display: none;
          }
        }
        @media (max-width: 760px) {
          .hero {
            height: 500px;
            min-height: 0;
          }
          .hero::before {
            background:
              radial-gradient(circle at 64% 25%, rgba(144, 64, 22, 0.5), transparent 30%),
              linear-gradient(180deg, #030303 0%, #070707 100%);
          }
          .hero::after {
            background:
              linear-gradient(90deg, rgba(0, 0, 0, 0.58) 0%, rgba(0, 0, 0, 0.12) 58%, rgba(0, 0, 0, 0.44) 100%),
              linear-gradient(180deg, rgba(0, 0, 0, 0.26) 0%, rgba(0, 0, 0, 0) 42%, rgba(0, 0, 0, 0.52) 100%);
          }
          .hero-photo {
            top: 78px;
            bottom: 0;
            width: 100%;
            opacity: 1;
            filter: brightness(1.16) saturate(1.18) contrast(1.03);
            background-size:
              100% 100%,
              100% 100%,
              cover,
              100% 100%;
            background-position:
              center,
              center,
              center,
              center;
          }

          .topbar {
            height: 66px;
            min-height: 0;
            align-items: center;
            gap: 12px;
            margin-top: 11px;
            padding: 0 14px;
            border-radius: 22px;
          }
          .brand {
            min-width: 0;
            gap: 10px;
          }
          .brand .brand-mark {
            width: 34px;
            height: 34px;
          }
          .brand b {
            font-size: 22px;
            line-height: 20px;
          }
          .brand small {
            margin-top: 4px;
            font-size: 8px;
            letter-spacing: 2.7px;
          }
          .top-actions {
            margin-left: auto;
            gap: 0;
          }
          .system-button {
            display: none;
          }
          .order-button {
            height: 42px;
            min-width: 88px;
            border-radius: 11px;
            font-size: 13px;
          }
          .hero-copy {
            width: min(100%, 440px);
            margin-left: 0;
            padding-top: 44px;
          }
          .hero h1 {
            font-size: 48px;
            line-height: 0.98;
          }
          .hero p {
            max-width: 310px;
            font-size: 15px;
          }
          .hero-actions {
            flex-wrap: wrap;
            gap: 12px;
            margin-top: 22px;
          }
          .hero-badges {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 8px;
            width: min(100%, 430px);
            margin-top: 28px;
            font-size: 11px;
          }
          .hero-badges span {
            grid-template-columns: 20px minmax(0, 1fr);
            min-height: 52px;
            padding: 10px 9px;
            border: 1px solid rgba(255, 132, 14, 0.22);
            border-radius: 10px;
            background: rgba(8, 8, 8, 0.46);
            backdrop-filter: blur(8px);
          }
          .hero-badges svg {
            width: 20px;
            height: 20px;
          }
          .menu-section {
            padding-top: 22px;
          }
          .section-title h2 {
            font-size: 27px;
            gap: 10px;
          }
          .section-title h2 i {
            width: 24px;
          }
          .category-panel {
            height: 132px;
            align-items: flex-start;
            padding: 23px 22px;
            border-radius: 10px;
            background-size:
              100% 100%,
              auto 100%,
              100% 100%,
              100% 100%;
          }
          .category-copy {
            gap: 13px;
            max-width: calc(100% - 146px);
          }
          .category-copy > svg {
            width: 34px;
            height: 34px;
          }
          .category-copy h3 {
            font-size: 29px;
          }
          .category-button {
            position: absolute;
            right: 18px;
            bottom: 18px;
            height: 32px;
          }
          .dish-grid {
            grid-template-columns: 1fr;
            gap: 10px;
          }
          .dish-card {
            height: 142px;
            padding: 32px 48px 13px 132px;
            border-color: rgba(255, 255, 255, 0.15);
            border-radius: 10px;
          }
          .dish-shot {
            left: 12px;
            top: 31px;
            bottom: auto;
            width: 108px;
            height: 96px;
            border-radius: 8px;
          }
          .dish-number {
            left: 12px;
            top: 10px;
          }
          .dish-flame {
            right: 12px;
            top: 10px;
          }
          .dish-copy h3 {
            font-size: 17px;
            line-height: 1.03;
            margin-bottom: 7px;
          }
          .dish-copy p {
            font-size: 11.4px;
            line-height: 1.2;
          }
          .dish-copy strong {
            font-size: 15px;
            margin-top: 8px;
          }
          .features-row {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            min-height: 0;
            gap: 0;
          }
          .feature:not(:last-child)::after {
            display: none;
          }
          .feature {
            justify-content: flex-start;
            align-items: flex-start;
            min-height: 112px;
            padding: 14px;
            border-bottom: 1px solid rgba(255, 132, 14, 0.14);
          }
          .feature:nth-child(odd) {
            border-right: 1px solid rgba(255, 132, 14, 0.14);
          }
          .feature:nth-child(n + 3) {
            border-bottom: none;
          }
          .feature-icon {
            flex-basis: 40px;
            width: 40px;
            height: 40px;
            border-radius: 12px;
          }
          .feature-icon svg {
            width: 21px;
            height: 21px;
          }
          .feature b {
            font-size: 12px;
          }
          .feature small {
            max-width: none;
            font-size: 10.6px;
          }
          .menu-rest {
            margin-top: 22px;
          }
        }
        @media (max-width: 470px) {
          .topbar,
          .hero-inner,
          .section-title,
          .category-panel,
          .dish-grid,
          .features-row {
            width: calc(100% - 22px);
          }
          .topbar {
            height: 62px;
            padding: 0 12px;
          }
          .brand .brand-mark {
            width: 31px;
            height: 31px;
          }
          .brand b {
            font-size: 20px;
            line-height: 19px;
          }
          .brand small {
            font-size: 7px;
            letter-spacing: 2.4px;
          }
          .order-button {
            min-width: 44px;
            width: 44px;
            height: 40px;
            padding: 0;
            gap: 0;
            font-size: 0;
          }
          .order-button svg {
            width: 21px;
            height: 21px;
          }
          .hero-copy {
            padding-top: 42px;
          }
          .hero h1 {
            font-size: 42px;
          }
          .hero p {
            max-width: 280px;
            font-size: 14.5px;
          }
          .cta-primary,
          .cta-secondary {
            width: 100%;
            height: 44px;
          }
          .dish-card {
            height: 138px;
            min-height: 0;
            padding: 31px 40px 12px 126px;
          }
          .dish-shot {
            left: 11px;
            top: 31px;
            width: 103px;
            height: 93px;
          }
          .dish-copy h3,
          .dish-copy p {
            max-width: none;
          }
          .dish-copy h3 {
            font-size: 15.8px;
          }
          .dish-copy p {
            font-size: 10.8px;
            -webkit-line-clamp: 3;
          }
          .hero-badges {
            gap: 5px;
            font-size: 10px;
            width: 100%;
          }
          .hero-badges span {
            padding: 6px 5px;
            min-height: 40px;
            column-gap: 6px;
            grid-template-columns: 16px minmax(0, 1fr);
          }
          .hero-badges svg {
            width: 16px;
            height: 16px;
          }
          .features-row {
            grid-template-columns: 1fr;
          }
          .category-panel {
            height: 148px;
            padding: 20px;
          }
          .category-copy {
            max-width: 100%;
          }
          .category-copy h3 {
            font-size: 25px;
            line-height: 0.98;
          }
          .category-copy p {
            font-size: 12.5px;
          }
          .category-button {
            left: 20px;
            right: auto;
            bottom: 17px;
            min-width: 118px;
          }
          .feature {
            min-height: 82px;
            flex-direction: row;
            align-items: center;
            border-right: none !important;
            border-bottom: 1px solid rgba(255, 132, 14, 0.14);
          }
          .feature:nth-child(n + 3) {
            border-bottom: 1px solid rgba(255, 132, 14, 0.14);
          }
          .feature:last-child {
            border-bottom: none;
          }
        }
      `}</style>
    </main>
  );
}
