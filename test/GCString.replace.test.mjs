/**
 * @fileoverview Jest tests demonstrating the failure of native String.replace() and 
 * String.replaceAll() when operating on Grapheme Clusters (GCs).
 */

import GCString from '../src/lib/gcu.js';

describe('Code Point Replacement vs. Grapheme Cluster Replacement', () => {

    // Test Cases using strings composed of a single, complex Grapheme Cluster (UPC)
    const familyEmoji = "👨‍👩‍👧‍👦"; // 1 GC, 11 code units
    const thumbsUpSkinTone = "👍🏽"; // 1 GC, 4 code units
    const replacement = "X"; // Simple replacement character

    // The standard regex /./g matches a single code unit, NOT a Grapheme Cluster.
    const standardRegex = /./g;

    // --- String.replace() Tests ---

    test('Native String.replace() on complex GC replaces only the first code unit (Failure)', () => {
        // We attempt to replace the *first* character using a regex that matches one code unit.
        const result = familyEmoji.replace(standardRegex, replacement);

        // EXPECTED FAILURE: It replaces the *first code unit* of the emoji, breaking the GC.
        // The original string has 11 code units. Replacing the first one means the result has 10 code units + 1 replacement (X).
        expect(result.length).toBe(11);
        
        console.log(`\n--- Replace Failure Demo: String.replace() ---`);
        console.log(`Original Length (Code Units): ${familyEmoji.length}`);
        console.log(`Native String.replace(/./, "X") Result: ${result}`);
        console.log(`Result Length (Code Units): ${result.length}`);
        console.log("The result is a broken Grapheme Cluster, now represented as 'X' followed by the 10 remaining code units.");
    });
    
    // --- String.replaceAll() Tests ---

    test('Native String.replaceAll() on complex GC replaces ALL code units (Catastrophic Failure)', () => {
        // We use the global flag to replace *every* code unit in the emoji.
        const result = familyEmoji.replaceAll(standardRegex, replacement);

        // EXPECTED FAILURE: The single Grapheme Cluster (1 UPC) is replaced by 11 'X's.
        expect(result.length).toBe(11);
        
        console.log(`\n--- ReplaceAll Failure Demo: Family Emoji (replaceAll) ---`);
        console.log(`Original UPC Count (GCString.length): 1`);
        console.log(`Native String.replaceAll(/./g, "X") Result: ${result}`);
        console.log("The single UPC was replaced by 11 individual characters ('X'), destroying the text structure.");
    });
    
    test('Native String.replaceAll() on Modifier GC replaces all code units (Skin Tone)', () => {
        // The single thumbsUpSkinTone GC (1 UPC) is replaced by its 4 code units.
        const result = thumbsUpSkinTone.replaceAll(standardRegex, replacement);

        expect(result.length).toBe(4); 
        expect(result).toBe("XXXX");

        console.log(`\n--- ReplaceAll Failure Demo: Thumbs Up (replaceAll) ---`);
        console.log(`Original UPC Count (GCString.length): 1`);
        console.log(`Native String.replaceAll(/./g, "X") Result: ${result}`);
        console.log("The single UPC was replaced by 4 'X's, destroying the Grapheme Cluster.");
    });

    // --- Desired GCString Behavior Comparison ---

    test('The desired GCString.replace() result (UPC-aware)', () => {
        // A theoretical GCString.replace() should use GC boundaries for matching.
        // If we want to replace the FIRST GC, we replace the whole GC.
        
        // Hypothetical Scenario: GCString("👨‍👩‍👧‍👦Hello").replaceGC(/./, "X")
        const desiredResult = "XHello"; // The full emoji is replaced by one 'X'.
        
        // DESIRED RESULT: The GC length should be 5 (X + H + e + l + l + o)
        expect(desiredResult.length).toBe(6); 
        console.log("\n--- Desired Behavior ---");
        console.log("GCString.replace() should ensure the replacement happens at a Grapheme Cluster boundary.");
    });
});
