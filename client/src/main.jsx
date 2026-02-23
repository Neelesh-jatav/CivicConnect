import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import axios from 'axios'
import './index.css'
import App from './App.jsx'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5002').replace(/\/+$/, '')

console.log('🌐 API_BASE_URL configured as:', API_BASE_URL)
console.log('📍 Environment:', import.meta.env.MODE)

const rewriteApiUrl = (url) => {
  if (typeof url !== 'string') return url
  // Handle both http:// and https:// localhost URLs
  const rewritten = url.replace(/^https?:\/\/localhost:5002/i, API_BASE_URL)
  if (rewritten !== url) {
    console.log('🔄 URL rewritten:', { original: url, rewritten })
  }
  return rewritten
}

axios.interceptors.request.use((config) => {
  if (config.url) {
    config.url = rewriteApiUrl(config.url)
  }
  if (typeof config.withCredentials === 'undefined') {
    config.withCredentials = true
  }
  return config
})

const nativeFetch = window.fetch.bind(window)
window.fetch = (input, init) => {
  // Ensure credentials are always sent for cross-domain requests
  const finalInit = {
    ...init,
    credentials: 'include', // Send cookies with every request
  }

  if (typeof input === 'string') {
    return nativeFetch(rewriteApiUrl(input), finalInit)
  }

  if (input instanceof Request) {
    const nextUrl = rewriteApiUrl(input.url)
    if (nextUrl !== input.url) {
      return nativeFetch(new Request(nextUrl, input), finalInit)
    }
  }

  return nativeFetch(input, finalInit)
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
