import { useEffect, useState } from "react";
import { X } from "lucide-react";

interface Props {
  title: string;
  label: string;
  submitLabel: string;
  initialValue?: string;
  onClose: () => void;
  /** Rejecting keeps the dialog open and shows the error. */
  onSubmit: (name: string) => Promise<void>;
}

/** A small modal with one text field, used for new folders and renames. */
export default function NameDialog({ title, label, submitLabel, initialValue = "", onClose, onSubmit }: Props) {
  const [name, setName] = useState(initialValue);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const trimmed = name.trim();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !saving && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, saving]);

  return (
    <div className="modal-backdrop" onClick={() => !saving && onClose()}>
      <form
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="name-dialog-title"
        onClick={(e) => e.stopPropagation()}
        onSubmit={async (e) => {
          e.preventDefault();
          if (!trimmed || trimmed === initialValue) return onClose();
          setSaving(true);
          setError(null);
          try {
            await onSubmit(trimmed);
            onClose();
          } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong.");
            setSaving(false);
          }
        }}
      >
        <header className="modal-header">
          <h2 id="name-dialog-title">{title}</h2>
          <button type="button" className="icon-btn" onClick={onClose} disabled={saving} aria-label="Close">
            <X size={20} />
          </button>
        </header>

        <input
          autoFocus
          aria-label={label}
          placeholder={label}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onFocus={(e) => {
            // Select the name without its extension, like Drive does.
            const dot = e.target.value.lastIndexOf(".");
            e.target.setSelectionRange(0, dot > 0 ? dot : e.target.value.length);
          }}
          disabled={saving}
        />
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}

        <footer className="modal-footer">
          <button type="button" className="btn" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={!trimmed || saving}>
            {saving ? "Saving…" : submitLabel}
          </button>
        </footer>
      </form>
    </div>
  );
}
