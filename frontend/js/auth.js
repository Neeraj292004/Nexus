document.addEventListener('DOMContentLoaded', () => {
    // Check if already logged in
    if (localStorage.getItem('access_token')) {
        window.location.href = 'index.html';
        return;
    }

    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const showSignup = document.getElementById('showSignup');
    const showLogin = document.getElementById('showLogin');

    // Toggle forms
    showSignup.addEventListener('click', (e) => {
        e.preventDefault();
        loginForm.classList.add('hidden');
        signupForm.classList.remove('hidden');
    });

    showLogin.addEventListener('click', (e) => {
        e.preventDefault();
        signupForm.classList.add('hidden');
        loginForm.classList.remove('hidden');
    });

    // Login Logic
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const errorDiv = document.getElementById('loginError');
        errorDiv.style.display = 'none';

        try {
            const username = document.getElementById('loginUsername').value;
            const password = document.getElementById('loginPassword').value;
            
            await ApiService.login(username, password);
            
            // Get user info and role to store
            // Since we need role in frontend and SimpleJWT doesn't return user obj by default,
            // we could either decode the token, customize the token view, or fetch users.
            // Let's just fetch /api/users/ and find current user
            const users = await ApiService.getUsers();
            const me = users.find(u => u.username === username);
            if (me) {
                localStorage.setItem('user_role', me.role);
                localStorage.setItem('username', me.username);
                localStorage.setItem('user_id', me.id);
            }
            
            window.location.href = 'index.html';
        } catch (error) {
            errorDiv.textContent = error.message;
            errorDiv.style.display = 'block';
        }
    });

    // Signup Logic
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const errorDiv = document.getElementById('signupError');
        errorDiv.style.display = 'none';

        try {
            const data = {
                username: document.getElementById('signupUsername').value,
                email: document.getElementById('signupEmail').value,
                password: document.getElementById('signupPassword').value,
                role: document.getElementById('signupRole').value
            };
            
            await ApiService.signup(data);
            
            // Auto login after signup
            await ApiService.login(data.username, data.password);
            
            localStorage.setItem('user_role', data.role);
            localStorage.setItem('username', data.username);
            
            window.location.href = 'index.html';
        } catch (error) {
            errorDiv.textContent = error.message || 'Signup failed. Username might be taken.';
            errorDiv.style.display = 'block';
        }
    });
});
