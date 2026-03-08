import { useRef, useEffect, useState, useCallback } from 'react'
import { tree as d3tree, hierarchy } from 'd3-hierarchy'
import { select } from 'd3-selection'
import { zoom as d3zoom, zoomIdentity } from 'd3-zoom'
import { linkVertical } from 'd3-shape'
import { buildTree, displayName, lifeSpan } from '../../utils/treeBuilder'
import { useAuth } from '../../contexts/AuthContext'
import styles from './FamilyTree.module.css'

const NODE_WIDTH = 180
const NODE_HEIGHT = 260
const COUPLE_GAP = 40
const LEVEL_HEIGHT = 300

export default function FamilyTree({ members, onSelectMember, onAddMember }) {
  const svgRef = useRef(null)
  const gRef = useRef(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const { user } = useAuth()

  // Track window resize
  useEffect(() => {
    const update = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight - 64,
      })
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  // Set up zoom
  useEffect(() => {
    if (!svgRef.current) return
    const svg = select(svgRef.current)
    const g = select(gRef.current)

    const zoomBehavior = d3zoom()
      .scaleExtent([0.1, 3])
      .on('zoom', (event) => {
        g.attr('transform', event.transform)
      })

    svg.call(zoomBehavior)

    // Initial centering
    const initialTransform = zoomIdentity
      .translate(dimensions.width / 2, 80)
      .scale(0.75)
    svg.call(zoomBehavior.transform, initialTransform)
  }, [dimensions.width, dimensions.height, members])

  const treeRoot = buildTree(members)

  if (!treeRoot) {
    return (
      <div className={styles.empty}>
        <div className={styles.emptyContent}>
          <h2>No family members yet</h2>
          <p>Sign in and add the first member to start your family tree.</p>
          {user && (
            <button
              className={styles.addFirstBtn}
              onClick={() => onAddMember(null, 'root')}
            >
              + Add First Member
            </button>
          )}
        </div>
      </div>
    )
  }

  // Convert to d3 hierarchy
  const root = hierarchy(treeRoot, (d) => (d.children && d.children.length > 0 ? d.children : null))

  // Create tree layout
  const treeLayout = d3tree().nodeSize([NODE_WIDTH + COUPLE_GAP + 40, LEVEL_HEIGHT])
  treeLayout(root)

  // Collect nodes and links
  const nodes = root.descendants()
  const links = root.links()

  return (
    <div className={styles.container}>
      <svg
        ref={svgRef}
        className={styles.svg}
        width={dimensions.width}
        height={dimensions.height}
      >
        <g ref={gRef}>
          {/* Links */}
          {links.map((link, i) => {
            // Skip links from virtual root
            if (link.source.data.data.virtual) {
              return (
                <path
                  key={`link-${i}`}
                  d={`M${link.source.x},${link.source.y + 20}
                      C${link.source.x},${(link.source.y + link.target.y) / 2}
                       ${link.target.x},${(link.source.y + link.target.y) / 2}
                       ${link.target.x},${link.target.y - 40}`}
                  fill="none"
                  stroke="var(--line-color, #8b7e6a)"
                  strokeWidth="2"
                  opacity="0.6"
                />
              )
            }

            const sourceY = link.source.y + NODE_HEIGHT / 2 + 10
            const targetY = link.target.y - 40

            return (
              <path
                key={`link-${i}`}
                d={`M${link.source.x},${sourceY}
                    C${link.source.x},${(sourceY + targetY) / 2}
                     ${link.target.x},${(sourceY + targetY) / 2}
                     ${link.target.x},${targetY}`}
                fill="none"
                stroke="var(--line-color, #8b7e6a)"
                strokeWidth="2"
                opacity="0.6"
              />
            )
          })}

          {/* Nodes */}
          {nodes.map((node) => {
            const member = node.data.data
            const spouse = node.data.spouse

            if (member.virtual) return null

            return (
              <g key={member.id} transform={`translate(${node.x},${node.y})`}>
                {/* Couple connector */}
                {spouse && (
                  <line
                    x1={0}
                    y1={60}
                    x2={COUPLE_GAP + NODE_WIDTH / 2}
                    y2={60}
                    stroke="var(--line-color, #8b7e6a)"
                    strokeWidth="2"
                    opacity="0.5"
                  />
                )}

                {/* Primary member card */}
                <g
                  className={styles.nodeGroup}
                  onClick={() => onSelectMember(member)}
                  style={{ cursor: 'pointer' }}
                >
                  {/* Card background */}
                  <rect
                    x={-NODE_WIDTH / 2}
                    y={-20}
                    width={NODE_WIDTH}
                    height={NODE_HEIGHT / 2 + 60}
                    rx="12"
                    fill="var(--card-bg, #faf8f5)"
                    stroke="var(--card-border, #e0d9cf)"
                    strokeWidth="1.5"
                    className={styles.card}
                  />

                  {/* Photo circle */}
                  <clipPath id={`clip-${member.id}`}>
                    <circle cx="0" cy="30" r="40" />
                  </clipPath>
                  {member.photoUrl ? (
                    <image
                      href={member.photoUrl}
                      x="-40"
                      y="-10"
                      width="80"
                      height="80"
                      clipPath={`url(#clip-${member.id})`}
                      preserveAspectRatio="xMidYMid slice"
                    />
                  ) : (
                    <circle
                      cx="0"
                      cy="30"
                      r="40"
                      fill={member.gender === 'female' ? '#e8d5e0' : member.gender === 'male' ? '#d5dde8' : '#e0ddd5'}
                    />
                  )}
                  {!member.photoUrl && (
                    <text
                      x="0"
                      y="36"
                      textAnchor="middle"
                      fontSize="28"
                      fill="#888"
                    >
                      {member.gender === 'female' ? '👩' : member.gender === 'male' ? '👨' : '👤'}
                    </text>
                  )}

                  {/* Name */}
                  <text
                    x="0"
                    y="90"
                    textAnchor="middle"
                    className={styles.name}
                  >
                    {displayName(member)}
                  </text>

                  {/* Life span */}
                  <text
                    x="0"
                    y="110"
                    textAnchor="middle"
                    className={styles.dates}
                  >
                    {lifeSpan(member)}
                  </text>
                </g>

                {/* Spouse card */}
                {spouse && (
                  <g
                    transform={`translate(${COUPLE_GAP + NODE_WIDTH / 2}, 0)`}
                    className={styles.nodeGroup}
                    onClick={() => onSelectMember(spouse)}
                    style={{ cursor: 'pointer' }}
                  >
                    <rect
                      x={-NODE_WIDTH / 2}
                      y={-20}
                      width={NODE_WIDTH}
                      height={NODE_HEIGHT / 2 + 60}
                      rx="12"
                      fill="var(--card-bg, #faf8f5)"
                      stroke="var(--card-border, #e0d9cf)"
                      strokeWidth="1.5"
                      className={styles.card}
                    />

                    <clipPath id={`clip-${spouse.id}`}>
                      <circle cx="0" cy="30" r="40" />
                    </clipPath>
                    {spouse.photoUrl ? (
                      <image
                        href={spouse.photoUrl}
                        x="-40"
                        y="-10"
                        width="80"
                        height="80"
                        clipPath={`url(#clip-${spouse.id})`}
                        preserveAspectRatio="xMidYMid slice"
                      />
                    ) : (
                      <circle
                        cx="0"
                        cy="30"
                        r="40"
                        fill={spouse.gender === 'female' ? '#e8d5e0' : spouse.gender === 'male' ? '#d5dde8' : '#e0ddd5'}
                      />
                    )}
                    {!spouse.photoUrl && (
                      <text
                        x="0"
                        y="36"
                        textAnchor="middle"
                        fontSize="28"
                        fill="#888"
                      >
                        {spouse.gender === 'female' ? '👩' : spouse.gender === 'male' ? '👨' : '👤'}
                      </text>
                    )}

                    <text
                      x="0"
                      y="90"
                      textAnchor="middle"
                      className={styles.name}
                    >
                      {displayName(spouse)}
                    </text>

                    <text
                      x="0"
                      y="110"
                      textAnchor="middle"
                      className={styles.dates}
                    >
                      {lifeSpan(spouse)}
                    </text>
                  </g>
                )}

                {/* Add child button (authenticated only) */}
                {user && (
                  <g
                    transform={`translate(${spouse ? (COUPLE_GAP + NODE_WIDTH / 2) / 2 : 0}, ${NODE_HEIGHT / 2 + 50})`}
                    className={styles.addBtn}
                    onClick={(e) => {
                      e.stopPropagation()
                      onAddMember(member, 'child')
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    <circle r="14" fill="var(--accent, #4a7c59)" opacity="0.85" />
                    <text
                      x="0"
                      y="5"
                      textAnchor="middle"
                      fill="white"
                      fontSize="18"
                      fontWeight="bold"
                    >
                      +
                    </text>
                  </g>
                )}

                {/* Add spouse button (if no spouse and authenticated) */}
                {user && !spouse && (
                  <g
                    transform={`translate(${NODE_WIDTH / 2 + 20}, 60)`}
                    className={styles.addBtn}
                    onClick={(e) => {
                      e.stopPropagation()
                      onAddMember(member, 'spouse')
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    <circle r="12" fill="var(--accent-secondary, #7c5a4a)" opacity="0.85" />
                    <text
                      x="0"
                      y="4"
                      textAnchor="middle"
                      fill="white"
                      fontSize="14"
                      fontWeight="bold"
                    >
                      +
                    </text>
                  </g>
                )}
              </g>
            )
          })}
        </g>
      </svg>

      {/* Floating add root button */}
      {user && members.length > 0 && (
        <button
          className={styles.floatingAdd}
          onClick={() => onAddMember(null, 'root')}
          title="Add root member"
        >
          + Add Member
        </button>
      )}
    </div>
  )
}
