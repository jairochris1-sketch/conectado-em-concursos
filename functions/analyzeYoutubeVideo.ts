import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

function extractVideoId(url) {
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtu.be')) {
      return u.pathname.replace('/', '');
    }
    if (u.searchParams.has('v')) {
      return u.searchParams.get('v');
    }
    // embed format
    const parts = u.pathname.split('/');
    const idx = parts.indexOf('embed');
    if (idx >= 0 && parts[idx + 1]) return parts[idx + 1];
  } catch {
    // ignore
  }
  return null;
}

function decodeXmlEntities(str) {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

async function fetchTranscriptFromUnofficial(videoId) {
  // youtubetranscript.net tends a return JSON array of captions
  const url = `https://youtubetranscript.net/?server_vid2=${videoId}`;
  const res = await fetch(url, { headers: { 'accept': 'application/json, text/plain, */*' } });
  const text = await res.text();
  try {
    const data = JSON.parse(text);
    if (Array.isArray(data)) {
      return data.map(x => x.text).join(' ');
    }
  } catch {
    // not JSON, ignore
  }
  return null;
}

async function fetchTranscriptFromTimedText(videoId) {
  const langs = ['pt-BR', 'pt', 'en'];
  for (const lang of langs) {
    const url = `https://www.youtube.com/api/timedtext?lang=${encodeURIComponent(lang)}&v=${encodeURIComponent(videoId)}`;
    const res = await fetch(url);
    if (!res.ok) continue;
    const xml = await res.text();
    const matches = xml.match(/<text[^>]*>([\s\S]*?)<\/text>/g);
    if (matches && matches.length) {
      const pieces = matches.map(x => {
        const inner = x.replace(/^<text[^>]*>/, '').replace(/<\/text>$/, '');
        try {
          // XML uses numeric and named entities
          return decodeXmlEntities(decodeURIComponent(inner.replace(/%/g, '%25')));
        } catch {
          return decodeXmlEntities(inner);
        }
      });
      const transcript = pieces.join(' ').replace(/\s+/g, ' ').trim();
      if (transcript.length > 0) return transcript;
    }
  }
  return null;
}

async function fetchVideoMeta(videoId) {
  try {
    const url = `https://www.youtube.com/oembed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`)}&format=json`;
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Usuário não autenticado.' }, { status: 401 });
    }
    
    const { videoUrl } = await req.json();

    if (!videoUrl) {
      return Response.json({ error: 'URL do vídeo é obrigatória.' }, { status: 400 });
    }

    const videoId = extractVideoId(videoUrl);
    if (!videoId) {
      return Response.json({ error: 'Não foi possível extrair o ID do vídeo. Verifique a URL.' }, { status: 400 });
    }

    const meta = await fetchVideoMeta(videoId);
    // Tenta obter transcrição de duas formas
    let transcript = await fetchTranscriptFromUnofficial(videoId);
    if (!transcript) {
      transcript = await fetchTranscriptFromTimedText(videoId);
    }

    if (!transcript || transcript.length < 50) {
      return Response.json({ 
        success: false, 
        error: 'Transcrição indisponível para este vídeo. Tente outro vídeo ou um com legendas geradas.' 
      }, { status: 404 });
    }

    // Limitar tamanho da transcrição para o LLM
    const MAX_LEN = 15000;
    const clippedTranscript = transcript.length > MAX_LEN ? transcript.slice(0, MAX_LEN) : transcript;

    const json_schema = {
      type: "object",
      properties: {
        summary: { type: "string" },
        flashcards: {
          type: "array",
          items: {
            type: "object",
            properties: {
              front: { type: "string" },
              back: { type: "string" }
            },
            required: ["front", "back"]
          }
        },
        questions: {
          type: "array",
          items: {
            type: "object",
            properties: {
              statement: { type: "string" },
              options: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    letter: { type: "string", enum: ["A", "B", "C", "D"] },
                    text: { type: "string" }
                  },
                  required: ["letter", "text"]
                }
              },
              correct_answer: { type: "string" },
              explanation: { type: "string" }
            },
            required: ["statement", "options", "correct_answer", "explanation"]
          }
        }
      },
      required: ["summary", "flashcards", "questions"]
    };

    const prompt = `
Você é um especialista em concursos públicos. Abaixo está a transcrição REAL do vídeo analisado.
Use SOMENTE esse conteúdo para gerar os materiais, sem inventar informações não presentes na transcrição.

Metadados (se disponíveis):
- Título: ${meta?.title || 'N/D'}
- Autor/Canal: ${meta?.author_name || 'N/D'}
- URL: https://www.youtube.com/watch?v=${videoId}

Transcrição (trecho inicial):
"""
${clippedTranscript}
"""

Tarefas a cumprir:
1) summary: Um resumo estruturado e didático em markdown, com tópicos e destaques.
2) flashcards: Exatamente 5 flashcards com 'front' e 'back'.
3) questions: Exatamente 3 questões de múltipla escolha (A-D), com a correta e explicação, baseadas SOMENTE na transcrição.
`;

    const analysisResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: false,
      response_json_schema: json_schema
    });

    return Response.json({ success: true, data: analysisResult });

  } catch (error) {
    console.error('Erro na função analyzeYoutubeVideo:', error);
    return Response.json({ success: false, error: `Erro interno: ${error.message}` }, { status: 500 });
  }
});