import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyDhciIgqa9cfLpQ-iOuLYyCCcIvfTDnBxY",
  authDomain: "rontala-family-tree.firebaseapp.com",
  databaseURL: "https://rontala-family-tree-default-rtdb.firebaseio.com",
  projectId: "rontala-family-tree",
  storageBucket: "rontala-family-tree.firebasestorage.app",
  messagingSenderId: "1009228032785",
  appId: "1:1009228032785:web:c39ea1f96bc4a2df287ab0"
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()
export const db = getFirestore(app)
