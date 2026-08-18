const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');

let client = null;
let isReady = false;

// Global process guard for wwebjs background errors (prevent server crash on Windows file locks)
process.on('unhandledRejection', (reason) => {
  const reasonStr = String(reason?.stack || reason?.message || reason);
  if (reasonStr.includes('wwebjs') || reasonStr.includes('LocalAuth') || reasonStr.includes('EBUSY') || reasonStr.includes('first_party_sets.db')) {
    console.warn('⚠️ [WhatsApp Engine] Handled non-fatal background session lock warning:', reason?.message || reason);
    return;
  }
});

// Helper to format Indian phone numbers to international format (e.g. 919876543210@c.us)
function formatWhatsAppPhone(phone) {
  if (!phone) return null;
  const digits = String(phone).replace(/[^0-9]/g, '');
  if (!digits) return null;

  // 1. If 10 digits (standard Indian mobile e.g. 8160977394)
  if (digits.length === 10) return `91${digits}`;

  // 2. If 11 digits starting with 0 (e.g. 08160977394)
  if (digits.length === 11 && digits.startsWith('0')) return `91${digits.slice(1)}`;

  // 3. If 12 digits starting with 91 (e.g. 918160977394)
  if (digits.length === 12 && digits.startsWith('91')) return digits;

  // 4. Robust extraction for numbers with invalid/duplicate country code prefixes (e.g. 9918160977394 or 9191...)
  if (digits.length > 10) {
    const last10 = digits.slice(-10);
    if (/^[6-9]\d{9}$/.test(last10)) {
      return `91${last10}`;
    }
  }

  return digits;
}

// Clean up stale lock files from Puppeteer sessions
function clearStaleLock() {
  try {
    const sessionPath = path.resolve('./.wwebjs_auth/session');
    if (fs.existsSync(sessionPath)) {
      const lockFiles = ['SingletonLock', 'SingletonCookie', 'SingletonSocket', 'DevToolsActivePort', 'LOCK'];
      lockFiles.forEach(file => {
        const filePath = path.join(sessionPath, file);
        if (fs.existsSync(filePath)) {
          try { fs.unlinkSync(filePath); } catch (_) {}
        }
      });
      console.log('🧹 [WhatsApp Engine] Cleaned stale session lock files.');
    }
  } catch (e) {
    // Ignore error
  }
}

/**
 * Safely purge auth folder on Windows with retries for locked files (EBUSY)
 */
async function safePurgeSessionFolder(maxRetries = 5, delayMs = 1000) {
  const authPath = path.resolve('./.wwebjs_auth');
  if (!fs.existsSync(authPath)) return;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      fs.rmSync(authPath, { recursive: true, force: true, maxRetries: 3, retryDelay: 500 });
      console.log('🧹 [WhatsApp Engine] Purged logged-out auth session folder.');
      return;
    } catch (e) {
      if (attempt === maxRetries) {
        console.warn(`⚠️ [WhatsApp Engine] Non-fatal warning: Could not fully purge auth folder (files busy/locked): ${e.message}`);
      } else {
        await new Promise(r => setTimeout(r, delayMs));
      }
    }
  }
}

/**
 * Initialize WhatsApp Web Client
 */
function initWhatsAppWebClient() {
  if (client && isReady) {
    return client;
  }

  clearStaleLock();

  try {
    if (client) {
      try { client.destroy(); } catch (_) {}
      client = null;
    }

    const authStrategy = new LocalAuth({ dataPath: './.wwebjs_auth' });

    // Safely wrap logout to handle Windows file locks (EBUSY) without throwing fatal process error
    const originalLogout = authStrategy.logout ? authStrategy.logout.bind(authStrategy) : null;
    if (originalLogout) {
      authStrategy.logout = async function () {
        try {
          await originalLogout();
        } catch (err) {
          console.warn('⚠️ [WhatsApp Engine] Non-fatal auth logout cleanup warning:', err.message);
        }
      };
    }

    client = new Client({
      authStrategy,
      webVersionCache: {
        type: 'remote',
        remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html',
      },
      puppeteer: {
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--disable-gpu',
          '--disable-extensions',
          '--disable-component-update',
          '--disable-default-apps',
          '--mute-audio',
          '--no-zygote'
        ]
      }
    });

    client.on('qr', (qr) => {
      isReady = false;
      if (global.whatsappWebClient) global.whatsappWebClient.isReady = false;
      console.log('\n=============================================================');
      console.log('📱 QUICKSEVA WHATSAPP WEB - SCAN THIS QR CODE WITH YOUR PHONE:');
      console.log('=============================================================\n');
      qrcode.generate(qr, { small: true });
      console.log('\n=============================================================');
      console.log('👆 Open WhatsApp > Linked Devices > Link a Device > Scan above');
      console.log('=============================================================\n');
    });

    client.on('authenticated', () => {
      console.log('✅ [WhatsApp Engine] Phone authenticated successfully!');
    });

    client.on('ready', () => {
      isReady = true;
      global.whatsappWebClient = client;
      global.whatsappWebClient.isReady = true;
      console.log('🚀 [WhatsApp Engine] LIVE — automated WhatsApp notifications are active!');
    });

    client.on('auth_failure', async (msg) => {
      console.error('❌ [WhatsApp Engine] Authentication failed:', msg);
      isReady = false;
      if (global.whatsappWebClient) global.whatsappWebClient.isReady = false;
      try {
        if (client) {
          await client.destroy().catch(() => {});
          client = null;
        }
      } catch (_) {}
      setTimeout(() => safePurgeSessionFolder(), 1500);
    });

    client.on('disconnected', async (reason) => {
      console.warn('⚠️ [WhatsApp Engine] Disconnected:', reason);
      isReady = false;
      if (global.whatsappWebClient) global.whatsappWebClient.isReady = false;
      try {
        if (client) {
          await client.destroy().catch(() => {});
          client = null;
        }
      } catch (_) {}

      if (reason === 'LOGOUT' || String(reason).toLowerCase().includes('logout')) {
        setTimeout(() => safePurgeSessionFolder(), 1500);
      }
    });

    client.initialize().catch((err) => {
      console.error('❌ [WhatsApp Engine] Init error:', err.message);
      isReady = false;
    });

    // Cleanup browser process on node exit
    const cleanup = () => {
      if (client) {
        try { client.destroy(); } catch (_) {}
      }
    };
    process.once('SIGINT', cleanup);
    process.once('SIGTERM', cleanup);

  } catch (err) {
    console.error('❌ [WhatsApp Engine] Setup error:', err.message);
    isReady = false;
  }

  return client;
}

