const { getMySqlPromiseConnection } = require('../config/mysql.db');

exports.getAll = async () => {
  const connection = await getMySqlPromiseConnection();
  try {
    const [rows] = await connection.query('SELECT * FROM delivery_time_slots ORDER BY sort_order ASC, id ASC');
    return rows;
  } finally {
    connection.release(); // Bắt buộc phải trả lại kết nối
  }
};

exports.create = async (data) => {
  const { title, cutoff_time, is_active, sort_order } = data;
  const connection = await getMySqlPromiseConnection();
  try {
    const query = 'INSERT INTO delivery_time_slots (title, cutoff_time, is_active, sort_order) VALUES (?, ?, ?, ?)';
    const [result] = await connection.query(query, [title, cutoff_time, is_active ?? 1, sort_order ?? 0]);
    return result;
  } finally {
    connection.release();
  }
};

exports.update = async (id, data) => {
  const { title, cutoff_time, is_active, sort_order } = data;
  const connection = await getMySqlPromiseConnection();
  try {
    const query = 'UPDATE delivery_time_slots SET title=?, cutoff_time=?, is_active=?, sort_order=? WHERE id=?';
    const [result] = await connection.query(query, [title, cutoff_time, is_active, sort_order, id]);
    return result;
  } finally {
    connection.release();
  }
};

exports.delete = async (id) => {
  const connection = await getMySqlPromiseConnection();
  try {
    const [result] = await connection.query('DELETE FROM delivery_time_slots WHERE id=?', [id]);
    return result;
  } finally {
    connection.release();
  }
};

exports.getActive = async () => {
  const connection = await getMySqlPromiseConnection();
  try {
    const [rows] = await connection.query(
      'SELECT id, title, cutoff_time, sort_order FROM delivery_time_slots WHERE is_active = 1 ORDER BY sort_order ASC, id ASC'
    );
    return rows;
  } finally {
    connection.release();
  }
};