import { Mail, Phone, MapPin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-border/60 bg-[hsl(var(--background)/0.72)] backdrop-blur-xl">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <span className="text-[15px] font-semibold tracking-[-0.01em] text-foreground">
              {{COMPANY_NAME}}
            </span>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">
              {{TAGLINE}}
            </p>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">Navigation</h3>
            <nav className="mt-4">
              <ul className="space-y-3">
                <li>
                  <a href={`{{NAV_LINK_1_HREF}}`} className="rounded-sm text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    {{NAV_LINK_1_TEXT}}
                  </a>
                </li>
                <li>
                  <a href={`{{NAV_LINK_2_HREF}}`} className="rounded-sm text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    {{NAV_LINK_2_TEXT}}
                  </a>
                </li>
                <li>
                  <a href={`{{NAV_LINK_3_HREF}}`} className="rounded-sm text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    {{NAV_LINK_3_TEXT}}
                  </a>
                </li>
              </ul>
            </nav>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">Services</h3>
            <nav className="mt-4">
              <ul className="space-y-3">
                <li>
                  <a href={`{{SERVICE_LINK_1_HREF}}`} className="rounded-sm text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    {{SERVICE_LINK_1_TEXT}}
                  </a>
                </li>
                <li>
                  <a href={`{{SERVICE_LINK_2_HREF}}`} className="rounded-sm text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    {{SERVICE_LINK_2_TEXT}}
                  </a>
                </li>
              </ul>
            </nav>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">Contact</h3>
            <ul className="mt-4 space-y-3">
              <li className="flex items-start gap-2 text-sm text-muted-foreground">
                <Mail className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <a href={`mailto:{{EMAIL}}`} className="rounded-sm transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  {{EMAIL}}
                </a>
              </li>
              <li className="flex items-start gap-2 text-sm text-muted-foreground">
                <Phone className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <a href={`tel:{{PHONE}}`} className="rounded-sm transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  {{PHONE}}
                </a>
              </li>
              <li className="flex items-start gap-2 text-sm text-muted-foreground">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{{ADDRESS}}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-border/60 pt-6">
          <p className="text-xs text-muted-foreground">
            © {{COPYRIGHT_YEAR}} {{COMPANY_NAME}}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
