import { useState, useRef } from 'react';
import { ImagePlus, LoaderCircle, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type ImageUploadProps = {
  value: string | null;
  onChange: (url: string | null) => void;
  label?: string;
  folder?: string;
};

export function ImageUpload({ value, onChange, label = 'Image', folder = 'misc' }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
    const ext = file.name.split('.').pop() ?? 'jpg';
    const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from('aci-just-images')
      .upload(fileName, file, { cacheControl: '3600', upsert: false });
    if (uploadError) {
      setError(uploadError.message);
      setUploading(false);
      return;
    }
    const { data } = supabase.storage.from('aci-just-images').getPublicUrl(fileName);
    onChange(data.publicUrl);
    setUploading(false);
  }

  async function removeImage() {
    if (value) {
      const path = value.split('/aci-just-images/')[1];
      if (path) await supabase.storage.from('aci-just-images').remove([path]);
    }
    onChange(null);
  }

  return (
    <div className="image-upload">
      <label className="form-label">{label}</label>
      {value ? (
        <div className="image-preview">
          <img src={value} alt="Preview" />
          <button type="button" className="image-remove" onClick={removeImage}><X size={14} /></button>
        </div>
      ) : (
        <button type="button" className="image-drop" onClick={() => inputRef.current?.click()} disabled={uploading}>
          {uploading ? <LoaderCircle className="spin" size={22} /> : <ImagePlus size={22} />}
          <span>{uploading ? 'Uploading...' : 'Click to upload'}</span>
        </button>
      )}
      {error && <p className="upload-error">{error}</p>}
      <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} hidden />
    </div>
  );
}
