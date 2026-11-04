// Inspect immutable revision links without deciding which conflicting version wins.
export function analyzeHistory(revisions) {
  if (!Array.isArray(revisions) || revisions.length > 100000) throw new Error('Invalid history');
  const nodes = new Map();
  for (const revision of revisions) {
    if (!revision || typeof revision.id !== 'string' || !revision.id || revision.id.length > 128 ||
        !(revision.parent === null || (typeof revision.parent === 'string' && revision.parent && revision.parent.length <= 128)) ||
        nodes.has(revision.id)) throw new Error('Invalid revision');
    nodes.set(revision.id, revision.parent);
  }
  const referenced = new Set();
  const missing = new Set();
  for (const parent of nodes.values()) {
    if (parent !== null) {
      referenced.add(parent);
      if (!nodes.has(parent)) missing.add(parent);
    }
  }
  const complete = new Set();
  for (const start of nodes.keys()) {
    const path = new Set();
    let current = start;
    while (current !== null && nodes.has(current) && !complete.has(current)) {
      if (path.has(current)) throw new Error('Cyclic history');
      path.add(current);
      current = nodes.get(current);
    }
    for (const id of path) complete.add(id);
  }
  const heads = [...nodes.keys()].filter(id => !referenced.has(id)).sort();
  const missingList = [...missing].sort();
  return {heads, missing: missingList, conflict: heads.length > 1 || missingList.length > 0};
}
