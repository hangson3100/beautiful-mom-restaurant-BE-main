const { getKitchenOrdersDB, updateOrderItemStatusDB } = require("../services/kitchen.service");
const { parseOrderAddons } = require("../utils/orderAddons");

exports.getKitchenOrders = async (req, res) => {
  try {
    const {addons,kitchenOrders,kitchenOrdersItems} = await getKitchenOrdersDB();

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

      return {
        ...order,
        items: orderItems
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