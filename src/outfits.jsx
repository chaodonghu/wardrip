import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Plus, SpinnerGap, Trash, X } from "@phosphor-icons/react";
import { MIN_OUTFIT_PIECES, OUTFIT_SLOTS, isOuterwear, outfitKey } from "../shared/outfit-slots.mjs";
import { SpinHero, TurnaroundPanel } from "./spin.jsx";

// Slot id to the piece in it. A piece that has left the wardrobe drops out.
export function outfitPieces(pieces, itemsById) {
  return Object.fromEntries(OUTFIT_SLOTS.flatMap((slot) => {
    const item = itemsById.get(pieces[slot.id]);
    return item ? [[slot.id, item]] : [];
  }));
}

// The cutouts laid out the way the outfit is worn. It stands in for the spin until there is one.
function OutfitFlatLay({ pieces }) {
  return (
    <div className={`outfit-lay${pieces.top && pieces.jacket ? " layered" : ""}`} aria-hidden="true">
      {OUTFIT_SLOTS.map((slot) => pieces[slot.id] && (
        <img key={slot.id} className={`outfit-lay__${slot.id}`} src={pieces[slot.id].thumbnail || pieces[slot.id].image} alt="" draggable={false} />
      ))}
    </div>
  );
}

// What a piece is shown in. Its own spin dresses it from the wardrobe, and every saved outfit it is part of is another
// look. `shown` is the outfit look on display, or null for the piece's own spin.
export function PieceLooks({ own, looks, shown, wornWith, onPick, onOpenPiece, onOpenOutfit }) {
  if (!looks.length && !wornWith.length) return null;
  const ownFront = own?.frames?.[0];
  return (
    <section className="piece-looks" aria-label="Looks for this piece">
      {looks.length > 0 && (
        <div className="piece-looks__row">
          <span>Looks</span>
          <div className="piece-looks__choices">
            <button type="button" className={shown ? "" : "active"} aria-pressed={!shown} aria-label="Styled from the wardrobe" title="Styled from the wardrobe" onClick={() => onPick(null)}>
              {ownFront ? <img src={ownFront} alt="" /> : <i aria-hidden="true" />}
            </button>
            {looks.map(({ outfit }) => (
              <button key={outfit.id} type="button" className={shown?.outfit.id === outfit.id ? "active" : ""} aria-pressed={shown?.outfit.id === outfit.id} aria-label={outfit.name} title={outfit.name} onClick={() => onPick(outfit.id)}>
                <img src={outfit.turnaround.frames[0]} alt="" loading="lazy" />
              </button>
            ))}
          </div>
        </div>
      )}
      {wornWith.length > 0 && (
        <div className="piece-looks__row">
          <span>Worn with</span>
          <div className="piece-looks__choices">
            {wornWith.map((piece) => (
              <button key={piece.id} type="button" aria-label={`View ${piece.name}`} title={piece.name} onClick={() => onOpenPiece(piece.id)}>
                <img src={piece.thumbnail || piece.image} alt="" loading="lazy" />
              </button>
            ))}
          </div>
          {shown && <button type="button" className="turnaround-action" onClick={() => onOpenOutfit(shown.outfit.id)}>{shown.outfit.name}</button>}
        </div>
      )}
    </section>
  );
}

function OutfitCard({ outfit, pieces, selected, onOpen }) {
  const front = outfit.turnaround?.frames?.[0];
  return (
    <button
      className={`gallery-item outfit-card${selected ? " selected" : ""}`}
      type="button"
      onClick={() => onOpen(outfit.id)}
      aria-label={`View ${outfit.name}`}
      aria-pressed={selected}
      data-testid={`outfit-${outfit.id}`}
    >
      {front ? <img src={front} alt="" loading="lazy" decoding="async" /> : <OutfitFlatLay pieces={pieces} />}
      {!front && outfit.turnaround?.status === "processing" && (
        <span className="outfit-card__status"><SpinnerGap size={12} className="import-spinner" aria-hidden="true" /> Preparing</span>
      )}
    </button>
  );
}

