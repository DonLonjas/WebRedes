// routes/quiz.js

const express = require('express');
const fs = require('fs/promises');
const path = require('path');
const checkRole = require('../middleware/checkRole');

const router = express.Router();
const quizFile = path.join(__dirname, '../data/quiz.json');
const historialDir = path.join(__dirname, '../data/historial');

function normalizeAndValidateQuiz(quiz) {
  if (!quiz || typeof quiz !== 'object') {
    throw new Error('El quiz enviado no es valido');
  }

  const title = String(quiz.title || '').trim();
  if (!title) {
    throw new Error('El titulo del quiz es obligatorio');
  }

  if (!Array.isArray(quiz.questions) || quiz.questions.length === 0) {
    throw new Error('Debes incluir al menos una pregunta');
  }

  const normalizedQuestions = quiz.questions.map((question, index) => {
    const questionText = String(question.question || '').trim();
    if (!questionText) {
      throw new Error(`La pregunta ${index + 1} no tiene enunciado`);
    }

    if (!Array.isArray(question.options) || question.options.length < 2) {
      throw new Error(`La pregunta ${index + 1} debe tener al menos 2 opciones`);
    }

    const options = question.options.map((option) => String(option || '').trim());
    if (options.some((option) => !option)) {
      throw new Error(`La pregunta ${index + 1} tiene opciones vacias`);
    }

    const correctAnswer = Number(question.correctAnswer);
    if (!Number.isInteger(correctAnswer) || correctAnswer < 0 || correctAnswer >= options.length) {
      throw new Error(`La respuesta correcta de la pregunta ${index + 1} no es valida`);
    }

    const timeLimit = Number(question.timeLimit);
    if (!Number.isFinite(timeLimit) || timeLimit <= 0) {
      throw new Error(`El tiempo de la pregunta ${index + 1} debe ser mayor a 0`);
    }

    const points = Number(question.points);
    if (!Number.isFinite(points) || points < 0) {
      throw new Error(`Los puntos de la pregunta ${index + 1} no son validos`);
    }

    return {
      ...question,
      id: String(question.id || `q${String(index + 1).padStart(3, '0')}`),
      question: questionText,
      options,
      correctAnswer,
      timeLimit,
      points
    };
  });

  return {
    title,
    questions: normalizedQuestions
  };
}

async function readHistoryFile(fileName) {
  const filePath = path.join(historialDir, fileName);
  const raw = await fs.readFile(filePath, 'utf-8');
  const parsed = JSON.parse(raw);

  return {
    fileName,
    ...parsed
  };
}

// GET /quiz/config - Solo docentes pueden ver/editar preguntas
router.get('/config', checkRole('docente'), async (req, res) => {
  try {
    const quizData = await fs.readFile(quizFile, 'utf-8');
    const parsed = JSON.parse(quizData);
    res.json({ ok: true, quiz: parsed.quiz });
  } catch (error) {
    console.error('Error al leer quiz.json:', error);
    res.status(500).json({ ok: false, error: 'No se pudo cargar la configuracion del quiz' });
  }
});

// PUT /quiz/config - Solo docentes pueden guardar cambios del quiz
router.put('/config', checkRole('docente'), async (req, res) => {
  try {
    const normalizedQuiz = normalizeAndValidateQuiz(req.body.quiz);
    const payload = { quiz: normalizedQuiz };

    await fs.writeFile(quizFile, `${JSON.stringify(payload, null, 2)}\n`, 'utf-8');

    res.json({ ok: true, message: 'Quiz actualizado', quiz: normalizedQuiz });
  } catch (error) {
    const message = error.message || 'No se pudo guardar el quiz';
    const status = message.includes('pregunta') || message.includes('quiz') || message.includes('tiempo') || message.includes('puntos')
      ? 400
      : 500;

    if (status === 500) {
      console.error('Error al guardar quiz.json:', error);
    }

    res.status(status).json({ ok: false, error: message });
  }
});

// POST /quiz/start - Solo docentes pueden iniciar
router.post('/start', checkRole('docente'), (req, res) => {
  // El evento de inicio real se maneja por Socket.io
  // Esta ruta es principalmente para autenticación
  res.json({ ok: true, message: 'Iniciando quiz...' });
});

// GET /quiz/history - Solo docentes pueden ver el historial de partidas
router.get('/history', checkRole('docente'), async (req, res) => {
  try {
    const entries = await fs.readdir(historialDir, { withFileTypes: true });
    const historyFiles = entries
      .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.json'))
      .map((entry) => entry.name);

    const histories = await Promise.all(
      historyFiles.map(async (fileName) => {
        try {
          return await readHistoryFile(fileName);
        } catch (error) {
          console.error(`Error al leer historial ${fileName}:`, error);
          return null;
        }
      })
    );

    const items = histories
      .filter(Boolean)
      .map((history) => ({
        fileName: history.fileName,
        students: Array.isArray(history.students) ? history.students : [],
        questions: Array.isArray(history.questions) ? history.questions : [],
        date: history.date || {}
      }))
      .sort((a, b) => b.fileName.localeCompare(a.fileName));

    res.json({ ok: true, histories: items });
  } catch (error) {
    if (error.code === 'ENOENT') {
      return res.json({ ok: true, histories: [] });
    }

    console.error('Error al leer el historial del quiz:', error);
    res.status(500).json({ ok: false, error: 'No se pudo cargar el historial del quiz' });
  }
});

// DELETE /quiz/history/:fileName - Solo docentes pueden eliminar un historial guardado
router.delete('/history/:fileName', checkRole('docente'), async (req, res) => {
  try {
    const fileName = String(req.params.fileName || '').trim();
    if (!fileName || path.extname(fileName).toLowerCase() !== '.json') {
      return res.status(400).json({ ok: false, error: 'Nombre de historial no valido' });
    }

    const normalizedName = path.basename(fileName);
    const targetPath = path.join(historialDir, normalizedName);
    const resolvedTarget = path.resolve(targetPath);
    const resolvedBase = path.resolve(historialDir);

    if (!resolvedTarget.startsWith(`${resolvedBase}${path.sep}`) && resolvedTarget !== path.join(resolvedBase, normalizedName)) {
      return res.status(400).json({ ok: false, error: 'Nombre de historial no valido' });
    }

    await fs.unlink(targetPath);
    res.json({ ok: true, message: 'Historial eliminado' });
  } catch (error) {
    if (error.code === 'ENOENT') {
      return res.status(404).json({ ok: false, error: 'El historial no existe' });
    }

    console.error('Error al eliminar historial:', error);
    res.status(500).json({ ok: false, error: 'No se pudo eliminar el historial' });
  }
});

module.exports = router;
