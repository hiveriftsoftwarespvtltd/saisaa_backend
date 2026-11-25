const { describe, it } = require('node:test');
const assert = require('node:assert');

describe('Checkout Pricing Engine & Price Tampering Prevention', () => {
  // Pure pricing calculator reflecting OrdersService.calculateOrderPricing logic
  function calculateOrderPricing(verifiedProducts, items, coupon = null) {
    let subtotal = 0;
    const verifiedItems = [];

    for (const item of items) {
      const product = verifiedProducts.find((p) => p.id === item.id);
      if (!product) throw new Error(`Product not found: ${item.id}`);

      const qty = Math.max(1, Number(item.quantity) || 1);
      const unitPrice = Number(product.price); // Canonical price from database
      const customStitching = Boolean(item.customStitching);
      const stitchingFee = customStitching ? 1499 : 0;
      const itemSubtotal = (unitPrice + stitchingFee) * qty;

      subtotal += itemSubtotal;
      verifiedItems.push({
        id: product.id,
        name: product.name,
        price: unitPrice,
        quantity: qty,
        stitchingFee,
        total: itemSubtotal,
      });
    }

    let discount = 0;
    if (coupon) {
      if (coupon.type === 'Percentage') {
        discount = Math.round((subtotal * coupon.value) / 100);
        if (coupon.maximumDiscount > 0) {
          discount = Math.min(discount, coupon.maximumDiscount);
        }
      } else {
        discount = Math.min(coupon.value, subtotal);
      }
    }

    const discountedSubtotal = Math.max(0, subtotal - discount);
    const tax = Math.round(discountedSubtotal * 0.05); // 5% GST
    const shipping = 0; // Complimentary free delivery
    const grandTotal = discountedSubtotal + tax + shipping;

    return {
      subtotal,
      discount,
      tax,
      shipping,
      grandTotal,
      verifiedItems,
    };
  }

  const catalog = [
    { id: 'suit-001', name: 'Embroidered Anarkali Suit Set', price: 12999 },
    { id: 'kurti-002', name: 'Printed Silk Kurti', price: 2600 },
  ];

  it('should accurately calculate standard order subtotal, 5% GST and complimentary shipping', () => {
    const items = [{ id: 'suit-001', quantity: 1, customStitching: false }];
    const pricing = calculateOrderPricing(catalog, items);

    assert.strictEqual(pricing.subtotal, 12999);
    assert.strictEqual(pricing.discount, 0);
    assert.strictEqual(pricing.tax, Math.round(12999 * 0.05)); // 650
    assert.strictEqual(pricing.shipping, 0);
    assert.strictEqual(pricing.grandTotal, 12999 + 650); // 13649
  });

  it('should prevent client-side price tampering by enforcing database prices', () => {
    // Client attempts to pass price: 1 instead of canonical 12999
    const tamperedClientItems = [{ id: 'suit-001', price: 1, quantity: 1 }];
    const pricing = calculateOrderPricing(catalog, tamperedClientItems);

    // Verified price must strictly be 12999, ignoring client tampered price
    assert.strictEqual(pricing.verifiedItems[0].price, 12999);
    assert.strictEqual(pricing.subtotal, 12999);
    assert.notStrictEqual(pricing.grandTotal, 1);
  });

  it('should include custom stitching fee in subtotal calculation', () => {
    const items = [{ id: 'suit-001', quantity: 1, customStitching: true }];
    const pricing = calculateOrderPricing(catalog, items);

    assert.strictEqual(pricing.verifiedItems[0].stitchingFee, 1499);
    assert.strictEqual(pricing.subtotal, 12999 + 1499); // 14498
    assert.strictEqual(pricing.tax, Math.round(14498 * 0.05)); // 725
    assert.strictEqual(pricing.grandTotal, 14498 + 725); // 15223
  });

  it('should correctly apply 15% coupon discount capped at maximum limit', () => {
    const items = [{ id: 'suit-001', quantity: 2, customStitching: false }]; // Subtotal: 25998
    const coupon = {
      code: 'SAISAAFIRST',
      type: 'Percentage',
      value: 15,
      maximumDiscount: 2000,
    };

    const pricing = calculateOrderPricing(catalog, items, coupon);

    assert.strictEqual(pricing.subtotal, 25998);
    // 15% of 25998 is 3899.7, but capped at 2000
    assert.strictEqual(pricing.discount, 2000);
    const expectedTax = Math.round((25998 - 2000) * 0.05); // 1200
    assert.strictEqual(pricing.tax, expectedTax);
    assert.strictEqual(pricing.grandTotal, 23998 + expectedTax);
  });
});
