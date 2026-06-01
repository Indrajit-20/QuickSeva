- [ ] Gather/verify current wallet + packages confirm modal flow
- [ ] Add WalletContext shared state (walletBalance + transactions) and provider
- [ ] Wrap App in WalletProvider
- [ ] Create reusable AddFundsModal component with tabs UPI/Card/Net Banking and fake payment success
- [x] Update SellerWallet page to use WalletContext + AddFundsModal

- [ ] Update SellerPackages confirm modal:
  - [ ] If balance insufficient: replace Confirm with “+ Add Money to Wallet” button

  - [ ] On click: close confirm modal, open AddFundsModal with prefilled shortfall amount
  - [ ] On add success: show success screen + “Continue to Purchase” reopens original confirm modal
  - [ ] If balance sufficient: keep normal Confirm deduction flow

- [ ] Verify transaction history updates on Wallet page after recharge
- [ ] Run build/dev to ensure no errors
