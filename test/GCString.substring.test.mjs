/**
 * @fileoverview Jest tests demonstrating the failure of native String.substring() 
 * when operating on Grapheme Clusters (GCs) and defining the expected 
 * GC-aware behavior for GCString.
 */

import GCString from '../src/lib/gcu.js';

describe('Code Unit Substring vs. Grapheme Cluster Substring', () => {

    // Test Cases using a string that combines GCs and standard characters
    // UPCs (GCs): [Family Emoji], [T], [h], [e], [Space], [Sun]
    // Raw String: "👨‍👩‍👧‍👦The☀️"
    // GCString Length (UPCs): 6
    // Native Length (Code Units): 11 (Emoji) + 3 (The) + 1 (Space) + 2 (Sun) = 17
    const complexString = "👨‍👩‍👧‍👦The☀️";
    const familyEmojiLength = 11; // Code units in the family emoji GC

    // --- Native String.substring() Tests ---

    test('Native String.substring() breaks the Grapheme Cluster (Failure)', () => {
        // Goal: Isolate the family emoji. The end index should be 11 (after the emoji).
        
        // FAILURE CASE 1: Slicing into the middle of the Grapheme Cluster (index 1 to 11)
        const result_broken = complexString.substring(1, familyEmojiLength); // 1 to 11 (exclusive)
        
        // The first code unit is removed, resulting in a broken, unusable Grapheme Cluster fragment.
        expect(result_broken.length).toBe(familyEmojiLength - 1); // 10 code units
        
        console.log(`\n--- Substring Failure Demo: Breaking the GC ---`);
        console.log(`String: "${complexString}"`);
        console.log(`Native .substring(1, 11) Result: "${result_broken}"`);
        console.log("This shows native substring cuts inside the Grapheme Cluster, creating corrupted text.");
    });
    
    test('Native String.substring() returns incorrect code unit length for a single GC', () => {
        // Goal: Slice out the first UPC: [Family Emoji].
        // In a UPC-aware system, this result would have a UPC length of 1.
        
        // Native substring operates on code units (0 to 11 exclusive).
        const result = complexString.substring(0, familyEmojiLength);
        
        // The native length is 11, but the UPC length is 1.
        expect(result.length).toBe(familyEmojiLength); // 11 code units
        
        console.log(`\n--- Substring Failure Demo: Incorrect Length ---`);
        console.log(`Native .substring(0, 11) Result: "${result}"`);
        console.log(`Native Length: ${result.length}`);
        console.log(`Expected UPC Length: 1`);
        console.log("Native substring returns 11 code units, misleading the developer about the visual length.");
    });

    // --- Desired GCString Behavior Comparison (GC-aware Substring) ---

    test.skip('The desired GCString.substring() result (UPC-aware)', () => {
        // 1. Instantiate the GCString
        const gcString = new GCString(complexString); // Length is 6 GCs

        // 2. Hypothetical GCString.substring(startGCIndex, endGCIndex)
        // Goal: Get the 2 UPCs: [Family Emoji] and [T] (GC indices 0 to 2)
        const desiredResult = gcString.substring(0, 2); 
        
        // DESIRED RESULT: The result should be the raw string "👨‍👩‍👧‍👦T"
        expect(desiredResult).toBe("👨‍👩‍👧‍👦T"); 
        
        // And the new GCString instance should have the correct UPC length (2)
        const resultGC = new GCString(desiredResult);
        expect(resultGC.length).toBe(2); 
        
        console.log("\n--- Desired GCString Behavior ---");
        console.log("GCString.substring(0, 2) returns a string composed of the first 2 GCs, preserving integrity and correct UPC count.");
    });
});
