/**
 * Compute SHA-256 hash of an ArrayBuffer or Uint8Array.
 * Works seamlessly in both browser (Web Crypto API) and Node.js environments.
 */
export async function computeFileHash(arrayBuffer) {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } else {
    // Node.js dynamic import for test runners
    const { createHash } = await import('crypto');
    const hash = createHash('sha256');
    hash.update(Buffer.from(arrayBuffer));
    return hash.digest('hex');
  }
}

/**
 * Identify duplicate files based on content hash.
 * Returns an array of file objects augmented with `isDuplicate` and `duplicateGroup`.
 */
export function markDuplicateFiles(files) {
  const hashCounts = {};
  for (const f of files) {
    if (f.hash) {
      hashCounts[f.hash] = (hashCounts[f.hash] || 0) + 1;
    }
  }

  return files.map(file => {
    const isDuplicate = Boolean(file.hash && hashCounts[file.hash] > 1);
    return {
      ...file,
      isDuplicate,
    };
  });
}
