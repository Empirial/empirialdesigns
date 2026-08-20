import { Mail, Phone, MapPin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t-2 border-foreground bg-foreground text-background">
      <div className="mx-auto max-w-7xl px-6 py-14">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <span className="text-xl font-extrabold uppercase tracking-tight">
              {{COMPANY_NAME}}
            </span>
            <p className="mt-3 max-w-xs text-sm font-medium text-background/70">
              {{TAGLINE}}
            </p>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-background/60">Navigation</h3>
            <nav className="mt-4">
              <ul className="space-y-3">
                <li>
                  <a href={`{{NAV_LINK_1_HREF}}`} className="rounded-sm text-sm font-bold uppercase tracking-wide transition-colors hover:text-[#FFE100] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-background">
                    {{NAV_LINK_1_TEXT}}
                  </a>
                </li>
                <li>
                  <a href={`{{NAV_LINK_2_HREF}}`} className="rounded-sm text-sm font-bold uppercase tracking-wide transition-colors hover:text-[#FFE100] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-background">
                    {{NAV_LINK_2_TEXT}}
                  </a>
                </li>
                <li>
                  <a href={`{{NAV_LINK_3_HREF}}`} className="rounded-sm text-sm font-bold uppercase tracking-wide transition-colors hover:text-[#FFE100] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-background">
                    {{NAV_LINK_3_TEXT}}
                  </a>
                </li>
              </ul>
            </nav>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-background/60">Services</h3>
            <nav className="mt-4">
              <ul className="space-y-3">
                <li>
                  <a href={`{{SERVICE_LINK_1_HREF}}`} className="rounded-sm text-sm font-bold uppercase tracking-wide transition-colors hover:text-[#FFE100] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-background">
                    {{SERVICE_LINK_1_TEXT}}
                  </a>
                </li>
                <li>
                  <a href={`{{SERVICE_LINK_2_HREF}}`} className="rounded-sm text-sm font-bold uppercase tracking-wide transition-colors hover:text-[#FFE100] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-background">
                    {{SERVICE_LINK_2_TEXT}}
                  </a>
                </li>
              </ul>
            </nav>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-background/60">Contact</h3>
            <ul className="mt-4 space-y-3">
              <li className="flex items-start gap-2 text-sm font-medium text-background/80">
                <Mail className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <a href={`mailto:{{EMAIL}}`} className="rounded-sm transition-colors hover:text-[#FFE100] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-background">
                  {{EMAIL}}
                </a>
              </li>
              <li className="flex items-start gap-2 text-sm font-medium text-background/80">
                <Phone className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <a href={`tel:{{PHONE}}`} className="rounded-sm transition-colors hover:text-[#FFE100] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-background">
                  {{PHONE}}
                </a>
              </li>
              <li className="flex items-start gap-2 text-sm font-medium text-background/80">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{{ADDRESS}}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t-2 border-background/20 pt-6">
          <p className="text-xs font-bold uppercase tracking-wide text-background/60">
            © {{COPYRIGHT_YEAR}} {{COMPANY_NAME}}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
