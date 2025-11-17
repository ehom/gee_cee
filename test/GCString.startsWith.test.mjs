/**
 * @fileoverview Jest tests demonstrating the confusion of native String.startsWith()
 * when using the optional 'position' argument, as it relies on code unit indices 
 * instead of User-Perceived Character (UPC) indices.
 */

import GCString from '../src/lib/gcu.js';

describe('Code Unit Position vs. Grapheme Cluster Position for startsWith()', () => {

    // Test Cases using a complex string: [Family Emoji], [T], [h], [e], [Sun Emoji]
    // Raw String: "👨‍👩‍👧‍👦The☀️World"
    // GCString Length (UPCs): 9 (Family, T, h, e, ☀️, W, o, r, l, d)
    const complexString = "👨‍👩‍👧‍👦The☀️World";
    
    // Grapheme Cluster at UPC index 0: "👨‍👩‍👧‍👦" (11 code units)
    // Grapheme Cluster at UPC index 1: "T" (1 code unit)
    // The starting code unit index for 'T' is 11.

    // --- Native String.startsWith() Tests ---

    test('Native String.startsWith() works correctly when checking from the start (UPC index 0)', () => {
        // Checking for the full Grapheme Cluster at the start.
        const searchString = "👨‍👩‍👧‍👦";
        const result = complexString.startsWith(searchString);

        // SUCCESS: Native startsWith handles the first GC correctly.
        expect(result).toBe(true);
        console.log(`\n--- Native Success Demo (Position 0) ---`);
        console.log(`String: "${complexString}"`);
        console.log(`Native .startsWith("${searchString}", 0) Result: ${result}`);
        console.log("Native startsWith works correctly when checking for a whole GC at the start (index 0).");
    });
    
    test('Native String.startsWith() fails when using the logical UPC index in the position argument (Failure)', () => {
        // GOAL: Check if the string starts with 'T' at the SECOND visual position (UPC Index 1).
        
        const searchString = "T";
        const logicalUPCIndex = 1;
        
        // FAILURE: Native startsWith interprets '1' as a CODE UNIT index, which falls inside the family emoji.
        const result_failure = complexString.startsWith(searchString, logicalUPCIndex);

        expect(result_failure).toBe(false); 
        
        console.log(`\n--- StartsWith Failure Demo: UPC vs. Code Unit Index ---`);
        console.log(`String: "${complexString}"`);
        console.log(`Native .startsWith("${searchString}", ${logicalUPCIndex}) Result: ${result_failure}`);
        console.log("The developer passed '1' (the UPC index), but native startsWith checked code unit index 1 (a ZWJ fragment) and failed.");
    });

    test('Native String.startsWith() requires the hidden code unit index to work correctly', () => {
        // To successfully check for 'T', we must know the family emoji is 11 code units long.
        const searchString = "T";
        const requiredCodeUnitIndex = 11;
        
        // SUCCESS (but confusing): This works, but only because we manually calculated '11'.
        const result_success = complexString.startsWith(searchString, requiredCodeUnitIndex);
        
        expect(result_success).toBe(true); 
        
        console.log(`Native .startsWith("${searchString}", ${requiredCodeUnitIndex}) Result: ${result_success}`);
        console.log("Native startsWith requires the manually calculated code unit index (11) for this check to succeed.");
    });

    // --- Desired GCString Behavior Comparison (GC-aware StartsWith) ---

    test('The desired GCString.startsWith() result (UPC-aware position)', () => {
        // 1. Instantiate the GCString
        const gcString = new GCString(complexString); 

        // 2. Hypothetical GCString.startsWith("T", 1)
        // DESIRED BEHAVIOR: Interprets '1' as the second UPC position and returns true.
        const desiredResult = gcString.startsWith("T", 1); 
        
        expect(desiredResult).toBe(true); 
        
        console.log("\n--- Desired GCString Behavior ---");
        console.log("GCString.startsWith(\"T\", 1) should correctly check the Grapheme Cluster at UPC index 1.");
    });
});
