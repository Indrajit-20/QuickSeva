/**
 * QuickSeva - WhatsApp Notification Test Script
 * Usage: node scripts/test_whatsapp.js [phoneNumber] [optionalMessage]
 * Example: node scripts/test_whatsapp.js 9876543210 "Testing QuickSeva WhatsApp alert"
 */

const { 
  initWhatsAppWebClient,
  sendWhatsAppNotification, 
  sendCashCompletionPinWhatsApp,
  sendStartPinWhatsApp,
  sendNewBookingAlertWhatsApp
} = require('../services/whatsappService');

async function testWhatsApp() {
  const args = process.argv.slice(2);
  const targetPhone = args[0] || '9876543210';
  const customMessage = args[1] || 'Hello from QuickSeva! WhatsApp notification test complete.';

  // Initialize WhatsApp Web client engine
  initWhatsAppWebClient();

  console.log('----------------------------------------------------');
  console.log(`🚀 Testing WhatsApp Service for Phone: +91-${targetPhone}`);
  console.log('----------------------------------------------------');

  // 1. Direct custom message test
  console.log('\n[Test 1: Direct Custom Message]');
  const res1 = await sendWhatsAppNotification(targetPhone, customMessage);
  console.log('Result 1:', res1);

  // 2. Cash Completion Security PIN test
  console.log('\n[Test 2: Cash Completion PIN Message]');
  const res2 = await sendCashCompletionPinWhatsApp({
    buyerPhone: targetPhone,
    buyerName: 'Ramesh Kumar',
    orderNumber: 'QS-99482',
    pin: '8492',
    amount: '450'
  });
  console.log('Result 2:', res2);

  // 3. Service Start PIN test
  console.log('\n[Test 3: Service Start PIN Message]');
  const res3 = await sendStartPinWhatsApp({
    buyerPhone: targetPhone,
    buyerName: 'Ramesh Kumar',
    orderNumber: 'QS-99482',
    pin: '1234',
    serviceTitle: 'Home AC Repair & Deep Clean'
  });
  console.log('Result 3:', res3);

  console.log('\n✅ Test complete! You can open the generated wa.me URLs to send real messages directly on WhatsApp.');
}

testWhatsApp().catch(err => {
  console.error('❌ Error during WhatsApp test:', err);
});
