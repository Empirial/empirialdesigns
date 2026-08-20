export default function Footer() {
  return (
    <footer className="bg-secondary text-secondary-foreground border-t border-border">
      <div className="mx-auto max-w-6xl px-6 py-12 md:py-16">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
          <div>
            <span className="text-xl font-bold tracking-tight">
              {{COMPANY_NAME}}
            </span>
            <p className="mt-3 max-w-xs text-sm text-muted-foreground">
              {{TAGLINE}}
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide">
              Navigation
            </h3>
            <nav className="mt-4">
              <ul className="space-y-3">
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
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide">
              Get in touch
            </h3>
            <form className="mt-4 space-y-3">
              <div>
                <label htmlFor="footer-contact-name" className="sr-only">
                  Name
                </label>
                <input
                  id="footer-contact-name"
                  type="text"
                  placeholder="Your name"
                  className="w-full rounded-md border border-border bg-background px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label htmlFor="footer-contact-email" className="sr-only">
                  Email
                </label>
                <input
                  id="footer-contact-email"
                  type="email"
                  placeholder="Your email"
                  className="w-full rounded-md border border-border bg-background px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label htmlFor="footer-contact-message" className="sr-only">
                  Message
                </label>
                <textarea
                  id="footer-contact-message"
                  rows={3}
                  placeholder="Your message"
                  className="w-full resize-none rounded-md border border-border bg-background px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
              >
                Send message
              </button>
            </form>
          </div>
        </div>

        <div className="mt-12 border-t border-border pt-6">
          <p className="text-sm text-muted-foreground">
            © {{COPYRIGHT_YEAR}} {{COMPANY_NAME}}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
