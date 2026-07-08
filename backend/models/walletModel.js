const { pool } = require("../config/db");

const WalletModel = {
  // Create wallet for new user
  create: async (user_id, conn = pool) => {
    const [result] = await conn.query(
      `INSERT INTO wallets (user_id, balance) VALUES (?, 0.00)`,
      [user_id]
    );
    return result.insertId;
  },

  // Get wallet by user ID
  findByUserId: async (user_id) => {
    const [rows] = await pool.query(
      `SELECT * FROM wallets WHERE user_id = ?`,
      [user_id]
    );
    return rows[0] || null;
  },

  // Credit wallet
  credit: async (user_id, amount, source, reference_id, description, externalConn = null) => {
    const conn = externalConn || await pool.getConnection();
    const shouldManageTx = !externalConn;
    try {
      if (shouldManageTx) await conn.beginTransaction();

      await conn.query(
        `UPDATE wallets SET balance = balance + ? WHERE user_id = ?`,
        [amount, user_id]
      );

      const [[wallet]] = await conn.query(
        `SELECT balance FROM wallets WHERE user_id = ?`,
        [user_id]
      );

      await conn.query(
        `INSERT INTO wallet_transactions (wallet_id, type, amount, balance_after, source, reference_id, description)
         VALUES ((SELECT id FROM wallets WHERE user_id = ?), 'credit', ?, ?, ?, ?, ?)`,
        [user_id, amount, wallet.balance, source, reference_id || null, description]
      );

      if (shouldManageTx) await conn.commit();
      return wallet.balance;
    } catch (err) {
      if (shouldManageTx) await conn.rollback();
      throw err;
    } finally {
      if (shouldManageTx) conn.release();
    }
  },

  // Debit wallet
  debit: async (user_id, amount, source, reference_id, description, externalConn = null) => {
    const conn = externalConn || await pool.getConnection();
    const shouldManageTx = !externalConn;
    try {
      if (shouldManageTx) await conn.beginTransaction();

      const [[wallet]] = await conn.query(
        `SELECT id, balance FROM wallets WHERE user_id = ? FOR UPDATE`,
        [user_id]
      );

      if (!wallet || wallet.balance < amount) {
        throw new Error("Insufficient wallet balance");
      }

      await conn.query(
        `UPDATE wallets SET balance = balance - ? WHERE user_id = ?`,
        [amount, user_id]
      );

      const newBalance = parseFloat(wallet.balance) - parseFloat(amount);

      await conn.query(
        `INSERT INTO wallet_transactions (wallet_id, type, amount, balance_after, source, reference_id, description)
         VALUES (?, 'debit', ?, ?, ?, ?, ?)`,
        [wallet.id, amount, newBalance, source, reference_id || null, description]
      );

      if (shouldManageTx) await conn.commit();
      return newBalance;
    } catch (err) {
      if (shouldManageTx) await conn.rollback();
      throw err;
    } finally {
      if (shouldManageTx) conn.release();
    }
  },

  // Transaction history
  getTransactions: async (user_id, limit, offset) => {
    const [rows] = await pool.query(
      `SELECT wt.* FROM wallet_transactions wt
       JOIN wallets w ON wt.wallet_id = w.id
       WHERE w.user_id = ?
       ORDER BY wt.created_at DESC LIMIT ? OFFSET ?`,
      [user_id, limit, offset]
    );
    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) as total FROM wallet_transactions wt
       JOIN wallets w ON wt.wallet_id = w.id WHERE w.user_id = ?`,
      [user_id]
    );
    return { transactions: rows, total };
  },
};

module.exports = WalletModel;
