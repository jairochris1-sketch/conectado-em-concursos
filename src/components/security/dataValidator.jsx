/**
 * Funções de validação e sanitização de dados para prevenir XSS e injection attacks
 */

/**
 * Sanitiza string removendo scripts e tags HTML potencialmente perigosas
 */
export function sanitizeHTML(input) {
  if (typeof input !== 'string') return input;
  
  // Remove tags script, iframe, object, embed
  let sanitized = input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  sanitized = sanitized.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');
  sanitized = sanitized.replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '');
  sanitized = sanitized.replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '');
  
  // Remove event handlers (onclick, onerror, etc)
  sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
  sanitized = sanitized.replace(/on\w+\s*=\s*[^\s>]*/gi, '');
  
  // Remove javascript: protocols
  sanitized = sanitized.replace(/javascript:/gi, '');
  
  return sanitized;
}

/**
 * Valida email
 */
export function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Valida telefone brasileiro
 */
export function isValidPhone(phone) {
  if (!phone || typeof phone !== 'string') return true; // Opcional
  const phoneRegex = /^\(?[1-9]{2}\)?\s?9?\d{4}-?\d{4}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}

/**
 * Valida URL
 */
export function isValidURL(url) {
  if (!url || typeof url !== 'string') return true; // Opcional
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Sanitiza dados de usuário antes de salvar
 */
export function sanitizeUserData(userData) {
  const sanitized = {};
  
  for (const [key, value] of Object.entries(userData)) {
    if (value === null || value === undefined) {
      sanitized[key] = value;
      continue;
    }
    
    // Campos específicos
    switch (key) {
      case 'email':
        sanitized[key] = value.toLowerCase().trim();
        if (!isValidEmail(sanitized[key])) {
          throw new Error(`Email inválido: ${value}`);
        }
        break;
        
      case 'phone':
        sanitized[key] = value.replace(/\D/g, ''); // Remove não-dígitos
        if (sanitized[key] && !isValidPhone(sanitized[key])) {
          throw new Error(`Telefone inválido: ${value}`);
        }
        break;
        
      case 'profile_photo_url':
        if (value && !isValidURL(value)) {
          throw new Error(`URL de foto inválida: ${value}`);
        }
        sanitized[key] = value;
        break;
        
      case 'full_name':
      case 'job_title':
      case 'city':
      case 'ban_reason':
        // Sanitiza strings de texto
        sanitized[key] = sanitizeHTML(value.toString().trim());
        break;
        
      default:
        // Para outros campos, apenas sanitiza se for string
        if (typeof value === 'string') {
          sanitized[key] = sanitizeHTML(value.trim());
        } else {
          sanitized[key] = value;
        }
    }
  }
  
  return sanitized;
}

/**
 * Valida dados de comentário/post para prevenir XSS
 */
export function sanitizeCommentData(commentData) {
  return {
    ...commentData,
    comment_text: sanitizeHTML(commentData.comment_text || ''),
    user_name: sanitizeHTML(commentData.user_name || ''),
    user_city: sanitizeHTML(commentData.user_city || '')
  };
}

/**
 * Valida dados de questão para admin
 */
export function sanitizeQuestionData(questionData) {
  const sanitized = { ...questionData };
  
  // Sanitiza campos de texto
  const textFields = ['statement', 'command', 'explanation', 'subject', 'topic', 'institution'];
  textFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = sanitizeHTML(sanitized[field]);
    }
  });
  
  // Sanitiza opções
  if (Array.isArray(sanitized.options)) {
    sanitized.options = sanitized.options.map(opt => ({
      letter: sanitizeHTML(opt.letter),
      text: sanitizeHTML(opt.text)
    }));
  }
  
  return sanitized;
}

/**
 * Previne SQL Injection em queries (para uso em filtros)
 */
export function sanitizeQueryParam(param) {
  if (typeof param !== 'string') return param;
  
  // Remove caracteres perigosos para SQL
  return param.replace(/['";\\]/g, '');
}