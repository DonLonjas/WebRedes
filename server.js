// server.js

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const session = require('express-session');
const path = require('path');

const os = require('os');
const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Sesiones
app.use(session({
  secret: 'spectrum-secret-key-2024',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 4 // 4 horas
  }
}));

// Rutas REST (requieren sesión)
app.use('/auth', require('./routes/auth'));
app.use('/quiz', require('./routes/quiz'));

// Proteger el panel del docente: si no está autenticado redirigir al login
app.get('/teacher.html', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/index.html?error=unauthenticated');
  }
  if (req.session.user.role !== 'docente') {
    return res.status(403).send('Forbidden: sin permiso');
  }
  return res.sendFile(path.join(__dirname, 'public', 'teacher.html'));
});

// Proteger el panel del estudiante: si no está autenticado redirigir al login
app.get('/student.html', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/index.html?error=unauthenticated');
  }
  if (req.session.user.role !== 'estudiante') {
    return res.status(403).send('Forbidden: sin permiso');
  }
  return res.sendFile(path.join(__dirname, 'public', 'student.html'));
});

// Servir archivos estáticos (después de configurar sesiones y rutas protegidas)
app.use(express.static(path.join(__dirname, 'public')));

// Socket.io
require('./sockets/quizSocket')(io);

// Manejo de sesiones en Socket.io
io.use((socket, next) => {
  const handshake = socket.handshake;
  
  // Para propósitos de esta demo, permitimos conexión sin autenticación
  // En producción, verificarías la sesión aquí
  
  next();
});

// Ruta raíz - redirige a login
app.get('/', (req, res) => {
  if (req.session.user) {
    const role = req.session.user.role;
    res.redirect(role === 'docente' ? '/teacher.html' : '/student.html');
  } else {
    res.redirect('/index.html');
  }
});

// Iniciar servidor
const PORT = process.env.PORT || 5050;
const HOST = process.env.HOST || '0.0.0.0';
httpServer.listen(PORT, HOST, () => {
  console.log(`✨ Espectro Electromagnético corriendo en http://localhost:${PORT}`);

  // Mostrar direcciones LAN para facilitar acceso desde otros dispositivos
  const nets = os.networkInterfaces();
  const addresses = [];
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      // Sólo IPv4 y no internas
      if (net.family === 'IPv4' && !net.internal) {
        addresses.push(net.address);
      }
    }
  }

  if (addresses.length > 0) {
    console.log('🌐 Accesible en la red local en:');
    addresses.forEach(ip => console.log(`   http://${ip}:${PORT}`));
  } else {
    console.log('⚠️ No se detectaron IPs de red locales automáticamente. Usa http://localhost:' + PORT);
  }

  console.log(`📚 Credenciales de prueba:`);
  console.log(`   - Docente: prof_garcia / docente2024`);
  console.log(`   - Estudiante: ana_lopez / estud123`);
  console.log(`   - Estudiante: carlos_m / carlos456`);
});
