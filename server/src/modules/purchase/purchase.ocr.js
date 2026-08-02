import { execSync } from 'child_process';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';

export function extractTextFromImage(buffer) {
  if (!buffer || buffer.length === 0) return '';

  const tmpDir = '/tmp/ocr-' + uuidv4();
  fs.mkdirSync(tmpDir, { recursive: true });
  const imgPath = path.join(tmpDir, 'receipt.png');

  try {
    fs.writeFileSync(imgPath, buffer);

    try {
      const result = execSync(`tesseract "${imgPath}" stdout -l eng+ind`, {
        encoding: 'utf-8',
        timeout: 15_000,
        stdio: ['pipe', 'pipe', 'ignore'],
      });

      return result.trim();
    } catch (execError) {
      // tesseract exits non-zero on unrecognizable images — return empty, don't crash
      console.warn('[OCR] tesseract failed:', execError.stderr?.toString() || execError.message);
      return '';
    }
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}