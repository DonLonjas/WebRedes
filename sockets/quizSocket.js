// sockets/quizSocket.js

const fs = require('fs/promises');
const path = require('path');
const { calcScore } = require('../utils/scoring');

const quizFile = path.join(__dirname, '../data/quiz.json');
const historialDir = path.join(__dirname, '../data/historial');

const dayNames = [
  'Domingo',
  'Lunes',
  'Martes',
  'Miercoles',
  'Jueves',
  'Viernes',
  'Sabado'
];

function pad(value) {
  return String(value).padStart(2, '0');
}

function formatHistoryStamp(date = new Date()) {
  const day = dayNames[date.getDay()];
  const datePart = `${pad(date.getDate())}-${pad(date.getMonth() + 1)}-${date.getFullYear()}`;
  const timePart = `${pad(date.getHours())}-${pad(date.getMinutes())}`;

  return {
    day,
    date: datePart,
    time: timePart,
    fileName: `${day}-${datePart}-${timePart}`
  };
}

async function saveQuizHistory(snapshot) {
  await fs.mkdir(historialDir, { recursive: true });

  const stamp = formatHistoryStamp();
  let filePath = path.join(historialDir, `${stamp.fileName}.json`);
  let suffix = 2;

  while (true) {
    try {
      await fs.access(filePath);
      filePath = path.join(historialDir, `${stamp.fileName}-${suffix}.json`);
      suffix += 1;
    } catch (error) {
      break;
    }
  }

  const payload = {
    students: snapshot.students,
    questions: snapshot.questions,
    date: {
      day: stamp.day,
      date: stamp.date,
      time: stamp.time
    }
  };

  await fs.writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf-8');
  return filePath;
}

let quizState = {
  isRunning: false,
  currentQuestionIndex: 0,
  questions: [],
  scores: {}, // { userId: { totalPoints, correctAnswers, displayName, avatar } }
  streaks: {},
  answers: {},
  expectedResponders: new Set(), // socket ids expected to answer current question
  currentAnswers: {} // questionId -> Set(socketId)
};

