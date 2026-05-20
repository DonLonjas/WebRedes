// js/quiz-client.js - Lógica del cliente para quiz

let socket = null;
let currentQuestion = null;
let quizState = {
  isRunning: false,
  currentQuestionIndex: 0,
  totalPoints: 0,
  questionStartTime: 0
};

// Cargar datos del usuario
let userData = null;

async function loadUserData() {
  try {
    const response = await fetch('/auth/me');
    const data = await response.json();

    if (data.user) {
      userData = data.user;
      const userDisplay = document.getElementById('userDisplay');
      if (userDisplay) {
        userDisplay.textContent = `${data.user.avatar} ${data.user.displayName}`;
      }
      return data.user;
    } else {
      window.location.href = '/';
    }
  } catch (error) {
    console.error('Error:', error);
    window.location.href = '/';
  }
}

// Inicializar Socket.io
function initSocket() {
  socket = io();

  socket.on('connect', () => {
    console.log('Conectado al servidor');
    
    // Registrar usuario con el servidor
    if (userData) {
      socket.emit('register_user', {
        displayName: userData.displayName,
        avatar: userData.avatar,
        role: userData.role
      });
    }
  });

  socket.on('quiz_start', (data) => {
    console.log('Quiz iniciado:', data);
    quizState.isRunning = true;
    showScreen('waitingScreen');
  });

  socket.on('new_question', (data) => {
    console.log('Nueva pregunta:', data);
    currentQuestion = data;
    quizState.currentQuestionIndex = data.questionNumber;
    displayQuestion(data);
    startTimer(data.timeLimit);
  });

  socket.on('answer_result', (data) => {
    console.log('Resultado:', data);
    displayAnswerFeedback(data);
    quizState.totalPoints = data.totalPoints;
  });

  socket.on('show_fact', (data) => {
    console.log('Dato curioso:', data);
    displayFact(data);
  });

  socket.on('mini_leaderboard', (data) => {
    console.log('Mini leaderboard:', data);
    // En el cliente estudiante no mostramos el mini leaderboard
  });

  socket.on('quiz_end', (data) => {
    console.log('Quiz terminado:', data);
    quizState.isRunning = false;
    displayLeaderboard(data);
  });

  socket.on('quiz_cancelled', (data) => {
    console.log('Quiz cancelado:', data);
    quizState.isRunning = false;
    window.location.href = '/student.html';
  });

  socket.on('disconnect', () => {
    console.log('Desconectado del servidor');
  });
}

function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach(screen => {
    screen.classList.remove('active');
  });
  const screen = document.getElementById(screenId);
  if (screen) {
    screen.classList.add('active');
  }
}

function getOptionLabel(index) {
  let value = index;
  let label = '';

  do {
    label = String.fromCharCode(97 + (value % 26)) + label;
    value = Math.floor(value / 26) - 1;
  } while (value >= 0);

  return label;
}

function displayQuestion(question) {
  showScreen('quizScreen');

  document.getElementById('questionNumber').textContent = 
    `Pregunta ${question.questionNumber} de ${question.totalQuestions}`;
  
  document.getElementById('questionText').textContent = question.question;

  const optionsContainer = document.getElementById('optionsContainer');
  optionsContainer.innerHTML = '';

  question.options.forEach((option, index) => {
    const button = document.createElement('button');
    button.className = 'option-btn';
    button.innerHTML = `<span class="option-letter">${getOptionLabel(index)}.</span><span class="option-text"></span>`;
    button.querySelector('.option-text').textContent = option;
    button.addEventListener('click', () => submitAnswer(index, question.id));
    optionsContainer.appendChild(button);
  });

  // Deshabilitar botones después de hacer clic
  optionsContainer.querySelectorAll('.option-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      optionsContainer.querySelectorAll('.option-btn').forEach(b => {
        b.disabled = true;
      });
    });
  });

  quizState.questionStartTime = Date.now();
}

let timerInterval = null;

