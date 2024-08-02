import { hashFileFromUrl } from './fileHashUtils.mjs';
import { readFile } from 'fs/promises';

async function compareHashes(jsonFilePath, algorithm = 'sha256') {
  try {
    const jsonData = await readFile(jsonFilePath, 'utf8');
    const storedHashes = JSON.parse(jsonData);

    let differencesFound = false;

    for (const { url, hash: storedHash } of storedHashes) {
      const result = await hashFileFromUrl(url, algorithm);
      if (result) {
        const { hash: currentHash } = result;
        if (currentHash !== storedHash) {
          console.error(`Hash difference found for URL: ${url}`);
          console.error(`Stored Hash: ${storedHash}`);
          console.error(`Current Hash: ${currentHash}`);
          differencesFound = true;
        }
      }
    }

    if (differencesFound) {
      console.error('Differences were found. Exiting with error code 1.');
      process.exit(1);
    } else {
      console.log('All hashes match.');
    }
  } catch (error) {
    console.error('Error comparing hashes:', error);
    process.exit(1);
  }
}

const jsonFilePath = './hashes.json';
compareHashes(jsonFilePath, 'sha256');
