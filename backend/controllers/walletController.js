const WalletModel = require("../models/walletModel");
const { successRes, errorRes, paginate } = require("../utils/helpers");

// Get wallet balance
exports.getWallet = async (req, res) => {
  try {
    const wallet = await WalletModel.findByUserId(req.user.id);
    if (!wallet) return errorRes(res, "Wallet not found", 404);
    return successRes(res, { balance: wallet.balance, wallet_id: wallet.id });
  } catch (err) {
    return errorRes(res, "Failed to fetch wallet");
  }
};

// Get transaction history
exports.getTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const { limit: lim, offset } = paginate(page, limit);
    const { transactions, total } = await WalletModel.getTransactions(req.user.id, lim, offset);
    return successRes(res, { transactions, total, page: parseInt(page) });
  } catch (err) {
    return errorRes(res, "Failed to fetch transactions");
  }
};

// Top-up wallet (admin grants or via payment gateway callback)
exports.topUpWallet = async (req, res) => {
  try {
    const { amount, description = "Credits top-up" } = req.body;

    if (!amount || parseFloat(amount) <= 0) {
      return errorRes(res, "Invalid amount", 400);
    }

    const balance = await WalletModel.credit(
      req.user.id, amount, "topup", null, description
    );

    return successRes(res, { balance }, "Credits topped up successfully");
  } catch (err) {
    return errorRes(res, "Failed to top up credits");
  }
};

// Admin: Credit any user's wallet
exports.adminCreditWallet = async (req, res) => {
  try {
    const { user_id, amount, description = "Admin credits grant" } = req.body;

    if (!amount || parseFloat(amount) <= 0) {
      return errorRes(res, "Invalid amount", 400);
    }

    const balance = await WalletModel.credit(user_id, amount, "bonus", null, description);
    return successRes(res, { balance }, "Credits granted successfully");
  } catch (err) {
    return errorRes(res, "Failed to credit user balance");
  }
};
