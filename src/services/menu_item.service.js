const { getMySqlPromiseConnection } = require('../config/mysql.db');

exports.addMenuItemDB = async (
  title,
  price,
  netPrice,
  taxId,
  categoryId,
  image,
  isShow,
  isSpecial,
  allowQuantity
) => {
  const conn = await getMySqlPromiseConnection();
  try {
    const sql = `
        INSERT INTO menu_items
        (title, price, net_price, tax_id, category, image, is_show, is_special, allow_quantity)
        VALUES
        (?, ?, ?, ?, ?, ?, ?, ?, ?);
        `;

    const [result] = await conn.query(sql, [
      title,
      price,
      netPrice,
      taxId,
      categoryId,
      image,
      isShow,
      isSpecial,
      allowQuantity,
    ]);

    return result.insertId;
  } catch (error) {
    console.error(error);
    throw error;
  } finally {
    conn.release();
  }
};

exports.updateMenuItemDB = async (
  id,
  title,
  price,
  netPrice,
  taxId,
  categoryId,
  isShow,
  isSpecial,
  allowQuantity
) => {
  const conn = await getMySqlPromiseConnection();
  try {
    const sql = `
        UPDATE menu_items SET
        title = ?, price = ?, net_price = ?, tax_id = ?, category = ?, is_show = ?, is_special = ?, allow_quantity = ?
        WHERE id = ?;
        `;

    await conn.query(sql, [
      title,
      price,
      netPrice,
      taxId,
      categoryId,
      isShow,
      isSpecial,
      allowQuantity,
      id,
    ]);

    return;
  } catch (error) {
    console.error(error);
    throw error;
  } finally {
    conn.release();
  }
};

exports.updateMenuItemImageDB = async (id, image) => {
  const conn = await getMySqlPromiseConnection();
  try {
    const sql = `
        UPDATE menu_items SET
        image = ?
        WHERE id = ?;
        `;

    await conn.query(sql, [image, id]);

    return;
  } catch (error) {
    console.error(error);
    throw error;
  } finally {
    conn.release();
  }
};

