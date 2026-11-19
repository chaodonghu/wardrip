import { OUTFIT_SLOTS } from "../shared/outfit-slots.mjs";

const LABELS = { upperbody: "Top", wholebody_up: "Jacket", lowerbody: "Bottom", accessories_up: "Accessory", shoes: "Shoes" };
const escape = (value) => String(value).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
// Names go in through replacer functions. In a replacement string, a name with `$&` or `$'` in it would paste parts of the page.
const meta = (html, attribute, name, content) => html.replace(new RegExp(`<meta ${attribute}="${name}" content="[^"]*" />`), () => `<meta ${attribute}="${name}" content="${escape(content)}" />`);
const frontFrame = (record) => record.turnaround?.status === "ready" ? record.turnaround.frames?.[0] : null;

export function pieceCard(piece) {
  const title = piece.name || "Wardrobe piece";
  const details = [LABELS[piece.part], ...(piece.tags || []).slice(0, 3)].filter(Boolean).join(" \u00b7 ");
  const frame = frontFrame(piece);
  return {
    title,
    description: `${details}. A piece in Drip, with a 360 spin.`,
    image: frame || piece.image,
    alt: frame ? `${title}, worn, front view` : `${title}, cutout`,
    query: `piece=${encodeURIComponent(piece.id.replace(/^import-/, ""))}`,
  };
}

// Until the spin is ready, the first piece's cutout stands in for the outfit.
export function outfitCard(outfit, records) {
  const pieces = OUTFIT_SLOTS.map((slot) => records.find((record) => record.id === outfit.pieces?.[slot.id])).filter(Boolean);
  const title = outfit.name || "Outfit";
  const names = pieces.map((piece) => piece.name).join(" \u00b7 ");
  const frame = frontFrame(outfit);
  return {
    title,
    description: `${names ? `${names}. ` : ""}An outfit in Drip, with a 360 spin.`,
    image: frame || pieces[0]?.image || null,
    alt: frame ? `${title}, worn, front view` : `${title}, first piece`,
    query: `outfit=${encodeURIComponent(outfit.id.replace(/^outfit-/, ""))}`,
  };
}

// Rewrites the app shell's share tags. Without an image the card stays the small summary kind.
export function applyCard(html, origin, card) {
  const link = `${origin}/?${card.query}`;
  const image = card.image ? `${origin}${card.image}` : null;
  let page = html.replace(/<title>[^<]*<\/title>/, () => `<title>${escape(card.title)} \u00b7 Drip</title>`);
  page = meta(page, "name", "description", card.description);
  page = meta(page, "property", "og:title", card.title);
  page = meta(page, "property", "og:description", card.description);
  page = meta(page, "name", "twitter:title", card.title);
  page = meta(page, "name", "twitter:description", card.description);
  return page.replace("<meta name=\"twitter:card\" content=\"summary\" />", () => [
    `<meta name="twitter:card" content="${image ? "summary_large_image" : "summary"}" />`,
    `<meta property="og:url" content="${escape(link)}" />`,
    ...(image ? [
      `<meta property="og:image" content="${escape(image)}" />`,
      `<meta property="og:image:alt" content="${escape(card.alt)}" />`,
      `<meta name="twitter:image" content="${escape(image)}" />`,
      `<meta name="twitter:image:alt" content="${escape(card.alt)}" />`,
    ] : []),
  ].join("\n    "));
}
