/**
 * Compute SHA-256 hash of an ArrayBuffer or Uint8Array.
 * Uses globalThis.crypto.subtle standard Web Crypto across browsers and modern Node.
 */
export async function computeFileHash(arrayBuffer) {
  const buffer = arrayBuffer instanceof Uint8Array ? arrayBuffer : new Uint8Array(arrayBuffer);
  const hashBuffer = await globalThis.crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Identify duplicate files based on content hash.
 * Returns an array of file objects augmented with `isDuplicate`.
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
