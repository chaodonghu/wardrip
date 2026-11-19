import { useRef, useState } from "react";
import { SpinnerGap } from "@phosphor-icons/react";

const TURNAROUND_VIEWS = ["Front", "Front left", "Left", "Back left", "Back", "Back right", "Right", "Front right"];
const TURNAROUND_ACTIONS = { ready: "Regenerate", failed: "Try again" };

function TurnaroundStrip({ frames, label }) {
  const [index, setIndex] = useState(0);
  const dragRef = useRef(null);
  const count = frames.length;
  const wrap = (value) => ((value % count) + count) % count;

  const startDrag = (event) => {
    if (event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { x: event.clientX, index, segment: event.currentTarget.clientWidth / count };
  };

  const drag = (event) => {
    const start = dragRef.current;
    if (!start) return;
    setIndex(wrap(start.index + Math.round((start.x - event.clientX) / start.segment)));
  };

  const endDrag = () => { dragRef.current = null; };

  const onKeyDown = (event) => {
    const delta = { ArrowLeft: -1, ArrowRight: 1 }[event.key];
    if (!delta) return;
    event.preventDefault();
    setIndex((current) => wrap(current + delta));
  };

  return (
    <div className="turnaround-strip">
      <div
        className="turnaround-stage"
        role="slider"
        tabIndex={0}
        aria-label={label}
        aria-valuemin={1}
        aria-valuemax={count}
        aria-valuenow={index + 1}
        aria-valuetext={TURNAROUND_VIEWS[index] || `View ${index + 1}`}
        onPointerDown={startDrag}
        onPointerMove={drag}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onKeyDown={onKeyDown}
      >
        {frames.map((frame, frameIndex) => (
          <img
            key={frame}
            className={frameIndex === index ? "active" : ""}
            src={frame}
            alt=""
            draggable={false}
          />
        ))}
      </div>
      <div className="turnaround-dots" aria-hidden="true">
        {frames.map((frame, frameIndex) => <span key={frame} className={frameIndex === index ? "active" : ""} />)}
      </div>
    </div>
  );
}

export function TurnaroundPanel({ turnaround, onGenerate, onCopyLink, canEdit }) {
  const [pending, setPending] = useState(false);
  const [requestError, setRequestError] = useState("");
  const status = turnaround?.status;

  const generate = async () => {
    setPending(true);
    setRequestError("");
    try {
      await onGenerate();
    } catch (error) {
      setRequestError(error.message);
    } finally {
      setPending(false);
    }
  };

  return (
    <section className="turnaround" aria-label="360 view controls">
      {status === "failed" && <p className="turnaround-error" role="alert">{turnaround.error}</p>}
      <div className="turnaround-actions">
        {canEdit && status !== "processing" && turnaround?.errorCode !== "moderation_blocked" && (
          <button className="turnaround-action" type="button" onClick={generate} disabled={pending}>
            {TURNAROUND_ACTIONS[status] || "Generate 360 view"}
          </button>
        )}
        <button className="turnaround-action" type="button" onClick={onCopyLink}>Copy link</button>
      </div>
      {requestError && <p className="turnaround-error" role="alert">{requestError}</p>}
    </section>
  );
}

// `replacement` takes over the whole hero. `placeholder` stands in above the status line until there are frames to spin.
export function SpinHero({ turnaround, label, replacement, placeholder }) {
  const frames = turnaround?.frames || [];
  return (
    <div className="spin-hero">
      {replacement || (frames.length ? <TurnaroundStrip frames={frames} label={label} /> : (
        <>
          {placeholder}
          <p className="turnaround-status" role="status">
            {turnaround?.status === "processing" && <SpinnerGap size={14} className="import-spinner" aria-hidden="true" />}
            {turnaround?.status === "processing" ? "Preparing 360 view" : "No 360 view yet"}
          </p>
        </>
      ))}
    </div>
  );
}