// `outfits` is what the search left, each with its pieces resolved. `total` is how many exist at all.
export function OutfitGallery({ outfits, total, query, canEdit, canBuild, selectedId, onOpen, onNew, onClearSearch }) {
  if (!outfits.length) {
    const hint = total
      ? "An outfit is found by its name or by any piece in it."
      : !canEdit
        ? "An outfit shows several pieces on the model at once."
        : canBuild
          ? "Pick a top, a bottom and whatever else you like, and see the whole look on you."
          : `Import at least ${MIN_OUTFIT_PIECES} pieces to put an outfit together.`;
    return (
      <div className="gallery-empty">
        <p className="gallery-empty__title">{total ? <>No outfits match “{query.trim()}”.</> : "No outfits yet."}</p>
        <p className="gallery-empty__hint">{hint}</p>
        {total > 0 && <button type="button" className="gallery-empty__action" onClick={onClearSearch}>Clear search</button>}
        {!total && canBuild && <button type="button" className="gallery-empty__action" onClick={onNew}>Build an outfit</button>}
      </div>
    );
  }
  return (
    <section className="gallery-grid" aria-label="Outfits">
      {canBuild && (
        <button type="button" className="gallery-item outfit-new" onClick={onNew}>
          <Plus size={18} aria-hidden="true" />
          <span>New outfit</span>
        </button>
      )}
      {outfits.map(({ outfit, pieces }) => (
        <OutfitCard key={outfit.id} outfit={outfit} pieces={pieces} selected={selectedId === outfit.id} onOpen={onOpen} />
      ))}
    </section>
  );
}

