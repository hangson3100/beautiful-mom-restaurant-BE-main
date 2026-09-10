const axios = require('axios');// Ham gui tin nhan tin den Telegram
const { getMySqlPromiseConnection } = require('../config/mysql.db');
const {
  getAllMenuItemsDB,
  getAllAddonsDB,
  getAllVariantsDB,
  getAllMenuItemsDBTrue,
} = require('../services/menu_item.service');
const {
  getStoreSettingDB,
  getCategoriesDB,
} = require('../services/settings.service');
const { createOrderDB } = require('../services/pos.service');
const { getActive: getActiveDeliveryTimeSlots } = require('../services/deliveryTimeSlot.service');

const parseTimeToMinutes = (value) => {
  const match = String(value || '').trim().match(/^(0?[1-9]|1[0-2]):([0-5][0-9])\s?(AM|PM)$/i);
  if (!match) return null;

  let hours = Number(match[1]) % 12;
  if (match[3].toUpperCase() === 'PM') hours += 12;
  return hours * 60 + Number(match[2]);
};

const getVietnamCurrentMinutes = () => {
  const time = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour: 'numeric',
    minute: 'numeric',
    hourCycle: 'h23',
  }).formatToParts(new Date());
  return Number(time.find((part) => part.type === 'hour')?.value) * 60
    + Number(time.find((part) => part.type === 'minute')?.value);
};
const {
  addCustomerDB,
  searchCustomerDB,
  updateCustomerAddressDB,
} = require('../services/customer.service');
/* Cau truc tin nhan*/
const sendTelegramNotification = (cart, deliveryType, tableId, reqBody = {}) => {
  setTimeout(async () => {
    try {
      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      const chatId = process.env.TELEGRAM_CHAT_ID;
      if (!botToken || !chatId) return;

      // Trích xuất thông tin khách hàng từ request (hỗ trợ nhiều định dạng gửi từ Frontend)
      const cusName = reqBody?.customerName || reqBody?.customerId?.name || 'Khách vãng lai';
      const cusPhone = reqBody?.customerPhone || reqBody?.customerId?.phone || 'Không có SĐT';
      const cusAddress = reqBody?.deliveryAddress || reqBody?.address || reqBody?.customerId?.address || 'Không có địa chỉ';
      const rcvTime = reqBody?.receiveTime || reqBody?.customerId?.receiveTime || 'Chưa chọn';
      const normalizedDeliveryType = String(deliveryType || '').trim().toLowerCase();

      let message = `🚨 <b>CÓ ĐƠN HÀNG MỚI!</b> 🚨\n\n`;

      // Phân loại hiển thị theo hình thức phục vụ
      if (normalizedDeliveryType === 'dine_in' || normalizedDeliveryType === 'dùng tại bàn') {
        message += `📍 <b>Hình thức:</b> Dùng tại bàn\n`;
        message += `🪑 <b>Bàn số:</b> ${tableId || 'Chưa chọn bàn'}\n`;
      } 
      else if (normalizedDeliveryType === 'delivery' || normalizedDeliveryType === 'giao hàng') {
        message += `📍 <b>Hình thức:</b> Giao hàng tận nơi\n`;
        message += `👤 <b>Khách hàng:</b> ${cusName} - ${cusPhone}\n`;
        message += `🏠 <b>Địa chỉ:</b> ${cusAddress}\n`;
        message += `⏰ <b>Thời gian nhận:</b> ${rcvTime}\n`;
      } 
      else if (normalizedDeliveryType === 'pickup' || normalizedDeliveryType === 'tự mang đi') {
        message += `📍 <b>Hình thức:</b> Khách tự đến lấy\n`;
        message += `👤 <b>Khách hàng:</b> ${cusName} - ${cusPhone}\n`;
        message += `⏰ <b>Thời gian nhận:</b> ${rcvTime}\n`;
      } 
      else {
        message += `📍 <b>Hình thức:</b> ${deliveryType || 'Không xác định'}\n`;
      }
      
      message += `\n📝 <b>CHI TIẾT MÓN:</b>\n`;
      cart.forEach((item, index) => {
        const itemTitle = item.title || item.item_title || item.name || `Món #${item.id || index + 1}`;
        message += `${index + 1}. ${itemTitle} (x${item.quantity || 1})\n`;
        if (Array.isArray(item.addons) && item.addons.length > 0) {
          const addonCounts = item.addons.reduce((counts, addon) => {
            if (!addon.title) return counts;
            counts[addon.id || addon.title] = {
              title: addon.title,
              quantity: (counts[addon.id || addon.title]?.quantity || 0) + 1,
            };
            return counts;
          }, {});
          const addonText = Object.values(addonCounts)
            .map(({ title, quantity }) => `${title}${quantity > 1 ? ` (x${quantity})` : ''}`)
            .join(', ');
          if (addonText) message += `   <b>Món phụ:</b> ${addonText}\n`;
        }
        if (item.notes) message += `   <i>- Ghi chú: ${item.notes}</i>\n`;
      });

      const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
      await axios.post(telegramUrl, {
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML'
      });
      
    } catch (error) {
      console.error("Lỗi gửi tin nhắn Telegram:", error.message);
    }
  }, 0);
};
exports.getQRMenuInit = async (req, res) => {
  try {
    const [categories, storeSettings, deliveryTimeSlots] = await Promise.all([
      getCategoriesDB(),
      getStoreSettingDB(),
      getActiveDeliveryTimeSlots(),
    ]);

    const [menuItems, addons, variants] = await Promise.all([
      getAllMenuItemsDBTrue(),
      getAllAddonsDB(),
      getAllVariantsDB(),
    ]);

    const formattedMenuItems = menuItems.map((item) => {
      const itemAddons = addons.filter((addon) => addon.item_id == item.id);
      const itemVariants = variants.filter(
        (variant) => variant.item_id == item.id
      );

      return {
        ...item,
        addons: [...itemAddons],
        variants: [...itemVariants],
      };
    });

    return res.status(200).json({
      categories: categories,
      storeSettings: storeSettings,
      deliveryTimeSlots,
      menuItems: formattedMenuItems,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong! Please try later!',
    });
  }
};

