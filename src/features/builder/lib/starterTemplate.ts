// Placeholder starter files shown in the builder's Files/Code/Preview tabs until real
// AI-generated output is wired up. See AssistantPanel.tsx's AI_WIRING_ENABLED flag —
// once that's flipped on, these get replaced by whatever the Cloud Function generates
// (createWebsite already produces files in this same App.tsx/components shape).
export const starterTemplateFiles: Record<string, { code: string }> = {
  '/App.tsx': {
    code: `import "./styles.css";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";

export default function App() {
  return (
    <div className="page">
      <Navbar />
      <Hero />
    </div>
  );
}
`,
  },
  '/components/Navbar.tsx': {
    code: `export default function Navbar() {
  return (
    <header className="navbar">
      <span className="brand">Your Site</span>
      <nav>
        <a href="#">Home</a>
        <a href="#">About</a>
        <a href="#">Contact</a>
      </nav>
    </header>
  );
}
`,
  },
  '/components/Hero.tsx': {
    code: `export default function Hero() {
  return (
    <section className="hero">
      <p className="eyebrow">Welcome</p>
      <h1>Build something great.</h1>
      <p className="lead">
        Describe what you want on the left, and EMPIRIAL will shape it into a real site.
      </p>
      <button className="cta">Get started</button>
    </section>
  );
}
`,
  },
  '/styles.css': {
    code: `body { margin: 0; font-family: Inter, system-ui, sans-serif; background: #fff; color: #111; }
.navbar { display: flex; align-items: center; justify-content: space-between; padding: 20px 32px; border-bottom: 1px solid #eee; }
.navbar .brand { font-weight: 700; }
.navbar nav { display: flex; gap: 20px; font-size: 14px; }
.navbar a { color: #444; text-decoration: none; }
.hero { padding: 96px 32px; text-align: center; max-width: 640px; margin: 0 auto; }
.eyebrow { color: #7c3aed; font-size: 12px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; }
.hero h1 { font-size: 44px; line-height: 1.1; margin: 16px 0; }
.lead { color: #555; line-height: 1.6; }
.cta { margin-top: 24px; padding: 12px 22px; background: #7c3aed; color: #fff; border: 0; border-radius: 8px; font-weight: 600; cursor: pointer; }
`,
  },
};
