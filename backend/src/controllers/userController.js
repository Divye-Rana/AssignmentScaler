const db = require('../config/db');

exports.getAllUsers = async (req, res, next) => {
  try {
    const { rows } = await db.query('SELECT id, name, avatar_url FROM users ORDER BY name ASC');
    res.json(rows);
  } catch (err) {
    next(err);
  }
};
