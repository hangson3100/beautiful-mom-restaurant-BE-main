const axios = require('axios');// Ham gui tin nhan tin den Telegram
const {
  getCategoriesDB,
  getPaymentTypesDB,
  getPrintSettingDB,
  getStoreSettingDB,
  getStoreTablesDB,
} = require('../services/settings.service');
const {
  getAllMenuItemsDB,
  getAllMenuItemsDBTrue,
  getAllAddonsDB,
  getAllVariantsDB,
} = require('../services/menu_item.service');
const { createOrderDB } = require('../services/pos.service');
const { createInvoiceDB } = require('../services/orders.service');
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
exports.getPOSInitData = async (req, res) => {
  try {
    const [
      categories,
      paymentTypes,
      printSettings,
      storeSettings,
      storeTables,
    ] = await Promise.all([
      getCategoriesDB(),
      getPaymentTypesDB(true),
      getPrintSettingDB(),
      getStoreSettingDB(),
      getStoreTablesDB(),
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

    const normalizedStoreSettings = {
      ...(storeSettings || {}),
      storeName: storeSettings?.storeName ?? storeSettings?.store_name ?? null,
      store_name: storeSettings?.store_name ?? storeSettings?.storeName ?? null,
      isQRMenuEnabled: storeSettings?.isQRMenuEnabled ?? storeSettings?.is_qr_menu_enabled ?? false,
      is_qr_menu_enabled: storeSettings?.is_qr_menu_enabled ?? storeSettings?.isQRMenuEnabled ?? false,
      isPaymentLater: storeSettings?.isPaymentLater ?? storeSettings?.is_payment_later ?? false,
      is_payment_later: storeSettings?.is_payment_later ?? storeSettings?.isPaymentLater ?? false,
    };

    return res.status(200).json({
      categories,
      paymentTypes,
      printSettings,
      storeSettings: normalizedStoreSettings,
      storeTables,
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

exports.createOrder = async (req, res) => {
  try {
    const { cart, deliveryType, customerType, customerId, tableId } = req.body;

    if (cart?.length == 0) {
      return res.status(400).json({
        success: false,
        message: 'Đơn hàng đang trống!',
      });
    }

    const result = await createOrderDB(
      cart,
      deliveryType,
      customerType,
      customerId?.phone || null,
      tableId || null
    );

    // step 8: send event to all subscriber through socket
    sendTelegramNotification(cart, deliveryType, tableId, req.body); // Gọi hàm gửi tin nhắn Telegram
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
      message: 'Error processing the request, please try after sometime!',
    });
  }
};

exports.createOrderAndInvoice = async (req, res) => {
  try {
    const {
      cart,
      deliveryType,
      customerType,
      customerId,
      tableId,
      netTotal,
      taxTotal,
      total,
    } = req.body;

    if (cart?.length == 0) {

      return res.status(400).json({
        success: false,
        message: 'Đơn hàng đang trống!',
      });
    }

    // create invoice
    const now = new Date();
    const date = `${now.getFullYear()}-${(now.getMonth() + 1)
      .toString()
      .padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')} ${now
      .getHours()
      .toString()
      .padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now
      .getSeconds()
      .toString()
      .padStart(2, '0')}`;
    const invoiceId = await createInvoiceDB(netTotal, taxTotal, total, date);
    // create invoice
    const result = await createOrderDB(
      cart,
      deliveryType,
      customerType,
      customerId?.phone || null,
      tableId || null,
      'Đã thanh toán',
      invoiceId
    );
    const orderId = result.orderId;
    const tokenNo = result.tokenNo;

    // step 8: send event to all subscriber through socket
    sendTelegramNotification(cart, deliveryType, tableId, req.body); // Gọi hàm gửi tin nhắn Telegram
    return res.status(200).json({
      success: true,
      message: `Đơn hàng đã được tạo. Token: ${tokenNo}`,
      tokenNo: result.tokenNo,
      orderId: result.orderId,
      invoiceId,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Error processing the request, please try after sometime!',
    });
  }
};
