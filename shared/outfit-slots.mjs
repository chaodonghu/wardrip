// An outfit holds at most one piece per slot. The jacket slot also takes tops, so a hoodie or an overshirt can layer over a tee.
export const OUTFIT_SLOTS = [
  { id: "top", label: "Top", parts: ["upperbody"] },
  { id: "jacket", label: "Jacket", parts: ["wholebody_up", "upperbody"] },
  { id: "bottom", label: "Bottom", parts: ["lowerbody"] },
  { id: "accessory", label: "Accessory", parts: ["accessories_up"] },
  { id: "shoes", label: "Shoes", parts: ["shoes"] },
];

export const MIN_OUTFIT_PIECES = 2;

// Two outfits with the same piece in every slot are the same outfit.
export const outfitKey = (pieces = {}) => OUTFIT_SLOTS.map((slot) => pieces[slot.id] || "").join("|");
