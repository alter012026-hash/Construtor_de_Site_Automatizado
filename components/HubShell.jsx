import Link from "next/link";

export default function HubShell({ children }) {
  return (
    <div className="hub-shell">
      <header className="hub-header">
        <Link className="hub-brand" href="/">
          <span className="hub-brand-mark" aria-hidden="true">H</span>
          <span>Construtor de Sites <span>Automatizados</span></span>
        </Link>
        <nav aria-label="Navegação principal do hub">
          <Link href="/">Início</Link>
          <Link href="/guias">Guias de criação</Link>
          <Link className="hub-header-cta" href="/admin?view=sites">Abrir painel</Link>
        </nav>
      </header>
      {children}
      <footer className="hub-footer">
        <span>Uma base para planejar, construir e administrar sites de nicho.</span>
        <Link href="/guias">Consultar guias</Link>
      </footer>
    </div>
  );
}
