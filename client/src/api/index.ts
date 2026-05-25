import axios from 'axios'

const api = axios.create({ baseURL: '/api', withCredentials: true })

api.interceptors.response.use(
  res => res,
  err => {
    const url: string = err.config?.url ?? ''
    if (err.response?.status === 401 && !url.includes('/auth/')) {
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api
