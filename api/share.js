import { applyCard, outfitCard, pieceCard } from "../server/share-card.mjs";
import { createBlobStorage } from "../server/storage-blob.mjs";

// Serves the app shell for /?piece=<id> and /?outfit=<id> with the name and the front spin frame of what the
// link points at in the share tags, so a pasted link previews it on the model instead of the generic site card.
// vercel.json routes this ahead of the filesystem, otherwise the static index.html wins.
const storage = createBlobStorage({ token: process.env.BLOB_READ_WRITE_TOKEN });
const readList = async (key) => (await storage.readJson(key).catch(() => null)) || [];

// A link that carries both opens the piece on top of the outfit, so the piece is what it previews.
async function findCard(params) {
  const pieceId = params.get("piece");
  const outfitId = params.get("outfit");
  const records = await readList("library/library.json");
  const piece = pieceId && records.find((record) => record.id === pieceId || record.id === `import-${pieceId}`);
  if (piece) return pieceCard(piece);
  const outfit = outfitId && (await readList("library/outfits.json")).find((record) => record.id === outfitId || record.id === `outfit-${outfitId}`);
  return outfit ? outfitCard(outfit, records) : null;
}

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const origin = `${url.protocol}//${url.host}`;
    const html = await (await fetch(`${origin}/index.html`)).text();
    const card = await findCard(url.searchParams);
    return new Response(card ? applyCard(html, origin, card) : html, { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, s-maxage=60, stale-while-revalidate=600" } });
  },
};
