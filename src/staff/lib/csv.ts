/**
 * Small hand-rolled CSV parser — no new npm dependency (the project's
 * install has been unreliable this session, and this doesn't need a full
 * library). Handles quoted fields (including embedded commas/newlines/
 * escaped "" quotes) and both \n and \r\n line endings. Does not handle
 * .xlsx (binary Excel) — accepts .csv files and pasted CSV/TSV-ish text
 * only; see admin.import.tsx for the explicit scope note in its UI copy.
 */
export interface ParsedCsv {
  headers: string[];
  rows: string[][];
}

export function parseCsv(text: string): ParsedCsv {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  const pushField = () => {
    row.push(field);
    field = "";
  };
  const pushRow = () => {
    pushField();
    // Skip fully-empty trailing rows (common at end of file).
    if (!(row.length === 1 && row[0] === "")) {
      rows.push(row);
    }
    row = [];
  };

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        field += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        field += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      pushField();
    } else if (ch === "\r") {
      // ignore, \n (or end of string) handles the row break
    } else if (ch === "\n") {
      pushRow();
    } else {
      field += ch;
    }
  }
  // Final field/row if the text didn't end with a newline.
  if (field.length > 0 || row.length > 0) {
    pushRow();
  }

  if (rows.length === 0) {
    return { headers: [], rows: [] };
  }
  const [headerRow, ...dataRows] = rows;
  return { headers: (headerRow ?? []).map((h) => h.trim()), rows: dataRows };
}

/** Turns parsed rows + a header→system-field mapping into plain objects keyed by system field name. */
export function applyColumnMapping(
  parsed: ParsedCsv,
  mapping: Record<string, string>, // detected column header -> system field id (e.g. "business", "phone") or "" to ignore
): Record<string, string>[] {
  const headerIndex = new Map(parsed.headers.map((h, i) => [h, i]));
  return parsed.rows.map((row) => {
    const obj: Record<string, string> = {};
    for (const [header, systemField] of Object.entries(mapping)) {
      if (!systemField) continue;
      const idx = headerIndex.get(header);
      if (idx === undefined) continue;
      obj[systemField] = (row[idx] ?? "").trim();
    }
    return obj;
  });
}
