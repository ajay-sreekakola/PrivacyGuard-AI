import axios from 'axios';

const api = {
  scan: {
    analyze: (data) => axios.post('/api/scan/analyze', data),
    history: (params) => axios.get('/api/scan/history', { params }),
    get: (id) => axios.get(`/api/scan/${id}`),
    delete: (id) => axios.delete(`/api/scan/${id}`)
  },
  redact: {
    safePrompt: (data) => axios.post('/api/redact/safe-prompt', data),
    batch: (data) => axios.post('/api/redact/batch', data)
  },
  dashboard: {
    stats: () => axios.get('/api/dashboard/stats')
  },
  audit: {
    logs: (params) => axios.get('/api/audit', { params })
  },
  policies: {
    list: () => axios.get('/api/policies'),
    create: (data) => axios.post('/api/policies', data),
    update: (id, data) => axios.patch(`/api/policies/${id}`, data),
    delete: (id) => axios.delete(`/api/policies/${id}`),
    getDefault: (sector) => axios.get(`/api/policies/defaults/${sector}`)
  },
  compliance: {
    forScan: (id) => axios.get(`/api/compliance/scan/${id}`),
    aggregate: (data) => axios.post('/api/compliance/aggregate', data)
  },
  embedding: {
    protect: (data) => axios.post('/api/embedding/protect', data),
    analyzeChunks: (chunks) => axios.post('/api/embedding/analyze-chunks', { chunks }),
    pseudonymize: (text, aggressiveness) => axios.post('/api/embedding/pseudonymize', { text, aggressiveness })
  },
  nlp: {
    entities: (text) => axios.post('/api/nlp/entities', { text })
  },
  settings: {
    getProfile: () => axios.get('/api/settings/profile'),
    updateProfile: (data) => axios.patch('/api/settings/profile', data),
    changePassword: (data) => axios.post('/api/settings/change-password', data),
    generateApiKey: () => axios.post('/api/settings/api-key'),
    revokeApiKey: () => axios.delete('/api/settings/api-key'),
    deleteAccount: (password) => axios.delete('/api/settings/account', { data: { password } })
  }
};

export default api;
