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

const ensureInvoicePaymentColumns = async (conn) => {
  try {
    const [columns] = await conn.query(
      `SHOW COLUMNS FROM invoices LIKE 'payment_type_id'`
    );

    if (columns.length === 0) {
      await conn.query(
        `ALTER TABLE invoices ADD COLUMN payment_type_id INT NULL AFTER total`
      );
    }

    const [statusColumns] = await conn.query(
      `SHOW COLUMNS FROM invoices LIKE 'payment_status'`
    );

    if (statusColumns.length === 0) {
      await conn.query(
        `ALTER TABLE invoices ADD COLUMN payment_status VARCHAR(50) NULL AFTER payment_type_id`
      );
    }
  } catch (error) {
    const message = error?.message || '';
    if (!/already exists|Duplicate column/i.test(message)) {
      throw error;
    }
  }
};

exports.createInvoiceDB = async (
  subtotal,
  taxTotal,
  total,
  date,
  paymentTypeId = null,
  paymentStatus = 'Đã thanh toán'
) => {
  const conn = await getMySqlPromiseConnection();
  try {
    await ensureInvoicePaymentColumns(conn);

    const sqlWithPayment = `
    INSERT INTO invoices
    (sub_total, tax_total, total, created_at, payment_type_id, payment_status)
    VALUES
    (?, ?, ?, ?, ?, ?)
    `;

    const params = [subtotal, taxTotal, total, date, paymentTypeId, paymentStatus];

    try {
      const [result] = await conn.query(sqlWithPayment, params);
      return result.insertId;
    } catch (schemaError) {
      const isLegacySchema =
        schemaError?.code === 'ER_BAD_FIELD_ERROR' ||
        /payment_type_id|payment_status/i.test(schemaError?.message || '');

      if (!isLegacySchema) {
        throw schemaError;
      }

      const legacySql = `
      INSERT INTO invoices
      (sub_total, tax_total, total, created_at)
      VALUES
      (?, ?, ?, ?)
      `;

      const [legacyResult] = await conn.query(legacySql, [subtotal, taxTotal, total, date]);
      return legacyResult.insertId;
    }
  } catch (error) {
    console.error(error);
    throw error;
  } finally {
    conn.release();
  }
}

exports.completeOrdersAndSaveInvoiceIdDB = async (
  orderIds,
  invoiceId,
  paymentStatus = 'Đã thanh toán'
) => {
  const conn = await getMySqlPromiseConnection();
  try {

    const orderIdsText = orderIds.join(",");

    const sql = `
    UPDATE orders SET
    status = 'completed', payment_status = ?, invoice_id = ?
    WHERE id IN (${orderIdsText});
    `;

    await conn.query(sql, [paymentStatus, invoiceId]);

    return;
  } catch (error) {
    console.error(error);
    throw error;
  } finally {
    conn.release();
  }
}