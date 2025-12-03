export function ImageModal({ imageSrc, onClose }) {
  if (!imageSrc) return null;

  return (
    <div className="modal show" onClick={onClose}>
      <img src={imageSrc} className="modal-content" alt="Proof" />
      <button className="modal-close" onClick={onClose}>Close</button>
    </div>
  );
}
