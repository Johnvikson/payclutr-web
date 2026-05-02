import { useEffect, useRef, useState } from 'react'

const GOOGLE_SCRIPT_ID = 'google-identity-services'
const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID

function loadGoogleScript() {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) {
      resolve()
      return
    }
    const existing = document.getElementById(GOOGLE_SCRIPT_ID)
    if (existing) {
      existing.addEventListener('load', resolve, { once: true })
      existing.addEventListener('error', reject, { once: true })
      return
    }
    const script = document.createElement('script')
    script.id = GOOGLE_SCRIPT_ID
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = resolve
    script.onerror = reject
    document.head.appendChild(script)
  })
}

export default function GoogleAuthButton({ text = 'signin_with', onCredential, disabled = false }) {
  const buttonRef = useRef(null)
  const callbackRef = useRef(onCredential)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    callbackRef.current = onCredential
  }, [onCredential])

  useEffect(() => {
    let cancelled = false
    if (!clientId || disabled) return undefined

    loadGoogleScript()
      .then(() => {
        if (cancelled || !buttonRef.current) return
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => callbackRef.current?.(response.credential),
        })
        buttonRef.current.innerHTML = ''
        window.google.accounts.id.renderButton(buttonRef.current, {
          theme: 'outline',
          size: 'large',
          type: 'standard',
          shape: 'rectangular',
          text,
          width: buttonRef.current.offsetWidth || 320,
        })
        setReady(true)
      })
      .catch(() => setReady(false))

    return () => {
      cancelled = true
    }
  }, [disabled, text])

  if (!clientId) {
    return (
      <button
        type="button"
        disabled
        title="Set VITE_GOOGLE_CLIENT_ID to enable Google sign-in"
        className="w-full h-11 rounded-lg border border-gray-200 bg-white text-gray-400 flex items-center justify-center text-sm font-medium cursor-not-allowed"
      >
        Google sign-in unavailable
      </button>
    )
  }

  return (
    <div className={`w-full min-h-11 ${disabled ? 'pointer-events-none opacity-60' : ''}`}>
      <div ref={buttonRef} className="w-full flex justify-center" />
      {!ready && (
        <button
          type="button"
          disabled
          className="w-full h-11 rounded-lg border border-gray-200 bg-white text-gray-400 flex items-center justify-center text-sm font-medium cursor-wait"
        >
          Loading Google...
        </button>
      )}
    </div>
  )
}
