// js/leaderboard.js - Lógica del leaderboard

function renderLeaderboard(leaderboard) {
  const podium = document.getElementById('podium');
  const table = document.getElementById('leaderboardTable');

  if (!podium || !table) return;

  let podiumHtml = '';
  let tableHtml = '<table><thead><tr><th>Posición</th><th>Estudiante</th><th>Puntos</th><th>Aciertos</th></tr></thead><tbody>';

  leaderboard.forEach((item, index) => {
    // Podio (top 3)
    if (index < 3) {
      const medals = ['🥇', '🥈', '🥉'];
      const ranks = ['1°', '2°', '3°'];
      
      podiumHtml += `<div class="podium-position">
        <div class="position-medal">${medals[index]} ${ranks[index]}</div>
        <div class="position-avatar">${item.avatar}</div>
        <div class="position-name">${item.displayName}</div>
        <div class="position-score">${item.points} pts</div>
        <div class="position-correct">${item.correctAnswers || 0} aciertos</div>
      </div>`;
    }

    // Tabla
    tableHtml += `<tr>
      <td class="position-col">#${index + 1}</td>
      <td class="name-col">
        <span class="avatar">${item.avatar}</span>
        <span>${item.displayName}</span>
      </td>
      <td class="score-col">${item.points}</td>
      <td class="correct-col">${item.correctAnswers || 0}</td>
    </tr>`;
  });

  tableHtml += '</tbody></table>';

  podium.innerHTML = podiumHtml || '<p style="text-align: center; color: var(--text-secondary);">Sin resultados</p>';
  table.innerHTML = tableHtml;
}

// Exportar para uso en otros scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { renderLeaderboard };
}
