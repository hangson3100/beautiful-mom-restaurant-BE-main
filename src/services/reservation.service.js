const { getMySqlPromiseConnection } = require("../config/mysql.db")

exports.addReservationDB = async (customerId, date, tableId, status, notes, peopleCount, uniqueCode) => {
    const conn = await getMySqlPromiseConnection();
    try {

        const sql = `
        INSERT INTO reservations
        (customer_id, date, table_id, status, notes, people_count, unique_code)
        VALUES
        (?, ?, ?, ?, ?, ?, ?);
        `;

        const [result] = await conn.query(sql, [customerId, date, tableId, status, notes, peopleCount, uniqueCode]);

        return result.insertId;
    } catch (error) {
        console.error(error);
        throw error;
    } finally {
        conn.release();
      }
};

exports.updateReservationDB = async (reservationId, date, tableId, status, notes, peopleCount) => {
    const conn = await getMySqlPromiseConnection();
    try {

        const sql = `
        UPDATE reservations
        SET
        date = ?, table_id = ?, status = ?, notes = ?, people_count = ?, updated_at = NOW()
        WHERE id = ?;
        `;

        await conn.query(sql, [date, tableId, status, notes, peopleCount, reservationId]);

        return;
    } catch (error) {
        console.error(error);
        throw error;
    } finally {
        conn.release();
      }
};

exports.cancelReservationDB = async (reservationId, status) => {
    const conn = await getMySqlPromiseConnection();
    try {

        const sql = `
        UPDATE reservations
        SET
        status = ?
        WHERE id = ?;
        `;

        await conn.query(sql, [status, reservationId]);

        return;
    } catch (error) {
        console.error(error);
        throw error;
    } finally {
        conn.release();
      }
};

exports.deleteReservationDB = async (reservationId) => {
    const conn = await getMySqlPromiseConnection();
    try {

        const sql = `
        DELETE FROM reservations
        WHERE id = ?;
        `;

        await conn.query(sql, [reservationId]);

        return;
    } catch (error) {
        console.error(error);
        throw error;
    } finally {
        conn.release();
      }
};

exports.searchReservationsDB = async (search) => {
    const conn = await getMySqlPromiseConnection();
    try {

        const sql = `
        SELECT r.id, customer_id, c.name as customer_name, r.date, table_id, st.table_title, status, notes, people_count, unique_code, r.created_at, r.updated_at
        FROM reservations r
        LEFT JOIN customers c
        ON r.customer_id = c.phone
        LEFT JOIN store_tables st
        ON r.table_id = st.id
        WHERE r.id = ? OR customer_id = ? OR unique_code = ?
        ORDER BY r.created_at DESC
        LIMIT 20;
        `;

        const [results] = await conn.query(sql, [search, search, search]);

        return results;
    } catch (error) {
        console.error(error);
        throw error;
    } finally {
        conn.release();
      }
};

exports.getReservationsDB = async (type, from, to) => {
    const conn = await getMySqlPromiseConnection();
    try {

        const {filter, params} = getFilterConditionForReservationSearch(type, from, to);

        const sql = `
        SELECT r.id, customer_id, c.name as customer_name, r.date, table_id, st.table_title, status, notes, people_count, unique_code, r.created_at, r.updated_at
        FROM reservations r
        LEFT JOIN customers c
        ON r.customer_id = c.phone
        LEFT JOIN store_tables st
        ON r.table_id = st.id
        WHERE ${filter}
        `;

        const [results] = await conn.query(sql, params);

        return results;
    } catch (error) {
        console.error(error);
        throw error;
    } finally {
        conn.release();
      }
};

const getFilterConditionForReservationSearch = (type, from, to) => {
    const params = [];
    let filter = '';

    switch (type) {
        case 'khác': {
            params.push(from, to);
            filter = `DATE(date) >= ? AND DATE(date) <= ?`;
            break;
        }
        case 'hôm_nay': {
            filter = `DATE(date) = CURDATE()`;
            break;
        }
        case 'tháng_này': {
            filter = `YEAR(date) = YEAR(NOW()) AND MONTH(date) = MONTH(NOW())`;
            break;
        }
        case 'tháng_trước': {
            filter = `DATE(date) >= DATE_SUB(CURDATE(), INTERVAL 1 MONTH) AND DATE(date) <= CURDATE()`;
            break;
        }
        case '7_ngày_trước': {
            filter = `DATE(date) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) AND DATE(date) <= CURDATE()`;
            break;
        }
        case 'hôm_qua': {
            filter = `DATE(date) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)`;
            break;
        }
        case 'ngày_mai': {
            filter = `DATE(date) = DATE_ADD(CURDATE(), INTERVAL 1 DAY)`;
            break;
        }
        default: {
            filter = '';
        }
    }

    return { params, filter };
}