exports.createQRMenuOrder = async (req, res) => {
  try {
    const {
      cart,
      serviceType,
      tableNumber,
      customerName,
      customerPhone,
      deliveryAddress,
      receiveTime,
    } = req.body;

    if (!Array.isArray(cart) || cart.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Đơn hàng đang trống!',
      });
    }

    if (!serviceType ||
      (serviceType === 'DINE_IN' && !tableNumber) ||
      (serviceType !== 'DINE_IN' && (!customerName || !customerPhone)) ||
      (serviceType !== 'DINE_IN' && !receiveTime) ||
      (serviceType === 'DELIVERY' && !deliveryAddress)) {
      return res.status(400).json({ success: false, message: 'Vui lòng điền đủ thông tin nhận món!' });
    }

    if (serviceType !== 'DINE_IN') {
      const activeSlots = await getActiveDeliveryTimeSlots();
      const selectedSlot = activeSlots.find((slot) => slot.title === receiveTime);
      const cutoffMinutes = parseTimeToMinutes(selectedSlot?.cutoff_time);

      if (!selectedSlot || cutoffMinutes === null) {
        return res.status(400).json({ success: false, message: 'Khung giờ nhận không hợp lệ hoặc đã bị tắt.' });
      }

      if (getVietnamCurrentMinutes() >= cutoffMinutes) {
        return res.status(400).json({ success: false, message: 'Khung giờ nhận này đã quá giờ chốt đơn. Vui lòng chọn khung giờ khác.' });
      }
    }

    if (serviceType !== 'DINE_IN') {
      const existingCustomer = await searchCustomerDB(customerPhone);
      const matchedCustomer = existingCustomer.find(
        (customer) => customer.phone === customerPhone
      );
      if (!matchedCustomer) {
        await addCustomerDB(
          customerPhone,
          customerName,
          null,
          null,
          null,
          0,
          deliveryAddress
        );
      } else if (deliveryAddress) {
        await updateCustomerAddressDB(customerPhone, deliveryAddress);
      }
    }

    const deliveryTypes = {
      DINE_IN: 'dùng tại bàn',
      DELIVERY: 'giao hàng',
      PICKUP: 'tự mang đi',
    };
   /* const orderNotes = [
      customerName && `Khách: ${customerName}`,
      customerPhone && `SĐT: ${customerPhone}`,
      receiveTime && `Thời gian nhận: ${receiveTime}`,
    ].filter(Boolean).join(' | ');*/
    const orderCart = cart.map((item) => ({ ...item, notes: item.notes || null  }));
    const result = await createOrderDB(
      orderCart,
      deliveryTypes[serviceType],
      serviceType === 'DINE_IN' ? 'WALKIN' : 'CUSTOMER',
      customerPhone || null,
      serviceType === 'DINE_IN' ? tableNumber : null,
      'Đợi thanh toán',
      null,
      receiveTime
    );

    req.app.get('io')?.emit('new_order', result.tokenNo, result.orderId);

    sendTelegramNotification(
      cart,
      deliveryTypes[serviceType],
      serviceType === 'DINE_IN' ? tableNumber : null,
      req.body
    );// Gọi hàm gửi tin nhắn Telegram

    return res.status(200).json({
      success: true,
      message: `Đơn hàng đã được tạo. Token: ${result.tokenNo}`,
      tokenNo: result.tokenNo,
      orderId: result.orderId,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Không thể tạo đơn hàng, vui lòng thử lại sau!',
    });
  }
};

