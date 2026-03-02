import React from 'react';

export default function ScoreBoard({ playerNames, scores, roundScores, roundNumber }) {
  return (
    <div className="scoreboard">
      <h3>📊 Scoreboard — Round {roundNumber}</h3>
      <table>
        <thead>
          <tr>
            <th>Player</th>
            <th>Round</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {playerNames.map((name, i) => (
            <tr key={i} className={scores[i] <= -800 ? 'score-danger' : ''}>
              <td>{name}</td>
              <td className={roundScores[i] > 0 ? 'score-positive' : roundScores[i] < 0 ? 'score-negative' : ''}>
                {roundScores[i] > 0 ? '+' : ''}{roundScores[i]}
              </td>
              <td className={scores[i] >= 0 ? 'score-positive' : 'score-negative'}>
                {scores[i]}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
