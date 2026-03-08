import { useState } from 'react'
import { uploadImage } from '../utils/cloudinary'

export function useImageUpload() {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)

  const upload = async (file) => {
    setUploading(true)
    setError(null)
    try {
      const url = await uploadImage(file)
      return url
    } catch (err) {
      setError(err.message)
      return null
    } finally {
      setUploading(false)
    }
  }

  return { upload, uploading, error }
}
