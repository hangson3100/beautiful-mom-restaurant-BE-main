const parseOrderAddons = (storedAddons) => {
  if (!storedAddons) {
    return { ids: [], quantityMode: 'per_item' };
  }

  const parsed = typeof storedAddons === 'string'
    ? JSON.parse(storedAddons)
    : storedAddons;

  if (Array.isArray(parsed)) {
    return { ids: parsed, quantityMode: 'per_item' };
  }

  if (parsed && Array.isArray(parsed.ids) && parsed.quantityMode === 'total') {
    return { ids: parsed.ids, quantityMode: 'total' };
  }

  throw new Error('Invalid stored order addons format.');
};

module.exports = { parseOrderAddons };
