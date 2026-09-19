import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const SOURCE_PAGE = "https://pesmasterlig.com.tr/pesdb.php?lang=en";
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 RekberGGDataTest/0.1";

const ATTRIBUTE_FIELDS = [
  "offensive_awareness",
  "ball_control",
  "dribbling",
  "tight_possession",
  "low_pass",
  "lofted_pass",
  "finishing",
  "heading",
  "set_piece_taking",
  "curl",
  "speed",
  "acceleration",
  "kicking_power",
  "jumping",
  "physical_contact",
  "balance",
  "stamina",
  "defensive_awareness",
  "tackling",
  "aggression",
  "defensive_engagement",
  "gk_awareness",
  "gk_catching",
  "gk_parrying",
  "gk_reflexes",
  "gk_reach",
] as const;

type JsonScalar = string | number | boolean | null;
type SourceRow = JsonScalar[];

interface PesdbIndex {
  meta: {
    schema?: string;
    generated_at?: string;
    total_cards?: number;
    card_type_counts?: Record<string, number>;
    fields: string[];
    [key: string]: unknown;
  };
  players: Record<string, SourceRow>;
}

interface CliOptions {
  output: string;
  limit: number | null;
  query: string;
  cardType: string;
  minOverall: number | null;
}

function readOption(name: string): string | undefined {
  const prefix = `--${name}=`;
  const inline = process.argv.find((argument) => argument.startsWith(prefix));
  if (inline) return inline.slice(prefix.length);

  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function parsePositiveInteger(value: string | undefined, fallback: number): number {
  if (value === undefined) return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`Nilai harus berupa bilangan bulat positif: ${value}`);
  }
  return parsed;
}

function parseOptions(): CliOptions {
  const minOverallValue = readOption("min-overall");
  const minOverall = minOverallValue === undefined ? null : Number(minOverallValue);
  if (minOverall !== null && (!Number.isFinite(minOverall) || minOverall < 0)) {
    throw new Error(`--min-overall tidak valid: ${minOverallValue}`);
  }

  return {
    output: readOption("output") ?? "data/efootball-cards.sample.json",
    limit: process.argv.includes("--all")
      ? null
      : parsePositiveInteger(readOption("limit"), 20),
    query: (readOption("query") ?? "").trim(),
    cardType: (readOption("type") ?? "").trim(),
    minOverall,
  };
}

function getCookieHeader(headers: Headers): string {
  const extendedHeaders = headers as Headers & {
    getSetCookie?: () => string[];
  };
  const setCookieValues =
    extendedHeaders.getSetCookie?.() ?? [headers.get("set-cookie") ?? ""];

  const cookies = setCookieValues
    .flatMap((value) => {
      const firstCookie = value.match(/^\s*([^=;,\s]+)=([^;,]*)/);
      if (firstCookie) return [`${firstCookie[1]}=${firstCookie[2]}`];

      return [...value.matchAll(/(?:^|,\s*)([^=;,\s]+)=([^;,]*)/g)].map(
        (match) => `${match[1]}=${match[2]}`
      );
    })
    .filter(Boolean);

  return [...new Set(cookies)].join("; ");
}

function findIndexUrl(html: string): URL {
  const match = html.match(/const\s+INDEX_URL\s*=\s*["']([^"']+)["']/);
  if (!match) {
    throw new Error("Endpoint indeks tidak ditemukan di halaman PESDB.");
  }
  return new URL(match[1].replaceAll("&amp;", "&"), SOURCE_PAGE);
}

async function fetchIndex(): Promise<PesdbIndex> {
  const pageResponse = await fetch(SOURCE_PAGE, {
    headers: {
      "accept-language": "en-US,en;q=0.9",
      "user-agent": USER_AGENT,
    },
    redirect: "follow",
  });

  if (!pageResponse.ok) {
    throw new Error(`Halaman PESDB gagal diakses (HTTP ${pageResponse.status}).`);
  }

  const cookie = getCookieHeader(pageResponse.headers);
  const html = await pageResponse.text();
  const indexUrl = findIndexUrl(html);
  const indexResponse = await fetch(indexUrl, {
    headers: {
      accept: "application/json, text/plain, */*",
      cookie,
      referer: SOURCE_PAGE,
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
      "user-agent": USER_AGENT,
      "x-requested-with": "fetch",
    },
  });

  if (!indexResponse.ok) {
    throw new Error(
      `Indeks kartu gagal diakses (HTTP ${indexResponse.status}). ` +
        "Token/cookie sesi kemungkinan sudah berubah."
    );
  }

  const data = (await indexResponse.json()) as PesdbIndex;
  if (!Array.isArray(data?.meta?.fields) || !data?.players) {
    throw new Error("Skema respons PESDB tidak dikenali.");
  }
  return data;
}

