const { getMySqlPromiseConnection } = require("../config/mysql.db")

exports.getCurrencyDB = async () => {
    const conn = await getMySqlPromiseConnection();
    try {

        const sql = `
        SELECT
            currency
        FROM
            store_details
        LIMIT 1;
        `;

        const [result] = await conn.query(sql);
        return result[0].currency;
    } catch (error) {
        console.error(error);
        throw error;
    } finally {
        conn.release();
    }
};

exports.getStoreSettingDB = async () => {
    const conn = await getMySqlPromiseConnection();

    try {
        const sql = `
        SELECT id, store_name, address, phone, email, currency, image, is_qr_menu_enabled, is_payment_later FROM store_details
        WHERE id = 1
        LIMIT 1;
        `;

        const [result] = await conn.query(sql);
        const row = result[0] || null;

        if (!row) {
            return null;
        }

        return {
            ...row,
            storeName: row.store_name ?? null,
            store_name: row.store_name ?? null,
            isQRMenuEnabled: row.is_qr_menu_enabled ?? false,
            is_qr_menu_enabled: row.is_qr_menu_enabled ?? false,
            isPaymentLater: row.is_payment_later ?? false,
            is_payment_later: row.is_payment_later ?? false,
        };
    } catch (error) {
        console.error(error);
        throw error;
    } finally {
        conn.release();
    }
};

exports.setStoreSettingDB = async (storeName, address, phone, email, currency, isQRMenuEnabled, isPaymentLater) => {
    const conn = await getMySqlPromiseConnection();

    try {
        const sql = `
        INSERT INTO store_details (id, store_name, address, phone, email, currency, is_qr_menu_enabled, is_payment_later)
        VALUES
        (1, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
        store_name = VALUES(store_name),
        address = VALUES(address),
        phone = VALUES(phone),
        email = VALUES(email),
        currency = VALUES(currency),
        is_qr_menu_enabled = VALUES(is_qr_menu_enabled),
        is_payment_later = VALUES(is_payment_later);
        `;

        await conn.query(sql, [storeName, address, phone, email, currency, isQRMenuEnabled, isPaymentLater]);
        return;
    } catch (error) {
        console.error(error);
        throw error;
    } finally {
        conn.release();
    }
};

exports.getPrintSettingDB = async () => {
    const conn = await getMySqlPromiseConnection();

    try {
        const sql = `
        SELECT id, page_format, header, footer, show_notes, is_enable_print, show_store_details, show_customer_details, print_token FROM print_settings
        WHERE id = 1
        LIMIT 1;
        `;

        const [result] = await conn.query(sql);
        return result[0];
    } catch (error) {
        console.error(error);
        throw error;
    } finally {
        conn.release();
    }
};

exports.setPrintSettingDB = async (pageFormat, header, footer, showNotes, isEnablePrint, showStoreDetails, showCustomerDetails, printToken) => {
    const conn = await getMySqlPromiseConnection();

    try {
        const sql = `
        INSERT INTO print_settings
        (id, page_format, header, footer, show_notes, is_enable_print, show_store_details, show_customer_details, print_token)
        VALUES
        (1, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
        page_format = VALUES(page_format),
        header = VALUES(header),
        footer = VALUES(footer),
        show_notes = VALUES(show_notes),
        is_enable_print = VALUES(is_enable_print),
        show_store_details = VALUES(show_store_details),
        show_customer_details = VALUES(show_customer_details),
        print_token = VALUES(print_token);
        `;

        await conn.query(sql, [pageFormat, header, footer, showNotes, isEnablePrint, showStoreDetails, showCustomerDetails, printToken]);
        return;
    } catch (error) {
        console.error(error);
        throw error;
    } finally {
        conn.release();
    }
};

exports.addTaxDB = async (title, rate, type) => {
    const conn = await getMySqlPromiseConnection();

    try {
        const sql = `
        INSERT INTO taxes
        (title, rate, type)
        VALUES (?, ?, ?);
        `;

        const [result] = await conn.query(sql, [title, rate, type]);
        return result.insertId;
    } catch (error) {
        console.error(error);
        throw error;
    } finally {
        conn.release();
    }
};

exports.getTaxesDB = async () => {
    const conn = await getMySqlPromiseConnection();

    try {
        const sql = `
        SELECT id, title, rate, type FROM taxes;
        `;

        const [result] = await conn.query(sql);
        return result;
    } catch (error) {
        console.error(error);
        throw error;
    } finally {
        conn.release();
    }
};

exports.getTaxDB = async (taxId) => {
    const conn = await getMySqlPromiseConnection();

    try {
        const sql = `
        SELECT id, title, rate, type FROM taxes
        WHERE id = ?
        LIMIT 1;
        `;

        const [result] = await conn.query(sql, [taxId]);
        return result[0];
    } catch (error) {
        console.error(error);
        throw error;
    } finally {
        conn.release();
    }
};

exports.deleteTaxDB = async (id) => {
    const conn = await getMySqlPromiseConnection();

    try {
        const sql = `
        DELETE FROM taxes WHERE id = ?;
        `;

        await conn.query(sql, [id]);
        return;
    } catch (error) {
        console.error(error);
        throw error;
    } finally {
        conn.release();
    }
};

exports.updateTaxDB = async (id, title, rate, type) => {
    const conn = await getMySqlPromiseConnection();

    try {
        const sql = `
        UPDATE taxes
        SET
        title = ?, rate = ?, type = ?
        WHERE id = ?
        `;

        await conn.query(sql, [title, rate, type, id]);
        return;
    } catch (error) {
        console.error(error);
        throw error;
    } finally {
        conn.release();
    }
};


