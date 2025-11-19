import React from "react";

export default function Modal({ isOpen, title, children, onClose, onConfirm }) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-content">
        <h3>{title}</h3>
        <div className="modal-body">{children}</div>
        <div className="modal-footer">
          <button onClick={onClose} className="btn btn-secondary">
            Cancelar
          </button>
          {onConfirm && (
            <button onClick={onConfirm} className="btn btn-primary">
              Confirmar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
