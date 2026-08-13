const SellerModel = require('../models/sellerModel');

async function test() {
  const seller = await SellerModel.findById(101);
  console.log('seller.phone (should be 8160977394):', seller.phone);
  console.log('seller.name:', seller.name);
  console.log('seller.business_name:', seller.business_name);
  console.log('seller.user_phone:', seller.user_phone);
  process.exit(0);
}

test().catch(err => { console.error(err); process.exit(1); });