module.exports = function (io) {
  // Mapear socket.id a información del usuario
  const socketUsers = {};
  const pendingTimeouts = new Set();

  function schedule(fn, delay) {
    const timeoutId = setTimeout(() => {
      pendingTimeouts.delete(timeoutId);
      fn();
    }, delay);
    pendingTimeouts.add(timeoutId);
  }

  function clearPendingTimeouts() {
    pendingTimeouts.forEach((timeoutId) => clearTimeout(timeoutId));
    pendingTimeouts.clear();
  }

  io.on('connection', (socket) => {
    console.log(`Usuario conectado: ${socket.id}`);

    // Guardar info del usuario cuando se conecta
    socket.on('register_user', (userData) => {
      socketUsers[socket.id] = userData;
      console.log(`Usuario registrado: ${userData.displayName} (${socket.id})`);
    });

    // Cuando un docente quiere iniciar el quiz
    socket.on('start_quiz', async (data) => {
      try {
        const quizData = await fs.readFile(quizFile, 'utf-8');
        const { quiz } = JSON.parse(quizData);
        
        quizState.isRunning = true;
        quizState.currentQuestionIndex = 0;
        quizState.questions = quiz.questions;
        quizState.scores = {};
        quizState.streaks = {};
        quizState.answers = {};
        quizState.expectedResponders = new Set();
        quizState.currentAnswers = {};

        // Notificar a todos que el quiz comienza
        io.emit('quiz_start', { title: quiz.title });

        // Esperar 3 segundos y enviar primera pregunta
        schedule(() => {
          sendNextQuestion(io);
        }, 3000);
      } catch (error) {
        console.error('Error al iniciar quiz:', error);
        socket.emit('error', 'Error al iniciar el quiz');
      }
    });

    // Cuando un estudiante envía una respuesta
    socket.on('submit_answer', (data) => {
      const { questionId, answer, timestamp } = data;
      
      // Usar socket.id como identificador único y consistente
      const userId = socket.id;
      const userData = socketUsers[userId] || { displayName: 'Estudiante', avatar: '🎓' };

      if (!quizState.isRunning) return;

      const question = quizState.questions.find(q => q.id === questionId);
      if (!question) return;

      const isCorrect = answer === question.correctAnswer;
      const timeUsed = (Date.now() - timestamp) / 1000;
      const timeRemaining = Math.max(0, question.timeLimit - timeUsed);

      // Calcular puntos
      let streak = quizState.streaks[userId] || 0;
      if (isCorrect) {
        streak += 1;
      } else {
        streak = 0;
      }
      quizState.streaks[userId] = streak;

      const points = isCorrect ? calcScore({
        pointsBase: question.points,
        timeLimit: question.timeLimit,
        timeRemaining: timeRemaining,
        streak: streak
      }) : 0;

      // Inicializar usuario si es la primera respuesta
      if (!quizState.scores[userId]) {
        quizState.scores[userId] = {
          totalPoints: 0,
          correctAnswers: 0,
          displayName: userData.displayName,
          avatar: userData.avatar
        };
      }

      // Acumular puntos
      quizState.scores[userId].totalPoints += points;
      if (isCorrect) {
        quizState.scores[userId].correctAnswers += 1;
      }

      // Guardar la respuesta para referencia
      if (!quizState.answers[questionId]) {
        quizState.answers[questionId] = [];
      }
      quizState.answers[questionId].push({
        userId,
        displayName: userData.displayName,
        answer,
        correct: isCorrect,
        points
      });

      // Track that this socket has answered this question
      if (!quizState.currentAnswers[questionId]) {
        quizState.currentAnswers[questionId] = new Set();
      }
      quizState.currentAnswers[questionId].add(userId);

      // If everyone answered, end the question early
      if (quizState.expectedResponders && quizState.expectedResponders.size > 0) {
        const answeredCount = quizState.currentAnswers[questionId].size;
        if (answeredCount >= quizState.expectedResponders.size) {
          // endCurrentQuestion will clear pending timeouts and proceed
          endCurrentQuestion(io);
        }
      }

      // Enviar resultado individual (mostrar solo el total acumulado)
      socket.emit('answer_result', {
        correct: isCorrect,
        correctAnswer: question.correctAnswer,
        points,
        totalPoints: quizState.scores[userId].totalPoints
      });
    });

    // Cuando el docente pide mostrar el siguiente
    socket.on('next_question', () => {
      if (!quizState.isRunning) return;
      // Teacher requested to force end current question
      endCurrentQuestion(io);
    });

    // Finalizacion manual inmediata (docente)
    socket.on('end_quiz', () => {
      if (!quizState.isRunning) return;
      cancelQuiz(io);
    });

    // Auto-next para demostración (opcional)
    socket.on('auto_next', () => {
      // Simular respuestas y pasar automáticamente
      socket.emit('next_question');
    });

    socket.on('disconnect', () => {
      console.log(`Usuario desconectado: ${socket.id}`);
      delete socketUsers[socket.id];
      // If this socket was expected to answer current question, remove it
      if (quizState.expectedResponders && quizState.expectedResponders.has(socket.id)) {
        quizState.expectedResponders.delete(socket.id);

        // check if remaining expected responders have all answered
        const currentQ = quizState.questions[quizState.currentQuestionIndex];
        if (currentQ) {
          const qid = currentQ.id;
          const answeredSet = quizState.currentAnswers[qid] || new Set();
          if (quizState.expectedResponders.size > 0 && answeredSet.size >= quizState.expectedResponders.size) {
            endCurrentQuestion(io);
          } else if (quizState.expectedResponders.size === 0) {
            // no expected responders left, end question
            endCurrentQuestion(io);
          }
        }
      }
    });
  });

  // End current question: show fact, mini leaderboard, advance index and schedule next question/end
  function endCurrentQuestion(io) {
    if (!quizState.isRunning) return;

    // clear any pending timeouts to avoid duplicate flows
    clearPendingTimeouts();

    const currentQuestion = quizState.questions[quizState.currentQuestionIndex];
    if (currentQuestion && currentQuestion.curiousFact) {
      io.emit('show_fact', currentQuestion.curiousFact);
    }

    // After short delay show mini leaderboard
    schedule(() => {
      const miniLeaderboard = Object.entries(quizState.scores)
        .map(([userId, scoreData]) => ({
          userId,
          displayName: scoreData.displayName,
          avatar: scoreData.avatar,
          points: scoreData.totalPoints
        }))
        .sort((a, b) => b.points - a.points)
        .slice(0, 3);

      io.emit('mini_leaderboard', miniLeaderboard);

      // advance
      quizState.currentQuestionIndex += 1;

      if (quizState.currentQuestionIndex >= quizState.questions.length) {
        endQuiz(io);
      } else {
        schedule(() => {
          sendNextQuestion(io);
        }, 3000);
      }
    }, 5000);
  }

  function sendNextQuestion(io) {
    if (!quizState.isRunning) {
      return;
    }

    if (quizState.currentQuestionIndex >= quizState.questions.length) {
      endQuiz(io);
      return;
    }

    const question = quizState.questions[quizState.currentQuestionIndex];

    // reset trackers for this question
    quizState.currentAnswers[question.id] = new Set();

    // Determine expected responders (currently connected estudiantes)
    const expected = new Set();
    Object.entries(socketUsers).forEach(([sockId, udata]) => {
      if (udata && udata.role === 'estudiante') expected.add(sockId);
    });
    quizState.expectedResponders = expected;

    // Enviar pregunta sin la respuesta correcta
    io.emit('new_question', {
      id: question.id,
      questionNumber: quizState.currentQuestionIndex + 1,
      totalQuestions: quizState.questions.length,
      question: question.question,
      options: question.options,
      timeLimit: question.timeLimit
    });

    // Schedule auto end when time runs out
    schedule(() => {
      // only end if still running and same question
      const currentQ = quizState.questions[quizState.currentQuestionIndex];
      if (!quizState.isRunning || !currentQ || currentQ.id !== question.id) return;
      endCurrentQuestion(io);
    }, (question.timeLimit || 20) * 1000);
  }

  function endQuiz(io) {
    clearPendingTimeouts();
    quizState.isRunning = false;

    // Crear leaderboard final consolidado por usuario
    const finalLeaderboard = Object.entries(quizState.scores)
      .map(([userId, scoreData]) => ({
        userId,
        displayName: scoreData.displayName,
        avatar: scoreData.avatar,
        points: scoreData.totalPoints,
        correctAnswers: scoreData.correctAnswers || 0,
        maxStreak: quizState.streaks[userId] || 0
      }))
      .sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        return b.correctAnswers - a.correctAnswers;
      });

    const historySnapshot = {
      students: finalLeaderboard.map(({ userId, displayName, avatar, points, correctAnswers, maxStreak }) => ({
        userId,
        displayName,
        avatar,
        points,
        correctAnswers,
        maxStreak
      })),
      questions: quizState.questions.map((question) => ({
        id: question.id,
        topic: question.topic,
        question: question.question,
        options: question.options,
        correctAnswer: question.correctAnswer,
        timeLimit: question.timeLimit,
        points: question.points
      }))
    };

    saveQuizHistory(historySnapshot).catch((error) => {
      console.error('Error al guardar el historial del quiz:', error);
    });

    io.emit('quiz_end', finalLeaderboard);
  }

  function cancelQuiz(io) {
    clearPendingTimeouts();
    quizState.isRunning = false;
    io.emit('quiz_cancelled', {
      reason: 'cancelled_by_teacher'
    });
  }
};
