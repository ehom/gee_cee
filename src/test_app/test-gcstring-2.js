#!/usr/bin/env node

import GCString from '../lib/gcstring.js';
import GCStringD from '../lib/gcstring_d.js';

// --- Test Utilities ---

let testCount = 0;
let failCount = 0;

/**
 * Custom assertion function to test GCString methods.
 * @param {boolean} condition - The condition to test
 * @param {string} message - Description of the test
 */
function assert(condition, message) {
    testCount++;
    if (condition) {
        console.log(`✅ Test ${testCount}: ${message}`);
    } else {
        failCount++;
        console.error(`❌ Test ${testCount}: FAILED - ${message}`);
    }
}

/**
 * Tests equality for GCString objects by comparing their primitive values.
 * @param {GCString} actual - The GCString result
 * @param {string} expectedValue - The expected primitive string value
 * @param {string} message - Description of the test
 */
function assertGCStringValue(actual, expectedValue, message) {
    assert(
        actual instanceof GCString && actual.value === expectedValue,
        `${message} (Expected: "${expectedValue}", Actual: "${actual.value}")`
    );
}

// --- Test Data ---

// 1. Complex Emojis (ZWJ and Skin Tones)
// Grapheme 0: Woman, woman, girl, boy family emoji (ZWJ sequence, 11 code units, 1 GC)
// Grapheme 1: Space (1 code unit, 1 GC)
// Grapheme 2: Thumbs up with medium-dark skin tone (modifier sequence, 4 code units, 1 GC)
// Grapheme 3: Space (1 code unit, 1 GC)
// Grapheme 4: U.S. Flag (Regional Indicator Symbols, 4 code units, 1 GC)
// Grapheme 5: Space (1 code unit, 1 GC)
// Grapheme 6-10: "Hello" (5 code units, 5 GCs)
// TOTAL GCs: 11
// TOTAL Code Units: 11 + 1 + 4 + 1 + 4 + 1 + 5 = 27

const complexStr = "👩‍👩‍👧‍👦 👍🏿 🇺🇸 Hello";
const gc = new GCString(complexStr);

const familyEmoji = "👩‍👩‍👧‍👦"; // Grapheme 0
const thumbsUp = "👍🏿";    // Grapheme 2
const usFlag = "🇺🇸";      // Grapheme 4

// --- Start Testing ---

console.log("--- Starting GCString Test Program ---");

// 1. Constructor and Properties Tests
console.log("\n[1] Properties and Constructor Tests");
assert(
    gc.length === 11,
    `Length check: Expected 11 GCs, got ${gc.length}`
);
assert(
    gc.codeUnitLength === 27,
    `Code Unit Length check: Expected 27 code units, got ${gc.codeUnitLength}`
);
assert(
    gc.value === complexStr,
    `Value check: Stored value matches original string`
);
assert(
    gc.graphemes.length === 11 && gc.graphemes[0] === familyEmoji && gc.graphemes[2] === thumbsUp,
    `Graphemes array check: Correctly segmented complex GCs`
);


// 2. Accessor Methods Tests (charAt, at)
console.log("\n[2] Accessor Methods Tests (charAt, at)");
assert(
    gc.charAt(0) === familyEmoji,
    `charAt(0) gets complex ZWJ emoji`
);
assert(
    gc.charAt(2) === thumbsUp,
    `charAt(2) gets complex skin-tone emoji`
);
assert(
    gc.charAt(4) === usFlag,
    `charAt(4) gets regional indicator flag`
);
assert(
    gc.at(0) === familyEmoji,
    `at(0) gets first GC`
);
assert(
    gc.at(-1) === 'o',
    `at(-1) gets last GC 'o'`
);
assert(
    gc.at(-7) === usFlag,
    `at(-7) gets flag GC (index 4)`
);
assert(
    gc.charAt(100) === '',
    `charAt() out of bounds returns empty string`
);
assert(
    gc.at(100) === undefined,
    `at() out of bounds returns undefined`
);


// 3. Substring/Slicing Methods Tests (slice, substring, substr)
console.log("\n[3] Slicing Methods Tests (slice, substring, substr)");
// slice(0, 1) should return just the family emoji (1 GC)
assertGCStringValue(
    gc.slice(0, 1),
    familyEmoji,
    `slice(0, 1) returns 1st complex GC`
);
// slice(1, 4) should return " 👍🏿 " (3 GCs: space, thumbs up, space)
assertGCStringValue(
    gc.slice(1, 4),
    " 👍🏿 ",
    `slice(1, 4) returns 3 GCs including space and emoji`
);
// substring(8, 5) should swap and return "lo"
assertGCStringValue(
    gc.substring(8, 10), // GCs at index 8 and 9
    "ll",
    `substring(8, 10) returns "ll"`
);
assertGCStringValue(
    gc.substring(10, 8), // swapped indices
    "ll",
    `substring(10, 8) handles swap and returns "ll"`
);
// substr(5, 2) should return " " (space) and 'H'
assertGCStringValue(
    gc.substr(5, 2),
    " H",
    `substr(5, 2) returns space and 'H' (index 5 and 6)`
);
// substr(-5, 5) should return "Hello" (indices 6 through 10)
assertGCStringValue(
    gc.substr(-5), // start at index 6, length undefined (goes to end)
    "Hello",
    `substr(-5) from end returns "Hello"`
);


