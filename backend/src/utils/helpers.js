const formatError = (errors) => {
  return errors.map(err => ({ field: err.path.join('.'), message: err.msg }));
};

const paginate = (page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  return { skip, take: parseInt(limit) };
};

const buildFilters = (query, allowedFilters) => {
  const filters = {};
  for (const [key, value] of Object.entries(query)) {
    if (allowedFilters.includes(key) && value) {
      filters[key] = value;
    }
  }
  return filters;
};

module.exports = { formatError, paginate, buildFilters };