import fetch from 'node-fetch';
import { createHash } from 'crypto';

export async function hashFileFromUrl(url, algorithm = 'sha256') {
  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Error fetching file from ${url}: ${response.statusText}`);
    }

    const hash = createHash(algorithm);
    const stream = response.body;

    return new Promise((resolve, reject) => {
      stream.on('data', (chunk) => {
        hash.update(chunk);
      });

      stream.on('end', () => {
        const hashValue = hash.digest('hex');
        resolve({ url, hash: hashValue });
      });

      stream.on('error', (err) => {
        reject(err);
      });
    });
  } catch (error) {
    console.error(`Error downloading file from ${url}:`, error);
    return null;
  }
}