// 4. Search Methods Tests (indexOf, includes, startsWith, endsWith)
console.log("\n[4] Search Methods Tests (indexOf, lastIndexOf, includes, startsWith, endsWith)");
// indexOf
assert(
    gc.indexOf(thumbsUp) === 2,
    `indexOf (complex emoji) returns index 2`
);
assert(
    gc.indexOf("Hello") === 6,
    `indexOf ("Hello") returns index 6`
);
assert(
    gc.indexOf(new GCString("🇺🇸 H")) === 4,
    `indexOf (GCString search) returns index 4`
);
assert(
    gc.indexOf("👩‍👩‍👧‍👦", 1) === -1,
    `indexOf (with position > match) returns -1`
);
// lastIndexOf
assert(
    gc.lastIndexOf("l") === 9, // last 'l' is at index 9
    `lastIndexOf ("l") returns index 9`
);
assert(
    gc.lastIndexOf(usFlag) === 4,
    `lastIndexOf (flag) returns index 4`
);
// includes
assert(
    gc.includes("🇺🇸"),
    `includes (flag) is true`
);
assert(
    !gc.includes("🚀"),
    `includes (missing emoji) is false`
);
// startsWith
assert(
    gc.startsWith(familyEmoji),
    `startsWith (family emoji) is true`
);
assert(
    gc.startsWith("H", 6),
    `startsWith ("H") at position 6 is true`
);
// endsWith
assert(
    gc.endsWith("o"),
    `endsWith ("o") is true`
);
// Ends with '🇺🇸 ' (Flag + Space) if treated as length 6 (indices 0-5)
assert(
    gc.endsWith("🇺🇸 ", 6),
    `endsWith (flag + space) at position 6 is true (indices 4 and 5)`
);


// 5. Utility Methods Tests
console.log("\n[5] Utility Methods Tests (split, repeat, padStart, padEnd, concat)");
// split
const splitResult = gc.split('');
assert(
    splitResult.length === 11 && splitResult[0].value === familyEmoji && splitResult[10].value === 'o',
    `split('') splits into 11 GCStrings correctly`
);
const splitBySpace = gc.split(' ');
assert(
    splitBySpace.length === 4 && splitBySpace[1].value === thumbsUp,
    `split(' ') correctly splits based on primitive string value into 4 parts, with element 1 being the thumbs-up emoji`
);
// repeat
const repeated = new GCString("A👋").repeat(3);
assertGCStringValue(
    repeated,
    "A👋A👋A👋",
    `repeat(3) results in "A👋A👋A👋"`
);
assert(
    repeated.length === 6,
    `repeat length is correct (3 repeats * 2 GCs)`
);
// padStart
assertGCStringValue(
    new GCString("Hi").padStart(5, thumbsUp),
    "👍🏿👍🏿👍🏿Hi", // 5 - 2 = 3 needed
    `padStart pads with complex emoji correctly`
);
assertGCStringValue(
    new GCString("GC").padStart(3, "ABC"),
    "AGC", // 3 - 2 = 1 needed, takes 1st char of padString
    `padStart pads partially correctly`
);
// padEnd
assertGCStringValue(
    new GCString("Hi").padEnd(5, thumbsUp),
    "Hi👍🏿👍🏿👍🏿", // 5 - 2 = 3 needed
    `padEnd pads with complex emoji correctly`
);
// concat
const gc2 = new GCString(" World");
const concatenated = gc.concat(gc2, "!");
assertGCStringValue(
    concatenated,
    `${complexStr} World!`,
    `concat method works with GCString and string arguments`
);


// 6. Casing and Trimming Tests
console.log("\n[6] Casing and Trimming Tests");
const mixedCaseGC = new GCString("  HeLlO 👋  ");
// toLowerCase
assertGCStringValue(
    mixedCaseGC.toLowerCase(),
    "  hello 👋  ",
    `toLowerCase works (emojis/spaces unaffected)`
);
// toUpperCase
assertGCStringValue(
    mixedCaseGC.toUpperCase(),
    "  HELLO 👋  ", // Corrected expected value
    `toUpperCase works`
);
// trim
assertGCStringValue(
    mixedCaseGC.trim(),
    "HeLlO 👋",
    `trim removes leading/trailing spaces`
);
// trimStart
assertGCStringValue(
    mixedCaseGC.trimStart(),
    "HeLlO 👋  ",
    `trimStart removes leading spaces only`
);


// 7. Iteration Tests
console.log("\n[7] Iteration Tests");
let iteratedGCs = [];
for (const grapheme of gc) {
    iteratedGCs.push(grapheme);
}
assert(
    iteratedGCs.length === 11 && iteratedGCs[0] === familyEmoji && iteratedGCs[4] === usFlag,
    `Iterator yields all 11 GCs, including complex ones`
);

// --- Summary ---

console.log("\n--- Test Summary ---");
if (failCount === 0) {
    console.log(`🎉 SUCCESS: All ${testCount} tests passed!`);
} else {
    console.error(`💔 FAIL: ${failCount} of ${testCount} tests failed.`);
}
console.log("--------------------");

