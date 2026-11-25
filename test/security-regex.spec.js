const { describe, it } = require('node:test');
const assert = require('node:assert');

describe('Security: ReDoS & Regex Sanitization', () => {
  function escapeRegex(str) {
    if (!str || typeof str !== 'string') return '';
    return str.slice(0, 100).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  it('should safely escape regex special characters that cause unhandled syntax crashes', () => {
    const malformedInputs = [
      '(',
      '[',
      '*',
      '+',
      '?',
      '(((.*)*)*)',
      '(a+)+$',
      '\\',
      'test[a-z',
    ];

    for (const input of malformedInputs) {
      const escaped = escapeRegex(input);
      // Constructing new RegExp must NOT throw SyntaxError
      assert.doesNotThrow(() => {
        new RegExp(escaped, 'i');
      });
    }
  });

  it('should truncate overly long regex inputs to 100 characters', () => {
    const longString = 'a'.repeat(500);
    const escaped = escapeRegex(longString);
    assert.strictEqual(escaped.length, 100);
  });

  it('should safely match literal characters when search contains regex meta-characters', () => {
    const searchParam = 'Silk (Pure)';
    const escaped = escapeRegex(searchParam);
    const regex = new RegExp(escaped, 'i');

    assert.strictEqual(regex.test('Authentic Silk (Pure) Suit'), true);
    assert.strictEqual(regex.test('Silk Suit'), false);
  });
});
