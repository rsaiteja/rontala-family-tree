import { useState, useEffect } from 'react'
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../config/firebase'

const COLLECTION = 'members'

export function useMembers() {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const colRef = collection(db, COLLECTION)
    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        const data = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }))
        setMembers(data)
        setLoading(false)
      },
      (err) => {
        console.error('Firestore error:', err)
        setError(err.message)
        setLoading(false)
      }
    )
    return unsubscribe
  }, [])

  const addMember = async (data) => {
    const colRef = collection(db, COLLECTION)
    const docRef = await addDoc(colRef, {
      firstName: data.firstName || '',
      lastName: data.lastName || '',
      bio: data.bio || null,
      birthDate: data.birthDate || null,
      deathDate: data.deathDate || null,
      gender: data.gender || null,
      parentIds: data.parentIds || [],
      spouseId: data.spouseId || null,
      photoUrl: data.photoUrl || null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    return docRef.id
  }

  const updateMember = async (id, data) => {
    const docRef = doc(db, COLLECTION, id)
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    })
  }

  const deleteMember = async (id) => {
    const docRef = doc(db, COLLECTION, id)
    await deleteDoc(docRef)
  }

  return { members, loading, error, addMember, updateMember, deleteMember }
}
