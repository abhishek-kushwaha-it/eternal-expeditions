const filterObject = (obj, ...allowedFields) =>
  Object.keys(obj).reduce((filtered, key) => {
    if (allowedFields.includes(key)) {
      filtered[key] = obj[key];
    }
    return filtered;
  }, {});

module.exports = { filterObject };
