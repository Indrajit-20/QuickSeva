class CrudService {
  /**
   * @param {BaseModel} model
   * @param {object} options
   * @param {string[]} [options.readOnlyColumns]
   * @param {string[]} [options.filterableColumns]
   * @param {string[]} [options.searchableColumns]
   * @param {string[]} [options.sortableColumns]
   * @param {object} [options.defaultFilters] - exact matches applied to every query
   * @param {(req:any, action:string)=>object} [options.buildFilters]
   */
  constructor(model, options = {}) {
    this.model = model;
    this.options = options;
  }

  _parsePagination(reqQuery) {
    const page = reqQuery?.page ?? 1;
    const limit = reqQuery?.limit ?? 10;
    return this.model.pagination(page, limit);
  }

  _parseSorting(reqQuery) {
    const sortBy = reqQuery?.sortBy;
    const sortOrder = String(reqQuery?.sortOrder || "DESC").toUpperCase();

    const allowed = this.options.sortableColumns;
    if (!sortBy) return [];
    if (allowed && Array.isArray(allowed) && !allowed.includes(sortBy))
      return [];

    return [
      { column: sortBy, direction: sortOrder === "ASC" ? "ASC" : "DESC" },
    ];
  }

  _parseSearching(reqQuery) {
    const keyword = reqQuery?.keyword;
    if (!keyword) return [];

    const searchable = this.options.searchableColumns;
    const cols = searchable && searchable.length ? searchable : [];
    if (!cols.length) return [];

    return cols.map((column) => ({ column, query: keyword }));
  }

  _parseFiltering(reqQuery) {
    const filterable = this.options.filterableColumns;
    if (!filterable || !filterable.length) return {};

    const filters = {};

    for (const col of filterable) {
      if (reqQuery[col] === undefined) continue;
      // Basic exact match only.
      filters[col] = reqQuery[col];
    }

    return filters;
  }

  _lightValidate(data) {
    // Validation is intentionally lightweight to avoid breaking existing business logic.
    // Hooks can be added via options.
    if (typeof this.options.validate === "function") {
      this.options.validate(data);
    }
  }

  async getAll(reqQuery = {}) {
    const pagination = this._parsePagination(reqQuery);
    const sort = this._parseSorting(reqQuery);
    const search = this._parseSearching(reqQuery);
    const filters = {
      ...(this.options.defaultFilters || {}),
      ...this._parseFiltering(reqQuery),
    };

    const whereExtra = this.options.whereExtra;

    const rows = await this.model.findAll({
      filters,
      search,
      sort,
      pagination,
      whereExtra: whereExtra || "",
    });

    const total = await this.model.count({
      filters,
      whereExtra: whereExtra || "",
    });

    return {
      rows,
      total,
      page: Number.parseInt(reqQuery.page || 1, 10),
      limit: pagination.limit,
    };
  }

  async getById(id) {
    return this.model.findById(id);
  }

  async create(data = {}) {
    this._lightValidate(data);
    return this.model.create(data);
  }

  async update(id, data = {}) {
    this._lightValidate(data);
    return this.model.update(id, data);
  }

  async delete(id) {
    return this.model.delete(id);
  }
}

module.exports = CrudService;
