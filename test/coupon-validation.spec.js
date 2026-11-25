const { describe, it } = require('node:test');
const assert = require('node:assert');

describe('Coupon Validation & Expiry Rules', () => {
  function validateCoupon(coupon, orderAmount) {
    if (!coupon || coupon.status !== 'Active') {
      throw new Error('Invalid or inactive royal promo code');
    }

    if (coupon.validUntil) {
      const expiryDate = new Date(coupon.validUntil);
      if (!isNaN(expiryDate.getTime())) {
        expiryDate.setHours(23, 59, 59, 999);
        if (new Date() > expiryDate) {
          throw new Error(`Promo code "${coupon.code}" has expired on ${coupon.validUntil}`);
        }
      }
    }

    if (coupon.usageLimit && coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) {
      throw new Error(`Promo code "${coupon.code}" usage limit has been exhausted`);
    }

    if (coupon.minimumOrder > 0 && orderAmount < coupon.minimumOrder) {
      throw new Error(`Minimum order amount of ₹${coupon.minimumOrder} required`);
    }

    let discountAmount = 0;
    if (coupon.type === 'Percentage') {
      discountAmount = Math.round((orderAmount * coupon.value) / 100);
      if (coupon.maximumDiscount > 0) {
        discountAmount = Math.min(discountAmount, coupon.maximumDiscount);
      }
    } else {
      discountAmount = Math.min(coupon.value, orderAmount);
    }

    return {
      valid: true,
      code: coupon.code,
      discountAmount,
      finalAmount: Math.max(0, orderAmount - discountAmount),
    };
  }

  it('should accept active coupon with valid date and within limit', () => {
    const coupon = {
      code: 'ROYAL10',
      status: 'Active',
      type: 'Percentage',
      value: 10,
      minimumOrder: 1999,
      maximumDiscount: 1500,
      usageLimit: 500,
      usedCount: 20,
      validUntil: '2028-12-31',
    };

    const result = validateCoupon(coupon, 5000);
    assert.strictEqual(result.valid, true);
    assert.strictEqual(result.discountAmount, 500);
    assert.strictEqual(result.finalAmount, 4500);
  });

  it('should reject expired coupon', () => {
    const expiredCoupon = {
      code: 'OLD20',
      status: 'Active',
      type: 'Percentage',
      value: 20,
      minimumOrder: 1000,
      usageLimit: 100,
      usedCount: 5,
      validUntil: '2023-01-01',
    };

    assert.throws(
      () => validateCoupon(expiredCoupon, 3000),
      /has expired/,
    );
  });

  it('should reject coupon when usageLimit is exhausted', () => {
    const exhaustedCoupon = {
      code: 'LIMITED50',
      status: 'Active',
      type: 'Fixed',
      value: 500,
      minimumOrder: 1000,
      usageLimit: 100,
      usedCount: 100, // Limit reached
      validUntil: '2028-12-31',
    };

    assert.throws(
      () => validateCoupon(exhaustedCoupon, 2000),
      /usage limit has been exhausted/,
    );
  });

  it('should reject coupon when order subtotal is below minimum order threshold', () => {
    const coupon = {
      code: 'BIGSAVER',
      status: 'Active',
      type: 'Percentage',
      value: 20,
      minimumOrder: 5000,
      usageLimit: 500,
      usedCount: 10,
      validUntil: '2028-12-31',
    };

    assert.throws(
      () => validateCoupon(coupon, 2500),
      /Minimum order amount of ₹5000 required/,
    );
  });
});
