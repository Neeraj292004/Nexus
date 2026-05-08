const API_URL = 'http://127.0.0.1:8080/api';

class ApiService {
    static getHeaders() {
        const token = localStorage.getItem('access_token');
        return {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        };
    }

    static async request(endpoint, options = {}) {
        const url = `${API_URL}${endpoint}`;
        const headers = this.getHeaders();
        
        try {
            const response = await fetch(url, { ...options, headers });
            
            if (response.status === 401 && !endpoint.includes('auth/')) {
                // Token expired or invalid
                localStorage.removeItem('access_token');
                window.location.href = 'login.html';
                return;
            }

            const data = response.status !== 204 ? await response.json() : null;
            
            if (!response.ok) {
                let errorMsg = data.detail || data.non_field_errors;
                if (!errorMsg) {
                    errorMsg = typeof data === 'object' ? JSON.stringify(data) : 'An error occurred';
                }
                throw new Error(errorMsg);
            }
            
            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    static async login(username, password) {
        const data = await this.request('/auth/login/', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
        localStorage.setItem('access_token', data.access);
        localStorage.setItem('refresh_token', data.refresh);
        return data;
    }

    static async signup(userData) {
        return this.request('/auth/signup/', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    }

    static async getDashboard() {
        return this.request('/dashboard/');
    }

    static async getProjects() {
        return this.request('/projects/');
    }

    static async createProject(data) {
        return this.request('/projects/', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    static async getTasks() {
        return this.request('/tasks/');
    }

    static async createTask(data) {
        return this.request('/tasks/', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    static async updateTaskStatus(taskId, status) {
        return this.request(`/tasks/${taskId}/`, {
            method: 'PATCH',
            body: JSON.stringify({ status })
        });
    }

    static async getUsers() {
        return this.request('/users/');
    }
}
