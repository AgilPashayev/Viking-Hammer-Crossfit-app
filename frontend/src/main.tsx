import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles.css'
// Import debug utilities to make them available in console
import './debug-utils'

const container = document.getElementById('root')!
createRoot(container).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
