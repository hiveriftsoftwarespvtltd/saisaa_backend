const { describe, it } = require('node:test');
const assert = require('node:assert');
const crypto = require('crypto');

describe('Payment Verification & Replay Attack Defense', () => {
  function verifyPaymentSignature(orderId, paymentId, signature, secret) {
    const text = `${orderId}|${paymentId}`;
    const generated = crypto
      .createHmac('sha256', secret)
      .update(text)
      .digest('hex');
    return generated === signature;
  }

  const secret = 'test_secret_key_saisaa_9988';
  const orderId = 'order_DAF82930492';
  const paymentId = 'pay_98374829384';

  it('should successfully verify legitimate HMAC SHA-256 signature', () => {
    const validSignature = crypto
      .createHmac('sha256', secret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    const isValid = verifyPaymentSignature(orderId, paymentId, validSignature, secret);
    assert.strictEqual(isValid, true);
  });

  it('should reject tampered signature', () => {
    const fakeSignature = 'bad_forged_signature_0000000000000000000000000000';
    const isValid = verifyPaymentSignature(orderId, paymentId, fakeSignature, secret);
    assert.strictEqual(isValid, false);
  });

  it('should detect and prevent payment replay attacks using duplicate payment IDs', () => {
    const recordedPayments = new Set(['pay_already_processed_123']);

    function processPaymentId(payId) {
      if (recordedPayments.has(payId)) {
        throw new Error('Payment transaction ID has already been finalized (Replay Attack blocked)');
      }
      recordedPayments.add(payId);
      return true;
    }

    // First attempt should succeed
    assert.strictEqual(processPaymentId('pay_brand_new_456'), true);

    // Second attempt with same payment ID must throw
    assert.throws(
      () => processPaymentId('pay_already_processed_123'),
      /Replay Attack blocked/,
    );
  });
});
