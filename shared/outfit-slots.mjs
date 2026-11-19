// Detection files most outer layers under Tops, so the name and detail tags say what a top really is.
const OUTERWEAR = /\b(jacket|coat|overcoat|parka|puffer|shell|bomber|blazer|anorak|windbreaker|gilet)\b/i;
const MIDLAYER = /\b(hoodie|hoody|hooded|sweatshirt|sweater|cardigan|fleece|overshirt|flannel|pullover)\b/i;
const says = (pattern, piece) => pattern.test([piece.name, ...(piece.tags || [])].join(" "));

export const isOuterwear = (piece) => piece.part === "wholebody_up" || (piece.part === "upperbody" && says(OUTERWEAR, piece));

// An outfit holds at most one piece per slot. A jacket goes over the top, so the jacket slot takes real jackets and the
// tops that layer, such as a hoodie over a tee. A T-shirt is only ever the top, and a jacket is never the top.
export const OUTFIT_SLOTS = [
  { id: "top", label: "Top", fits: (piece) => piece.part === "upperbody" && !isOuterwear(piece) },
  { id: "jacket", label: "Jacket", fits: (piece) => isOuterwear(piece) || (piece.part === "upperbody" && says(MIDLAYER, piece)) },
  { id: "bottom", label: "Bottom", fits: (piece) => piece.part === "lowerbody" },
  { id: "accessory", label: "Accessory", fits: (piece) => piece.part === "accessories_up" },
  { id: "shoes", label: "Shoes", fits: (piece) => piece.part === "shoes" },
];

export const MIN_OUTFIT_PIECES = 2;

// Two outfits with the same piece in every slot are the same outfit.
export const outfitKey = (pieces = {}) => OUTFIT_SLOTS.map((slot) => pieces[slot.id] || "").join("|");
