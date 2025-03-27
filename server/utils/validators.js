/**
 * Validate a string as a proper UUID
 * @param {string} uuid - The UUID string to validate
 * @returns {boolean} - Whether the string is a valid UUID
 */
const isValidUUID = (uuid) => {
  if (!uuid) return false;
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

/**
 * Filter an array to only include valid UUIDs
 * @param {Array} uuidArray - Array of potential UUID strings
 * @returns {Array} - Array with only valid UUIDs
 */
const filterValidUUIDs = (uuidArray) => {
  if (!Array.isArray(uuidArray)) return [];
  return uuidArray.filter((uuid) => isValidUUID(uuid));
};

module.exports = {
  isValidUUID,
  filterValidUUIDs,
};