exports.getQRMenuOrdersStatuses = async (req, res) => {
  try {
    const payload = Array.isArray(req.body) ? req.body : req.body?.orderIds;
    const orderIds = Array.isArray(payload)
      ? payload
          .map((id) => Number(id))
          .filter((id) => Number.isFinite(id) && id > 0)
      : [];

    if (orderIds.length === 0) {
      return res.status(200).json({ success: true, statuses: [] });
    }

    const uniqueOrderIds = [...new Set(orderIds)];
    const conn = await getMySqlPromiseConnection();
    const placeholders = uniqueOrderIds.map(() => '?').join(',');

    const [orderRows] = await conn.query(
      `SELECT id, payment_status FROM orders WHERE id IN (${placeholders})`,
      uniqueOrderIds
    );

    const [itemRows] = await conn.query(
      `SELECT order_id, status FROM order_items WHERE order_id IN (${placeholders})`,
      uniqueOrderIds
    );

    const orderMap = new Map(orderRows.map((row) => [row.id, row]));
    const itemStatusMap = new Map();
    itemRows.forEach((row) => {
      const existing = itemStatusMap.get(row.order_id) || [];
      existing.push(row.status);
      itemStatusMap.set(row.order_id, existing);
    });

    const statuses = uniqueOrderIds.map((orderId) => {
      const order = orderMap.get(orderId);
      const statusesForOrder = itemStatusMap.get(orderId) || [];
      const hasPaid = String(order?.payment_status || '').toLowerCase() === 'paid'
        || String(order?.payment_status || '').trim().toLowerCase() === 'đã thanh toán';
      const hasCompleted = statusesForOrder.some((status) => ['completed', 'delivered'].includes(status));
      const hasPreparing = statusesForOrder.some((status) => status === 'preparing');

      let statusLabel = 'Chờ xác nhận';
      if (hasPaid) {
        statusLabel = 'Đã thanh toán';
      } else if (hasCompleted) {
        statusLabel = 'Đang giao';
      } else if (hasPreparing) {
        statusLabel = 'Đang thực hiện';
      }

      return {
        orderId,
        statusLabel,
      };
    });

    return res.status(200).json({ success: true, statuses });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Không thể đồng bộ trạng thái đơn hàng!' });
  }
};

exports.searchQRMenuCustomers = async (req, res) => {
  try {
    const query = String(req.query.q || '').trim();
    if (!query) return res.status(200).json([]);
    return res.status(200).json(await searchCustomerDB(query));
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Không thể tìm khách hàng!' });
  }
};
