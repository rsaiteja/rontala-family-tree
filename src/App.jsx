import { useState, useCallback } from 'react'
import { AuthProvider } from './contexts/AuthContext'
import { useMembers } from './hooks/useMembers'
import Header from './components/Layout/Header'
import FamilyTree from './components/FamilyTree/FamilyTree'
import MemberModal from './components/MemberModal/MemberModal'
import AddMemberForm from './components/AddMemberForm/AddMemberForm'

function AppContent() {
  const { members, loading, error, addMember, updateMember, deleteMember } =
    useMembers()
  const [selectedMember, setSelectedMember] = useState(null)
  const [addContext, setAddContext] = useState(null) // { relatedMember, relationType }

  const handleSelectMember = useCallback((member) => {
    setSelectedMember(member)
  }, [])

  const handleAddMember = useCallback((relatedMember, relationType) => {
    setAddContext({ relatedMember, relationType })
  }, [])

  const handleSubmitNewMember = useCallback(
    async (memberData, relatedMember, relationType) => {
      const newId = await addMember(memberData)

      // If adding a spouse, update the related member's spouseId
      if (relationType === 'spouse' && relatedMember) {
        await updateMember(relatedMember.id, { spouseId: newId })
      }
    },
    [addMember, updateMember]
  )

  if (loading) {
    return (
      <>
        <Header />
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: 'calc(100vh - 64px)',
            color: 'var(--text-muted, #8b7e6a)',
            background: 'var(--bg, #f5f2ed)',
          }}
        >
          Loading family tree...
        </div>
      </>
    )
  }

  if (error) {
    return (
      <>
        <Header />
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: 'calc(100vh - 64px)',
            color: '#c0392b',
            background: 'var(--bg, #f5f2ed)',
          }}
        >
          Error loading data: {error}
        </div>
      </>
    )
  }

  return (
    <>
      <Header />
      <FamilyTree
        members={members}
        onSelectMember={handleSelectMember}
        onAddMember={handleAddMember}
      />

      {selectedMember && (
        <MemberModal
          member={selectedMember}
          members={members}
          onClose={() => setSelectedMember(null)}
          onUpdate={updateMember}
          onDelete={deleteMember}
        />
      )}

      {addContext && (
        <AddMemberForm
          relatedMember={addContext.relatedMember}
          relationType={addContext.relationType}
          members={members}
          onSubmit={handleSubmitNewMember}
          onClose={() => setAddContext(null)}
        />
      )}
    </>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}
