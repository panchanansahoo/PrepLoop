import mammoth from 'mammoth';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');

/**
 * Extracts raw text and metadata from PDF, DOCX, or TXT buffers.
 *
 * Capabilities:
 * 1. Local extraction with zero server/API token cost.
 * 2. Real page count detection via PDF metadata (data.numpages).
 * 3. Scanned PDF detector: flags files with < 50 extractable characters so user gets paste fallback.
 * 4. Mammoth integration for DOCX, preventing raw binary buffer corruption.
 */
export async function extractResumeText(fileBuffer, mimeType = '', filename = '') {
  if (!fileBuffer || !Buffer.isBuffer(fileBuffer)) {
    throw new Error('A valid file buffer is required for extraction');
  }

  const isPdf = mimeType === 'application/pdf' || /\.pdf$/i.test(filename);
  const isDocx = mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || /\.docx$/i.test(filename);
  const isDoc = mimeType === 'application/msword' || /\.doc$/i.test(filename);
  const isTxt = mimeType === 'text/plain' || /\.txt$/i.test(filename);

  let extractedText = '';
  let pageCount = null;
  let isScanned = false;

  if (isPdf) {
    try {
      const data = await pdf(fileBuffer);
      extractedText = (data.text || '').trim();
      pageCount = typeof data.numpages === 'number' ? data.numpages : null;

      // Scanned PDF detection: if less than 50 text characters found
      if (extractedText.replace(/\s+/g, '').length < 50) {
        isScanned = true;
      }
    } catch (err) {
      throw new Error(`Failed to extract text from PDF: ${err.message}`);
    }
  } else if (isDocx) {
    try {
      const { value } = await mammoth.extractRawText({ buffer: fileBuffer });
      extractedText = (value || '').trim();
    } catch (err) {
      throw new Error(`Failed to extract text from DOCX: ${err.message}`);
    }
  } else if (isDoc) {
    // For older binary .doc files, attempt mammoth or raw text fallback
    try {
      const { value } = await mammoth.extractRawText({ buffer: fileBuffer });
      extractedText = (value || '').trim();
    } catch {
      extractedText = fileBuffer.toString('utf-8').replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, ' ').trim();
    }
  } else if (isTxt) {
    extractedText = fileBuffer.toString('utf-8').trim();
  } else {
    // Attempt utf-8 decoding
    extractedText = fileBuffer.toString('utf-8').trim();
  }

  // Estimate page count if not provided by PDF metadata (~450 words/page)
  if (!pageCount) {
    const wordCount = extractedText.split(/\s+/).filter(Boolean).length;
    pageCount = Math.max(1, Math.ceil(wordCount / 450));
  }

  return {
    text: extractedText,
    pageCount,
    isScanned,
    wordCount: extractedText.split(/\s+/).filter(Boolean).length,
    characterCount: extractedText.length,
  };
}
