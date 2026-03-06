const db = require('../db');

exports.exerciseProgress = (req, res) => {
  const { exerciseId } = req.params;
  const { metric = 'max_weight', from, to } = req.query;

  if (!['volume', 'max_weight'].includes(metric)) {
    return res.status(400).json({ error: 'metric must be volume or max_weight' });
  }

  const exercise = db.prepare('SELECT id, name FROM exercises WHERE id = ?').get(exerciseId);
  if (!exercise) return res.status(404).json({ error: 'Exercise not found' });

  const valueExpr = metric === 'volume'
    ? 'SUM(s.reps * COALESCE(s.weight, 0))'
    : 'MAX(s.weight)';

  let sql = `
    SELECT w.workout_date, w.name as workout_name, ${valueExpr} as value
    FROM workouts w
    JOIN workout_exercises we ON we.workout_id = w.id
    JOIN sets s ON s.workout_exercise_id = we.id
    WHERE w.user_id = ? AND we.exercise_id = ?
  `;
  const params = [req.userId, exerciseId];

  if (from) { sql += ' AND w.workout_date >= ?'; params.push(from); }
  if (to)   { sql += ' AND w.workout_date <= ?'; params.push(to); }

  sql += ' GROUP BY w.id ORDER BY w.workout_date ASC';

  const rows = db.prepare(sql).all(...params);
  res.json({ exercise, metric, data: rows });
};
