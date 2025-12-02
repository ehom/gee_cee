// gcstring.test.js

// Import your GCString class
// const { GCString } = require('./gcstring');
// or: import { GCString } from './gcstring';

import GCString from '../src/lib/gcstring';

describe('GCString', () => {
  describe('Constructor and Basic Properties', () => {
    test('should create GCString from regular string', () => {
      const gc = new GCString('Hello');
      expect(gc.value).toBe('Hello');
      expect(gc.length).toBe(5);
    });

    test('should handle empty string', () => {
      const gc = new GCString('');
      expect(gc.value).toBe('');
      expect(gc.length).toBe(0);
      expect(gc.graphemes).toEqual([]);
    });

    test('should handle emojis as single graphemes', () => {
      const gc = new GCString('👨‍👩‍👧‍👦');
      expect(gc.length).toBe(1);
      expect(gc.codeUnitLength).toBeGreaterThan(1);
    });

    test('should handle multiple complex emojis', () => {
      const gc = new GCString('👨‍👩‍👧‍👦🇺🇸👋');
      expect(gc.length).toBe(3);
      expect(gc.graphemes).toHaveLength(3);
    });

    test('should handle combining characters', () => {
      const gc = new GCString('e\u0301'); // é (e + combining acute accent)
      expect(gc.length).toBe(1);
      expect(gc.codeUnitLength).toBe(2);
    });

    test('should freeze graphemes array', () => {
      const gc = new GCString('Hello');
      expect(Object.isFrozen(gc.graphemes)).toBe(true);
    });

    test('should expose code unit length separately', () => {
      const gc = new GCString('👨‍👩‍👧‍👦 Hi');
      expect(gc.length).toBe(4); // grapheme count
      expect(gc.codeUnitLength).toBeGreaterThan(4); // code units
    });
  });

  describe('charAt() and at()', () => {
    test('charAt should return grapheme at index', () => {
      const gc = new GCString('👨‍👩‍👧‍👦 Hello');
      expect(gc.charAt(0)).toBe('👨‍👩‍👧‍👦');
      expect(gc.charAt(1)).toBe(' ');
      expect(gc.charAt(2)).toBe('H');
    });

    test('charAt should return empty string for out of bounds', () => {
      const gc = new GCString('Hi');
      expect(gc.charAt(10)).toBe('');
      expect(gc.charAt(-1)).toBe('');
    });

    test('at should support negative indices', () => {
      const gc = new GCString('Hello');
      expect(gc.at(-1)).toBe('o');
      expect(gc.at(-2)).toBe('l');
    });

    test('at should return undefined for out of bounds', () => {
      const gc = new GCString('Hi');
      expect(gc.at(10)).toBeUndefined();
      expect(gc.at(-10)).toBeUndefined();
    });
  });

  describe('slice()', () => {
    test('should slice by grapheme positions', () => {
      const gc = new GCString('👨‍👩‍👧‍👦 Hello 🇺🇸');
      expect(gc.slice(0, 1).toString()).toBe('👨‍👩‍👧‍👦');
      expect(gc.slice(2, 7).toString()).toBe('Hello');
    });

    test('should handle negative indices', () => {
      const gc = new GCString('Hello');
      expect(gc.slice(-2).toString()).toBe('lo');
      expect(gc.slice(-4, -1).toString()).toBe('ell');
    });

    test('should handle omitted end parameter', () => {
      const gc = new GCString('Hello World');
      expect(gc.slice(6).toString()).toBe('World');
    });

    test('should return new GCString instance', () => {
      const gc = new GCString('Hello');
      const sliced = gc.slice(0, 2);
      expect(sliced).toBeInstanceOf(GCString);
      expect(sliced).not.toBe(gc);
    });
  });

  describe('substring()', () => {
    test('should extract substring by grapheme positions', () => {
      const gc = new GCString('👨‍👩‍👧‍👦 Hello');
      expect(gc.substring(0, 1).toString()).toBe('👨‍👩‍👧‍👦');
      expect(gc.substring(2, 7).toString()).toBe('Hello');
    });

    test('should swap start and end if start > end', () => {
      const gc = new GCString('Hello');
      expect(gc.substring(3, 1).toString()).toBe('el');
    });

    test('should treat negative values as 0', () => {
      const gc = new GCString('Hello');
      expect(gc.substring(-2, 3).toString()).toBe('Hel');
    });
  });

  describe('substr()', () => {
    test('should extract by start position and length', () => {
      const gc = new GCString('👨‍👩‍👧‍👦 Hello');
      expect(gc.substr(0, 1).toString()).toBe('👨‍👩‍👧‍👦');
      expect(gc.substr(2, 5).toString()).toBe('Hello');
    });

    test('should handle negative start position', () => {
      const gc = new GCString('Hello');
      expect(gc.substr(-2, 2).toString()).toBe('lo');
    });

    test('should handle omitted length', () => {
      const gc = new GCString('Hello World');
      expect(gc.substr(6).toString()).toBe('World');
    });
  });

  describe('indexOf()', () => {
    test('should find grapheme-aware index', () => {
      const gc = new GCString('Hello 👋 World 👋');
      expect(gc.indexOf('👋')).toBe(6);
      expect(gc.indexOf('World')).toBe(8);
    });

    test('should return -1 when not found', () => {
      const gc = new GCString('Hello');
      expect(gc.indexOf('xyz')).toBe(-1);
    });

    test('should support start position', () => {
      const gc = new GCString('Hello 👋 World 👋');
      expect(gc.indexOf('👋', 7)).toBe(14);
    });

    test('should work with GCString search parameter', () => {
      const gc = new GCString('Hello 👋 World');
      const search = new GCString('👋');
      expect(gc.indexOf(search)).toBe(6);
    });
  });

  describe('lastIndexOf()', () => {
    test('should find last occurrence', () => {
      const gc = new GCString('Hello 👋 World 👋');
      expect(gc.lastIndexOf('👋')).toBe(14);
    });

    test('should support end position', () => {
      const gc = new GCString('Hello 👋 World 👋');
      expect(gc.lastIndexOf('👋', 10)).toBe(6);
    });

    test('should return -1 when not found', () => {
      const gc = new GCString('Hello');
      expect(gc.lastIndexOf('xyz')).toBe(-1);
    });
  });

  describe('includes()', () => {
    test('should return true when substring exists', () => {
      const gc = new GCString('Hello 👋 World');
      expect(gc.includes('👋')).toBe(true);
      expect(gc.includes('World')).toBe(true);
    });

    test('should return false when substring does not exist', () => {
      const gc = new GCString('Hello');
      expect(gc.includes('xyz')).toBe(false);
    });

    test('should support start position', () => {
      const gc = new GCString('Hello World');
      expect(gc.includes('Hello', 1)).toBe(false);
      expect(gc.includes('World', 6)).toBe(true);
    });
  });

  describe('startsWith() and endsWith()', () => {
    test('startsWith should check beginning', () => {
      const gc = new GCString('👋 Hello World');
      expect(gc.startsWith('👋')).toBe(true);
      expect(gc.startsWith('Hello')).toBe(false);
    });

    test('startsWith should support position parameter', () => {
      const gc = new GCString('👋 Hello World');
      expect(gc.startsWith('Hello', 2)).toBe(true);
    });

    test('endsWith should check end', () => {
      const gc = new GCString('Hello World 👋');
      expect(gc.endsWith('👋')).toBe(true);
      expect(gc.endsWith('World 👋')).toBe(true);
    });

    test('endsWith should support length parameter', () => {
      const gc = new GCString('Hello World');
      expect(gc.endsWith('Hello', 5)).toBe(true);
    });
  });

  describe('split()', () => {
    test('should split by separator', () => {
      const gc = new GCString('Hello 👋 World');
      const parts = gc.split(' ');
      expect(parts).toHaveLength(3);
      expect(parts[0].toString()).toBe('Hello');
      expect(parts[1].toString()).toBe('👋');
      expect(parts[2].toString()).toBe('World');
    });

    test('should split into graphemes with empty separator', () => {
      const gc = new GCString('👋Hi');
      const parts = gc.split('');
      expect(parts).toHaveLength(3);
      expect(parts[0].toString()).toBe('👋');
      expect(parts[1].toString()).toBe('H');
      expect(parts[2].toString()).toBe('i');
    });

    test('should respect limit parameter', () => {
      const gc = new GCString('a b c d');
      const parts = gc.split(' ', 2);
      expect(parts).toHaveLength(2);
    });

    test('should return array of GCString instances', () => {
      const gc = new GCString('Hello World');
      const parts = gc.split(' ');
      parts.forEach(part => {
        expect(part).toBeInstanceOf(GCString);
      });
    });
  });

  describe('padStart() and padEnd()', () => {
    test('padStart should pad to target length with graphemes', () => {
      const gc = new GCString('Hi');
      const padded = gc.padStart(5, '👋');
      expect(padded.length).toBe(5);
      expect(padded.toString()).toBe('👋👋👋Hi');
    });

    test('padStart should use space as default', () => {
      const gc = new GCString('Hi');
      const padded = gc.padStart(5);
      expect(padded.toString()).toBe('   Hi');
    });

    test('padStart should not pad if already at target length', () => {
      const gc = new GCString('Hello');
      const padded = gc.padStart(3);
      expect(padded.toString()).toBe('Hello');
    });

    test('padEnd should pad at end', () => {
      const gc = new GCString('Hi');
      const padded = gc.padEnd(5, '👋');
      expect(padded.length).toBe(5);
      expect(padded.toString()).toBe('Hi👋👋👋');
    });

    test('should handle multi-grapheme padding strings', () => {
      const gc = new GCString('Hi');
      const padded = gc.padStart(10, '👋·');
      expect(padded.length).toBe(10);
    });
  });

  describe('repeat()', () => {
    test('should repeat the string', () => {
      const gc = new GCString('👋');
      const repeated = gc.repeat(3);
      expect(repeated.toString()).toBe('👋👋👋');
      expect(repeated.length).toBe(3);
    });

    test('should return empty string when count is 0', () => {
      const gc = new GCString('Hi');
      expect(gc.repeat(0).toString()).toBe('');
    });
  });

  describe('Iterator', () => {
    test('should iterate over graphemes', () => {
      const gc = new GCString('👋 Hi');
      const chars = [...gc];
      expect(chars).toEqual(['👋', ' ', 'H', 'i']);
    });

    test('should work with for...of loop', () => {
      const gc = new GCString('A👋B');
      const result = [];
      for (const char of gc) {
        result.push(char);
      }
      expect(result).toEqual(['A', '👋', 'B']);
    });
  });

  describe('Case Conversion', () => {
    test('toLowerCase should convert to lowercase', () => {
      const gc = new GCString('HELLO 👋');
      const lower = gc.toLowerCase();
      expect(lower.toString()).toBe('hello 👋');
      expect(lower).toBeInstanceOf(GCString);
    });

    test('toUpperCase should convert to uppercase', () => {
      const gc = new GCString('hello 👋');
      const upper = gc.toUpperCase();
      expect(upper.toString()).toBe('HELLO 👋');
      expect(upper).toBeInstanceOf(GCString);
    });
  });

  describe('Trim Methods', () => {
    test('trim should remove whitespace from both ends', () => {
      const gc = new GCString('  Hello 👋  ');
      expect(gc.trim().toString()).toBe('Hello 👋');
    });

    test('trimStart should remove leading whitespace', () => {
      const gc = new GCString('  Hello 👋  ');
      expect(gc.trimStart().toString()).toBe('Hello 👋  ');
    });

    test('trimEnd should remove trailing whitespace', () => {
      const gc = new GCString('  Hello 👋  ');
      expect(gc.trimEnd().toString()).toBe('  Hello 👋');
    });
  });

  describe('concat()', () => {
    test('should concatenate strings', () => {
      const gc1 = new GCString('Hello');
      const gc2 = new GCString(' 👋');
      const result = gc1.concat(gc2);
      expect(result.toString()).toBe('Hello 👋');
      expect(result.length).toBe(7);
    });

    test('should handle multiple arguments', () => {
      const gc = new GCString('A');
      const result = gc.concat('B', new GCString('C'), '👋');
      expect(result.toString()).toBe('ABC👋');
    });

    test('should return new GCString instance', () => {
      const gc1 = new GCString('Hello');
      const result = gc1.concat(' World');
      expect(result).not.toBe(gc1);
      expect(result).toBeInstanceOf(GCString);
    });
  });

  describe('toString() and valueOf()', () => {
    test('toString should return primitive string', () => {
      const gc = new GCString('Hello 👋');
      expect(gc.toString()).toBe('Hello 👋');
      expect(typeof gc.toString()).toBe('string');
    });

    test('valueOf should return primitive string', () => {
      const gc = new GCString('Hello 👋');
      expect(gc.valueOf()).toBe('Hello 👋');
      expect(typeof gc.valueOf()).toBe('string');
    });

    test('should work with string concatenation', () => {
      const gc = new GCString('Hello');
      const result = gc + ' World';
      expect(result).toBe('Hello World');
    });
  });

  describe('Edge Cases', () => {
    test('should handle very long strings', () => {
      const long = '👋'.repeat(1000);
      const gc = new GCString(long);
      expect(gc.length).toBe(1000);
    });

    test('should handle regional indicator sequences (flags)', () => {
      const gc = new GCString('🇺🇸🇬🇧🇯🇵');
      expect(gc.length).toBe(3);
      expect(gc.charAt(0)).toBe('🇺🇸');
      expect(gc.charAt(1)).toBe('🇬🇧');
      expect(gc.charAt(2)).toBe('🇯🇵');
    });

    test('should handle skin tone modifiers', () => {
      const gc = new GCString('👋🏻👋🏿');
      expect(gc.length).toBe(2);
    });

    test('should handle ZWJ sequences', () => {
      const gc = new GCString('👨‍💻'); // Man technologist (ZWJ sequence)
      expect(gc.length).toBe(1);
    });

    test('should handle mixed content', () => {
      const gc = new GCString('Hello 世界 👋 مرحبا');
      expect(gc.charAt(6)).toBe('世');
      expect(gc.charAt(9)).toBe('👋');
    });

    test('should handle numbers and special characters', () => {
      const gc = new GCString('Price: $99.99 💰');
      expect(gc.length).toBe(15);
    });
  });

  describe('Immutability', () => {
    test('should not modify original when slicing', () => {
      const original = new GCString('Hello World');
      const sliced = original.slice(0, 5);
      expect(original.toString()).toBe('Hello World');
      expect(sliced.toString()).toBe('Hello');
    });

    test('graphemes array should be frozen', () => {
      const gc = new GCString('Hello');
      expect(() => {
        gc.graphemes.push('X');
      }).toThrow();
    });

    test('should not allow reassignment of internal value', () => {
      const gc = new GCString('Hello');
      // Private fields can't be accessed from outside
      expect(() => {
        gc.value = 'Changed';
      }).toThrow();
    });
  });
});
