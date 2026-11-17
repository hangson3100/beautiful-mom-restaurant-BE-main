const {
  getInvoicesDB,
  getInvoiceOrdersDB,
  searchInvoicesDB,
} = require("../services/invoice.service");
const {
  getPrintSettingDB,
  getStoreSettingDB,
} = require("../services/settings.service");
const { parseOrderAddons } = require("../utils/orderAddons");

exports.getInvoicesInit = async (req, res) => {
  try {
    const [printSettings, storeSettings] = await Promise.all([
      getPrintSettingDB(),
      getStoreSettingDB(),
    ]);

    return res.status(200).json({
      printSettings,
      storeSettings,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong! Please try later!",
    });
  }
};

exports.getInvoices = async (req, res) => {
  try {
    const from = req.query.from || null;
    const to = req.query.to || null;
    const type = req.query.type || 'hôm_nay';

    if (type == "custom") {
      if (!(from && to)) {
        return res.status(400).json({
          success: false,
          message: "Please provide required details from & to dates!",
        });
      }
    }

    const result = await getInvoicesDB(type, from, to);

    if (result.length > 0) {
      // format the result
      const invoices = [];

      for (let index = 0; index < result.length; index++) {
        const invoice = result[index];
        const {
          invoice_id,
          created_at,
          sub_total,
          tax_total,
          total,
          table_id,
          table_title,
          floor,
          order_id,
          payment_status,
          token_no,
          delivery_type,
          customer_type,
          customer_id,
          name,
          email,
          payment_type_title,
        } = invoice;

        const existingInvoiceId = invoices.findIndex(
          (i) => i.invoice_id == invoice_id
        );

        if (existingInvoiceId == -1) {
          invoices.push({
            invoice_id,
            created_at,
            sub_total,
            tax_total,
            total,
            table_id,
            table_title,
            floor,
            delivery_type,
            customer_type,
            customer_id,
            name,
            email,
            payment_type_title,
            orders: [{ order_id, payment_status, token_no }],
          });
        } else {
          invoices[existingInvoiceId].orders.push({
            order_id,
            payment_status,
            token_no,
          });
        }
      }

      return res.status(200).json(invoices);
    } else {
      return res.status(200).json([]);
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong! Please try later!",
    });
  }
};

exports.searchInvoices = async (req, res) => {
  try {
    const searchString = req.query.q;

    if (!searchString) {
      return res.status(400).json({
        success: false,
        message: "Please provide required details!",
      });
    }

    const result = await searchInvoicesDB(searchString);

    if (result.length > 0) {
      // format the result
      const invoices = [];

      for (let index = 0; index < result.length; index++) {
        const invoice = result[index];
        const {
          invoice_id,
          created_at,
          sub_total,
          tax_total,
          total,
          payment_type_title,
          table_id,
          table_title,
          floor,
          order_id,
          payment_status,
          token_no,
          delivery_type,
          customer_type,
          customer_id,
          name,
          email,
        } = invoice;

        const existingInvoiceId = invoices.findIndex(
          (i) => i.invoice_id == invoice_id
        );

        if (existingInvoiceId == -1) {
          invoices.push({
            invoice_id,
            created_at,
            sub_total,
            tax_total,
            total,
            payment_type_title,
            table_id,
            table_title,
            floor,
            delivery_type,
            customer_type,
            customer_id,
            name,
            email,
            orders: [{ order_id, payment_status, token_no }],
          });
        } else {
          invoices[existingInvoiceId].orders.push({
            order_id,
            payment_status,
            token_no,
          });
        }
      }

      return res.status(200).json(invoices);
    } else {
      return res.status(200).json([]);
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong! Please try later!",
    });
  }
};

exports.getInvoiceOrders = async (req, res) => {
  try {
    const orderIds = req.body.orderIds;

    if (!orderIds || orderIds?.length == 0) {
      return res.status(400).JSON({
        success: false,
        message: "Invalid Request!",
      });
    }

    const orderIdsParams = orderIds.join(",");

    const { kitchenOrders, kitchenOrdersItems, addons } =
      await getInvoiceOrdersDB(orderIdsParams);

    const formattedOrders = kitchenOrders.map((order) => {
      const orderItems = kitchenOrdersItems.filter(
        (oi) => oi.order_id == order.id
      );

      orderItems.forEach((oi, index) => {
        const { ids: addonsIds, quantityMode } = parseOrderAddons(oi?.addons);

        if (addonsIds.length > 0) {
          const itemAddons = addonsIds.map((addonId) => {
            const addon = addons.filter((a) => a.id == addonId);
            return addon[0];
          });
          orderItems[index].addons = [...itemAddons];
        }
        orderItems[index].addonsQuantityMode = quantityMode;
      });

      return {
        ...order,
        items: orderItems,
      };
    });

    // calculate summary
    let subtotal = 0;
    let taxTotal = 0;
    let total = 0;

    for (const order of formattedOrders) {
      const items = order.items;

      for (let index = 0; index < items.length; index++) {
        const item = items[index];

        const {
          variant_price,
          price,
          tax_rate,
          tax_type: taxType,
          quantity,
          addons,
        } = item;

        const taxRate = Number(tax_rate);

        let addonsTotal = 0;
        if(addons) {
          for (const addon of addons) {
            addonsTotal += Number(addon.price)
          }
        }

        const itemPrice =
          Number(variant_price ? variant_price : price) * Number(quantity);

        if (taxType == "exclusive") {
          const tax = (itemPrice * taxRate) / 100;
          const priceWithTax = itemPrice + tax;

          taxTotal += tax;
          const addonMultiplier = item.addonsQuantityMode === 'total' ? 1 : quantity;
          subtotal += itemPrice + addonsTotal * addonMultiplier;
          total += priceWithTax + addonsTotal * addonMultiplier;

          items[index].itemTotal = priceWithTax / quantity + (addonsTotal * addonMultiplier / quantity);
          items[index].price = items[index].itemTotal;
        } else if (taxType == "inclusive") {
          const tax = itemPrice - itemPrice * (100 / (100 + taxRate));
          const priceWithoutTax = itemPrice - tax;

          taxTotal += tax;
          const addonMultiplier = item.addonsQuantityMode === 'total' ? 1 : quantity;
          subtotal += priceWithoutTax + addonsTotal * addonMultiplier;
          total += itemPrice + addonsTotal * addonMultiplier;

          items[index].itemTotal = itemPrice / quantity + (addonsTotal * addonMultiplier / quantity);
          items[index].price = items[index].itemTotal;
        } else {
          const addonMultiplier = item.addonsQuantityMode === 'total' ? 1 : quantity;
          subtotal += itemPrice + addonsTotal * addonMultiplier;
          total += itemPrice + addonsTotal * addonMultiplier;

          items[index].itemTotal = itemPrice / quantity + (addonsTotal * addonMultiplier / quantity);
          items[index].price = items[index].itemTotal;
        }
      }
    }
    // calculate summary

    return res.status(200).json({
      subtotal,
      taxTotal,
      total,
      orders: formattedOrders,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong! Please try later!",
    });
  }
};
