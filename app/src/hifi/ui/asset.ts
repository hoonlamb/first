/** Resolve a public asset path (photos/…) or pass through data:/http URLs. */
export const asset = (p: string) => (p.startsWith('data:') || p.startsWith('http') ? p : `./${p}`)
