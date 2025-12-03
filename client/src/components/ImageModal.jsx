import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export function ImageModal({ imageSrc, onClose }) {
  return (
    <AnimatePresence>
      {imageSrc && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              className="absolute -top-12 right-0 p-2 text-white/50 hover:text-white transition-colors"
            >
              <X className="w-8 h-8" />
            </button>

            <img
              src={imageSrc}
              className="w-auto h-auto max-w-full max-h-[85vh] rounded-2xl shadow-2xl shadow-black/50 border border-white/10"
              alt="Proof"
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
