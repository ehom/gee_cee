/**
 * @fileoverview Jest tests demonstrating the confusion of native String.endsWith()
 * when using the optional 'length' argument, as it relies on code unit indices 
 * instead of User-Perceived Character (UPC) count limits.
 */

import GCString from '../src/lib/gcu.js';

describe('Code Unit Length vs. Grapheme Cluster Length for endsWith()', () => {

    // Test Cases using a complex string: [T], [h], [e], [☀️], [W], [o], [r], [l], [d], [Family Emoji]
    // Raw String: "The☀️World👨‍👩‍👧‍👦"
    // GCString Length (UPCs): 10 
    const complexString = "The☀️World👨‍👩‍👧‍👦";
    
    // Grapheme Cluster at UPC index 9: "👨‍👩‍👧‍👦" (11 code units)
    // Grapheme Cluster at UPC index 8: "d" (1 code unit)
    // Total Native Length (Code Units): 3 (The) + 2 (☀️) + 5 (World) + 11 (Family) = 21

    const totalCodeUnitLength = 21;

    // --- Native String.endsWith() Tests ---

    test('Native String.endsWith() works correctly when checking the end (no length limit)', () => {
        // Checking for the full Grapheme Cluster at the end.
        const searchString = "👨‍👩‍👧‍👦";
        const result = complexString.endsWith(searchString);

        // SUCCESS: Native endsWith handles the last GC correctly.
        expect(result).toBe(true);
        console.log(`\n--- Native Success Demo (No Limit) ---`);
        console.log(`String: "${complexString}"`);
        console.log(`Native .endsWith("${searchString}") Result: ${result}`);
        console.log("Native endsWith works correctly when checking for a whole GC at the very end.");
    });
    
    test('Native String.endsWith() fails when using the logical UPC count in the length argument (Failure)', () => {
        // GOAL: Check if the string ENDS WITH 'd', limiting the search to the first 9 visual characters (UPC Count 9).
        
        const searchString = "d";
        const logicalUPCCount = 9; // We want to check the string segment ending just after 'd' (The 9th UPC).
        
        /* * The string is 10 GCs long. Limiting length to 9 GCs means the string ends at 'd'.
         * The 'length' argument is for the code unit length of the *segment* to check.
         * The length of the last GC ("👨‍👩‍👧‍👦") is 11 code units. 
         * We need to limit the code unit length to (21 - 11) = 10 code units to stop *before* the last GC.
         */
        
        // FAILURE: Native endsWith interprets '9' as a CODE UNIT length, which is far too short.
        const result_failure = complexString.endsWith(searchString, logicalUPCCount);

        expect(result_failure).toBe(false); 
        
        console.log(`\n--- EndsWith Failure Demo: UPC Count vs. Code Unit Length ---`);
        console.log(`String: "${complexString}"`);
        console.log(`Native .endsWith("${searchString}", ${logicalUPCCount}) Result: ${result_failure}`);
        console.log("The developer intended to limit the check to the first 9 GCs (up to 'd'), but native endsWith only checked the first 9 CODE UNITS ('The☀️Worl') and failed.");
    });

    test('Native String.endsWith() requires the hidden code unit length to work correctly', () => {
        // To successfully check for 'd', we must know the last emoji is 11 code units long 
        // and limit the search segment to 21 - 11 = 10 code units.
        const searchString = "d";
        const requiredCodeUnitLimit = 10;
        
        // SUCCESS (but confusing): This works, but only because we manually calculated '10'.
        const result_success = complexString.endsWith(searchString, requiredCodeUnitLimit);
        
        expect(result_success).toBe(true); 
        
        console.log(`Native .endsWith("${searchString}", ${requiredCodeUnitLimit}) Result: ${result_success}`);
        console.log("Native endsWith requires the manually calculated code unit limit (10) for this check to succeed.");
    });

    // --- Desired GCString Behavior Comparison (GC-aware EndsWith) ---

    test('The desired GCString.endsWith() result (UPC-aware length limit)', () => {
        // 1. Instantiate the GCString
        const gcString = new GCString(complexString); // Length is 10 GCs

        // 2. Hypothetical GCString.endsWith("d", 9)
        // DESIRED BEHAVIOR: Interprets '9' as the 9th UPC position (which is 'd') and returns true.
        const desiredResult = gcString.endsWith("d", 9); // Check segment of 9 UPCs long
        
        expect(desiredResult).toBe(true); 
        
        console.log("\n--- Desired GCString Behavior ---");
        console.log("GCString.endsWith(\"d\", 9) should correctly check the segment ending at the 9th Grapheme Cluster ('d').");
    });
});