function startTimer(timeLimit) {
  if (timerInterval) clearInterval(timerInterval);

  let timeRemaining = timeLimit;
  const timerBar = document.getElementById('timerBar');
  const timerText = document.getElementById('timerText');

  // Actualizar CSS para duración del timer
  const root = document.documentElement;
  root.style.setProperty('--timer-duration', `${timeLimit}s`);

  const updateTimer = () => {
    timerText.textContent = `${timeRemaining}s`;
    
    if (timeRemaining <= 0) {
      clearInterval(timerInterval);
      // Auto-submit con respuesta vacía
      document.querySelectorAll('.option-btn').forEach(btn => {
        btn.disabled = true;
      });
    }
    
    timeRemaining--;
  };

  updateTimer();
  timerInterval = setInterval(updateTimer, 1000);
}

function submitAnswer(answerIndex, questionId) {
  if (timerInterval) clearInterval(timerInterval);

  const timeElapsed = (Date.now() - quizState.questionStartTime) / 1000;
  const currentQ = currentQuestion;
  
  if (!currentQ) return;

  const timestamp = quizState.questionStartTime;

  // Enviar solo información esencial (sin userId ni displayName)
  // El servidor usa socket.id como userId consistente
  socket.emit('submit_answer', {
    questionId,
    answer: answerIndex,
    timestamp
  });
}

function displayAnswerFeedback(data) {
  const optionsContainer = document.getElementById('optionsContainer');
  const buttons = optionsContainer.querySelectorAll('.option-btn');

  buttons.forEach((btn, index) => {
    if (index === data.correctAnswer) {
      btn.classList.add('correct');
    }
    btn.disabled = true;
  });

  const feedback = document.createElement('div');
  feedback.className = `answer-feedback ${data.correct ? 'correct' : 'incorrect'}`;
  
  // Mostrar puntos obtenidos en esta pregunta y total acumulado
  const pointsText = data.correct ? `+${data.points}` : `0`;
  
  feedback.innerHTML = `
    ${data.correct ? '✅ ¡Correcto!' : '❌ Incorrecto'}
    <div class="points-earned">${pointsText} puntos</div>
    <div style="font-size: 0.9rem; margin-top: 5px;">Total acumulado: ${data.totalPoints}</div>
  `;

  optionsContainer.parentElement.appendChild(feedback);

  // Esperar antes de pasar a siguiente estado
  // Esperar: el servidor (o el docente) decide cuándo avanzar.
  // No emitimos `next_question` desde el cliente para evitar adelantar la ronda.
}

function displayFact(fact) {
  showScreen('factScreen');
  
  document.getElementById('factTitle').textContent = fact.title;
  document.getElementById('factEmoji').textContent = fact.emoji;
  document.getElementById('factText').textContent = fact.text;
  document.getElementById('factSource').textContent = fact.source;
}

function displayLeaderboard(leaderboard) {
  showScreen('leaderboardScreen');
  if (typeof renderLeaderboard === 'function') {
    renderLeaderboard(leaderboard);
  } else {
    const podium = document.getElementById('podium');
    const table = document.getElementById('leaderboardTable');

    let podiumHtml = '';
    let tableHtml = '<table><thead><tr><th>Posición</th><th>Estudiante</th><th>Puntos</th><th>Aciertos</th></tr></thead><tbody>';

    leaderboard.forEach((item, index) => {
      if (index < 3) {
        const medals = ['🥇 1°', '🥈 2°', '🥉 3°'];
        podiumHtml += `<div class="podium-position">
          <div class="position-medal">${medals[index]}</div>
          <div class="position-avatar">${item.avatar}</div>
          <div class="position-name">${item.displayName}</div>
          <div class="position-score">${item.points}</div>
          <div class="position-correct">${item.correctAnswers || 0} aciertos</div>
        </div>`;
      }

      tableHtml += `<tr>
        <td class="position-col">${index + 1}</td>
        <td class="name-col"><span class="avatar">${item.avatar}</span> ${item.displayName}</td>
        <td class="score-col">${item.points}</td>
        <td class="correct-col">${item.correctAnswers || 0}</td>
      </tr>`;
    });

    tableHtml += '</tbody></table>';

    podium.innerHTML = podiumHtml || '<p>Sin resultados</p>';
    table.innerHTML = tableHtml;
  }

  document.getElementById('returnBtn')?.addEventListener('click', () => {
    window.location.href = '/student.html';
  });
}

// Logout
document.getElementById('logoutBtn')?.addEventListener('click', async () => {
  await fetch('/auth/logout', { method: 'POST' });
  window.location.href = '/';
});

// Inicializar
document.addEventListener('DOMContentLoaded', async () => {
  await loadUserData();
  initSocket();
});
