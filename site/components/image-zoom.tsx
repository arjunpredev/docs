'use client';
// Click an image or diagram in the page body to see it full screen; Escape, a
// click or the close button dismisses it.
import { X } from 'lucide-react';
import { useEffect, useState } from 'react';

export function ImageZoom({ container }: { container: string }) {
  const [image, setImage] = useState<{ src: string; alt: string } | null>(null);

  useEffect(() => {
    const root = document.getElementById(container);
    if (!root) return;
    const images = [...root.querySelectorAll<HTMLImageElement>('.prose img')].filter((img) => !img.closest('a'));
    for (const img of images) img.classList.add('cursor-zoom-in');
    const onClick = (event: MouseEvent) => {
      const img = (event.target as HTMLElement).closest('img');
      if (img && images.includes(img)) setImage({ src: img.currentSrc || img.src, alt: img.alt });
    };
    root.addEventListener('click', onClick);
    return () => root.removeEventListener('click', onClick);
  }, [container]);

  useEffect(() => {
    if (!image) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setImage(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [image]);

  if (!image) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={image.alt || 'Image'}
      onClick={() => setImage(null)}
      className="fixed inset-0 z-[60] flex cursor-zoom-out items-center justify-center bg-fd-background/90 p-4 backdrop-blur-sm sm:p-10"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={image.src} alt={image.alt} className="max-h-full max-w-full object-contain" />
      <button
        type="button"
        aria-label="Close"
        autoFocus
        className="absolute top-4 right-4 rounded-md border bg-fd-background p-2 text-fd-muted-foreground hover:text-fd-foreground"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
