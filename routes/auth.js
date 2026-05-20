// routes/auth.js

const express = require('express');
const fs = require('fs/promises');
const path = require('path');
const { randomUUID } = require('crypto');
const checkRole = require('../middleware/checkRole');

const router = express.Router();
const usersFile = path.join(__dirname, '../data/users.json');

// Avatares para estudiantes
const studentAvatars = ['🎓', '👨‍🎓', '👩‍🎓', '📚', '🔬', '⚡', '🌟', '🎯'];

function generateAvatar() {
  return studentAvatars[Math.floor(Math.random() * studentAvatars.length)];
}

// GET /auth/me - Obtener usuario actual
router.get('/me', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'No autenticado' });
  }
  res.json({ user: req.session.user });
});

// GET /auth/active-users - Sesiones activas de estudiantes (solo docente)
router.get('/active-users', checkRole('docente'), (req, res) => {
  if (!req.sessionStore || typeof req.sessionStore.all !== 'function') {
    return res.json({ ok: true, count: 0, users: [] });
  }

  req.sessionStore.all((error, sessions) => {
    if (error) {
      console.error('Error al consultar sesiones activas:', error);
      return res.status(500).json({ ok: false, error: 'No se pudieron obtener las sesiones activas' });
    }

    const usersMap = new Map();
    const allSessions = sessions || {};

    Object.values(allSessions).forEach((sessionData) => {
      const user = sessionData && sessionData.user;
      if (!user || user.role !== 'estudiante') {
        return;
      }

      const key = String(user.id || user.username || user.displayName);
      if (!usersMap.has(key)) {
        usersMap.set(key, {
          id: key,
          displayName: user.displayName || user.username || 'Estudiante',
          avatar: user.avatar || '🎓',
          role: user.role
        });
      }
    });

    const users = Array.from(usersMap.values())
      .sort((a, b) => a.displayName.localeCompare(b.displayName, 'es', { sensitivity: 'base' }));

    return res.json({
      ok: true,
      count: users.length,
      users
    });
  });
});

// POST /auth/login
router.post('/login', async (req, res) => {
  const { username, password, displayName, isGuest } = req.body;

  try {
    // Modo estudiante (guest)
    if (isGuest && displayName) {
      if (!displayName.trim()) {
        return res.status(400).json({ error: 'Por favor ingresa un nombre' });
      }

      const guestUser = {
        id: randomUUID(),
        username: displayName,
        displayName: displayName.trim(),
        role: 'estudiante',
        avatar: generateAvatar(),
        isGuest: true
      };

      // Guardar sesión
      req.session.user = guestUser;

      return res.json({
        ok: true,
        role: 'estudiante',
        displayName: guestUser.displayName,
        avatar: guestUser.avatar
      });
    }

    // Modo docente (requiere credenciales)
    if (!username || !password) {
      return res.status(400).json({ error: 'Usuario y contraseña requeridos' });
    }

    const data = await fs.readFile(usersFile, 'utf-8');
    const { users } = JSON.parse(data);

    const user = users.find(u => u.username === username && u.password === password);

    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Guardar sesión
    req.session.user = {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      role: user.role,
      avatar: user.avatar
    };

    res.json({
      ok: true,
      role: user.role,
      displayName: user.displayName,
      avatar: user.avatar
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /auth/logout
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Error al cerrar sesión' });
    }
    res.json({ ok: true });
  });
});

// POST /auth/change-password - Solo docente autenticado puede cambiar su contraseña
router.post('/change-password', checkRole('docente'), async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'La contraseña actual y la nueva contraseña son requeridas' });
    }

    if (String(newPassword).trim().length < 6) {
      return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres' });
    }

    const data = await fs.readFile(usersFile, 'utf-8');
    const parsed = JSON.parse(data);
    const users = Array.isArray(parsed.users) ? parsed.users : [];

    const sessionUser = req.session.user;
    const userIndex = users.findIndex((user) => user.username === sessionUser.username && user.role === 'docente');

    if (userIndex === -1) {
      return res.status(404).json({ error: 'No se encontró el usuario docente' });
    }

    if (users[userIndex].password !== currentPassword) {
      return res.status(401).json({ error: 'La contraseña actual no es correcta' });
    }

    users[userIndex] = {
      ...users[userIndex],
      password: String(newPassword).trim()
    };

    await fs.writeFile(
      usersFile,
      JSON.stringify({ ...parsed, users }, null, 2),
      'utf-8'
    );

    req.session.user = {
      ...req.session.user,
      username: users[userIndex].username,
      displayName: users[userIndex].displayName,
      role: users[userIndex].role,
      avatar: users[userIndex].avatar
    };

    return res.json({ ok: true });
  } catch (error) {
    console.error('Error al cambiar contraseña:', error);
    return res.status(500).json({ error: 'No se pudo cambiar la contraseña' });
  }
});

module.exports = router;
