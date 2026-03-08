/**
 * Converts flat Firestore members array into a D3-compatible hierarchy.
 *
 * Data model per member:
 *   { id, firstname, lastName, parentIds: string[], spouseId: string|null, ... }
 *
 * The tree is rooted at members that have no parents (parentIds is empty/null).
 * Spouses are attached as a `.spouse` property on the node rather than as
 * separate tree nodes — the renderer draws them side-by-side.
 *
 * Returns an object shaped for d3.hierarchy():
 *   { data: rootMember, children: [ { data, children, spouse? }, ... ], spouse? }
 *
 * If there are multiple root members with no parents, we create a virtual root
 * whose children are all the actual roots.
 */

export function buildTree(members) {
  if (!members || members.length === 0) return null

  // id → member lookup
  const byId = new Map()
  members.forEach((m) => byId.set(m.id, m))

  // Build a set of IDs that are someone's spouse — we won't give them
  // their own node in the tree; they appear as `.spouse` on their partner.
  const spouseIds = new Set()
  members.forEach((m) => {
    if (m.spouseId && byId.has(m.spouseId)) {
      spouseIds.add(m.spouseId)
    }
  })

  // parentId → children lookup  (only non-spouse members become child nodes)
  const childrenOf = new Map() // parentId → [member]
  members.forEach((m) => {
    // Skip members that are only present as a spouse attachment
    // But only skip if their spouse is NOT also a child (avoid losing people)
    if (spouseIds.has(m.id)) {
      // Check: does this member also have parents? If yes, they need their own node.
      const hasParents = m.parentIds && m.parentIds.length > 0
      if (!hasParents) return // pure spouse, skip as standalone node
    }

    if (m.parentIds && m.parentIds.length > 0) {
      m.parentIds.forEach((pid) => {
        if (!childrenOf.has(pid)) childrenOf.set(pid, [])
        childrenOf.get(pid).push(m)
      })
    }
  })

  // Find root members: those with no parentIds who are not pure-spouse-only nodes
  const roots = members.filter((m) => {
    const hasParents = m.parentIds && m.parentIds.length > 0
    if (hasParents) return false
    // If this member is only present as someone else's spouse and has no children
    // of their own, don't make them a root
    if (spouseIds.has(m.id) && !childrenOf.has(m.id)) return false
    return true
  })

  function buildNode(member) {
    const node = {
      data: member,
      children: [],
      spouse: null,
    }

    // Attach spouse
    if (member.spouseId && byId.has(member.spouseId)) {
      node.spouse = byId.get(member.spouseId)
    }

    // Gather children — children that list this member (or their spouse) as parent
    const directChildren = childrenOf.get(member.id) || []
    const spouseChildren =
      member.spouseId ? (childrenOf.get(member.spouseId) || []) : []

    // Merge & deduplicate
    const seen = new Set()
    const allChildren = []
    ;[...directChildren, ...spouseChildren].forEach((c) => {
      if (!seen.has(c.id)) {
        seen.add(c.id)
        allChildren.push(c)
      }
    })

    node.children = allChildren.map(buildNode)
    return node
  }

  if (roots.length === 0) {
    // Fallback: pick the first member as root
    return buildNode(members[0])
  }

  if (roots.length === 1) {
    return buildNode(roots[0])
  }

  // Multiple roots — create a virtual root
  return {
    data: { id: '__root__', firstname: 'Family', lastName: '', virtual: true },
    children: roots.map(buildNode),
    spouse: null,
  }
}

/**
 * Returns a display name for a member.
 */
export function displayName(member) {
  if (!member) return ''
  const first = member.firstname || ''
  const last = member.lastName || ''
  return `${first} ${last}`.trim() || 'Unknown'
}

/**
 * Formats a date string or Firestore Timestamp for display.
 */
export function formatDate(value) {
  if (!value) return ''
  // Firestore Timestamp
  if (value.toDate) {
    return value.toDate().getFullYear().toString()
  }
  // String "YYYY-MM-DD"
  if (typeof value === 'string') {
    const year = value.split('-')[0]
    return year || value
  }
  return ''
}

/**
 * Returns birth–death year string like "1950 – 2020" or "1950 –"
 */
export function lifeSpan(member) {
  const b = formatDate(member.birthDate)
  const d = formatDate(member.deathDate)
  if (!b && !d) return ''
  if (b && d) return `${b} – ${d}`
  if (b) return `b. ${b}`
  return `d. ${d}`
}