/**
 * Wait for client to be ready (up to maxWaitMs)
 */
async function waitUntilReady(maxWaitMs = 10000) {
  if (isReady || (global.whatsappWebClient && global.whatsappWebClient.isReady)) return true;
  if (!client && !global.whatsappWebClient) return false;
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    if (isReady || (global.whatsappWebClient && global.whatsappWebClient.isReady)) return true;
    await new Promise(resolve => setTimeout(resolve, 400));
  }
  return isReady || (global.whatsappWebClient && global.whatsappWebClient.isReady);
}

/**
 * Send WhatsApp notification directly to a phone number
 */
async function sendWhatsAppNotification(phone, message) {
  const formatted = formatWhatsAppPhone(phone);
  if (!formatted) {
    console.warn('⚠️ [WhatsApp] Invalid phone number:', phone);
    return { success: false, reason: 'Invalid phone' };
  }

  const chatId = `${formatted}@c.us`;
  const activeClient = client || global.whatsappWebClient;

  // Check if activeClient is ready or wait up to 10 seconds
  const ready = isReady || (global.whatsappWebClient && global.whatsappWebClient.isReady) || await waitUntilReady(10000);

  if (activeClient && ready) {
    try {
      await activeClient.sendMessage(chatId, message);
      console.log(`✅ [WhatsApp] Message sent to ${formatted}`);
      return { success: true };
    } catch (err) {
      console.error(`❌ [WhatsApp] Failed to send to ${formatted}:`, err.message);
      return { success: false, reason: err.message };
    }
  } else {
    console.log(`\n[WhatsApp Engine] ⚠️ [NOT LINKED YET — SCAN TERMINAL QR CODE] Notification for ${formatted}:`);
    console.log(`─────────────────────────────────────────────────────────────────`);
    console.log(message);
    console.log(`─────────────────────────────────────────────────────────────────\n`);
    return { success: true, fallback: true };
  }
}

// Generate wa.me fallback URL
function generateWhatsAppUrl(phone, message) {
  const formatted = formatWhatsAppPhone(phone);
  if (!formatted) return '#';
  return `https://wa.me/${formatted}?text=${encodeURIComponent(message)}`;
}

// ─────────────────────────────────────────────
// Transactional WhatsApp Message Templates
// ─────────────────────────────────────────────

async function sendCashCompletionPinWhatsApp({ buyerPhone, buyerName, orderNumber, pin, amount }) {
  const message =
`🔒 *QuickSeva - Cash Payment PIN*

Hi *${buyerName || 'Customer'}*,

Your cash completion PIN for Order *#${orderNumber}* is:
🔑 *PIN: ${pin}*

⚠️ Do NOT share this PIN until the work is 100% complete and you have handed over cash (Rs.${amount || '0'}).

- QuickSeva Team`;
  return sendWhatsAppNotification(buyerPhone, message);
}

async function sendStartPinWhatsApp({ buyerPhone, buyerName, orderNumber, pin, serviceTitle }) {
  const message =
`⚡ *QuickSeva - Service Start PIN*

Hi *${buyerName || 'Customer'}*,

Your provider has arrived for *${serviceTitle || 'your service'}* (Order *#${orderNumber}*).

🔑 *Start PIN: ${pin}*

Share this PIN with your provider to begin work.

- QuickSeva Team`;
  return sendWhatsAppNotification(buyerPhone, message);
}

