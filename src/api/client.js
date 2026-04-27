import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://payclutr-api.onrender.com/api'

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('payclutr_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

client.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('payclutr_token')
      localStorage.removeItem('payclutr_user')
      window.location.href = '/login'
    }

    // Normalize the rejected value so BOTH access patterns work:
    //   err.detail              (top-level — preferred)
    //   err.response.data.detail (axios-classic)
    //   err.message             (network / unknown errors)
    const body = error.response?.data
    if (body && typeof body === 'object') {
      const enhanced = {
        ...body,
        response: { data: body, status: error.response?.status },
        status:   error.response?.status,
        message:  body.detail || body.message || error.message,
      }
      return Promise.reject(enhanced)
    }
    return Promise.reject(error)
  }
)

export default client
