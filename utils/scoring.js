// utils/scoring.js

function calcScore({ pointsBase, timeLimit, timeRemaining, streak }) {
  if (timeRemaining <= 0) return 0;
  
  const ratio = timeRemaining / timeLimit;
  let multiplier = 1.0;
  
  if (streak >= 5) {
    multiplier = 1.5;
  } else if (streak >= 3) {
    multiplier = 1.25;
  }
  
  return Math.round(pointsBase * ratio * multiplier);
}

module.exports = { calcScore };
