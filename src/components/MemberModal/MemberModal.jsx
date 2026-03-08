import { useState } from 'react'
import { displayName, lifeSpan } from '../../utils/treeBuilder'
import { useAuth } from '../../contexts/AuthContext'
import { useImageUpload } from '../../hooks/useImageUpload'
import styles from './MemberModal.module.css'

export default function MemberModal({ member, members, onClose, onUpdate, onDelete }) {
  const { user } = useAuth()
  const { upload, uploading } = useImageUpload()
  const [editing, setEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [form, setForm] = useState({
    firstName: member.firstName || '',
    lastName: member.lastName || '',
    bio: member.bio || '',
    birthDate: member.birthDate || '',
    deathDate: member.deathDate || '',
    gender: member.gender || '',
    photoUrl: member.photoUrl || '',
  })

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    const url = await upload(file)
    if (url) {
      setForm((prev) => ({ ...prev, photoUrl: url }))
    }
  }

  const handleSave = async () => {
    await onUpdate(member.id, {
      firstName: form.firstName,
      lastName: form.lastName,
      bio: form.bio || null,
      birthDate: form.birthDate || null,
      deathDate: form.deathDate || null,
      gender: form.gender || null,
      photoUrl: form.photoUrl || null,
    })
    setEditing(false)
  }

  const handleDelete = async () => {
    // Clean up spouse reference
    if (member.spouseId) {
      const spouse = members.find((m) => m.id === member.spouseId)
      if (spouse) {
        await onUpdate(spouse.id, { spouseId: null })
      }
    }
    // Clean up children's parentIds
    const children = members.filter(
      (m) => m.parentIds && m.parentIds.includes(member.id)
    )
    for (const child of children) {
      await onUpdate(child.id, {
        parentIds: child.parentIds.filter((pid) => pid !== member.id),
      })
    }
    await onDelete(member.id)
    onClose()
  }

  // Find related members
  const spouse = member.spouseId
    ? members.find((m) => m.id === member.spouseId)
    : null
  const parents = (member.parentIds || [])
    .map((pid) => members.find((m) => m.id === pid))
    .filter(Boolean)
  const children = members.filter(
    (m) => m.parentIds && m.parentIds.includes(member.id)
  )

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose}>
          &times;
        </button>

        {!editing ? (
          /* ── View Mode ── */
          <div className={styles.viewMode}>
            <div className={styles.photoSection}>
              {member.photoUrl ? (
                <img
                  src={member.photoUrl}
                  alt={displayName(member)}
                  className={styles.photo}
                />
              ) : (
                <div className={styles.photoPlaceholder}>
                  {member.gender === 'female' ? '👩' : member.gender === 'male' ? '👨' : '👤'}
                </div>
              )}
            </div>

            <h2 className={styles.memberName}>{displayName(member)}</h2>
            {lifeSpan(member) && (
              <p className={styles.lifeSpan}>{lifeSpan(member)}</p>
            )}
            {member.gender && (
              <span className={styles.genderBadge}>
                {member.gender.charAt(0).toUpperCase() + member.gender.slice(1)}
              </span>
            )}

            {member.bio && <p className={styles.bio}>{member.bio}</p>}

            {/* Relationships */}
            <div className={styles.relationships}>
              {parents.length > 0 && (
                <div className={styles.relGroup}>
                  <span className={styles.relLabel}>Parents:</span>
                  <span>{parents.map(displayName).join(' & ')}</span>
                </div>
              )}
              {spouse && (
                <div className={styles.relGroup}>
                  <span className={styles.relLabel}>Spouse:</span>
                  <span>{displayName(spouse)}</span>
                </div>
              )}
              {children.length > 0 && (
                <div className={styles.relGroup}>
                  <span className={styles.relLabel}>Children:</span>
                  <span>{children.map(displayName).join(', ')}</span>
                </div>
              )}
            </div>

            {user && (
              <div className={styles.actions}>
                <button
                  className={styles.editBtn}
                  onClick={() => setEditing(true)}
                >
                  Edit
                </button>
                {!confirmDelete ? (
                  <button
                    className={styles.deleteBtn}
                    onClick={() => setConfirmDelete(true)}
                  >
                    Delete
                  </button>
                ) : (
                  <div className={styles.confirmRow}>
                    <span>Are you sure?</span>
                    <button className={styles.confirmYes} onClick={handleDelete}>
                      Yes, delete
                    </button>
                    <button
                      className={styles.confirmNo}
                      onClick={() => setConfirmDelete(false)}
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* ── Edit Mode ── */
          <div className={styles.editMode}>
            <h3>Edit Member</h3>

            <div className={styles.photoEdit}>
              {form.photoUrl ? (
                <img src={form.photoUrl} alt="Preview" className={styles.photoSmall} />
              ) : (
                <div className={styles.photoPlaceholderSmall}>👤</div>
              )}
              <label className={styles.uploadLabel}>
                {uploading ? 'Uploading...' : 'Change Photo'}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  disabled={uploading}
                  hidden
                />
              </label>
            </div>

            <div className={styles.formGrid}>
              <div className={styles.field}>
                <label>First Name</label>
                <input
                  value={form.firstName}
                  onChange={(e) => handleChange('firstName', e.target.value)}
                />
              </div>
              <div className={styles.field}>
                <label>Last Name</label>
                <input
                  value={form.lastName}
                  onChange={(e) => handleChange('lastName', e.target.value)}
                />
              </div>
              <div className={styles.field}>
                <label>Gender</label>
                <select
                  value={form.gender}
                  onChange={(e) => handleChange('gender', e.target.value)}
                >
                  <option value="">Select...</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className={styles.field}>
                <label>Birth Date</label>
                <input
                  type="date"
                  value={form.birthDate}
                  onChange={(e) => handleChange('birthDate', e.target.value)}
                />
              </div>
              <div className={styles.field}>
                <label>Death Date</label>
                <input
                  type="date"
                  value={form.deathDate}
                  onChange={(e) => handleChange('deathDate', e.target.value)}
                />
              </div>
            </div>

            <div className={styles.field}>
              <label>Bio</label>
              <textarea
                value={form.bio}
                onChange={(e) => handleChange('bio', e.target.value)}
                rows="3"
              />
            </div>

            <div className={styles.editActions}>
              <button className={styles.saveBtn} onClick={handleSave}>
                Save Changes
              </button>
              <button
                className={styles.cancelBtn}
                onClick={() => setEditing(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