function slugify(value: unknown): string {
  return String(value ?? "")
    .toLowerCase()
    .replaceAll("ç", "c")
    .replaceAll("ğ", "g")
    .replaceAll("ı", "i")
    .replaceAll("ö", "o")
    .replaceAll("ş", "s")
    .replaceAll("ü", "u")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function splitList(value: unknown): string[] {
  return String(value ?? "")
    .split(";")
    .map((item) => item.trim())
    .filter(Boolean);
}

function decodeRow(fields: string[], row: SourceRow): Record<string, unknown> {
  const card: Record<string, unknown> = Object.fromEntries(
    fields.map((field, index) => [field, row[index] ?? null])
  );
  const id = String(card.id ?? "");
  const name = String(card.name ?? "");

  for (const idField of [
    "id",
    "base_id",
    "source_id",
    "canonical_standard_id",
  ]) {
    if (card[idField] !== null && card[idField] !== undefined) {
      card[idField] = String(card[idField]);
    }
  }

  card.player_skills = splitList(card.player_skills);
  card.ai_playing_styles = splitList(card.ai_playing_styles);
  card.detail_url = new URL(
    `/oyuncu/${encodeURIComponent(id)}-${slugify(name)}?lang=en`,
    SOURCE_PAGE
  ).toString();
  card.image_url = new URL(
    `/efootball/card-image.php?id=${encodeURIComponent(id)}`,
    SOURCE_PAGE
  ).toString();
  return card;
}

function isCatalogOutlier(card: Record<string, unknown>): boolean {
  if (card.card_type !== "Standard" || Number(card.is_variant) !== 0) return false;
  if (Number(card.overall) < 110) return false;
  return (
    ATTRIBUTE_FIELDS.filter((field) => Number(card[field]) === 95).length >= 22
  );
}

function matchesOptions(card: Record<string, unknown>, options: CliOptions): boolean {
  if (
    options.cardType &&
    String(card.card_type).toLowerCase() !== options.cardType.toLowerCase()
  ) {
    return false;
  }
  if (options.minOverall !== null && Number(card.overall) < options.minOverall) {
    return false;
  }
  if (options.query) {
    const haystack = `${card.name ?? ""} ${card.short_name ?? ""}`.toLowerCase();
    if (!haystack.includes(options.query.toLowerCase())) return false;
  }
  return true;
}

async function main() {
  const options = parseOptions();
  const data = await fetchIndex();
  const decodedCards = Object.values(data.players)
    .map((row) => decodeRow(data.meta.fields, row))
    .filter((card) => !isCatalogOutlier(card));

  const matchingCards = decodedCards
    .filter((card) => matchesOptions(card, options))
    .sort(
      (left, right) =>
        Number(right.overall) - Number(left.overall) ||
        Number(right.id) - Number(left.id)
    );
  const exportedCards =
    options.limit === null ? matchingCards : matchingCards.slice(0, options.limit);

  const result = {
    source_page: SOURCE_PAGE,
    source_schema: data.meta.schema ?? null,
    source_generated_at: data.meta.generated_at ?? null,
    scraped_at: new Date().toISOString(),
    raw_card_count: Object.keys(data.players).length,
    catalog_card_count: decodedCards.length,
    matching_card_count: matchingCards.length,
    exported_card_count: exportedCards.length,
    filters: {
      query: options.query || null,
      card_type: options.cardType || null,
      min_overall: options.minOverall,
      limit: options.limit,
    },
    source_card_type_counts: data.meta.card_type_counts ?? null,
    cards: exportedCards,
  };

  const outputPath = path.resolve(process.cwd(), options.output);
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(result, null, 2)}\n`, "utf8");

  console.log(`Sumber mentah : ${result.raw_card_count.toLocaleString("en-US")} kartu`);
  console.log(`Katalog valid: ${result.catalog_card_count.toLocaleString("en-US")} kartu`);
  console.log(`Cocok filter : ${result.matching_card_count.toLocaleString("en-US")} kartu`);
  console.log(`Diekspor     : ${result.exported_card_count.toLocaleString("en-US")} kartu`);
  console.log(`Output       : ${outputPath}`);
}

main().catch((error) => {
  if (error instanceof Error) {
    const cause = error.cause instanceof Error ? ` (${error.cause.message})` : "";
    console.error(`${error.message}${cause}`);
  } else {
    console.error(error);
  }
  process.exitCode = 1;
});
