import { hashFileFromUrl } from './fileHashUtils.mjs';
import { writeFile, readFile } from 'fs/promises';

async function hashFilesFromUrls(outputJsonPath, algorithm = 'sha256') {
  try {
    const jsonData = await readFile(jsonFilePath, 'utf8');
    const storedHashes = JSON.parse(jsonData);

    const hashResults = [];

    for (const { url } of storedHashes) {
      const result = await hashFileFromUrl(url, algorithm);
      if (result) {
        hashResults.push(result);
      }
    }

    await writeFile(outputJsonPath, JSON.stringify(hashResults, null, 2));
    console.log(`Hashes were successfully saved to ${outputJsonPath}.`);
  } catch (error) {
    console.error('Error generating hashes:', error);
  }
}

const jsonFilePath = './hashes.json';
hashFilesFromUrls(jsonFilePath, 'sha256');
