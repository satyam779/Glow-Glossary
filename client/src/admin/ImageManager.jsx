import { useEffect, useRef, useState } from 'react';
import { Grip, Trash, Upload } from '../components/Icons';
import { adminApi } from './adminApi';
import { useToast } from './ui';

const ACCEPT = 'image/jpeg,image/png,image/webp,image/avif,image/gif';
const MAX_BYTES = 12 * 1024 * 1024;
const UPLOAD_BYTES = 3.5 * 1024 * 1024;

// Scales large photos down in the browser so each upload fits the host's request limit.
// The server still resizes everything to 1600 px WebP, so nothing visible is lost.
export async function shrink(file) {
  if (file.size <= UPLOAD_BYTES || file.type === 'image/gif') return file;
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 2400 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const encode = (type, q) => new Promise((resolve) => canvas.toBlob(resolve, type, q));
  let blob = await encode('image/webp', 0.9); // keeps transparency
  if (!blob || blob.type !== 'image/webp') blob = await encode('image/jpeg', 0.88); // Safari can't encode WebP
  return new File([blob], `${file.name.replace(/\.\w+$/, '')}.${blob.type === 'image/webp' ? 'webp' : 'jpg'}`, { type: blob.type });
}

// Photos for one product. With a productId, changes save immediately.
// Without one (a product that hasn't been created yet), files are queued in `pending`.
export default function ImageManager({ productId, images, onChange, pending, onPendingChange }) {
  const toast = useToast();
  const input = useRef(null);
  const [over, setOver] = useState(false);
  const [uploading, setUploading] = useState(0);
  const [dragId, setDragId] = useState(null);

  // Free preview URLs for queued files when the editor closes.
  const pendingRef = useRef(pending);
  pendingRef.current = pending;
  useEffect(() => () => pendingRef.current?.forEach((p) => URL.revokeObjectURL(p.preview)), []);

  const unqueue = (item) => {
    URL.revokeObjectURL(item.preview);
    onPendingChange(pending.filter((x) => x.key !== item.key));
  };

  const accept = (fileList) => {
    const files = [...fileList].filter((f) => {
      if (!ACCEPT.split(',').includes(f.type)) {
        toast(`${f.name}: use JPG, PNG, WebP or AVIF`, 'error');
        return false;
      }
      if (f.size > MAX_BYTES) {
        toast(`${f.name} is over 12 MB`, 'error');
        return false;
      }
      return true;
    });
    if (!files.length) return;
    if (!productId) {
      onPendingChange([...(pending || []), ...files.map((file) => ({ file, preview: URL.createObjectURL(file), key: `${file.name}-${file.size}-${Math.random()}` }))]);
      return;
    }
    upload(files);
  };

  const upload = async (files) => {
    setUploading((n) => n + files.length);
    try {
      // One photo per request: serverless hosts (Vercel) cap request bodies at about 4.5 MB.
      let added = [];
      for (const file of files) {
        const fd = new FormData();
        fd.append('images', await shrink(file));
        const res = await adminApi(`/products/${productId}/images`, { method: 'POST', body: fd });
        added = added.concat(res.images);
        onChange((current) => [...current, ...res.images]);
      }
      toast(`${added.length} photo${added.length === 1 ? '' : 's'} uploaded`);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setUploading((n) => n - files.length);
    }
  };

  const saveOrder = async (next) => {
    const before = images;
    onChange(next);
    try {
      const res = await adminApi(`/products/${productId}/images`, { method: 'PATCH', body: { order: next.map((i) => i.id) } });
      onChange(res.images);
    } catch (err) {
      onChange(before);
      toast(err.message, 'error');
    }
  };

  const move = (from, to) => {
    if (to < 0 || to >= images.length || from === to) return;
    const next = [...images];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    saveOrder(next);
  };

  const remove = async (img) => {
    if (!window.confirm('Delete this photo? This can’t be undone.')) return;
    const before = images;
    onChange(images.filter((i) => i.id !== img.id));
    try {
      await adminApi(`/images/${img.id}`, { method: 'DELETE' });
      toast('Photo deleted');
    } catch (err) {
      onChange(before);
      toast(err.message, 'error');
    }
  };

  const saveAlt = async (img, alt) => {
    if (alt === img.alt) return;
    try {
      const res = await adminApi(`/images/${img.id}`, { method: 'PATCH', body: { alt } });
      onChange(images.map((i) => (i.id === img.id ? res.image : i)));
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  return (
    <div className="imgs">
      <div
        className={`drop ${over ? 'is-over' : ''}`}
        onDragOver={(e) => {
          if (e.dataTransfer.types.includes('Files')) {
            e.preventDefault();
            setOver(true);
          }
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          if (!e.dataTransfer.files.length) return;
          e.preventDefault();
          setOver(false);
          accept(e.dataTransfer.files);
        }}
      >
        <Upload />
        <p>
          <b>Drop photos here</b> or{' '}
          <button type="button" className="a-linkbtn" onClick={() => input.current?.click()}>
            choose files
          </button>
        </p>
        <small>JPG, PNG, WebP or AVIF, up to 12 MB each. They’re resized and converted to WebP automatically.</small>
        <input
          ref={input}
          type="file"
          accept={ACCEPT}
          multiple
          hidden
          onChange={(e) => {
            accept(e.target.files);
            e.target.value = '';
          }}
        />
        {uploading > 0 && <span className="drop__busy">Uploading {uploading}…</span>}
      </div>

      {productId ? (
        images.length > 0 && (
          <ol className="imgs__grid">
            {images.map((img, i) => (
              <li
                key={img.id}
                className={`imgcard ${dragId === img.id ? 'is-dragging' : ''}`}
                draggable
                onDragStart={(e) => {
                  setDragId(img.id);
                  e.dataTransfer.effectAllowed = 'move';
                }}
                onDragEnd={() => setDragId(null)}
                onDragOver={(e) => dragId && e.preventDefault()}
                onDrop={(e) => {
                  if (!dragId) return;
                  e.preventDefault();
                  e.stopPropagation();
                  move(images.findIndex((x) => x.id === dragId), i);
                  setDragId(null);
                }}
              >
                <div className="imgcard__media">
                  <img src={img.url} alt={img.alt} loading="lazy" />
                  {i === 0 && <span className="imgcard__cover">Cover</span>}
                  <span className="imgcard__grip" title="Drag to reorder">
                    <Grip />
                  </span>
                </div>
                <input
                  className="imgcard__alt"
                  defaultValue={img.alt}
                  placeholder="Describe the photo (alt text)"
                  maxLength={200}
                  onBlur={(e) => saveAlt(img, e.target.value.trim())}
                  aria-label={`Alt text for photo ${i + 1}`}
                />
                <div className="imgcard__actions">
                  <button type="button" onClick={() => move(i, i - 1)} disabled={i === 0} aria-label="Move earlier">
                    ←
                  </button>
                  <button type="button" onClick={() => move(i, i + 1)} disabled={i === images.length - 1} aria-label="Move later">
                    →
                  </button>
                  {i !== 0 && (
                    <button type="button" onClick={() => move(i, 0)}>
                      Make cover
                    </button>
                  )}
                  <button type="button" className="danger" onClick={() => remove(img)} aria-label="Delete photo">
                    <Trash />
                  </button>
                </div>
              </li>
            ))}
          </ol>
        )
      ) : (
        pending?.length > 0 && (
          <ol className="imgs__grid">
            {pending.map((p, i) => (
              <li key={p.key} className="imgcard">
                <div className="imgcard__media">
                  <img src={p.preview} alt="" />
                  {i === 0 && <span className="imgcard__cover">Cover</span>}
                </div>
                <div className="imgcard__actions">
                  <span className="a-muted">Uploads when you save</span>
                  <button type="button" className="danger" onClick={() => unqueue(p)} aria-label="Remove photo">
                    <Trash />
                  </button>
                </div>
              </li>
            ))}
          </ol>
        )
      )}
    </div>
  );
}
