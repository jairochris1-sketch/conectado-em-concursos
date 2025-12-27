import React, { useEffect, useState } from "react";
import { SiteContent } from "@/entities/SiteContent";
import { useSearchParams } from "react-router-dom";

export default function GuidePage() {
  const [sp] = useSearchParams();
  const key = sp.get("key");
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!key) { setLoading(false); return; }
      try {
        const res = await SiteContent.filter({ page_key: key });
        setContent(res && res.length ? res[0] : null);
      } finally { setLoading(false); }
    };
    load();
  }, [key]);

  const title = content?.title || key || "Página";
  const subtitle = content?.subtitle;
  const main = content?.main_text;
  const secondary = content?.secondary_text;
  const bg = content?.background_image_url;

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4" style={bg ? {backgroundImage:`url(${bg})`, backgroundSize:'cover', backgroundPosition:'center'} : {}}>
      <div className="mx-auto bg-white shadow-xl rounded-md p-8" style={{ maxWidth: "794px" }}>
        <h1 className="text-3xl font-extrabold mb-2">{title}</h1>
        {subtitle && <p className="text-gray-700 mb-2">{subtitle}</p>}
        {main && <p className="text-gray-600 mb-4 whitespace-pre-wrap">{main}</p>}
        {secondary && <p className="text-gray-600 whitespace-pre-wrap">{secondary}</p>}
        {!loading && !content && (
          <div className="text-gray-600">Nenhum conteúdo encontrado para esta página.</div>
        )}
      </div>
    </div>
  );
}