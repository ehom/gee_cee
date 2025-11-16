/**
 * @fileoverview Jest tests for the GCString class, focusing on Grapheme Cluster (GC) integrity.
 */

import GCString from '../src/lib/gcu.js';

describe('GCString Basics', () => {
    test('should initialize and return correct GC length for standard string', () => {
        const standardStr = "hello";
        const gc = new GCString(standardStr);
        expect(gc).toBeDefined();
        // Native length and GC length should be the same here
        expect(gc.length).toBe(standardStr.length);
    });

    test('should return correct GC length for complex emoji (ZWJ sequence)', () => {
        // Family emoji (👨‍👩‍👧‍👦) is 7 code points / 1 Grapheme Cluster
        const familyEmoji = "👨‍👩‍👧‍👦";
        const gc = new GCString(familyEmoji);
        
        // Native JS length reports 11 (due to surrogate pairs and ZWJs)
        expect(familyEmoji.length).toBe(11); 
        
        // GCString corrects this to 1 (one User-Perceived Character)
        expect(gc.length).toBe(1);
    });
});

describe('Code Point Matching vs. Grapheme Cluster Matching', () => {
    
    // Test Case: Complex emoji using a standard regex
    const familyEmoji = "👨‍👩‍👧‍👦"; // 1 GC, 11 code units in JS
    const thumbsUpSkinTone = "👍🏽"; // 1 GC, 4 code units in JS
    
    // The standard regex /./g matches a single code unit, NOT a Grapheme Cluster.
    const standardRegex = /./g;

    // --- String.match() Tests ---

    test('Native String.match() fails on ZWJ sequence (Family Emoji)', () => {
        // When using /./g, the native match operation splits the single Grapheme Cluster
        const matches = familyEmoji.match(standardRegex);
        
        // RESULT: match() returns 11 individual code units, breaking the UPC
        expect(matches).not.toBeNull();
        expect(matches.length).toBe(11); 
        
        console.log(`\n--- Match Failure Demo: Family Emoji (match) ---`);
        console.log(`Native String.match(/./g) result length: ${matches.length}`);
        console.log(`Native matches (first 5): [${matches.slice(0, 5).join(', ')}]...`);
        console.log("This proves native match() breaks the Grapheme Cluster boundary.");
    });

    test('Native String.match() fails on Modifiers (Skin Tone)', () => {
        // When using /./g, the native match operation splits the single Grapheme Cluster
        const matches = thumbsUpSkinTone.match(standardRegex);

        // RESULT: match() returns 4 individual code units, breaking the UPC
        expect(matches).not.toBeNull();
        expect(matches.length).toBe(4); 
        
        console.log(`\n--- Match Failure Demo: Thumbs Up (match) ---`);
        console.log(`Native String.match(/./g) result length: ${matches.length}`);
        console.log(`Native matches: [${matches.join(', ')}]`);
        console.log("This proves native match() breaks the Grapheme Cluster boundary.");
    });

    // --- String.matchAll() Tests ---

    test('Native String.matchAll() fails on ZWJ sequence (Family Emoji)', () => {
        // When using /./g, the native matchAll operation iterates over code units.
        const matches = [...familyEmoji.matchAll(standardRegex)];
        
        // RESULT: matchAll returns 11 individual code unit match objects.
        expect(matches.length).toBe(11); 
        
        console.log(`\n--- MatchAll Failure Demo: Family Emoji (matchAll) ---`);
        console.log(`Native String.matchAll(/./g) result length: ${matches.length}`);
        // matchAll returns match objects, we extract the matched string [0]
        console.log(`Native matches (first 5 segments): [${matches.slice(0, 5).map(m => m[0]).join(', ')}]...`);
        console.log("This confirms native matchAll() breaks the Grapheme Cluster boundary.");
    });
    
    test('Native String.matchAll() fails on Modifiers (Skin Tone)', () => {
        // When using /./g, the native matchAll operation iterates over code units.
        const matches = [...thumbsUpSkinTone.matchAll(standardRegex)];

        // RESULT: matchAll returns 4 individual code unit match objects.
        expect(matches.length).toBe(4); 
        
        console.log(`\n--- MatchAll Failure Demo: Thumbs Up (matchAll) ---`);
        console.log(`Native String.matchAll(/./g) result length: ${matches.length}`);
        console.log(`Native matches: [${matches.map(m => m[0]).join(', ')}]`);
        console.log("This confirms native matchAll() breaks the Grapheme Cluster boundary.");
    });

    // NOTE: A true GCString.match() implementation is complex, but here is what the expectation would be:
    test.skip('The desired GCString Match result', () => {
        // A theoretical GC-aware match (what the user expects)
        const desiredGCMatch = [familyEmoji]; 

        // DESIRED RESULT: Should return a single element array containing the full emoji
        expect(desiredGCMatch.length).toBe(1); 
    });

});

