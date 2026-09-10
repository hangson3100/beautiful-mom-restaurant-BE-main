const { getMySqlPromiseConnection } = require("../config/mysql.db")

exports.getOrdersDB = async () => {
  const conn = await getMySqlPromiseConnection();
  try {

    const sql = `
    SELECT
      o.id,
      o.date,
      o.delivery_type,
      o.customer_type,
      o.customer_id,
      c. \`name\` AS customer_name,
      c.phone AS customer_phone,
      c.address AS customer_address,
      o.table_id,
      st.table_title,
      st. \`floor\`,
      o.status,
      o.payment_status,
      o.token_no
    FROM
      orders o
      LEFT JOIN customers c ON o.customer_id = c.phone
      LEFT JOIN store_tables st ON o.table_id = st.id
    WHERE
      date >= DATE_SUB(NOW(), INTERVAL 1 DAY)
      AND date <= DATE_ADD(NOW(), INTERVAL 1 DAY)
      AND o.status NOT IN ('completed', 'cancelled')
    `;

    const [kitchenOrders] = await conn.query(sql);

    let kitchenOrdersItems = [];
    let addons = [];

    if(kitchenOrders.length > 0) {
      const orderIds = kitchenOrders.map(o=>o.id).join(",");
      const sql2 = `
      SELECT
        oi.id,
        oi.order_id,
        oi.item_id,
        mi.title AS item_title,
        oi.variant_id,
        miv.title as variant_title,
        oi.price,
        oi.quantity,
        oi.status,
        oi.date,
        oi.addons,
        oi.notes
      FROM
        order_items oi
        LEFT JOIN menu_items mi ON oi.item_id = mi.id
        LEFT join menu_item_variants miv ON oi.item_id = miv.item_id AND oi.variant_id = miv.id

      WHERE oi.order_id IN (${orderIds})
      `
      const [kitchenOrdersItemsResult] = await conn.query(sql2);
      kitchenOrdersItems = kitchenOrdersItemsResult;

      const addonIds = [...new Set([...kitchenOrdersItems.flatMap((o)=>o.addons?JSON.parse(o?.addons):[])])].join(",");
      const [addonsResult] = addonIds ? await conn.query(`SELECT id, item_id, title FROM menu_item_addons WHERE id IN (${addonIds});`):[]
      addons = addonsResult;
    }
    return {
      kitchenOrders,
      kitchenOrdersItems,
      addons
    }

  } catch (error) {
    console.error(error);
    throw error;
  } finally {
    conn.release();
}
};

exports.updateOrderItemStatusDB = async (orderItemId, status) => {
  const conn = await getMySqlPromiseConnection();
  try {

    const sql = `
    UPDATE order_items SET
    status = ?
    WHERE id = ?;
    `;

    await conn.query(sql, [status, orderItemId]);

    return;
  } catch (error) {
    console.error(error);
    throw error;
  } finally {
    conn.release();
}
};

exports.cancelOrderDB = async (orderIds) => {
  const conn = await getMySqlPromiseConnection();
  try {

    const orderIdsText = orderIds.join(",");

    const sql = `
    UPDATE orders SET
    status = 'cancelled'
    WHERE id IN (${orderIdsText});
    `;

    await conn.query(sql);
    return;
  } catch (error) {
    console.error(error);
    throw error;
  }
  finally {
    conn.release();
}
};

exports.completeOrderDB = async (orderIds) => {
  const conn = await getMySqlPromiseConnection();
  try {

    const orderIdsText = orderIds.join(",");

    const sql = `
    UPDATE orders SET
    status = 'completed'
    WHERE id IN (${orderIdsText});
    `;

    await conn.query(sql);

    return;
  } catch (error) {
    console.error(error);
    throw error;
  } finally {
    conn.release();
}
};

exports.getOrdersPaymentSummaryDB = async (orderIdsToFindSummary) => {
  const conn = await getMySqlPromiseConnection();
  try {

    const sql = `
    SELECT
      o.id,
      o.date,
      o.delivery_type,
      o.customer_type,
      o.customer_id,
      c. \`name\` AS customer_name,
      c.address AS customer_address,
      o.table_id,
      st.table_title,
      st. \`floor\`,
      o.status,
      o.payment_status,
      o.token_no
    FROM
      orders o
      LEFT JOIN customers c ON o.customer_id = c.phone
      LEFT JOIN store_tables st ON o.table_id = st.id
    WHERE
      date >= DATE_SUB(NOW(), INTERVAL 1 DAY)
      AND date <= DATE_ADD(NOW(), INTERVAL 1 DAY)
      AND o.status NOT IN ('completed', 'cancelled')
      AND o.id IN (${orderIdsToFindSummary})
    `;

    const [kitchenOrders] = await conn.query(sql);

    let kitchenOrdersItems = [];
    let addons = [];

    if(kitchenOrders.length > 0) {
      const orderIds = kitchenOrders.map(o=>o.id).join(",");
      const sql2 = `
      SELECT
        oi.id,
        oi.order_id,
        oi.item_id,
        mi.title AS item_title,
        oi.variant_id,
        miv.title as variant_title,
        miv.price as variant_price,
        mi.price,
        mi.tax_id,
        t.title as tax_title,
        t.rate as tax_rate,
        t.type as tax_type,
        oi.quantity,
        oi.status,
        oi.date,
        oi.addons,
        oi.notes
      FROM
        order_items oi
        LEFT JOIN menu_items mi ON oi.item_id = mi.id
        LEFT JOIN menu_item_variants miv ON oi.item_id = miv.item_id AND oi.variant_id = miv.id
        LEFT JOIN taxes t ON mi.tax_id = t.id

      WHERE oi.order_id IN (${orderIds}) AND oi.status NOT IN ('cancelled')
      `
      const [kitchenOrdersItemsResult] = await conn.query(sql2);
      kitchenOrdersItems = kitchenOrdersItemsResult;

      const addonIds = [...new Set([...kitchenOrdersItems.flatMap((o)=>o.addons?JSON.parse(o?.addons):[])])].join(",");
      const [addonsResult] = addonIds ? await conn.query(`SELECT id, item_id, title, price FROM menu_item_addons WHERE id IN (${addonIds});`):[]
      addons = addonsResult;
    }


    return {
      kitchenOrders,
      kitchenOrdersItems,
      addons
    }

  } catch (error) {
    console.error(error);
    throw error;
  } finally {
    conn.release();
}
};

exports.createInvoiceDB = async (subtotal, taxTotal, total, date) => {
  const conn = await getMySqlPromiseConnection();
  try {

    const sql = `
    INSERT INTO invoices
    (sub_total, tax_total, total, created_at)
    VALUES
    (?, ?, ?, ?)
    `;

    const [result] = await conn.query(sql, [subtotal, taxTotal, total, date]);

    return result.insertId;
  } catch (error) {
    console.error(error);
    throw error;
  } finally {
    conn.release();
  }
}

exports.completeOrdersAndSaveInvoiceIdDB = async (orderIds, invoiceId) => {
  const conn = await getMySqlPromiseConnection();
  try {

    const orderIdsText = orderIds.join(",");

    const sql = `
    UPDATE orders SET
    status = 'completed', payment_status = 'Đã thanh toán', invoice_id = ?
    WHERE id IN (${orderIdsText});
    `;

    await conn.query(sql, [invoiceId]);

    return;
  } catch (error) {
    console.error(error);
    throw error;
  } finally {
    conn.release();
  }
}