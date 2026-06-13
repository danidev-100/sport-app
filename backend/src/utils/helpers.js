const formatError = (errors) => {
  return errors.map(err => ({ field: err.path.join('.'), message: err.msg }));
};

const paginate = (page = 1, limit = 25) => {
  const p = Math.max(1, parseInt(page) || 1);
  const l = Math.min(100, Math.max(1, parseInt(limit) || 25));
  const skip = (p - 1) * l;
  return { skip, take: l, page: p, limit: l };
};

const paginatedResponse = (data, total, page, limit) => ({
  data,
  pagination: {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  },
});

const buildFilters = (query, allowedFilters) => {
  const filters = {};
  for (const [key, value] of Object.entries(query)) {
    if (allowedFilters.includes(key) && value) {
      filters[key] = value;
    }
  }
  return filters;
};

module.exports = { formatError, paginate, paginatedResponse, buildFilters };