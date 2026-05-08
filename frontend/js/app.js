
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('access_token');
    const userRole = localStorage.getItem('user_role');
    const username = localStorage.getItem('username');

    if (!token) {
        window.location.href = 'login.html';
        return;
    }
    document.getElementById('userName').textContent = username;
    document.getElementById('userRole').textContent = userRole;

    if (userRole === 'Admin') {
        document.getElementById('createProjectBtn').classList.remove('hidden');
        document.getElementById('createTaskBtn').classList.remove('hidden');
    }
    loadDashboard();
    loadProjects();
    loadTasks();
    loadDropdowns();
    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.clear();
        window.location.href = 'login.html';
    });

    document.getElementById('createProjectBtn').addEventListener('click', () => {
        document.getElementById('projectModal').classList.add('active');
    });

    document.getElementById('createTaskBtn').addEventListener('click', () => {
        document.getElementById('taskModal').classList.add('active');
    });

    document.getElementById('projectForm').addEventListener('submit', handleProjectSubmit);
    document.getElementById('taskForm').addEventListener('submit', handleTaskSubmit);
});

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

async function loadDashboard() {
    try {
        const stats = await ApiService.getDashboard();
        const statCards = document.querySelectorAll('.stat-value');
        statCards[0].textContent = stats.total_tasks;
        statCards[1].textContent = stats.in_progress_tasks;
        statCards[2].textContent = stats.completed_tasks;
        statCards[3].textContent = stats.overdue_tasks;
        if (stats.overdue_tasks > 0) statCards[3].style.color = 'var(--danger)';
    } catch (e) {
        console.error('Failed to load dashboard:', e);
    }
}

async function loadProjects() {
    try {
        const projects = await ApiService.getProjects();
        const list = document.getElementById('projectsList');

        if (projects.length === 0) {
            list.innerHTML = '<p style="color: var(--text-muted)">No projects found.</p>';
            return;
        }

        list.innerHTML = projects.map(p => `
            <div class="card" style="padding: 1rem;">
                <h3 style="margin-bottom: 0.5rem; color: #818CF8;">${p.name}</h3>
                <p style="font-size: 0.875rem; color: var(--text-muted)">${p.description || 'No description'}</p>
                <div style="margin-top: 1rem; font-size: 0.75rem; color: var(--text-muted)">
                    By: ${p.created_by_name} | Tasks: ${p.tasks.length}
                </div>
            </div>
        `).join('');
    } catch (e) {
        console.error('Failed to load projects:', e);
    }
}

async function loadTasks() {
    try {
        const tasks = await ApiService.getTasks();
        const list = document.getElementById('tasksList');
        const userRole = localStorage.getItem('user_role');
        const currentUsername = localStorage.getItem('username');

        if (tasks.length === 0) {
            list.innerHTML = '<p style="padding: 1.5rem; color: var(--text-muted)">No tasks found.</p>';
            return;
        }

        list.innerHTML = tasks.map(t => {
            let badgeClass = 'badge-pending';
            if (t.status === 'In Progress') badgeClass = 'badge-progress';
            if (t.status === 'Completed') badgeClass = 'badge-completed';


            const canUpdate = userRole === 'Admin' || t.assigned_to_name === currentUsername;

            let statusSelect = '';
            if (canUpdate) {
                statusSelect = `
                    <select onchange="updateTaskStatus(${t.id}, this.value)" class="form-control" style="width: 130px; padding: 0.25rem; font-size: 0.75rem;">
                        <option value="Pending" ${t.status === 'Pending' ? 'selected' : ''}>Pending</option>
                        <option value="In Progress" ${t.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
                        <option value="Completed" ${t.status === 'Completed' ? 'selected' : ''}>Completed</option>
                    </select>
                `;
            } else {
                statusSelect = `<span class="badge ${badgeClass}">${t.status}</span>`;
            }

            return `
                <div class="task-item">
                    <div>
                        <div style="font-weight: 500;">${t.title}</div>
                        <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.25rem;">
                            Due: ${t.due_date || 'N/A'} | Assignee: ${t.assigned_to_name || 'Unassigned'}
                        </div>
                    </div>
                    <div>${statusSelect}</div>
                </div>
            `;
        }).join('');
    } catch (e) {
        console.error('Failed to load tasks:', e);
    }
}

async function loadDropdowns() {
    if (localStorage.getItem('user_role') !== 'Admin') return;

    try {
        const [projects, users] = await Promise.all([
            ApiService.getProjects(),
            ApiService.getUsers()
        ]);

        const projectSelect = document.getElementById('taskProject');
        projectSelect.innerHTML = projects.map(p => `<option value="${p.id}">${p.name}</option>`).join('');

        const assigneeSelect = document.getElementById('taskAssignee');
        assigneeSelect.innerHTML = users.map(u => `<option value="${u.id}">${u.username} (${u.role})</option>`).join('');
    } catch (e) {
        console.error('Failed to load dropdowns:', e);
    }
}

async function handleProjectSubmit(e) {
    e.preventDefault();
    const data = {
        name: document.getElementById('projName').value,
        description: document.getElementById('projDesc').value
    };

    try {
        await ApiService.createProject(data);
        closeModal('projectModal');
        document.getElementById('projectForm').reset();
        loadProjects();
        loadDropdowns();
    } catch (error) {
        alert('Failed to create project: ' + error.message);
    }
}

async function handleTaskSubmit(e) {
    e.preventDefault();
    const data = {
        title: document.getElementById('taskTitle').value,
        project: document.getElementById('taskProject').value,
        assigned_to: document.getElementById('taskAssignee').value,
        due_date: document.getElementById('taskDue').value,
        status: 'Pending'
    };

    try {
        await ApiService.createTask(data);
        closeModal('taskModal');
        document.getElementById('taskForm').reset();
        loadTasks();
        loadDashboard();
    } catch (error) {
        alert('Failed to create task: ' + error.message);
    }
}

async function updateTaskStatus(taskId, status) {
    try {
        await ApiService.updateTaskStatus(taskId, status);
        loadDashboard();
        loadTasks();
    } catch (e) {
        alert('Failed to update status');
    }
}
