// js/auth.js - Autenticación

// Mostrar/ocultar contraseña según si es docente
const docenteToggle = document.getElementById('docente-toggle');
const passwordGroup = document.getElementById('passwordGroup');
const passwordInput = document.getElementById('password');

docenteToggle?.addEventListener('change', (e) => {
  if (e.target.checked) {
    // Modo docente: mostrar contraseña
    passwordGroup.style.display = 'block';
    passwordInput.required = true;
  } else {
    // Modo estudiante: ocultar contraseña
    passwordGroup.style.display = 'none';
    passwordInput.required = false;
    passwordInput.value = '';
  }
});

document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const username = document.getElementById('username').value.trim();
  const isDocente = document.getElementById('docente-toggle').checked;
  const password = document.getElementById('password').value.trim();
  const errorDiv = document.getElementById('errorMessage');

  // Validación
  if (!username) {
    showError('Por favor ingresa tu nombre');
    return;
  }

  if (isDocente && !password) {
    showError('Por favor ingresa tu contraseña');
    return;
  }

  try {
    const loginData = isDocente 
      ? { username, password }
      : { displayName: username, isGuest: true };

    const response = await fetch('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(loginData)
    });

    const data = await response.json();

    if (!response.ok) {
      showError(data.error || 'Error en la autenticación');
      return;
    }

    // Login exitoso
    if (data.role === 'docente') {
      window.location.href = '/teacher.html';
    } else {
      window.location.href = '/student.html';
    }
  } catch (error) {
    console.error('Error:', error);
    showError('Error de conexión. Por favor intenta de nuevo.');
  }
});

function showError(message) {
  const errorDiv = document.getElementById('errorMessage');
  errorDiv.textContent = message;
  errorDiv.classList.add('show');

  setTimeout(() => {
    errorDiv.classList.remove('show');
  }, 5000);
}

// Cargar datos del usuario
document.addEventListener('DOMContentLoaded', async () => {
  try {
    const response = await fetch('/auth/me');
    const data = await response.json();

    if (data.user) {
      // Ya hay sesión activa, redirigir al dashboard
      const role = data.user.role;
      window.location.href = role === 'docente' ? '/teacher.html' : '/student.html';
    }
  } catch (error) {
    // Sin sesión activa, mostrar login
  }
});