exports.addPaymentTypeDB = async (title, isActive) => {
    const conn = await getMySqlPromiseConnection();

    try {
        const sql = `
        INSERT INTO payment_types
        (title, is_active)
        VALUES (?, ?);
        `;

        const [result] = await conn.query(sql, [title, isActive]);
        return result.insertId;
    } catch (error) {
        console.error(error);
        throw error;
    } finally {
        conn.release();
    }
};

exports.getPaymentTypesDB = async (activeOnly=false) => {
    const conn = await getMySqlPromiseConnection();

    try {
        let sql = `
        SELECT id, title, is_active FROM payment_types;
        `;

        if(activeOnly) {
            sql = `
            SELECT id, title, is_active FROM payment_types
            WHERE is_active = 1;
            `
        }

        const [result] = await conn.query(sql);
        return result;
    } catch (error) {
        console.error(error);
        throw error;
    } finally {
        conn.release();
    }
};

exports.updatePaymentTypeDB = async (id, title, isActive) => {
    const conn = await getMySqlPromiseConnection();

    try {
        const sql = `
        UPDATE payment_types
        SET title = ?, is_active = ?
        WHERE id = ?;
        `;

        const [result] = await conn.query(sql, [title, isActive, id]);
        return;
    } catch (error) {
        console.error(error);
        throw error;
    } finally {
        conn.release();
    }
};

exports.togglePaymentTypeDB = async (id, isActive) => {
    const conn = await getMySqlPromiseConnection();

    try {
        const sql = `
        UPDATE payment_types
        SET is_active = ?
        WHERE id = ?;
        `;

        const [result] = await conn.query(sql, [isActive, id]);
        return;
    } catch (error) {
        console.error(error);
        throw error;
    } finally {
        conn.release();
    }
};

exports.deletePaymentTypeDB = async (id) => {
    const conn = await getMySqlPromiseConnection();

    try {
        const sql = `
        DELETE FROM payment_types
        WHERE id = ?;
        `;

        await conn.query(sql, [id]);
        return;
    } catch (error) {
        console.error(error);
        throw error;
    } finally {
        conn.release();
    }
};

exports.addStoreTableDB = async (title, floor, seatingCapacity) => {
    const conn = await getMySqlPromiseConnection();

    try {
        const sql = `
        INSERT INTO store_tables
        (table_title, floor, seating_capacity)
        VALUES (?, ?, ?);
        `;

        const [result] = await conn.query(sql, [title, floor, seatingCapacity]);
        return result.insertId;
    } catch (error) {
        console.error(error);
        throw error;
    } finally {
        conn.release();
    }
};

exports.getStoreTablesDB = async () => {
    const conn = await getMySqlPromiseConnection();

    try {
        const sql = `
        SELECT id, table_title, floor, seating_capacity FROM store_tables;
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

exports.updateStoreTableDB = async (id, title, floor, seatingCapacity) => {
    const conn = await getMySqlPromiseConnection();

    try {
        const sql = `
        UPDATE store_tables SET
        table_title = ?, floor = ?, seating_capacity = ?
        WHERE id = ?;
        `;

        await conn.query(sql, [title, floor, seatingCapacity, id]);
        return;
    } catch (error) {
        console.error(error);
        throw error;
    } finally {
        conn.release();
    }
};

exports.deleteStoreTableDB = async (id) => {
    const conn = await getMySqlPromiseConnection();

    try {
        const sql = `
        DELETE FROM store_tables
        WHERE id = ?;
        `;

        await conn.query(sql, [id]);
        return;
    } catch (error) {
        console.error(error);
        throw error;
    } finally {
        conn.release();
    }
};

exports.addCategoryDB = async (title) => {
    const conn = await getMySqlPromiseConnection();

    try {
        const sql = `
        INSERT INTO categories
        (title)
        VALUES (?);
        `;

        const [result] = await conn.query(sql, [title]);
        return result.insertId;
    } catch (error) {
        console.error(error);
        throw error;
    } finally {
        conn.release();
    }
};

exports.getCategoriesDB = async () => {
    const conn = await getMySqlPromiseConnection();

    try {
        const sql = `
        SELECT id, title FROM categories;
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

exports.updateCategoryDB = async (id, title) => {
    const conn = await getMySqlPromiseConnection();

    try {
        const sql = `
        UPDATE categories
        SET title = ?
        WHERE id = ?;
        `;

        await conn.query(sql, [title, id]);
        return;
    } catch (error) {
        console.error(error);
        throw error;
    } finally {
        conn.release();
    }
};

exports.deleteCategoryDB = async (id) => {
    const conn = await getMySqlPromiseConnection();

    try {
        const sql = `
        DELETE FROM categories
        WHERE id = ?;
        `;

        await conn.query(sql, [id]);
        return;
    } catch (error) {
        console.error(error);
        throw error;
    } finally {
        conn.release();
    }
};


exports.buttonHideMenuDB = async (id, isShow) => {
    const conn = await getMySqlPromiseConnection();

    try {
      const sql = `
        UPDATE menu_items
        SET is_show = ?
        WHERE category = ?;
        `;

      const [result] = await conn.query(sql, [isShow, id]);
      return;
    } catch (error) {
      console.error(error);
      throw error;
    } finally {
      conn.release();
    }
  };