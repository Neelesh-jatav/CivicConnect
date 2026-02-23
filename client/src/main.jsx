import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import axios from 'axios'
import './index.css'
import App from './App.jsx'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5002').replace(/\/+$/, '')

const rewriteApiUrl = (url) => {
  if (typeof url !== 'string') return url
  return url.replace(/^http:\/\/localhost:5002/i, API_BASE_URL)
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
  if (typeof input === 'string') {
    return nativeFetch(rewriteApiUrl(input), init)
  }

  if (input instanceof Request) {
    const nextUrl = rewriteApiUrl(input.url)
    if (nextUrl !== input.url) {
      return nativeFetch(new Request(nextUrl, input), init)
    }
  }

  return nativeFetch(input, init)
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
