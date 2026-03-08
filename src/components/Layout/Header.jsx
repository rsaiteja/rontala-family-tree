import LoginButton from '../Auth/LoginButton'
import styles from './Header.module.css'

export default function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.brand}>
        <svg viewBox="0 0 32 32" width="28" height="28" className={styles.logo}>
          <circle cx="16" cy="8" r="5" fill="#4a7c59" />
          <circle cx="8" cy="22" r="3.5" fill="#6b9e7a" />
          <circle cx="24" cy="22" r="3.5" fill="#6b9e7a" />
          <line x1="16" y1="13" x2="8" y2="18.5" stroke="#3d6b4a" strokeWidth="1.5" />
          <line x1="16" y1="13" x2="24" y2="18.5" stroke="#3d6b4a" strokeWidth="1.5" />
        </svg>
        <h1 className={styles.title}>Rontala Family Tree</h1>
      </div>
      <LoginButton />
    </header>
  )
}
