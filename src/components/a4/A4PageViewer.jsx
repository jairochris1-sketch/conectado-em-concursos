import React from "react";

export default function A4PageViewer({ page }) {
  if (!page) return null;
  const { title, subtitle, cover_image_url, content_html, footer_text } = page;

  return (
    <div className="w-full flex justify-center">
      <style>{`
        /* A4 layout for screen and print */
        .a4-sheet { width: 210mm; min-height: 297mm; background: white; color: #111; box-shadow: 0 0 0.5rem rgba(0,0,0,.15); }
        .a4-body { padding: 18mm 18mm 24mm; }
        .a4-header { text-align: center; margin-bottom: 12mm; }
        .a4-title { font-size: 18pt; font-weight: 700; }
        .a4-subtitle { font-size: 12pt; color: #555; margin-top: 4px; }
        .a4-cover { width: 100%; max-height: 90mm; object-fit: cover; border-radius: 6px; margin-bottom: 8mm; }
        .a4-content { font-size: 11pt; line-height: 1.5; }
        .a4-content h1 { font-size: 16pt; margin: 12px 0 6px; }
        .a4-content h2 { font-size: 14pt; margin: 10px 0 6px; }
        .a4-content h3 { font-size: 12pt; margin: 8px 0 4px; }
        .a4-content p { margin: 6px 0; }
        .a4-content ul, .a4-content ol { margin: 6px 0 6px 18px; }
        .a4-footer { position: relative; margin-top: 12mm; color: #666; font-size: 9pt; text-align: center; }

        @media print {
          body { background: white !important; }
          .no-print { display: none !important; }
          .a4-sheet { box-shadow: none; break-after: page; }
          @page { size: A4; margin: 12mm; }
        }
      `}</style>

      <article className="a4-sheet">
        <div className="a4-body">
          <header className="a4-header">
            <div className="a4-title">{title}</div>
            {subtitle && <div className="a4-subtitle">{subtitle}</div>}
          </header>

          {cover_image_url && (
            <img src={cover_image_url} alt="Capa" className="a4-cover" />
          )}

          <section className="a4-content prose prose-slate max-w-none" dangerouslySetInnerHTML={{ __html: content_html || "" }} />

          {footer_text && <footer className="a4-footer">{footer_text}</footer>}
        </div>
      </article>
    </div>
  );
}