const { getKitchenOrdersDB, updateOrderItemStatusDB } = require("../services/kitchen.service");
const { parseOrderAddons } = require("../utils/orderAddons");

exports.getKitchenOrders = async (req, res) => {
  try {
    const {
      addons,
      kitchenOrders,
      kitchenOrdersItems,
      storeSettings,
      printSettings,
    } = await getKitchenOrdersDB();

    const formattedOrders = kitchenOrders.map((order)=>{
      const orderItems = kitchenOrdersItems.filter((oi)=>oi.order_id == order.id);

      orderItems.forEach((oi, index)=>{
        const { ids: addonsIds, quantityMode } = parseOrderAddons(oi?.addons);

        if (addonsIds.length > 0) {
          const itemAddons = addonsIds.map((addonId)=>{
            const addon = addons.filter((a)=>a.id == addonId);
            return addon[0];
          });
          orderItems[index].addons = [...itemAddons];
        }
        orderItems[index].addonsQuantityMode = quantityMode;
      });

      const orderTotals = orderItems.reduce(
        (totals, item) => {
          if (item.status === "cancelled") {
            return totals;
          }

          const quantity = Number(item.quantity) || 0;
          const baseUnitPrice = Number(item.variant_price ?? item.price) || 0;
          const itemPrice = baseUnitPrice * quantity;
          const addonsTotal = (item.addons || []).reduce(
            (sum, addon) => sum + (Number(addon?.price) || 0),
            0
          );
          const addonMultiplier =
            item.addonsQuantityMode === "total" ? 1 : quantity;
          const addonsPrice = addonsTotal * addonMultiplier;
          const taxRate = Number(item.tax_rate) || 0;
          const taxType = item.tax_type;
          let itemTax = 0;
          let itemSubtotal = itemPrice + addonsPrice;
          let itemTotal = itemPrice + addonsPrice;

          if (taxType === "exclusive") {
            itemTax = (itemPrice * taxRate) / 100;
            itemTotal += itemTax;
          } else if (taxType === "inclusive") {
            itemTax = itemPrice - itemPrice * (100 / (100 + taxRate));
            itemSubtotal -= itemTax;
          }

          totals.subtotal += itemSubtotal;
          totals.taxTotal += itemTax;
          totals.total += itemTotal;
          return totals;
        },
        { subtotal: 0, taxTotal: 0, total: 0 }
      );

      return {
        ...order,
        items: orderItems,
        ...orderTotals,
        storeSettings,
        printSettings,
      }
    })

    return res.status(200).json(formattedOrders);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong! Please try later!",
    });
  }
};

exports.updateKitchenOrderItemStatus = async (req, res) => {
  try {
    const orderItemId = req.params.id;
    const { status } = req.body

    if(!status) {
      return res.status(400).json({
        success: false,
        message: "Invalid Request!"
      });
    }

    await updateOrderItemStatusDB(orderItemId, status)

    return res.status(200).json({
      success: true,
      message: "Đã cập nhật trạng thái món ăn!"
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong! Please try later!",
    });
  }
};