exports.deleteMenuItemDB = async (id) => {
  const conn = await getMySqlPromiseConnection();
  try {
    const sql = `
        DELETE FROM menu_items
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

exports.getAllMenuItemsDB = async () => {
  const conn = await getMySqlPromiseConnection();
  try {
    const sql = `
        SELECT
        i.id, i.title, price, net_price, tax_id, t.title AS tax_title, t.rate AS tax_rate, t.type AS tax_type, category as category_id, c.title AS category_title, image, is_show, is_special, allow_quantity
        FROM menu_items i
        LEFT JOIN taxes t
        ON i.tax_id = t.id
        LEFT JOIN categories c
        ON i.category = c.id;
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

exports.getAllMenuItemsDBTrue = async () => {
  const conn = await getMySqlPromiseConnection();
  try {
    const sql = `
        SELECT
    i.id,
    i.title,
    i.price,
    i.net_price,
    i.tax_id,
    t.title AS tax_title,
    t.rate AS tax_rate,
    t.type AS tax_type,
    i.category AS category_id,
    c.title AS category_title,
    i.image,
    i.is_show,
    i.is_special,
    (i.allow_quantity - (
        SELECT IFNULL(SUM(oi.quantity), 0)
        FROM order_items oi
        WHERE oi.item_id = i.id
        AND oi.date >= CURDATE()
        AND oi.date < CURDATE() + INTERVAL 1 DAY
        AND oi.status <> 'cancelled'
    )) AS allow_quantity
FROM
    menu_items i
LEFT JOIN
    taxes t ON i.tax_id = t.id
LEFT JOIN
    categories c ON i.category = c.id
WHERE
    i.is_show = 1;
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

exports.getMenuItemDB = async (id) => {
  const conn = await getMySqlPromiseConnection();
  try {
    const sql = `
        SELECT
        i.id, i.title, price, net_price, tax_id, t.title AS tax_title, t.rate AS tax_rate, t.type AS tax_type, category as category_id, c.title AS category_title, image, is_show, is_special, allow_quantity
        FROM menu_items i
        LEFT JOIN taxes t
        ON i.tax_id = t.id
        LEFT JOIN categories c
        ON i.category = c.id
        WHERE i.id = ?
        `;

    const [result] = await conn.query(sql, [id]);
    return result[0];
  } catch (error) {
    console.error(error);
    throw error;
  } finally {
    conn.release();
  }
};

/**
 * @param {number} itemId Menu Item ID to add Addon
 * @param {string} title Title of Addon
 * @param {number} price Additonal Price for addon, Put 0 / null to make addon as free option
 * @returns {Promise<number>}
 *  */
exports.addMenuItemAddonDB = async (itemId, title, price, showAddons) => {
  const conn = await getMySqlPromiseConnection();
  try {
    const sql = `
        INSERT INTO menu_item_addons
        (item_id, title, price, show_addons)
        VALUES
        (?, ?, ?, ?);
        `;

    const [result] = await conn.query(sql, [itemId, title, price, showAddons]);
    return result.insertId;
  } catch (error) {
    console.error(error);
    throw error;
  } finally {
    conn.release();
  }
};

/**
 * @param {number} itemId Menu Item ID
 * @param {number} addonId Addon ID
 * @param {string} title Title of Addon
 * @param {number} price Additonal Price for addon, Put 0 / null to make addon as free option
 * @returns {Promise<void>}
 *  */
exports.updateMenuItemAddonDB = async (
  itemId,
  addonId,
  title,
  price,
  showAddons
) => {
  const conn = await getMySqlPromiseConnection();
  try {
    const sql = `
        UPDATE menu_item_addons
        SET
        title = ?,
        price = ?,
        show_addons = ?
        WHERE id = ? AND item_id = ?
        `;

    await conn.query(sql, [title, price, showAddons, addonId, itemId]);
    return;
  } catch (error) {
    console.error(error);
    throw error;
  } finally {
    conn.release();
  }
};


/**
 * @param {number} itemId Menu Item ID
 * @param {number} addonId Addon ID
 * @returns {Promise<void>}
 *  */
exports.deleteMenuItemAddonDB = async (itemId, addonId) => {
  const conn = await getMySqlPromiseConnection();
  try {
    const sql = `
        DELETE FROM menu_item_addons
        WHERE id = ? AND item_id = ?;
        `;

    await conn.query(sql, [addonId, itemId]);

    return;
  } catch (error) {
    console.error(error);
    throw error;
  } finally {
    conn.release();
  }
};

/**
 * @param {number} itemId Menu Item ID
 * @param {number} addonId Addon ID
 * @returns {Promise<Array>}
 *  */
exports.getMenuItemAddonsDB = async (itemId) => {
  const conn = await getMySqlPromiseConnection();
  try {
    const sql = `
        SELECT id, item_id, title, price, show_addons FROM menu_item_addons
        WHERE item_id = ?;
        `;

    const [result] = await conn.query(sql, [itemId]);

    return result;
  } catch (error) {
    console.error(error);
    throw error;
  } finally {
    conn.release();
  }
};

exports.getAllAddonsDB = async () => {
  const conn = await getMySqlPromiseConnection();
  try {
    const sql = `
        SELECT id, item_id, title, price, show_addons FROM menu_item_addons WHERE show_addons = 1;
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

/**
 * @param {number} itemId Menu Item ID to add Variant
 * @param {string} title Title of Variant
 * @param {number} price Additonal Price for Variant, Put 0 / null to make Variant as free option
 * @returns {Promise<number>}
 *  */
exports.addMenuItemVariantDB = async (itemId, title, price, showVariant) => {
  const conn = await getMySqlPromiseConnection();
  try {
    const sql = `
        INSERT INTO menu_item_variants
        (item_id, title, price, show_variant)
        VALUES
        (?, ?, ?, ?);
        `;

    const [result] = await conn.query(sql, [itemId, title, price, showVariant]);

    return result.insertId;
  } catch (error) {
    console.error(error);
    throw error;
  } finally {
    conn.release();
  }
};

exports.updateMenuItemVariantDB = async (itemId, variantId, title, price, showVariant) => {
  const conn = await getMySqlPromiseConnection();
  try {
    const sql = `
        UPDATE menu_item_variants
        SET
        title = ?,
        price = ?,
        show_variant = ?  -- New field
        WHERE item_id = ? AND id = ?
        `;

    await conn.query(sql, [title, price, showVariant, itemId, variantId]);
    return;
  } catch (error) {
    console.error(error);
    throw error;
  } finally {
    conn.release();
  }
};


exports.deleteMenuItemVariantDB = async (itemId, variantId) => {
  const conn = await getMySqlPromiseConnection();
  try {
    const sql = `
        DELETE FROM menu_item_variants
        WHERE item_id = ? AND id = ?
        `;

    await conn.query(sql, [itemId, variantId]);

    return;
  } catch (error) {
    console.error(error);
    throw error;
  } finally {
    conn.release();
  }
};

exports.getMenuItemVariantsDB = async (itemId) => {
  const conn = await getMySqlPromiseConnection();
  try {
    const sql = `
        SELECT id, item_id, title, price, show_variant FROM menu_item_variants
        WHERE item_id = ?;
        `;

    const [result] = await conn.query(sql, [itemId]);

    return result;
  } catch (error) {
    console.error(error);
    throw error;
  } finally {
    conn.release();
  }
};
exports.getAllVariantsDB = async () => {
  const conn = await getMySqlPromiseConnection();
  try {
    const sql = `
        SELECT id, item_id, title, price, show_variant FROM menu_item_variants WHERE show_variant = 1;
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

exports.toggleShowDishDB = async (id, isShow) => {
  const conn = await getMySqlPromiseConnection();

  try {
    const sql = `
      UPDATE menu_items
      SET is_show = ?
      WHERE id = ?;
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

exports.toggleShowAddonsDB = async (id, showAddons) => {
  const conn = await getMySqlPromiseConnection();

  try {
    const sql = `
      UPDATE menu_item_addons
      SET show_addons = ?
      WHERE id = ?;
      `;

    const [result] = await conn.query(sql, [showAddons, id]);
    return;
  } catch (error) {
    console.error(error);
    throw error;
  } finally {
    conn.release();
  }
};





exports.toggleShowVariantDB = async (id, showVariant) => {
  const conn = await getMySqlPromiseConnection();

  try {
    const sql = `
      UPDATE menu_item_variants
      SET show_variant = ?
      WHERE id = ?;
      `;

    const [result] = await conn.query(sql, [showVariant, id]);
    return;
  } catch (error) {
    console.error(error);
    throw error;
  } finally {
    conn.release();
  }
};