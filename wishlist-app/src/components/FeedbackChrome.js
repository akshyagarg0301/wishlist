import React from 'react';

export function LoadingOverlay({ message }) {
  if (!message) {
    return null;
  }

  return (
    <div className="progress-overlay show" aria-hidden="false">
      <div className="progress-panel" role="status" aria-live="polite">
        <div className="spinner" aria-hidden="true"></div>
        <p>{message}</p>
      </div>
    </div>
  );
}

export function ConfirmDialog({
  open,
  title = 'Confirm action',
  message = 'Are you sure you want to continue?',
  confirmLabel = 'Confirm',
  onConfirm,
  onCancel,
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="modal show" aria-hidden="false" onClick={onCancel}>
      <div className="modal-card confirm-card" onClick={(e) => e.stopPropagation()}>
        <h3>{title}</h3>
        <p className="confirm-copy">{message}</p>
        <div className="dialog-actions">
          <button className="ghost" type="button" onClick={onCancel}>
            Cancel
          </button>
          <button className="ghost danger" type="button" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
