import { useState } from 'react'
import { useImageUpload } from '../../hooks/useImageUpload'
import { displayName } from '../../utils/treeBuilder'
import styles from './AddMemberForm.module.css'

export default function AddMemberForm({
  relatedMember,
  relationType, // 'child' | 'spouse' | 'root'
  members,
  onSubmit,
  onClose,
}) {
  const { upload, uploading } = useImageUpload()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    firstname: '',
    lastName: relatedMember?.lastName || '',
    bio: '',
    birthDate: '',
    deathDate: '',
    gender: '',
    photoUrl: '',
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.firstname.trim()) return
    setSaving(true)

    try {
      const memberData = {
        firstname: form.firstname.trim(),
        lastName: form.lastName.trim(),
        bio: form.bio || null,
        birthDate: form.birthDate || null,
        deathDate: form.deathDate || null,
        gender: form.gender || null,
        photoUrl: form.photoUrl || null,
        parentIds: [],
        spouseId: null,
      }

      if (relationType === 'child' && relatedMember) {
        // This new member is a child of relatedMember (and their spouse)
        memberData.parentIds = [relatedMember.id]
        if (relatedMember.spouseId) {
          memberData.parentIds.push(relatedMember.spouseId)
        }
      }

      if (relationType === 'spouse' && relatedMember) {
        memberData.spouseId = relatedMember.id
      }

      await onSubmit(memberData, relatedMember, relationType)
      onClose()
    } catch (err) {
      console.error('Error adding member:', err)
    } finally {
      setSaving(false)
    }
  }

  const getTitle = () => {
    if (relationType === 'spouse' && relatedMember) {
      return `Add Spouse for ${displayName(relatedMember)}`
    }
    if (relationType === 'child' && relatedMember) {
      return `Add Child of ${displayName(relatedMember)}`
    }
    return 'Add Family Member'
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose}>
          &times;
        </button>

        <h3 className={styles.title}>{getTitle()}</h3>

        <form onSubmit={handleSubmit}>
          <div className={styles.photoEdit}>
            {form.photoUrl ? (
              <img src={form.photoUrl} alt="Preview" className={styles.photoSmall} />
            ) : (
              <div className={styles.photoPlaceholder}>👤</div>
            )}
            <label className={styles.uploadLabel}>
              {uploading ? 'Uploading...' : 'Add Photo'}
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
              <label>First Name *</label>
              <input
                value={form.firstname}
                onChange={(e) => handleChange('firstname', e.target.value)}
                required
                autoFocus
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
              placeholder="A short biography..."
            />
          </div>

          <div className={styles.formActions}>
            <button
              type="submit"
              className={styles.submitBtn}
              disabled={saving || uploading || !form.firstname.trim()}
            >
              {saving ? 'Adding...' : 'Add Member'}
            </button>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={onClose}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
