const { getMySqlPromiseConnection } = require("../config/mysql.db")

exports.getTodaysOrdersCountDB = async () => {
    const conn = await getMySqlPromiseConnection();
    try {

        const sql = `
        SELECT
            count(*) AS todays_orders
        FROM
            orders
        WHERE
            DATE(\`date\`) = CURDATE()
        `;
    
        const [result] = await conn.query(sql);
        return result[0].todays_orders;
    } catch (error) {
        console.error(error);
        throw error;
    } finally {
        conn.release();
    }
};

exports.getTodaysNewCustomerCountDB = async () => {
    const conn = await getMySqlPromiseConnection();
    try {
        const sql = `
        SELECT
            count(*) AS new_customers_count
        FROM
            customers
        WHERE
            DATE(created_at) = CURDATE()
        `;
    
        const [result] = await conn.query(sql);
        return result[0].new_customers_count;
    } catch (error) {
        console.error(error);
        throw error;
    } finally {
        conn.release();
    }
};

exports.getTodaysRepeatCustomerCountDB = async () => {
    const conn = await getMySqlPromiseConnection();
    try {

        const sql = `
        SELECT
            COUNT(*) as todays_repeat_customers
        FROM
            orders
        WHERE
            DATE(\`date\`) = CURDATE()
            AND customer_type = 'CUSTOMER';
        `;
    
        const [result] = await conn.query(sql);

        return result[0].todays_repeat_customers;
    } catch (error) {
        console.error(error);
        throw error;
    } finally {
        conn.release();
    }
};

exports.getTodaysTopSellingItemsDB = async () => {
    const conn = await getMySqlPromiseConnection();
    try {

        const sql = `
        SELECT
            mi.*,
            oi_c.orders_count
        FROM
            menu_items mi
            INNER JOIN (
                SELECT
                    item_id,
                    SUM(quantity) AS orders_count
                FROM
                    order_items
                WHERE
                    status <> 'cancelled'
                    AND DATE(\`date\`) = CURDATE()
                GROUP BY
                    item_id
                LIMIT 50) oi_c ON mi.id = oi_c.item_id
        ORDER BY
            oi_c.orders_count DESC;
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
