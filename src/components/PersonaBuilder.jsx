import { useState, useEffect } from 'react';
import { Image as ImageIcon, Plus, Trash2, CheckCircle2, ArrowLeft, ArrowRight } from 'lucide-react';
import ImageCropperModal from './ImageCropperModal';
import { getCroppedImg } from '../lib/cropImage';

const getRandomColor = () => {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};

export default function PersonaBuilder({ onSave, onCancel, initialData }) {
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    role: '',
    avatar: '',
    systemPrompt: '',
    personality: [],
    habits: [],
    lore: []
  });

  const [newPersonality, setNewPersonality] = useState('');
  const [newHabit, setNewHabit] = useState('');
  const [newLore, setNewLore] = useState('');

  const [selectedImageForCrop, setSelectedImageForCrop] = useState(null);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };



  const addItem = (field, value, setter) => {
    if (value.trim()) {
      setFormData(prev => ({ ...prev, [field]: [...prev[field], value.trim()] }));
      setter('');
    }
  };

  const removeItem = (field, index) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const themeToSave = formData.theme || { primary: getRandomColor(), secondary: getRandomColor() };

    const personaToSave = {
      ...formData,
      theme: themeToSave,
      id: formData.id || `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      isCustom: true
    };
    
    onSave(personaToSave);
  };

  return (
    <div className="flex flex-col animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="flex items-center justify-between mb-4 shrink-0 -mt-1 pr-2">
        <h2 className="text-lg font-medium text-slate-900 dark:text-white">
          {initialData ? 'Edit Persona' : 'New Persona'}
        </h2>
        <button
          onClick={onCancel}
          className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
        >
          <ArrowRight size={20} />
        </button>
      </div>

      <div className="flex flex-col gap-5 pb-6">
          {/* Basic Info */}
          <div className="flex flex-col gap-3">
            <h3 className="text-[11px] font-medium tracking-wider uppercase text-slate-400">Basic Info</h3>
            <div className="p-3.5 rounded-lg border border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.01] flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-medium text-slate-500 flex justify-between">
                  <span>Avatar Photo (Optional)</span>
                </label>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-slate-200 dark:bg-white/10 flex items-center justify-center text-slate-400 overflow-hidden shrink-0 border-2 border-slate-200 dark:border-white/10">
                    {formData.avatar ? (
                      <img src={formData.avatar} alt="Preview" className="w-full h-full object-cover" onError={(e) => e.target.style.display='none'} />
                    ) : (
                      <ImageIcon size={24} />
                    )}
                  </div>
                  <label className="cursor-pointer bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10 hover:border-[var(--color-brand-magenta)]/30 transition-all px-3 py-2 rounded-md text-[12px] font-semibold text-slate-700 dark:text-slate-300 flex-1 text-center">
                    Upload Photo
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (event) => setSelectedImageForCrop(event.target.result);
                          reader.readAsDataURL(file);
                        }
                        e.target.value = null;
                      }}
                    />
                  </label>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-medium text-slate-500">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="e.g. JARVIS"
                  className="w-full bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-white/10 rounded-md px-3 py-2 text-slate-900 dark:text-white text-[13px] font-medium focus:outline-none focus:border-[var(--color-brand-magenta)] transition-colors"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-medium text-slate-500">Role / Title</label>
                <input
                  type="text"
                  value={formData.role}
                  onChange={(e) => handleChange('role', e.target.value)}
                  placeholder="e.g. AI Assistant"
                  className="w-full bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-white/10 rounded-md px-3 py-2 text-slate-900 dark:text-white text-[13px] font-medium focus:outline-none focus:border-[var(--color-brand-magenta)] transition-colors"
                />
              </div>
            </div>
          </div>



          {/* Core Instruction */}
          <div className="flex flex-col gap-3">
            <h3 className="text-[11px] font-medium tracking-wider uppercase text-slate-400">System Prompt</h3>
            <div className="p-3.5 rounded-lg border border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.01]">
              <textarea
                value={formData.systemPrompt}
                onChange={(e) => handleChange('systemPrompt', e.target.value)}
                placeholder="You are a helpful assistant..."
                rows={5}
                className="w-full bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-white/10 rounded-md px-3 py-2 text-slate-900 dark:text-white text-[12px] font-medium focus:outline-none focus:border-[var(--color-brand-magenta)] transition-colors resize-y custom-scrollbar"
              />
            </div>
          </div>

          {/* Dynamic Lists */}
          {[
            { label: 'Personality Traits', field: 'personality', state: newPersonality, setter: setNewPersonality, placeholder: 'e.g. Always optimistic and cheerful' },
            { label: 'Habits', field: 'habits', state: newHabit, setter: setNewHabit, placeholder: 'e.g. Ends sentences with emojis' },
            { label: 'Lore & Background', field: 'lore', state: newLore, setter: setNewLore, placeholder: 'e.g. Created in 2026 by a brilliant scientist' }
          ].map(({ label, field, state, setter, placeholder }) => (
            <div key={field} className="flex flex-col gap-3">
              <h3 className="text-[11px] font-medium tracking-wider uppercase text-slate-400">{label}</h3>
              <div className="p-3.5 rounded-lg border border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.01] flex flex-col gap-2">
                {formData[field].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2 bg-white dark:bg-white/5 p-2 rounded-md border border-slate-200 dark:border-white/5 group">
                    <span className="flex-1 text-[12px] text-slate-700 dark:text-slate-300 break-words">{item}</span>
                    <button onClick={() => removeItem(field, idx)} className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setter(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addItem(field, state, setter)}
                    placeholder={placeholder}
                    className="flex-1 bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-white/10 rounded-md px-3 py-1.5 text-slate-900 dark:text-white text-[12px] focus:outline-none focus:border-[var(--color-brand-magenta)]"
                  />
                  <button onClick={() => addItem(field, state, setter)} disabled={!state.trim()} className="p-1.5 bg-[var(--color-brand-magenta)] text-white rounded-md disabled:opacity-50">
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}

        {/* Save Button */}
        <div className="flex justify-end mt-2">
          <button
            onClick={handleSubmit}
            disabled={!formData.name.trim()}
            className="px-5 py-2 bg-[var(--color-brand-magenta)] hover:bg-[var(--color-brand-magenta)]/90 text-white text-xs font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
          >
            <CheckCircle2 size={14} /> {initialData ? 'Save Changes' : 'Save New Persona'}
          </button>
        </div>

      </div>

      {/* Image Cropper Modal for Persona */}
      {selectedImageForCrop && (
        <ImageCropperModal
          imageSrc={selectedImageForCrop}
          onComplete={async (croppedAreaPixels) => {
            try {
              const croppedImage = await getCroppedImg(selectedImageForCrop, croppedAreaPixels);
              handleChange('avatar', croppedImage);
              setSelectedImageForCrop(null);
            } catch (e) {
              console.error(e);
            }
          }}
          onCancel={() => setSelectedImageForCrop(null)}
        />
      )}
    </div>
  );
}