async function sendNewBookingAlertWhatsApp({ sellerPhone, sellerName, buyerName, serviceTitle, orderNumber, scheduledAt }) {
  const message =
`🚨 *QuickSeva - New Booking Alert!*

Hello *${sellerName || 'Partner'}*,

You received a new booking!
📦 Service: *${serviceTitle || 'Your Service'}*
👤 Customer: *${buyerName || 'Client'}*
🆔 Order: *#${orderNumber}*
📅 Scheduled: *${scheduledAt || 'As requested'}*

Log in to your QuickSeva dashboard to respond.

- QuickSeva Team`;
  return sendWhatsAppNotification(sellerPhone, message);
}

async function sendBookingCreatedBuyerWhatsApp({ buyerPhone, buyerName, sellerName, serviceTitle, orderNumber, scheduledAt }) {
  const message =
`🎉 *QuickSeva - Booking Confirmed!*

Hi *${buyerName || 'Customer'}*,

Your booking is placed successfully!
📦 Service: *${serviceTitle || 'Service'}*
👤 Provider: *${sellerName || 'Provider'}*
🆔 Order: *#${orderNumber}*
📅 Scheduled: *${scheduledAt || 'As requested'}*

Track your order on QuickSeva dashboard.

- QuickSeva Team`;
  return sendWhatsAppNotification(buyerPhone, message);
}

async function sendBookingAcceptedWhatsApp({ buyerPhone, buyerName, sellerName, sellerPhone: sPhone, serviceTitle, orderNumber }) {
  const message =
`✅ *QuickSeva - Booking Accepted!*

Hi *${buyerName || 'Customer'}*,

*${sellerName}* has accepted your booking for *${serviceTitle}* (Order *#${orderNumber}*).

📞 Provider Contact: *${sPhone || 'N/A'}*

Thank you for choosing QuickSeva!`;
  return sendWhatsAppNotification(buyerPhone, message);
}

async function sendBookingCompletedWhatsApp({ buyerPhone, buyerName, serviceTitle, orderNumber, amount }) {
  const message =
`✅ *QuickSeva - Service Completed!*

Hi *${buyerName || 'Customer'}*,

Your service *${serviceTitle}* (Order *#${orderNumber}*) is marked complete.
💵 Total: *Rs.${amount || '0'}*

Please rate your provider on QuickSeva. Thank you!

- QuickSeva Team`;
  return sendWhatsAppNotification(buyerPhone, message);
}

async function sendBookingCancelledWhatsApp({ recipientPhone, recipientName, orderNumber, cancelledBy, reason, refundInfo }) {
  let message =
`❌ *QuickSeva - Booking Cancelled*

Hi *${recipientName || 'Customer'}*,

Booking *#${orderNumber}* has been cancelled by *${cancelledBy}*.
📌 Reason: "${reason || 'Cancelled'}"`;

  if (refundInfo) {
    message += `\n💰 Refund: ${refundInfo}`;
  }

  message += `\n\nThank you for choosing QuickSeva!`;
  return sendWhatsAppNotification(recipientPhone, message);
}

/**
 * Send Bulk WhatsApp Messages to a list of recipients (Sellers or Buyers)
 * Sends sequentially with anti-spam delay between messages.
 */
async function sendBulkWhatsAppMessages({ recipients, messageTemplate, delayMs = 2000 }) {
  if (!Array.isArray(recipients) || recipients.length === 0) {
    return { success: false, reason: "No recipients provided" };
  }

  let sentCount = 0;
  let failedCount = 0;
  const results = [];

  for (let i = 0; i < recipients.length; i++) {
    const recipient = recipients[i];
    if (!recipient.phone) {
      failedCount++;
      continue;
    }

    // Replace {{name}} placeholder with recipient name
    const personalizedMessage = messageTemplate.replace(/\{\{name\}\}/g, recipient.name || "User");

    const res = await sendWhatsAppNotification(recipient.phone, personalizedMessage);
    if (res.success && !res.fallback) {
      sentCount++;
    } else {
      failedCount++;
    }

    results.push({ phone: recipient.phone, name: recipient.name, status: res.success ? "sent" : "failed" });

    // Anti-spam delay between bulk messages
    if (i < recipients.length - 1) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  return { success: true, total: recipients.length, sentCount, failedCount, results };
}

module.exports = {
  initWhatsAppWebClient,
  formatWhatsAppPhone,
  generateWhatsAppUrl,
  sendWhatsAppNotification,
  sendCashCompletionPinWhatsApp,
  sendStartPinWhatsApp,
  sendNewBookingAlertWhatsApp,
  sendBookingCreatedBuyerWhatsApp,
  sendBookingAcceptedWhatsApp,
  sendBookingCompletedWhatsApp,
  sendBookingCancelledWhatsApp,
  sendBulkWhatsAppMessages,
};
