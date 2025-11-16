/**
 * @fileoverview Jest tests demonstrating the failure of native String.slice() 
 * when operating on Grapheme Clusters (GCs) and defining the expected 
 * GC-aware behavior for GCString.
 */

import GCString from '../src/lib/gcu.js';

describe('Code Unit Slicing vs. Grapheme Cluster Slicing', () => {

    // Test Cases using a string that combines GCs and standard characters
    // UPCs (GCs): [Family Emoji], [T], [h], [e], [Space], [Sun]
    // Raw String: "👨‍👩‍👧‍👦The☀️"
    // GCString Length (UPCs): 6
    // Native Length (Code Units): 11 (Emoji) + 3 (The) + 1 (Space) + 2 (Sun) = 17
    const complexString = "👨‍👩‍👧‍👦The☀️";
    const familyEmojiLength = 11; // Code units in the family emoji GC

    // --- Native String.slice() Tests ---

    test('Native String.slice() breaks the leading Grapheme Cluster (Failure)', () => {
        // Goal: Get the "The☀️" part (characters 2 through 6 in terms of UPCs).
        // If we treat the Family Emoji as 1 char, we should start slicing after it.
        
        // Native slice operates on code units. To slice *after* the 11-unit emoji, we start at index 11.
        const result_safe = complexString.slice(familyEmojiLength); // Starts after the emoji
        expect(result_safe).toBe("The☀️"); 

        // FAILURE CASE 1: Slicing from index 1 (internal to the emoji)
        const result_broken = complexString.slice(1);
        
        // The first code unit is removed, resulting in a broken, unusable Grapheme Cluster.
        expect(result_broken.length).toBe(complexString.length - 1); // 16 code units
        
        console.log(`\n--- Slice Failure Demo: Breaking the GC ---`);
        console.log(`String: "${complexString}"`);
        console.log(`Native .slice(1) Result: "${result_broken}"`);
        console.log("This shows native slice cuts inside the Grapheme Cluster, creating corrupted text.");
    });
    
    test('Native String.slice() on complex string returns incorrect length', () => {
        // Goal: Slice out the first two UPCs: [Family Emoji] and [T].
        // In a UPC-aware system, this would be 2 characters long.
        
        // In the native string, this requires slicing up to code unit index 13 (11 for emoji + 2 for 'T').
        const result = complexString.slice(0, 13);
        
        // The native length is 13, but the UPC length is 2.
        expect(result.length).toBe(13);
        
        console.log(`\n--- Slice Failure Demo: Incorrect Length ---`);
        console.log(`Native .slice(0, 13) Result: "${result}"`);
        console.log(`Native Length: ${result.length}`);
        console.log(`Expected UPC Length: 2`);
        console.log("Native slice returns 13 code units, misleading the developer about the visual length.");
    });

    // --- Desired GCString Behavior Comparison (GC-aware Slicing) ---

    test.skip('The desired GCString.slice() result (UPC-aware)', () => {
        // 1. Instantiate the GCString
        const gcString = new GCString(complexString); // Length is 6 GCs

        // 2. Hypothetical GCString.slice(startGCIndex, endGCIndex)
        // Goal: Get the first 2 UPCs: [Family Emoji] and [T]
        const desiredResult = gcString.slice(0, 2); 
        
        // DESIRED RESULT: The result should be the raw string "👨‍👩‍👧‍👦T"
        expect(desiredResult).toBe("👨‍👩‍👧‍👦T"); 
        
        // And the new GCString instance should have the correct UPC length (2)
        const resultGC = new GCString(desiredResult);
        expect(resultGC.length).toBe(2); 
        
        console.log("\n--- Desired GCString Behavior ---");
        console.log("GCString.slice(0, 2) returns a string composed of the first 2 GCs, preserving integrity and correct UPC count.");
    });
});
