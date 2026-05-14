import DOMPurify from 'dompurify';

const sanitizeConfig = {
  ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 'code', 'pre', 'blockquote'],
  ALLOWED_ATTR: ['href', 'target', 'rel'],
  ALLOW_DATA_ATTR: false
};

export const sanitizeHtml = (dirty) => {
  if (!dirty || typeof dirty !== 'string') return '';
  return DOMPurify.sanitize(dirty, sanitizeConfig);
};

export const sanitizeText = (text) => {
  if (!text || typeof text !== 'string') return '';
  return text.replace(/[<>]/g, '');
};

export const sanitizeUserInput = (input) => {
  if (typeof input === 'string') {
    return sanitizeText(input);
  }
  
  if (Array.isArray(input)) {
    return input.map(sanitizeUserInput);
  }
  
  if (input && typeof input === 'object') {
    const sanitized = {};
    for (const [key, value] of Object.entries(input)) {
      sanitized[key] = sanitizeUserInput(value);
    }
    return sanitized;
  }
  
  return input;
};

export const sanitizeMarkdown = (markdown) => {
  if (!markdown || typeof markdown !== 'string') return '';
  
  // Allow markdown but sanitize HTML within it
  const htmlRegex = /<[^>]*>/g;
  return markdown.replace(htmlRegex, (match) => sanitizeHtml(match));
};
