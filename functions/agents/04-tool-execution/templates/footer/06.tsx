export default function Footer() {
  return (
    <footer className="bg-secondary text-secondary-foreground border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-6 sm:flex-row">
        <span className="text-base font-bold tracking-tight">
          {{COMPANY_NAME}}
        </span>

        <div className="flex flex-col items-center gap-3 sm:flex-row sm:gap-6">
          <p className="text-sm text-muted-foreground">
            © {{COPYRIGHT_YEAR}} {{COMPANY_NAME}}. All rights reserved.
          </p>
          <nav>
            <ul className="flex items-center gap-4">
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
            </ul>
          </nav>
        </div>
      </div>
    </footer>
  );
}
