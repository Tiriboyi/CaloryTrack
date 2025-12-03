import { useState, useRef, forwardRef, useImperativeHandle } from 'react';
import { submitEntry } from '../api';
import { resizeImage } from '../utils';
import { motion } from 'framer-motion';
import { Plus, Image as ImageIcon, Loader2 } from 'lucide-react';

export const EntryForm = forwardRef(function EntryForm({ onSubmitSuccess }, ref) {
  const [name, setName] = useState('');
  const [calories, setCalories] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);
  const formRef = useRef(null);

  useImperativeHandle(ref, () => ({
    setFormValues: (newName, newCalories) => {
      setName(newName);
      setCalories(newCalories.toString());
    },
    scrollIntoView: () => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let imageBase64 = null;
      const file = fileInputRef.current?.files?.[0];

      if (file) {
        try {
          imageBase64 = await resizeImage(file);
        } catch (err) {
          alert('Error processing image. Try a smaller file.');
          console.error(err);
          setIsSubmitting(false);
          return;
        }
      }

      const res = await submitEntry(name.trim(), parseInt(calories), imageBase64);

      if (res.ok) {
        setCalories('');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        onSubmitSuccess?.();
      } else {
        alert('Error saving entry');
      }
    } catch (err) {
      console.error(err);
      alert('Network error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="glass-panel rounded-3xl p-6 md:p-8 mb-8 md:mb-12 relative overflow-hidden"
      ref={formRef}
    >
      <div className="absolute top-0 right-0 w-64 h-64 bg-accent-secondary/10 blur-[80px] -z-10 pointer-events-none" />

      <h2 className="mb-8 text-2xl font-bold text-white flex items-center gap-3">
        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-accent-primary/20 text-accent-primary">
          <Plus className="w-5 h-5" />
        </span>
        Log Activity
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="group">
            <label htmlFor="username" className="block mb-2 text-xs font-bold text-text-secondary uppercase tracking-wider">Name / Nickname</label>
            <input
              type="text"
              id="username"
              required
              placeholder="e.g. Iron Mike"
              maxLength={20}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-4 rounded-xl bg-bg-secondary/50 border border-border-color text-white placeholder-text-tertiary focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-all"
            />
          </div>

          <div className="group">
            <label htmlFor="calories" className="block mb-2 text-xs font-bold text-text-secondary uppercase tracking-wider">Calories Burned</label>
            <input
              type="number"
              id="calories"
              required
              placeholder="e.g. 500"
              min={1}
              max={10000}
              value={calories}
              onChange={(e) => setCalories(e.target.value)}
              className="w-full p-4 rounded-xl bg-bg-secondary/50 border border-border-color text-white placeholder-text-tertiary focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-all"
            />
          </div>
        </div>

        <div>
          <label htmlFor="proof" className="block mb-2 text-xs font-bold text-text-secondary uppercase tracking-wider">Proof (Optional)</label>
          <div className="relative">
            <input
              type="file"
              id="proof"
              accept="image/png, image/jpeg"
              ref={fileInputRef}
              className="w-full p-3 rounded-xl bg-bg-secondary/50 border border-border-color text-text-secondary file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-accent-primary/10 file:text-accent-primary hover:file:bg-accent-primary/20 transition-all cursor-pointer"
            />
            <ImageIcon className="absolute right-4 top-1/2 -translate-y-1/2 text-text-tertiary w-5 h-5 pointer-events-none" />
          </div>
          <p className="text-text-tertiary text-xs mt-2">Only visible to participants. Max 5MB.</p>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={isSubmitting}
          className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-accent-primary to-accent-secondary text-white font-bold text-lg shadow-lg shadow-accent-primary/25 hover:shadow-accent-primary/40 disabled:opacity-70 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              Log Workout <span className="text-xl">💪</span>
            </>
          )}
        </motion.button>
      </form>
    </motion.section>
  );
});
