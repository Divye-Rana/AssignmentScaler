const db = require('../config/db');

exports.createList = async (req, res, next) => {
  try {
    const { board_id, title } = req.body;
    
    // Get max position to append to the end
    const posResult = await db.query('SELECT MAX(position) as max_pos FROM lists WHERE board_id = $1', [board_id]);
    const nextPos = (posResult.rows[0].max_pos || 0) + 1024;

    const { rows } = await db.query(
      'INSERT INTO lists (board_id, title, position) VALUES ($1, $2, $3) RETURNING *',
      [board_id, title, nextPos]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
};

exports.updateList = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title } = req.body;
    
    const { rows } = await db.query(
      'UPDATE lists SET title = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [title, id]
    );
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
};

exports.deleteList = async (req, res, next) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM lists WHERE id = $1', [id]);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

exports.reorderList = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { position } = req.body;
    
    const { rows } = await db.query(
      'UPDATE lists SET position = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [position, id]
    );
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
};
