/**
 * PhonePe Payment Gateway Utility
 * Shared singleton client used by Hotel, Travel, and Tour booking modules.
 *
 * Env vars required:
 *   PHONEPE_CLIENT_ID       - Merchant clientId from PhonePe dashboard
 *   PHONEPE_CLIENT_SECRET   - Merchant clientSecret
 *   PHONEPE_CLIENT_VERSION  - API version (default: 1)
 *   PHONEPE_ENV             - "PRODUCTION" or "SANDBOX" (default: SANDBOX)
 *   PHONEPE_CALLBACK_USERNAME - Basic auth username for S2S callback validation
 *   PHONEPE_CALLBACK_PASSWORD - Basic auth password for S2S callback validation
 */

const {
  StandardCheckoutClient,
  Env,
  StandardCheckoutPayRequest,
} = require("@phonepe-pg/pg-sdk-node");

let _client = null;

/**
 * Returns a singleton StandardCheckoutClient.
 * Throws if env vars are missing — this is intentional so misconfigured
 * environments fail loudly at startup rather than silently at payment time.
 */
function getPhonePeClient() {
  if (_client) return _client;

  const clientId = process.env.PHONEPE_CLIENT_ID;
  const clientSecret = process.env.PHONEPE_CLIENT_SECRET;
  const clientVersion = Number(process.env.PHONEPE_CLIENT_VERSION || 1);
  const envFlag =
    process.env.PHONEPE_ENV === "PRODUCTION" ? Env.PRODUCTION : Env.SANDBOX;

  if (!clientId || !clientSecret) {
    throw new Error(
      "PhonePe configuration missing: set PHONEPE_CLIENT_ID and PHONEPE_CLIENT_SECRET in .env"
    );
  }

  _client = StandardCheckoutClient.getInstance(
    clientId,
    clientSecret,
    clientVersion,
    envFlag
  );

  return _client;
}

/**
 * Create a PhonePe Standard Checkout order.
 *
 * @param {object} opts
 * @param {string} opts.merchantOrderId  - Unique order ID from your system
 * @param {number} opts.amountInPaise    - Amount in paise (INR * 100)
 * @param {string} opts.redirectUrl      - URL to redirect user after payment
 * @returns {Promise<{ checkoutUrl: string, merchantOrderId: string }>}
 */
async function createPhonePeOrder({ merchantOrderId, amountInPaise, redirectUrl }) {
  if (!merchantOrderId || !amountInPaise || !redirectUrl) {
    throw new Error("merchantOrderId, amountInPaise, and redirectUrl are required");
  }
  if (amountInPaise < 100) {
    throw new Error("Minimum payment amount is ₹1 (100 paise)");
  }

  const client = getPhonePeClient();
  const request = StandardCheckoutPayRequest.builder()
    .merchantOrderId(merchantOrderId)
    .amount(amountInPaise)
    .redirectUrl(redirectUrl)
    .build();

  const response = await client.pay(request);
  return { checkoutUrl: response.redirectUrl, merchantOrderId };
}

/**
 * Fetch the current status of a PhonePe order.
 * state values: "COMPLETED" | "PENDING" | "FAILED"
 *
 * @param {string} merchantOrderId
 * @returns {Promise<{ state: string, raw: object }>}
 */
async function getPhonePeOrderStatus(merchantOrderId) {
  if (!merchantOrderId) throw new Error("merchantOrderId is required");
  const client = getPhonePeClient();
  const response = await client.getOrderStatus(merchantOrderId);
  return { state: response.state, raw: response };
}

/**
 * Validate an incoming S2S callback from PhonePe.
 * Returns the parsed callback data or throws on invalid signature.
 *
 * @param {string} authorizationHeader  - SHA-256 value from the callback header
 * @param {string} bodyString           - Raw JSON string of the request body
 * @returns {object} callbackResponse   - Parsed callback with orderId, state, etc.
 */
function validatePhonePeCallback(authorizationHeader, bodyString) {
  const username = process.env.PHONEPE_CALLBACK_USERNAME;
  const password = process.env.PHONEPE_CALLBACK_PASSWORD;
  if (!username || !password) {
    throw new Error(
      "PHONEPE_CALLBACK_USERNAME and PHONEPE_CALLBACK_PASSWORD must be set in .env"
    );
  }
  const client = getPhonePeClient();
  return client.validateCallback(username, password, authorizationHeader, bodyString);
}

/**
 * Build a merchant order ID that encodes the booking type and ID.
 * Format:  PP_<TYPE>_<BOOKINGID>_<TIMESTAMP>
 * Type: HOTEL | TRAVEL | TOUR
 */
function buildMerchantOrderId(type, bookingId) {
  return `PP_${type}_${bookingId}_${Date.now()}`;
}

module.exports = {
  createPhonePeOrder,
  getPhonePeOrderStatus,
  validatePhonePeCallback,
  buildMerchantOrderId,
};
