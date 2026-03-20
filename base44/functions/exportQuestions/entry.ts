import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

function csvEscape(value) {
  if (value === null || value === undefined) return '';
  const str = String(value).replace(/"/g, '""');
  // Always wrap in quotes to be safe with commas/newlines
  return `"${str}"`;
}

function toCSV(rows) {
  const headers = [
    'id','subject','topic','institution','year','cargo','exam_name','type','statement','command',
    'options','correct_answer','explanation','tags','edital_url','prova_url','gabarito_url',
    'created_date','updated_date','created_by'
  ];
  const lines = [];
  lines.push(headers.join(','));
  for (const q of rows) {
    const optionsStr = q.options ? JSON.stringify(q.options) : '';
    const tagsStr = q.tags ? JSON.stringify(q.tags) : '';
    const line = [
      q.id, q.subject, q.topic, q.institution, q.year, q.cargo, q.exam_name, q.type,
      q.statement, q.command, optionsStr, q.correct_answer, q.explanation, tagsStr,
      q.edital_url, q.prova_url, q.gabarito_url, q.created_date, q.updated_date, q.created_by
    ].map(csvEscape).join(',');
    lines.push(line);
  }
  return lines.join('\n');
}

function xmlEscape(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function toXML(rows) {
  const parts = [];
  parts.push('<?xml version="1.0" encoding="UTF-8"?>');
  parts.push('<questions>');
  for (const q of rows) {
    parts.push(`  <question id="${xmlEscape(q.id)}">`);
    const simple = ['subject','topic','institution','year','cargo','exam_name','type','statement','command','correct_answer','explanation','edital_url','prova_url','gabarito_url','created_date','updated_date','created_by'];
    for (const key of simple) {
      const val = q[key] !== undefined && q[key] !== null ? xmlEscape(q[key]) : '';
      parts.push(`    <${key}>${val}</${key}>`);
    }
    // tags
    parts.push('    <tags>');
    (q.tags || []).forEach(t => parts.push(`      <tag>${xmlEscape(t)}</tag>`));
    parts.push('    </tags>');
    // options
    parts.push('    <options>');
    (q.options || []).forEach(op => {
      const letter = xmlEscape(op.letter || '');
      const text = xmlEscape(op.text || '');
      parts.push(`      <option letter="${letter}">${text}</option>`);
    });
    parts.push('    </options>');
    parts.push('  </question>');
  }
  parts.push('</questions>');
  return parts.join('\n');
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const adminEmails = ['conectadoemconcursos@gmail.com', 'jairochris1@gmail.com'];
    if (user.role !== 'admin' && !adminEmails.includes(user.email)) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { format = 'csv' } = await req.json().catch(() => ({ format: 'csv' }));

    // Streaming response para grandes volumes
    const isXml = String(format).toLowerCase() === 'xml';
    const contentType = isXml ? 'application/xml; charset=utf-8' : 'text/csv; charset=utf-8';
    const filename = isXml ? 'questions.xml' : 'questions.csv';

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Cabeçalhos iniciais
          if (!isXml) {
            // BOM + CSV headers
            const headers = [
              'id','subject','topic','institution','year','cargo','exam_name','type','statement','command',
              'options','correct_answer','explanation','tags','edital_url','prova_url','gabarito_url',
              'created_date','updated_date','created_by'
            ];
            controller.enqueue(encoder.encode('\uFEFF' + headers.join(',') + '\n'));
          } else {
            controller.enqueue(encoder.encode('<?xml version="1.0" encoding="UTF-8"?>\n<questions>\n'));
          }

          // Processar em chunks de 100 questões por vez
          const CHUNK_SIZE = 100;
          let skip = 0;
          let hasMore = true;

          while (hasMore) {
            // Buscar chunk usando asServiceRole para garantir acesso total
            const questions = await base44.asServiceRole.entities.Question.filter(
              {}, 
              '-created_date', 
              CHUNK_SIZE,
              skip
            );

            if (!questions || questions.length === 0) {
              hasMore = false;
              break;
            }

            // Processar e enviar chunk
            if (isXml) {
              for (const q of questions) {
                const lines = [];
                lines.push(`  <question id="${xmlEscape(q.id)}">`);
                const simple = ['subject','topic','institution','year','cargo','exam_name','type','statement','command','correct_answer','explanation','edital_url','prova_url','gabarito_url','created_date','updated_date','created_by'];
                for (const key of simple) {
                  const val = q[key] !== undefined && q[key] !== null ? xmlEscape(q[key]) : '';
                  lines.push(`    <${key}>${val}</${key}>`);
                }
                lines.push('    <tags>');
                (q.tags || []).forEach(t => lines.push(`      <tag>${xmlEscape(t)}</tag>`));
                lines.push('    </tags>');
                lines.push('    <options>');
                (q.options || []).forEach(op => {
                  const letter = xmlEscape(op.letter || '');
                  const text = xmlEscape(op.text || '');
                  lines.push(`      <option letter="${letter}">${text}</option>`);
                });
                lines.push('    </options>');
                lines.push('  </question>');
                controller.enqueue(encoder.encode(lines.join('\n') + '\n'));
              }
            } else {
              for (const q of questions) {
                const optionsStr = q.options ? JSON.stringify(q.options) : '';
                const tagsStr = q.tags ? JSON.stringify(q.tags) : '';
                const line = [
                  q.id, q.subject, q.topic, q.institution, q.year, q.cargo, q.exam_name, q.type,
                  q.statement, q.command, optionsStr, q.correct_answer, q.explanation, tagsStr,
                  q.edital_url, q.prova_url, q.gabarito_url, q.created_date, q.updated_date, q.created_by
                ].map(csvEscape).join(',');
                controller.enqueue(encoder.encode(line + '\n'));
              }
            }

            // Verificar se há mais questões
            if (questions.length < CHUNK_SIZE) {
              hasMore = false;
            } else {
              skip += CHUNK_SIZE;
            }
          }

          // Fechar tags XML
          if (isXml) {
            controller.enqueue(encoder.encode('</questions>'));
          }

          controller.close();
        } catch (error) {
          console.error('Stream error:', error);
          controller.error(error);
        }
      }
    });

    return new Response(stream, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename=${filename}`,
        'Cache-Control': 'no-store',
        'Transfer-Encoding': 'chunked'
      }
    });
  } catch (error) {
    console.error('exportQuestions error:', error);
    return Response.json({ error: error?.message || 'Internal error' }, { status: 500 });
  }
});