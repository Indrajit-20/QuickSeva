const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

class BaseController {
  /**
   * @param {CrudService} crudService
   */
  constructor(crudService) {
    this.crudService = crudService;
  }

  // GET /?page&limit&keyword&sortBy&sortOrder
  getAll = asyncHandler(async (req, res) => {
    const { successRes } = this._helpers(res);

    const result = await this.crudService.getAll(req.query);
    return successRes(res, {
      [this.listKey]: result.rows,
      total: result.total,
      page: result.page,
      limit: result.limit,
    });
  });

  getById = asyncHandler(async (req, res) => {
    const { successRes, errorRes } = this._helpers(res);
    const entity = await this.crudService.getById(req.params.id);
    if (!entity) return errorRes(res, `${this.entityKey} not found`, 404);
    return successRes(res, { [this.entityKey]: entity });
  });

  create = asyncHandler(async (req, res) => {
    const { successRes, errorRes } = this._helpers(res);

    const id = await this.crudService.create(req.body);
    const entity = await this.crudService.getById(id);
    return successRes(
      res,
      { [this.entityKey]: entity },
      `${this.entityKey} created`,
      201,
    );
  });

  update = asyncHandler(async (req, res) => {
    const { successRes, errorRes } = this._helpers(res);

    const affected = await this.crudService.update(req.params.id, req.body);
    if (!affected) return errorRes(res, `${this.entityKey} not found`, 404);

    const entity = await this.crudService.getById(req.params.id);
    return successRes(
      res,
      { [this.entityKey]: entity },
      `${this.entityKey} updated`,
    );
  });

  delete = asyncHandler(async (req, res) => {
    const { successRes, errorRes } = this._helpers(res);

    const affected = await this.crudService.delete(req.params.id);
    if (!affected) return errorRes(res, `${this.entityKey} not found`, 404);
    return successRes(res, null, `${this.entityKey} deleted`);
  });

  /**
   * Configure response payload keys.
   */
  configure({ entityKey, listKey }) {
    this.entityKey = entityKey;
    this.listKey = listKey || entityKey + "s";
    return this;
  }

  _helpers(res) {
    // Lazy-load to avoid circular deps.
    // eslint-disable-next-line global-require
    const { successRes, errorRes } = require("../../utils/helpers");
    return { successRes, errorRes };
  }
}

module.exports = BaseController;
