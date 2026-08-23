// Lightweight per-route <head> management for the marketing SPA.
//
// There's no SSR here (Vite + React Router, client-rendered), so the static
// tags in index.html only ever describe the homepage. Every other public
// route needs to overwrite title/description/canonical/OG itself on mount —
// this hook is that, without pulling in react-helmet-async for five call
// sites. It cleans up nothing on unmount by design: the next page's effect
// overwrites the same tags on its own mount, and a stale tag sitting around
// between navigations is harmless (nothing reads it until the next paint).
import { useEffect } from 'react';

export type SeoMeta = {
  title: string;
  description: string;
  keywords?: string;
  path: string; // e.g. "/web-design-limpopo" — used for canonical + og:url
  jsonLd?: Record<string, unknown>;
};

const SITE = 'https://empirialdesigns.co.za';
const JSON_LD_ID = 'route-json-ld';

function upsertMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

export function useSeo({ title, description, keywords, path, jsonLd }: SeoMeta) {
  useEffect(() => {
    const url = `${SITE}${path}`;
    document.title = title;

    upsertMeta('name', 'description', description);
    if (keywords) upsertMeta('name', 'keywords', keywords);
    upsertMeta('name', 'robots', 'index, follow, max-image-preview:large');

    let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', url);

    upsertMeta('property', 'og:title', title);
    upsertMeta('property', 'og:description', description);
    upsertMeta('property', 'og:url', url);
    upsertMeta('property', 'og:type', 'website');
    upsertMeta('name', 'twitter:title', title);
    upsertMeta('name', 'twitter:description', description);

    const existingLd = document.getElementById(JSON_LD_ID);
    if (existingLd) existingLd.remove();
    if (jsonLd) {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.id = JSON_LD_ID;
      script.textContent = JSON.stringify(jsonLd);
      document.head.appendChild(script);
    }
  }, [title, description, keywords, path, jsonLd]);
}

export type ProvinceCopy = {
  slug: string;
  province: string;
  h1: string;
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  intro: string;
  reach: string;
};

export const PROVINCES: ProvinceCopy[] = [
  {
    slug: 'web-design-limpopo',
    province: 'Limpopo',
    h1: 'Web Design in Limpopo That Gets Your Business Found',
    metaTitle: 'Web Design in Limpopo | EMPIRIAL',
    metaDescription:
      'Affordable, professional website design for businesses across Limpopo — Makhado, Polokwane, Thohoyandou, Tzaneen & more. Get a free quote from EMPIRIAL today.',
    metaKeywords:
      'web design Limpopo, website design Makhado, web designer Louis Trichardt, website design Polokwane, EMPIRIAL Limpopo, Empirial Designs',
    intro:
      "EMPIRIAL is a digital studio based right here in Makhado (Louis Trichardt), building websites for businesses across Limpopo. Whether you're a law firm in Polokwane, a guesthouse in Tzaneen, an electrician in Thohoyandou, or a retailer in Phalaborwa, we build fast, mobile-friendly websites designed to turn visitors into customers.",
    reach:
      'We work with businesses across the whole province — Makhado, Polokwane, Thohoyandou, Tzaneen, Phalaborwa, Mokopane, Giyani, and Bela-Bela — combining local market knowledge with modern web design and automation tools most agencies in the region don’t offer.',
  },
  {
    slug: 'web-design-mpumalanga',
    province: 'Mpumalanga',
    h1: 'Web Design in Mpumalanga for Businesses Ready to Grow',
    metaTitle: 'Web Design in Mpumalanga | EMPIRIAL',
    metaDescription:
      'Professional website design for businesses in Mpumalanga — Mbombela, eMalahleni, Middelburg, Secunda & more. Fast, affordable sites built by EMPIRIAL.',
    metaKeywords:
      'web design Mpumalanga, website design Mbombela, web designer Nelspruit, website design eMalahleni, EMPIRIAL Mpumalanga, Empirial Designs',
    intro:
      "EMPIRIAL builds websites and digital systems for businesses across Mpumalanga — from Mbombela (Nelspruit) to eMalahleni (Witbank), Middelburg, Secunda, and Barberton. If your business isn't showing up when local customers search for you online, that's exactly what we fix.",
    reach:
      'We design mobile-friendly, high-converting websites, and back them with automation and SEO support so your business keeps showing up — not just on launch day.',
  },
  {
    slug: 'web-design-gauteng',
    province: 'Gauteng',
    h1: 'Web Design in Gauteng — Built to Perform, Not Just Look Good',
    metaTitle: 'Web Design in Gauteng | EMPIRIAL',
    metaDescription:
      'Website design and digital automation for businesses in Gauteng — Johannesburg, Pretoria, Centurion, Sandton & Midrand. Get a free quote from EMPIRIAL.',
    metaKeywords:
      'web design Gauteng, website design Johannesburg, web designer Pretoria, website design Centurion, EMPIRIAL Gauteng, Empirial Designs',
    intro:
      'EMPIRIAL builds websites, apps, and automation systems for businesses across Gauteng — Johannesburg, Pretoria, Centurion, Sandton, and Midrand. We combine clean, modern design with the technical SEO foundations most cheaper website builders skip, so your site actually gets found.',
    reach:
      "We're a Limpopo-based studio serving clients across Gauteng remotely, with the same close, direct working relationship you'd expect from someone down the road.",
  },
];
