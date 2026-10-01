const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:4000';

class APIClient {
  constructor() {
    this.token = localStorage.getItem('ncc_token');
  }

  setToken(token) {
    this.token = token;
    localStorage.setItem('ncc_token', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('ncc_token');
  }

  getHeaders() {
    return {
      'Content-Type': 'application/json',
      ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
    };
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: this.getHeaders(),
    });

    if (response.status === 401) {
      this.clearToken();
      window.location.href = '/';
      throw new Error('Session expired');
    }

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'API error');
    return data;
  }

  async get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }

  async post(endpoint, body) {
    return this.request(endpoint, { method: 'POST', body: JSON.stringify(body) });
  }

  async put(endpoint, body) {
    return this.request(endpoint, { method: 'PUT', body: JSON.stringify(body) });
  }

  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }

  // Auth
  async login(user, password, regNo, name) {
    const response = await this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ user, password, regNo, name }),
    });
    this.setToken(response.token);
    return response.user;
  }

  async register(name, role, password, regNo) {
    return this.post('/api/auth/register', { name, role, password, regNo });
  }

  // Dashboard
  async getDashboard() {
    return this.get('/api/dashboard');
  }

  // Settings
  async getSettings() {
    return this.get('/api/settings');
  }

  async updateSettings(settings) {
    return this.put('/api/settings', settings);
  }

  async getBackup() {
    return this.get('/api/backup');
  }

  async importBackup(backup) {
    return this.post('/api/settings/import', backup);
  }

  // Cadets
  async getCadets() {
    return this.get('/api/cadets');
  }

  async createCadet(data) {
    return this.post('/api/cadets', data);
  }

  async updateCadet(id, data) {
    return this.put(`/api/cadets/${id}`, data);
  }

  async deleteCadet(id) {
    return this.delete(`/api/cadets/${id}`);
  }

  // NR
  async getNRs() {
    return this.get('/api/nrs');
  }

  async createNR(data) {
    return this.post('/api/nrs', data);
  }

  // Letters
  async getLetters() {
    return this.get('/api/letters');
  }

  async createLetter(data) {
    return this.post('/api/letters', data);
  }

  // Attendance
  async getAttendance() {
    return this.get('/api/attendance');
  }

  async createAttendance(data) {
    return this.post('/api/attendance', data);
  }

  // Volunteer
  async getVolunteer() {
    return this.get('/api/volunteer');
  }

  async createVolunteer(data) {
    return this.post('/api/volunteer', data);
  }

  // Finance
  async getFinance() {
    return this.get('/api/finance');
  }

  async createFinance(data) {
    return this.post('/api/finance', data);
  }

  // Drive
  async getDrive() {
    return this.get('/api/drive');
  }

  async createDrive(data) {
    return this.post('/api/drive', data);
  }

  // Activity
  async getActivity() {
    return this.get('/api/activity');
  }

  // Users (Admin)
  async getUsers() {
    return this.get('/api/users');
  }

  async deleteUser(id) {
    return this.delete(`/api/users/${id}`);
  }

  async resetDemo() {
    return this.post('/api/admin/reset-demo', {});
  }
}

const api = new APIClient();
window.api = api;

export default api;