function SidePanel({ label, onClose, children }) {
  const closeButtonRef = useRef(null);

  useEffect(() => {
    document.body.classList.add("viewer-open");
    closeButtonRef.current?.focus({ preventScroll: true });
    return () => document.body.classList.remove("viewer-open");
  }, []);

  useEffect(() => {
    const onKeyDown = (event) => { if (event.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div className="viewer-overlay" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className="viewer-entry">
        <aside className="viewer has-spin" role="dialog" aria-modal="true" aria-label={label}>
          <button className="viewer-icon-close" type="button" onClick={onClose} aria-label="Close" ref={closeButtonRef}>
            <X size={24} weight="light" aria-hidden="true" />
          </button>
          {children}
        </aside>
      </div>
    </div>
  );
}

export function OutfitBuilder({ items, outfits, onCreate, onOpen, onClose }) {
  const [selection, setSelection] = useState({});
  const [name, setName] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const itemsById = useMemo(() => new Map(items.map((item) => [item.id, item])), [items]);
  const pieces = outfitPieces(selection, itemsById);
  const count = Object.keys(selection).length;
  const existing = count >= MIN_OUTFIT_PIECES ? outfits.find((outfit) => outfitKey(outfit.pieces) === outfitKey(selection)) : null;

  const toggle = (slotId, itemId) => {
    setError("");
    setSelection((current) => {
      const { [slotId]: chosen, ...rest } = current;
      return chosen === itemId ? rest : { ...rest, [slotId]: itemId };
    });
  };

  // A hoodie fits the top slot and the jacket slot, and one piece cannot be worn twice.
  const wornElsewhere = (slotId, itemId) => Object.entries(selection).some(([otherSlot, id]) => otherSlot !== slotId && id === itemId);

  const submit = async (event) => {
    event.preventDefault();
    if (existing) {
      onOpen(existing.id);
      return;
    }
    setPending(true);
    setError("");
    try {
      await onCreate(selection, name.trim());
    } catch (requestError) {
      setError(requestError.message);
      setPending(false);
    }
  };

  // A request that is on its way cannot be taken back, so the panel stays until it answers and can show a failure.
  const close = () => { if (!pending) onClose(); };

  const hint = existing
    ? "You already have this outfit."
    : count < MIN_OUTFIT_PIECES
      ? `Pick at least ${MIN_OUTFIT_PIECES} pieces.`
      : "The 360 view takes about a minute.";

  return (
    <SidePanel label="New outfit" onClose={close}>
      <div className="spin-hero outfit-preview">
        {count ? <OutfitFlatLay pieces={pieces} /> : <p className="turnaround-status">Pick the pieces below</p>}
      </div>
      <form className="viewer-details outfit-builder" onSubmit={submit}>
        <h2 className="outfit-heading">New outfit</h2>
        {OUTFIT_SLOTS.map((slot) => {
          const candidates = items
            .filter(slot.fits)
            .sort((a, b) => Number(isOuterwear(b)) - Number(isOuterwear(a)) || a.id.localeCompare(b.id));
          return (
            <div key={slot.id} className="outfit-slot" role="group" aria-label={slot.label}>
              <div className="outfit-slot__head">
                <span>{slot.label}</span>
                <small>{pieces[slot.id]?.name || "None"}</small>
              </div>
              {candidates.length ? (
                <div className="outfit-choices">
                  {candidates.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className={selection[slot.id] === item.id ? "active" : ""}
                      aria-pressed={selection[slot.id] === item.id}
                      aria-label={item.name}
                      title={item.name}
                      disabled={wornElsewhere(slot.id, item.id)}
                      onClick={() => toggle(slot.id, item.id)}
                    >
                      <img src={item.thumbnail || item.image} alt="" loading="lazy" draggable={false} />
                    </button>
                  ))}
                </div>
              ) : <p className="outfit-slot__empty">Nothing in the wardrobe fits here yet.</p>}
            </div>
          );
        })}
        <label className="field">
          <span>Name</span>
          <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Optional" maxLength={80} autoComplete="off" />
        </label>
        {error && <p className="unsaved-notice" role="alert">{error}</p>}
        <div className="viewer-actions">
          <p className="outfit-hint">{hint}</p>
          <span className="action-spacer" />
          <button className="primary-button" type="submit" disabled={pending || count < MIN_OUTFIT_PIECES}>
            {pending ? <SpinnerGap size={15} className="import-spinner" aria-hidden="true" /> : <Check size={15} weight="bold" aria-hidden="true" />}
            {existing ? "Open it" : pending ? "Starting" : "Try it on"}
          </button>
        </div>
      </form>
    </SidePanel>
  );
}

export function OutfitViewer({ outfit, pieces, canEdit, onClose, onGenerate, onCopyLink, onRename, onDelete, onOpenPiece }) {
  const [name, setName] = useState(outfit.name);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const renamed = Boolean(name.trim()) && name.trim() !== outfit.name;

  useEffect(() => {
    setName(outfit.name);
    setError("");
  }, [outfit.id, outfit.name]);

  const rename = async (event) => {
    event.preventDefault();
    if (!renamed) return;
    setSaving(true);
    setError("");
    try {
      await onRename(outfit.id, name.trim());
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SidePanel label="Selected outfit" onClose={onClose}>
      <SpinHero turnaround={outfit.turnaround} label={`${outfit.name} 360 view`} placeholder={<OutfitFlatLay pieces={pieces} />} />
      <TurnaroundPanel turnaround={outfit.turnaround} onGenerate={() => onGenerate(outfit.id)} onCopyLink={() => onCopyLink(outfit.id)} canEdit={canEdit} />
      <div className="viewer-details">
        {canEdit ? (
          <form className="outfit-rename" onSubmit={rename}>
            <label className="field">
              <span>Name</span>
              <input value={name} onChange={(event) => setName(event.target.value)} maxLength={80} autoComplete="off" />
            </label>
            {renamed && <button className="secondary-button" type="submit" disabled={saving}>{saving ? "Saving" : "Save"}</button>}
          </form>
        ) : <h2 className="outfit-heading">{outfit.name}</h2>}
        {error && <p className="unsaved-notice" role="alert">{error}</p>}
        <ul className="outfit-pieces">
          {OUTFIT_SLOTS.filter((slot) => pieces[slot.id]).map((slot) => (
            <li key={slot.id}>
              <button type="button" onClick={() => onOpenPiece(pieces[slot.id].id)}>
                <img src={pieces[slot.id].thumbnail || pieces[slot.id].image} alt="" loading="lazy" />
                <span><small>{slot.label}</small><strong>{pieces[slot.id].name}</strong></span>
              </button>
            </li>
          ))}
        </ul>
        {canEdit && (
          <div className="viewer-actions">
            <button className="delete-button" type="button" onClick={() => onDelete(outfit.id)}>
              <Trash size={15} weight="regular" aria-hidden="true" /> Delete
            </button>
          </div>
        )}
      </div>
    </SidePanel>
  );
}
