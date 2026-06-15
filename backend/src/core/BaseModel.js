const { pool } = require("../../config/db");

class BaseModel {
  /**
   * @param {string} tableName
   * @param {object} [options]
   * @param {string} [options.idColumn='id']
   * @param {string} [options.createdAtColumn='created_at']
   * @param {string} [options.updatedAtColumn] - optional
   * @param {object} [options.softDelete] - { column: 'is_active', inactiveValue: 0 }
   */
  constructor(tableName, options = {}) {
    this.tableName = tableName;
    this.idColumn = options.idColumn || "id";
    this.createdAtColumn = options.createdAtColumn || "created_at";
    this.updatedAtColumn = options.updatedAtColumn || null;
    this.softDelete = options.softDelete || null;
  }

  /**
   * @param {object} data
   */
  async create(data = {}) {
    const keys = Object.keys(data).filter((k) => data[k] !== undefined);
    if (!keys.length) {
      throw new Error(`No data provided for create() on ${this.tableName}`);
    }

    const columns = keys.join(", ");
    const placeholders = keys.map(() => "?").join(", ");
    const values = keys.map((k) => data[k]);

    const [result] = await pool.query(
      `INSERT INTO ${this.tableName} (${columns}) VALUES (${placeholders})`,
      values,
    );
    return result.insertId;
  }

  /**
   * Generic find with filtering/search/sorting/pagination.
   *
   * @param {object} params
   * @param {object} [params.filters] - { col: value | { op: '>=', value } }
   * @param {Array<{ column: string, query: string }>} [params.search] - LIKE search entries
   * @param {Array<{ column: string, direction: 'ASC'|'DESC' }>} [params.sort]
   * @param {{ limit:number, offset:number }} [params.pagination]
   * @param {string} [params.whereExtra] - raw where fragment (no params) - use carefully
   * @param {Array<any>} [params.whereParams]
   */
  async findAll({
    filters = {},
    search = [],
    sort = [],
    pagination = null,
    whereExtra = "",
    whereParams = [],
  } = {}) {
    const whereParts = [];
    const params = [];

    for (const [col, v] of Object.entries(filters)) {
      if (
        v &&
        typeof v === "object" &&
        Object.prototype.hasOwnProperty.call(v, "op")
      ) {
        const op = v.op;
        whereParts.push(`${col} ${op} ?`);
        params.push(v.value);
      } else {
        whereParts.push(`${col} = ?`);
        params.push(v);
      }
    }

    // Search (LIKE)
    if (Array.isArray(search) && search.length) {
      const likeParts = [];
      for (const s of search) {
        likeParts.push(`${s.column} LIKE ?`);
        params.push(`%${s.query}%`);
      }
      if (likeParts.length) whereParts.push(`(${likeParts.join(" OR ")})`);
    }

    if (whereExtra) whereParts.push(whereExtra);

    const whereClause = whereParts.length
      ? `WHERE ${whereParts.join(" AND ")}`
      : "";

    const orderClause =
      sort && sort.length
        ? `ORDER BY ${sort
            .map(
              (s) =>
                `${s.column} ${String(s.direction || "DESC").toUpperCase()}`,
            )
            .join(", ")}`
        : `ORDER BY ${this.createdAtColumn} DESC`;

    let limitClause = "";
    if (pagination) {
      limitClause = `LIMIT ? OFFSET ?`;
      params.push(pagination.limit);
      params.push(pagination.offset);
    }

    const [rows] = await pool.query(
      `SELECT * FROM ${this.tableName} ${whereClause} ${orderClause} ${limitClause}`,
      params,
    );

    return rows;
  }

  async findById(id) {
    const [rows] = await pool.query(
      `SELECT * FROM ${this.tableName} WHERE ${this.idColumn} = ?`,
      [id],
    );
    return rows[0] || null;
  }

  /**
   * @param {any} id
   * @param {object} data
   */
  async update(id, data = {}) {
    const keys = Object.keys(data).filter((k) => data[k] !== undefined);
    if (!keys.length) return 0;

    const sets = keys.map((k) => `${k} = ?`).join(", ");
    const values = keys.map((k) => data[k]);

    if (this.updatedAtColumn) {
      values.push(new Date());
      // append updated_at column at the end
      const updatedAtSet = `${this.updatedAtColumn} = ?`;
      const setWithUpdatedAt = `${sets}, ${updatedAtSet}`;
      const [result] = await pool.query(
        `UPDATE ${this.tableName} SET ${setWithUpdatedAt} WHERE ${this.idColumn} = ?`,
        [...values, id],
      );
      return result.affectedRows;
    }

    const [result] = await pool.query(
      `UPDATE ${this.tableName} SET ${sets} WHERE ${this.idColumn} = ?`,
      [...values, id],
    );

    return result.affectedRows;
  }

  async delete(id) {
    if (this.softDelete) {
      const { column, inactiveValue } = this.softDelete;
      const [result] = await pool.query(
        `UPDATE ${this.tableName} SET ${column} = ? WHERE ${this.idColumn} = ?`,
        [inactiveValue, id],
      );
      return result.affectedRows;
    }

    const [result] = await pool.query(
      `DELETE FROM ${this.tableName} WHERE ${this.idColumn} = ?`,
      [id],
    );
    return result.affectedRows;
  }

  async count({ filters = {}, whereExtra = "", whereParams = [] } = {}) {
    const whereParts = [];
    const params = [];

    for (const [col, v] of Object.entries(filters)) {
      if (
        v &&
        typeof v === "object" &&
        Object.prototype.hasOwnProperty.call(v, "op")
      ) {
        whereParts.push(`${col} ${v.op} ?`);
        params.push(v.value);
      } else {
        whereParts.push(`${col} = ?`);
        params.push(v);
      }
    }

    if (whereExtra) whereParts.push(whereExtra);

    const whereClause = whereParts.length
      ? `WHERE ${whereParts.join(" AND ")}`
      : "";

    const [rows] = await pool.query(
      `SELECT COUNT(*) as total FROM ${this.tableName} ${whereClause}`,
      [...params, ...whereParams],
    );

    return rows[0]?.total || 0;
  }

  pagination(page = 1, limit = 10) {
    const lim = parseInt(limit, 10);
    const p = parseInt(page, 10);
    const safeLimit = Number.isFinite(lim) && lim > 0 ? lim : 10;
    const safePage = Number.isFinite(p) && p > 0 ? p : 1;
    const offset = (safePage - 1) * safeLimit;
    return { limit: safeLimit, offset };
  }
}

module.exports = BaseModel;
