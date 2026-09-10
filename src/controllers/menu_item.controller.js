const {
  addMenuItemDB,
  updateMenuItemDB,
  deleteMenuItemDB,
  addMenuItemAddonDB,
  updateMenuItemAddonDB,
  deleteMenuItemAddonDB,
  getMenuItemAddonsDB,
  getAllAddonsDB,
  addMenuItemVariantDB,
  updateMenuItemVariantDB,
  deleteMenuItemVariantDB,
  getMenuItemVariantsDB,
  getAllVariantsDB,
  getAllMenuItemsDB,
  getMenuItemDB,
  updateMenuItemImageDB,
  getAllMenuItemsDBTrue,
  toggleShowDishDB,
  toggleShowAddonsDB,
  toggleShowVariantDB,
} = require('../services/menu_item.service');

const path = require('path');
const fs = require('fs');

exports.addMenuItem = async (req, res) => {
  try {
    const {
      title,
      price,
      netPrice,
      taxId,
      categoryId,
      isShow,
      isSpecial,
      allowQuantity,
    } = req.body;

    if (!(title && price)) {
      return res.status(400).json({
        success: false,
        message: 'Đừng bỏ trống tên món và đơn giá',
      });
    }

    const menuItemId = await addMenuItemDB(
      title,
      price,
      netPrice,
      taxId,
      categoryId,
      null,
      isShow,
      isSpecial,
      allowQuantity
    );

    return res.status(200).json({
      success: true,
      message: 'Thêm món thành công',
      menuItemId,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong! Please try later!',
    });
  }
};

exports.updateMenuItem = async (req, res) => {
  try {
    const id = req.params.id;
    const {
      title,
      price,
      netPrice,
      taxId,
      categoryId,
      isShow,
      isSpecial,
      allowQuantity,
    } = req.body;

    if (!(title && price)) {
      return res.status(400).json({
        success: false,
        message: 'Đừng bỏ trống tên món và đơn giá',
      });
    }

    await updateMenuItemDB(
      id,
      title,
      price,
      netPrice,
      taxId,
      categoryId,
      isShow,
      isSpecial,
      allowQuantity
    );

    return res.status(200).json({
      success: true,
      message: 'Cập nhật món ăn thành công!',
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong! Please try later!',
    });
  }
};

exports.uploadMenuItemPhoto = async (req, res) => {
  try {
    const id = req.params.id;

    const file = req.files.image;

    const imagePath = path.join(__dirname, '../../public/') + id;
    const imageURL = '/public/' + id;

    await file.mv(imagePath);
    await updateMenuItemImageDB(id, imageURL);

    return res.status(200).json({
      success: true,
      message: 'Thêm hình ảnh món ăn thành công!',
      imageURL: imageURL,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong! Please try later!',
    });
  }
};

exports.removeMenuItemPhoto = async (req, res) => {
  try {
    const id = req.params.id;
    const imagePath = path.join(__dirname, '../../public/') + id;

    fs.unlinkSync(imagePath);

    await updateMenuItemImageDB(id, null);

    return res.status(200).json({
      success: true,
      message: 'Đã xóa hình ảnh món ăn!',
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong! Please try later!',
    });
  }
};

exports.deleteMenuItem = async (req, res) => {
  try {
    const id = req.params.id;

    await deleteMenuItemDB(id);

    return res.status(200).json({
      success: true,
      message: 'Đã xóa món ăn!',
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong! Please try later!',
    });
  }
};

exports.getAllMenuItems = async (req, res) => {
  try {
    const [menuItems, addons, variants] = await Promise.all([
      getAllMenuItemsDB(),
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

    return res.status(200).json(formattedMenuItems);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong! Please try later!',
    });
  }
};

exports.getMenuItem = async (req, res) => {
  try {
    const id = req.params.id;

    const [menuItem, addons, variants] = await Promise.all([
      getMenuItemDB(id),
      getMenuItemAddonsDB(id),
      getMenuItemVariantsDB(id),
    ]);

    const formattedMenuItems = {
      ...menuItem,
      addons: [...addons],
      variants: [...variants],
    };

    return res.status(200).json(formattedMenuItems);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong! Please try later!',
    });
  }
};

