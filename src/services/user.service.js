const { getMySqlPromiseConnection } = require("../config/mysql.db")

exports.getUserDB = async (username) => {
    const conn = await getMySqlPromiseConnection();
    try {

        const sql = `
        SELECT username, role, scope FROM users
        WHERE username = ?
        LIMIT 1;
        `;
    
        const [result] = await conn.query(sql, [username]);
        return result[0];
    } catch (error) {
        console.error(error);
        throw error;
    } finally {
        conn.release();
    }
};

exports.getAllUsersDB = async () => {
    const conn = await getMySqlPromiseConnection();
    try {

        const sql = `
        SELECT username, name, role, photo, designation, phone, email, scope FROM users
        ORDER BY role, name;
        `;
    
        const [result] = await conn.query(sql, []);
        return result;
    } catch (error) {
        console.error(error);
        throw error;
    } finally {
        conn.release();
    }
};

exports.doUserExistDB = async (username) => {
    const conn = await getMySqlPromiseConnection();
    try {

        const sql = `
        SELECT username FROM users
        WHERE username = ?
        LIMIT 1;
        `;
    
        const [result] = await conn.query(sql, [username]);
        return result.length == 1;
    } catch (error) {
        console.error(error);
        throw error;
    } finally {
        conn.release();
    }
};

exports.addUserDB = async (username, encryptedPassword, name, role, photo, designation, phone, email, scope) => {
    const conn = await getMySqlPromiseConnection();
    try {

        const sql = `
        INSERT INTO users
        (username, password, name, role, photo, designation, phone, email, scope)
        VALUES
        (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        await conn.query(sql, [username, encryptedPassword, name, role, photo, designation, phone, email, scope]);
        return;
    } catch (error) {
        console.error(error);
        throw error;
    } finally {
        conn.release();
    }
};

exports.deleteUserDB = async (username) => {
    const conn = await getMySqlPromiseConnection();
    try {

        const sql = `
        DELETE FROM refresh_tokens WHERE username = ?;
        DELETE FROM users WHERE username = ?;
        `;

        await conn.query(sql, [username, username]);
        return;
    } catch (error) {
        console.error(error);
        throw error;
    } finally {
        conn.release();
    }
};

exports.deleteUserRefreshTokensDB = async (username) => {
    const conn = await getMySqlPromiseConnection();
    try {

        const sql = `
        DELETE FROM refresh_tokens WHERE username = ?;
        `;

        await conn.query(sql, [username]);
        return;
    } catch (error) {
        console.error(error);
        throw error;
    } finally {
        conn.release();
    }
};

exports.updateUserDB = async (username, name, photo, designation, phone, email, scope) => {
    const conn = await getMySqlPromiseConnection();
    try {

        const sql = `
        UPDATE users
        SET
        name = ?, photo = ?, designation = ?, phone = ?, email = ?, scope = ?
        WHERE username = ?;
        `;

        await conn.query(sql, [name, photo, designation, phone, email, scope, username]);
        return;
    } catch (error) {
        console.error(error);
        throw error;
    } finally {
        conn.release();
    }
};

exports.updateUserPasswordDB = async (username, password) => {
    const conn = await getMySqlPromiseConnection();
    try {

        const sql = `
        UPDATE users
        SET
        password = ?
        WHERE username = ?;
        `;

        await conn.query(sql, [password, username]);
        return;
    } catch (error) {
        console.error(error);
        throw error;
    } finally {
        conn.release();
    }
};