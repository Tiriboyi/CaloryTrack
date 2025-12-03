import { useState, useRef, forwardRef, useImperativeHandle } from 'react';
import { submitEntry } from '../api';
import { resizeImage } from '../utils';

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
    <section className="card" ref={formRef}>
      <h2 className="form-title">Add Daily Burn</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="username">Name / Nickname</label>
          <input
            type="text"
            id="username"
            required
            placeholder="e.g. Iron Mike"
            maxLength={20}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label htmlFor="calories">Calories Burned</label>
          <input
            type="number"
            id="calories"
            required
            placeholder="e.g. 500"
            min={1}
            max={10000}
            value={calories}
            onChange={(e) => setCalories(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label htmlFor="proof">Proof (Optional Screenshot)</label>
          <input
            type="file"
            id="proof"
            accept="image/png, image/jpeg"
            ref={fileInputRef}
          />
          <p className="privacy-note">Only visible to participants. Max 5MB.</p>
        </div>
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Submitting...' : '💪 Log It!'}
        </button>
      </form>
    </section>
  );
});
