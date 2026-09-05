import { useState, useRef } from 'react';
import { ImagePlus, Link2, LoaderCircle, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type ImageUploadProps = {
  value: string | null;
  onChange: (url: string | null) => void;
  label?: string;
  folder?: string;
};

function convertDriveUrl(url: string): string {
  const patterns = [
    /drive\.google\.com\/file\/d\/([^/]+)/,
    /drive\.google\.com\/open\?id=([^&]+)/,
    /drive\.google\.com\/uc\?id=([^&]+)/,
  /docs\.google\.com\/.*\/d\/([^/]+)/,
  /docs\.google\.com\/uc\?id=([^&]+)/,
  /drive\.google\.com\/thumbnail\?id=([^&]+)/,
  /lh3\.googleusercontent\.com\/d\/([^?]+)/,
  /lh\d+\.googleusercontent\.com\/d\/([^?]+)/,
  /lh\d+\.googleusercontent\.com\/u\/\d+\/d\/([^?]+)/,
  /lh\d+-?\.googleusercontent\.com\/p\/[^?]+/,
  /lh\d+\.googleusercontent\.com\/[^?]+/,
  /lh\d+\.ggpht\.com\/[^?]+/,
  /lh\d+\.googleusercontent\.com\/a-\/[^?]+/,
    ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      if (pattern.source.includes('thumbnail')) {
        return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w1000`;
      }
      return `https://lh3.googleusercontent.com/d/${match[1]}=w1000`;
    }
  }
  return url;
}

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

  function handleUrlSubmit() {
    if (!urlInput.trim()) return;
    const converted = convertDriveUrl(urlInput.trim());
    onChange(converted);
    setUrlInput('');
    setShowUrlInput(false);
    setError('');
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
          <img src={value} alt="Preview" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          <button type="button" className="image-remove" onClick={removeImage}><X size={14} /></button>
          <p className="upload-error" style={{ marginTop: 4 }}>If the image doesn't show, the link may not be a direct image URL.</p>
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
              <button type="button" className="button button-dark" onClick={handleUrlSubmit}>Add</button>
            </div>
          )}
        </>
      )}
      {error && <p className="upload-error">{error}</p>}
      <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} hidden />
    </div>
  );
}