/* Addons */
exports.addMenuItemAddon = async (req, res) => {
  try {
    const itemId = req.params.id;
    const { title, price, showAddons } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Please provide required details: title',
      });
    }

    const menuItemAddonId = await addMenuItemAddonDB(
      itemId,
      title,
      price,
      showAddons
    );

    return res.status(200).json({
      success: true,
      message: 'Đã thêm món phụ vào thực đơn!',
      addonId: menuItemAddonId,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong! Please try later!',
    });
  }
};
exports.updateMenuItemAddon = async (req, res) => {
  try {
    const itemId = req.params.id;
    const addonId = req.params.addonId;
    const { title, price, showAddons } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Please provide required details: title',
      });
    }

    await updateMenuItemAddonDB(itemId, addonId, title, price, showAddons);

    return res.status(200).json({
      success: true,
      message: 'Menu Item Addon Updated.',
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong! Please try later!',
    });
  }
};
exports.deleteMenuItemAddon = async (req, res) => {
  try {
    const itemId = req.params.id;
    const addonId = req.params.addonId;

    await deleteMenuItemAddonDB(itemId, addonId);

    return res.status(200).json({
      success: true,
      message: 'Menu Item Addon Deleted.',
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong! Please try later!',
    });
  }
};
exports.getMenuItemAddons = async (req, res) => {
  try {
    const itemId = req.params.id;

    const itemAddons = await getMenuItemAddonsDB(itemId);

    if (itemAddons.length == 0) {
      return res.status(404).json({
        success: false,
        message: 'No addons found for this item!',
      });
    }

    return res.status(200).json(itemAddons);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong! Please try later!',
    });
  }
};
exports.getAllAddons = async (req, res) => {
  try {
    const addons = await getAllAddonsDB();

    return res.status(200).json(addons);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong! Please try later!',
    });
  }
};
/* Addons */

/* Variants */
exports.addMenuItemVariant = async (req, res) => {
  try {
    const itemId = req.params.id;
    const { title, price, showVariant} = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Please provide required details: title',
      });
    }

    const menuItemVariantId = await addMenuItemVariantDB(itemId, title, price, showVariant);

    return res.status(200).json({
      success: true,
      message: 'Đã thêm tùy chọn vào thực đơn.',
      variantId: menuItemVariantId,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong! Please try later!',
    });
  }
};
exports.updateMenuItemVariant = async (req, res) => {
  try {
    const itemId = req.params.id;
    const variantId = req.params.variantId;
    const { title, price, showVariant } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Please provide required details: title',
      });
    }

    await updateMenuItemVariantDB(itemId, variantId, title, price, showVariant);

    return res.status(200).json({
      success: true,
      message: 'Đã cập nhật tùy chọn vào thực đơn.',
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong! Please try later!',
    });
  }
};
exports.deleteMenuItemVariant = async (req, res) => {
  try {
    const itemId = req.params.id;
    const variantId = req.params.variantId;

    await deleteMenuItemVariantDB(itemId, variantId);

    return res.status(200).json({
      success: true,
      message: 'Menu Item Variant Deleted.',
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong! Please try later!',
    });
  }
};
exports.getMenuItemVariants = async (req, res) => {
  try {
    const itemId = req.params.id;

    const itemVariants = await getMenuItemVariantsDB(itemId);

    if (itemVariants.length == 0) {
      return res.status(404).json({
        success: false,
        message: 'No variants found for this item!',
      });
    }

    return res.status(200).json(itemVariants);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong! Please try later!',
    });
  }
};
exports.getAllVariants = async (req, res) => {
  try {
    const allVariants = await getAllVariantsDB();

    return res.status(200).json(allVariants);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong! Please try later!',
    });
  }
};

exports.toggleShowDish = async (req, res) => {
  try {
    const id = req.params.id;
    const isShow = req.body.isShow;

    await toggleShowDishDB(id, isShow);
    return res.status(200).json({
      success: true,
      message: `Món ăn đã được cập nhật!`,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong! Please try later!',
    });
  }
};

exports.toggleShowAddons = async (req, res) => {
  try {
    const id = req.params.id;
    const showAddons = req.body.showAddons;

    await toggleShowAddonsDB(id, showAddons);
    return res.status(200).json({
      success: true,
      message: `Món ăn phụ đã được cập nhật!`,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong! Please try later!',
    });
  }
};


exports.toggleShowVariant = async (req, res) => {
  try {
    const id = req.params.id;
    const showVariant = req.body.showVariant;

    await toggleShowVariantDB(id, showVariant);
    return res.status(200).json({
      success: true,
      message: `Món ăn phụ đã được cập nhật!`,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong! Please try later!',
    });
  }
};
/* Variants */
