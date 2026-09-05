import { useState, useRef } from 'react';
import { ImagePlus, Link2, LoaderCircle, X } from 'lucide-react';
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
  const [urlInput, setUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
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

  async function handleUrlSubmit() {
    if (!urlInput.trim()) return;
    setUploading(true);
    setError('');
    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fetch-image`;
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ url: urlInput.trim(), folder }),
      });
      const result = await res.json();
      if (!res.ok || result.error) {
        throw new Error(result.error || 'Failed to fetch image');
      }
      onChange(result.url);
      setUrlInput('');
      setShowUrlInput(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  async function removeImage() {
    if (value) {
      const path = value.split('/aci-just-images/')[1];
      if (path) await supabase.storage.from('aci-just-images').remove([path]);
    }
    onChange(null);
    setShowUrlInput(false);
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
        <>
          <button type="button" className="image-drop" onClick={() => inputRef.current?.click()} disabled={uploading}>
            {uploading ? <LoaderCircle className="spin" size={22} /> : <ImagePlus size={22} />}
            <span>{uploading ? 'Uploading...' : 'Click to upload'}</span>
          </button>
          <button type="button" className="image-url-toggle" onClick={() => setShowUrlInput(!showUrlInput)}>
            <Link2 size={14} /> Or paste a link
          </button>
          {showUrlInput && (
            <div className="image-url-row">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="Paste Google Drive or image link..."
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleUrlSubmit(); } }}
              />
              <button type="button" className="button button-dark" onClick={handleUrlSubmit} disabled={uploading}>
                {uploading ? <LoaderCircle size={14} className="spin" /> : 'Add'}
              </button>
            </div>
          )}
        </>
      )}
      {error && <p className="upload-error">{error}</p>}
      <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} hidden />
    </div>
  );
}
