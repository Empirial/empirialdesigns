export default function Footer() {
  return (
    <footer className="bg-secondary text-secondary-foreground border-t border-border">
      <div className="mx-auto max-w-5xl px-6 py-12 text-center">
        <span className="text-xl font-bold tracking-tight">
          {{COMPANY_NAME}}
        </span>

        <nav className="mt-6">
          <ul className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
            <li>
              <a
                href={`{{NAV_LINK_1_HREF}}`}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {{NAV_LINK_1_TEXT}}
              </a>
            </li>
            <li>
              <a
                href={`{{NAV_LINK_2_HREF}}`}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {{NAV_LINK_2_TEXT}}
              </a>
            </li>
            <li>
              <a
                href={`{{NAV_LINK_3_HREF}}`}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {{NAV_LINK_3_TEXT}}
              </a>
            </li>
          </ul>
        </nav>

        <div className="mx-auto mt-8 h-px w-full max-w-xs bg-border" />

        <p className="mt-6 text-sm text-muted-foreground">
          © {{COPYRIGHT_YEAR}} {{COMPANY_NAME}}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
