const { getMySqlPromiseConnection } = require("../config/mysql.db")

const FREE_ADDON_LIMIT_MESSAGE = "Số lượng món phụ miễn phí (0đ) không được vượt quá số lượng món chính.";

const createOrderValidationError = (message) => {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
};

exports.validateOrderAddons = async (items, dbConnection) => {
  if (!Array.isArray(items) || items.length === 0) {
    throw createOrderValidationError("Đơn hàng đang trống!");
  }

  const normalizedItems = items.map((item) => {
    const mainQuantity = Number(item.quantity);
    if (!Number.isInteger(mainQuantity) || mainQuantity < 1) {
      throw createOrderValidationError("Số lượng món chính không hợp lệ.");
    }

    let addonIds = item.addons_ids;
    if (!Array.isArray(addonIds)) {
      addonIds = Array.isArray(item.addons)
        ? item.addons.flatMap((addon) => {
            const addonQuantity = Number(addon.quantity ?? 1);
            if (!Number.isInteger(addonQuantity) || addonQuantity < 0) {
              throw createOrderValidationError("Số lượng món phụ không hợp lệ.");
            }
            return Array(addonQuantity).fill(addon.id);
          })
        : [];
    }

    const normalizedAddonIds = addonIds.map(Number);
    if (normalizedAddonIds.some((id) => !Number.isInteger(id) || id < 1)) {
      throw createOrderValidationError("Món phụ không hợp lệ.");
    }

    const itemId = Number(item.id);
    if (!Number.isInteger(itemId) || itemId < 1) {
      throw createOrderValidationError("Món chính không hợp lệ.");
    }

    return {
      ...item,
      id: itemId,
      quantity: mainQuantity,
      addons_ids: normalizedAddonIds,
    };
  });

  const addonIds = [...new Set(normalizedItems.flatMap((item) => item.addons_ids))];
  const addonById = new Map();
  if (addonIds.length > 0) {
    const [addons] = await dbConnection.query(
      "SELECT id, item_id, title, price FROM menu_item_addons WHERE id IN (?)",
      [addonIds]
    );
    addons.forEach((addon) => addonById.set(Number(addon.id), addon));
  }

  const itemIds = [...new Set(normalizedItems.map((item) => item.id))];
  const [menuItems] = await dbConnection.query(
    "SELECT id, price FROM menu_items WHERE id IN (?)",
    [itemIds]
  );
  const menuItemById = new Map(menuItems.map((item) => [Number(item.id), item]));

  const variantIds = [...new Set(
    normalizedItems
      .map((item) => Number(item.variant_id))
      .filter((id) => Number.isInteger(id) && id > 0)
  )];
  const variantById = new Map();
  if (variantIds.length > 0) {
    const [variants] = await dbConnection.query(
      "SELECT id, item_id, price FROM menu_item_variants WHERE id IN (?)",
      [variantIds]
    );
    variants.forEach((variant) => variantById.set(Number(variant.id), variant));
  }

  return normalizedItems.map((item) => {
    const menuItem = menuItemById.get(item.id);
    if (!menuItem) {
      throw createOrderValidationError("Món chính không hợp lệ.");
    }

    const variantId = item.variant_id == null ? null : Number(item.variant_id);
    const variant = variantId === null ? null : variantById.get(variantId);
    if (
      variantId !== null &&
      (!variant || Number(variant.item_id) !== item.id)
    ) {
      throw createOrderValidationError("Tùy chọn món chính không hợp lệ.");
    }

    let totalFreeAddons = 0;
    const validatedAddons = item.addons_ids.map((addonId) => {
      const addon = addonById.get(addonId);
      if (!addon || Number(addon.item_id) !== item.id) {
        throw createOrderValidationError("Món phụ không hợp lệ.");
      }

      const addonPrice = Number(addon.price);
      if (!Number.isFinite(addonPrice) || addonPrice < 0) {
        throw new Error(`Giá món phụ không hợp lệ trong cơ sở dữ liệu (ID: ${addonId}).`);
      }
      if (addonPrice === 0) totalFreeAddons += 1;
      return addon;
    });

    if (totalFreeAddons > item.quantity) {
      throw createOrderValidationError(FREE_ADDON_LIMIT_MESSAGE);
    }

    const mainPrice = Number(variant ? variant.price : menuItem.price);
    if (!Number.isFinite(mainPrice) || mainPrice < 0) {
      throw new Error(`Giá món chính không hợp lệ trong cơ sở dữ liệu (ID: ${item.id}).`);
    }

    return {
      ...item,
      price: mainPrice,
      addons_quantity_mode: 'total',
      addons: validatedAddons,
    };
  });
};

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

    await conn.query(sqlOrderItems, [cartItems.map((item) => {
      const addons = item?.addons_ids?.length > 0
        ? item.addons_quantity_mode === 'total'
          ? JSON.stringify({ quantityMode: 'total', ids: item.addons_ids })
          : JSON.stringify(item.addons_ids)
        : null;
      return [
        orderId,
        item.id,
        item.variant_id,
        item.price,
        item.quantity,
        item.notes,
        addons,
      ];
    })]);

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