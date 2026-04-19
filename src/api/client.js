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
    return Promise.reject(error.response?.data || error)
  }
)

export default client
