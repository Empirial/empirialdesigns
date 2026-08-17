import type { Industry, SALocation } from "@staff/lib/types";

export const INDUSTRIES: Industry[] = [
  "Construction",
  "Healthcare",
  "Funeral Services",
  "Renewable Energy",
  "Hospitality",
  "Legal",
  "Automotive",
  "Retail",
  "Education",
  "Agriculture",
  "Logistics",
  "Beauty",
];

export const LOCATIONS: SALocation[] = [
  "Thohoyandou",
  "Makhado",
  "Louis Trichardt",
  "Polokwane",
  "Elim",
  "Giyani",
  "Tzaneen",
];

export const SOURCES = [
  "Cold List",
  "Walk-in",
  "Referral",
  "Website Form",
  "Facebook",
  "Directory",
] as const;
