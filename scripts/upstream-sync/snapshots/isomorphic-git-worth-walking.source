export const worthWalking = (filepath, root) => {
  if (filepath === '.' || root == null || root.length === 0 || root === '.') {
    return true
  }
  // A shared prefix only counts when it lands on a path component boundary,
  // otherwise the root 'src' would also pull in 'src2/a.js' and 'srcfoo.txt'.
  const base = root.endsWith('/') ? root.slice(0, -1) : root
  if (base === '.') {
    return true
  }
  if (base.length >= filepath.length) {
    // Keep walking while filepath is still an ancestor of the wanted root.
    return base === filepath || base.startsWith(`${filepath}/`)
  }
  return filepath.startsWith(`${base}/`)
}
