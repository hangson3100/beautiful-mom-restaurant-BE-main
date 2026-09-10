const { Router } = require('express');

const {
  isLoggedIn,
  isAuthenticated,
  authorize,
} = require('../middlewares/auth.middleware');
const { SCOPES } = require('../config/user.config');
const {
  addMenuItem,
  updateMenuItem,
  deleteMenuItem,
  addMenuItemAddon,
  updateMenuItemAddon,
  deleteMenuItemAddon,
  getMenuItemAddons,
  getAllAddons,
  addMenuItemVariant,
  updateMenuItemVariant,
  deleteMenuItemVariant,
  getMenuItemVariants,
  getAllVariants,
  getAllMenuItems,
  getMenuItem,
  uploadMenuItemPhoto,
  removeMenuItemPhoto,
  toggleShowDish,
  toggleShowAddons,
  toggleShowVariant,
} = require('../controllers/menu_item.controller');

const router = Router();

router.post(
  '/add',
  isLoggedIn,
  isAuthenticated,
  authorize([SCOPES.SETTINGS]),
  addMenuItem
);
router.post(
  '/update/:id',
  isLoggedIn,
  isAuthenticated,
  authorize([SCOPES.SETTINGS]),
  updateMenuItem
);

router.post(
  '/:id/toggle',
  isLoggedIn,
  isAuthenticated,
  authorize([SCOPES.SETTINGS]),
  toggleShowDish
);

router.post(
  '/:id/toggle-addons',
  isLoggedIn,
  isAuthenticated,
  authorize([SCOPES.SETTINGS]),
  toggleShowAddons
);

router.post(
  '/:id/toggle-variant',
  isLoggedIn,
  isAuthenticated,
  authorize([SCOPES.SETTINGS]),
  toggleShowVariant
);

router.post(
  '/update/:id/upload-photo',
  isLoggedIn,
  isAuthenticated,
  authorize([SCOPES.SETTINGS]),
  uploadMenuItemPhoto
);
router.post(
  '/update/:id/remove-photo',
  isLoggedIn,
  isAuthenticated,
  authorize([SCOPES.SETTINGS]),
  removeMenuItemPhoto
);
router.delete(
  '/delete/:id',
  isLoggedIn,
  isAuthenticated,
  authorize([SCOPES.SETTINGS]),
  deleteMenuItem
);
router.get(
  '/',
  isLoggedIn,
  isAuthenticated,
  authorize([SCOPES.SETTINGS]),
  getAllMenuItems
);
router.get(
  '/:id',
  isLoggedIn,
  isAuthenticated,
  authorize([SCOPES.SETTINGS]),
  getMenuItem
);

/* menu item: Addons */
router.post(
  '/addons/:id/add',
  isLoggedIn,
  isAuthenticated,
  authorize([SCOPES.SETTINGS]),
  addMenuItemAddon
);
router.post(
  '/addons/:id/update/:addonId',
  isLoggedIn,
  isAuthenticated,
  authorize([SCOPES.SETTINGS]),
  updateMenuItemAddon
);
router.delete(
  '/addons/:id/delete/:addonId',
  isLoggedIn,
  isAuthenticated,
  authorize([SCOPES.SETTINGS]),
  deleteMenuItemAddon
);
router.get(
  '/addons/:id',
  isLoggedIn,
  isAuthenticated,
  authorize([SCOPES.SETTINGS]),
  getMenuItemAddons
);
router.get(
  '/addons',
  isLoggedIn,
  isAuthenticated,
  authorize([SCOPES.SETTINGS]),
  getAllAddons
);
/* menu item: Addons */

/* menu item: variants */
router.post(
  '/variants/:id/add',
  isLoggedIn,
  isAuthenticated,
  authorize([SCOPES.SETTINGS]),
  addMenuItemVariant
);
router.post(
  '/variants/:id/update/:variantId',
  isLoggedIn,
  isAuthenticated,
  authorize([SCOPES.SETTINGS]),
  updateMenuItemVariant
);
router.delete(
  '/variants/:id/delete/:variantId',
  isLoggedIn,
  isAuthenticated,
  authorize([SCOPES.SETTINGS]),
  deleteMenuItemVariant
);
router.get(
  '/variants/:id',
  isLoggedIn,
  isAuthenticated,
  authorize([SCOPES.SETTINGS]),
  getMenuItemVariants
);
router.get(
  '/variants',
  isLoggedIn,
  isAuthenticated,
  authorize([SCOPES.SETTINGS]),
  getAllVariants
);

/* menu item: variants */

module.exports = router;
