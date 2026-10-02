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

  getAuthHeader() {
    return this.token ? { Authorization: `Bearer ${this.token}` } : {};
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...this.getAuthHeader(),
      ...options.headers,
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (response.status === 401) {
        this.clearToken();
        window.location.href = '/login';
        return null;
      }

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Auth
  async login(user, password, regNo = null, name = null) {
    const data = await this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ user, password, regNo, name }),
    });
    if (data?.token) this.setToken(data.token);
    return data;
  }

  async register(name, role, password, regNo = null) {
    return this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, role, password, regNo }),
    });
  }

  // Dashboard
  async getDashboard() {
    return this.request('/api/dashboard');
  }

  // Settings
  async getSettings() {
    return this.request('/api/settings');
  }

  async updateSettings(settings) {
    return this.request('/api/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  async importSettings(backup) {
    return this.request('/api/settings/import', {
      method: 'POST',
      body: JSON.stringify(backup),
    });
  }

  async getBackup() {
    return this.request('/api/backup');
  }

  // Cadets
  async getCadets() {
    return this.request('/api/cadets');
  }

  async createCadet(cadet) {
    return this.request('/api/cadets', {
      method: 'POST',
      body: JSON.stringify(cadet),
    });
  }

  async updateCadet(id, cadet) {
    return this.request(`/api/cadets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(cadet),
    });
  }

  async deleteCadet(id) {
    return this.request(`/api/cadets/${id}`, {
      method: 'DELETE',
    });
  }

  // NRs
  async getNRs() {
    return this.request('/api/nrs');
  }

  async createNR(nr) {
    return this.request('/api/nrs', {
      method: 'POST',
      body: JSON.stringify(nr),
    });
  }

  // Letters
  async getLetters() {
    return this.request('/api/letters');
  }

  async createLetter(letter) {
    return this.request('/api/letters', {
      method: 'POST',
      body: JSON.stringify(letter),
    });
  }

  // Attendance
  async getAttendance() {
    return this.request('/api/attendance');
  }

  async createAttendance(attendance) {
    return this.request('/api/attendance', {
      method: 'POST',
      body: JSON.stringify(attendance),
    });
  }

  // Volunteer
  async getVolunteer() {
    return this.request('/api/volunteer');
  }

  async createVolunteer(volunteer) {
    return this.request('/api/volunteer', {
      method: 'POST',
      body: JSON.stringify(volunteer),
    });
  }

  // Finance
  async getFinance() {
    return this.request('/api/finance');
  }

  async createFinance(finance) {
    return this.request('/api/finance', {
      method: 'POST',
      body: JSON.stringify(finance),
    });
  }

  // Drive
  async getDrive() {
    return this.request('/api/drive');
  }

  async createDriveItem(item) {
    return this.request('/api/drive', {
      method: 'POST',
      body: JSON.stringify(item),
    });
  }

  // Activity
  async getActivity() {
    return this.request('/api/activity');
  }

  // Users
  async getUsers() {
    return this.request('/api/users');
  }

  async deleteUser(id) {
    return this.request(`/api/users/${id}`, {
      method: 'DELETE',
    });
  }

  // Admin
  async resetDemo() {
    return this.request('/api/admin/reset-demo', {
      method: 'POST',
    });
  }
}

const api = new APIClient();

export default api;
