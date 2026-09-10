const { getMySqlPromiseConnection } = require("../config/mysql.db")

exports.createOrderDB = async (cartItems, deliveryType, customerType, customerId, tableId, paymentStatus = 'Đợi thanh toán', invoiceId=null, receiveTime=null) => {
  const conn = await getMySqlPromiseConnection();

  try {
    // start transaction
    await conn.beginTransaction();

    // step 1: get current token no. from table token_sequences
    // if no data found give 0
    let tokenNo = 0;

    const [tokenSequence] = await conn.query("SELECT sequence_no, last_updated FROM token_sequences LIMIT 1 FOR UPDATE");
    tokenNo = tokenSequence[0]?.sequence_no || 0;
    const tokenLastUpdated = tokenSequence[0]?.last_updated ? new Date(tokenSequence[0]?.last_updated).toISOString().substring(0, 10) : new Date().toISOString().substring(0,10);

    const today = new Date().toISOString().substring(0,10);

    if(tokenLastUpdated != today) {
      tokenNo = 0;
    }

    // step 2: increase the token no. by +1
    tokenNo += 1;

    // step 3: save data to orders table
    const [orderResult] = await conn.query(`INSERT INTO orders (delivery_type, receive_time, customer_type, customer_id, table_id, token_no, payment_status, invoice_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [deliveryType, receiveTime || null, customerType, customerId, tableId, tokenNo, paymentStatus || 'Đợi thanh toán', invoiceId || null]);

    const orderId = orderResult.insertId;

    // step 4: save data to order_items
    const sqlOrderItems = `
    INSERT INTO order_items
    (order_id, item_id, variant_id, price, quantity, notes, addons)
    VALUES ?
    `;

    await conn.query(sqlOrderItems, [cartItems.map((item)=>[orderId, item.id, item.variant_id, item.price, item.quantity, item.notes, item?.addons_ids?.length > 0 ? JSON.stringify(item.addons_ids):null ])]);

    // step 6: Save updated token no. to table token_sequences
    await conn.query("INSERT INTO token_sequences (id, sequence_no, last_updated) VALUES (1, ?, ?) ON DUPLICATE KEY UPDATE sequence_no = VALUES(sequence_no), last_updated = VALUES(last_updated) ;", [tokenNo, today]);

    // step 7: commit transaction / if any exception occurs then rollback
    await conn.commit();

    return {
      tokenNo,
      orderId
    }
  } catch (error) {
    console.error(error);
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
};