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
  return new TextEncoder().encode(lines.join('\n'));
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
  return new TextEncoder().encode(parts.join('\n'));
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

    // Fetch all questions (service role for full access)
    const questions = await base44.asServiceRole.entities.Question.filter({});

    let bytes; let contentType; let filename;
    if (String(format).toLowerCase() === 'xml') {
      bytes = toXML(questions || []);
      contentType = 'application/xml';
      filename = 'questions.xml';
    } else {
      bytes = toCSV(questions || []);
      contentType = 'text/csv; charset=utf-8';
      filename = 'questions.csv';
    }

    return new Response(bytes, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename=${filename}`,
        'Cache-Control': 'no-store'
      }
    });
  } catch (error) {
    return Response.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
});