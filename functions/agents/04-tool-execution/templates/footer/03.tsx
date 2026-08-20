import { Mail, Phone, MapPin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-secondary text-secondary-foreground border-t border-border">
      <div className="mx-auto max-w-6xl px-6 py-12 md:py-16">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
          <div>
            <span className="text-xl font-bold tracking-tight">
              {{COMPANY_NAME}}
            </span>
            <ul className="mt-5 space-y-3">
              <li className="flex items-start gap-2 text-sm text-muted-foreground">
                <Mail className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <a
                  href={`mailto:{{EMAIL}}`}
                  className="transition-colors hover:text-foreground"
                >
                  {{EMAIL}}
                </a>
              </li>
              <li className="flex items-start gap-2 text-sm text-muted-foreground">
                <Phone className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <a
                  href={`tel:{{PHONE}}`}
                  className="transition-colors hover:text-foreground"
                >
                  {{PHONE}}
                </a>
              </li>
              <li className="flex items-start gap-2 text-sm text-muted-foreground">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{{ADDRESS}}</span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide">
              Stay in the loop
            </h3>
            <p className="mt-3 text-sm text-muted-foreground">
              Sign up for occasional updates and news.
            </p>
            <form className="mt-4 flex flex-col gap-3 sm:flex-row">
              <label htmlFor="footer-newsletter-email" className="sr-only">
                Email address
              </label>
              <input
                id="footer-newsletter-email"
                type="email"
                placeholder="you@example.com"
                className="w-full rounded-md border border-border bg-background px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary sm:flex-1"
              />
              <button
                type="submit"
                className="rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
              >
                Subscribe
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
