const { getMySqlPromiseConnection } = require('../config/mysql.db');
const { escape } = require('mysql2');
exports.doCustomerExistDB = async (phone) => {
  const conn = await getMySqlPromiseConnection();
  try {
    const sql = `
        SELECT phone, name FROM customers
        WHERE phone = ?
        LIMIT 1;
        `;

    const [result] = await conn.query(sql, [phone]);

    return result.length > 0;
  } catch (error) {
    console.error(error);
    throw error;
  } finally {
    conn.release();
  }
};

exports.addCustomerDB = async (
  phone,
  name,
  email,
  birthDate,
  gender,
  isMember,
  address = null
) => {
  const conn = await getMySqlPromiseConnection();
  try {
    const sql = `
        INSERT INTO customers
        (phone, name, email, birth_date, gender, is_member, address)
        VALUES
        (?, ?, ?, ?, ?, ?, ?);
        `;

    const [result] = await conn.query(sql, [
      phone,
      name,
      email,
      birthDate,
      gender,
      isMember,
      address,
    ]);

    return result.insertId;
  } catch (error) {
    console.error(error);
    throw error;
  } finally {
    conn.release();
  }
};

exports.getCustomersDB = async (page, perPage, sort, filter) => {
  const conn = await getMySqlPromiseConnection();
  try {
    // Validate and sanitize inputs
    const currentPage = parseInt(page) || 1;
    const limit = parseInt(perPage) || 10; // Define default page size
    const offset = (currentPage - 1) * limit;
    const sortedBy = sort
      ? `ORDER BY ${escape(sort)}`
      : 'ORDER BY created_at DESC'; // Add sorting based on query param

    // Build filter query based on 'filter' param (use appropriate library for complex filters)
    const filterQuery = filter
      ? `WHERE name LIKE '${filter}%' OR phone='${filter}'`
      : '';

    const [customers] = await conn.execute(
      `SELECT phone, name, email, birth_date, gender, is_member, created_at FROM customers ${filterQuery} ${sortedBy} LIMIT ${limit} OFFSET ${offset} ;`
    );

    // Prepared statement for total customer count
    const [totalCustomers] = await conn.execute(
      `SELECT COUNT(*) AS total FROM customers ${filterQuery} ;`
    );

    // Prepare response data
    const response = {
      customers,
      currentPage,
      perPage,
      totalPages: Math.ceil(totalCustomers[0].total / limit),
      totalCustomers: totalCustomers[0].total,
    };

    return response;
  } catch (error) {
    console.error(error);
    throw error;
  } finally {
    conn.release();
  }
};

exports.getCustomerDB = async (phone) => {
  const conn = await getMySqlPromiseConnection();
  try {
    const [result] = await conn.execute(
      `SELECT phone, name, email, address, birth_date, gender, is_member, created_at FROM customers
            WHERE phone LIKE ? OR name LIKE ?
            LIMIT 1;`,
      [`${phone}%`, `%${phone}%`]
    );

    return result[0];
  } catch (error) {
    console.error(error);
    throw error;
  } finally {
    conn.release();
  }
};
exports.searchCustomerDB = async (searchString) => {
  const conn = await getMySqlPromiseConnection();
  try {
    const [result] = await conn.execute(
      `
            SELECT phone, name, email, address, birth_date, gender, is_member, created_at FROM customers
            WHERE phone LIKE ? OR name LIKE ?
            LIMIT 100
            ;`,
      [`${searchString}%`, `%${searchString}%`]
    );

    return result;
  } catch (error) {
    console.error(error);
    throw error;
  } finally {
    conn.release();
  }
};

exports.updateCustomerAddressDB = async (phone, address) => {
  const conn = await getMySqlPromiseConnection();
  try {
    await conn.query(
      'UPDATE customers SET address = ? WHERE phone = ?',
      [address || null, phone]
    );
  } catch (error) {
    console.error(error);
    throw error;
  } finally {
    conn.release();
  }
};

exports.updateCustomerDB = async (phone, name, email, birthDate, gender) => {
  const conn = await getMySqlPromiseConnection();
  try {
    const sql = `
        UPDATE customers
        SET
        name = ?, email = ?, birth_date = ?, gender = ?
        WHERE phone = ?
        `;

    await conn.query(sql, [name, email, birthDate, gender, phone]);
    return;
  } catch (error) {
    console.error(error);
    throw error;
  } finally {
    conn.release();
  }
};

exports.deleteCustomerDB = async (phone) => {
  const conn = await getMySqlPromiseConnection();
  try {
    const sql = `
        DELETE FROM customers
        WHERE phone = ?;
        `;

    await conn.query(sql, [phone]);

    return;
  } catch (error) {
    console.error(error);
    throw error;
  } finally {
    conn.release();
  }
};
