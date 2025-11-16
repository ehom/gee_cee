/**
 * @fileoverview A simple application to demonstrate GCString usage.
 */

import GCString from '../lib/gcu.js';

/**
 * Runs the demonstration application.
 */
function runDemo() {
    console.log("--- GCString Demo ---");
    console.log("Testing Complex User-Perceived Characters (UPCs / GCs)");

    // 1. Emoji with ZWJ (Zero Width Joiner) sequence (e.g., family emoji)
    const family = "👨‍👩‍👧‍👦"; 

    // 2. Emoji with modifiers (e.g., skin tone)
    const thumbsUp = "👍🏽";

    // 3. Korean Jamo: 
    // This sequence is often treated as 6 characters by .length but is 2 UPCs/GCs.
    const korean = "한글"; 

    // 4. Combining characters (e.g., 'e' + acute accent)
    const combined = "é";

    const testCases = [
        { name: "Family Emoji (ZWJ)", str: family },
        { name: "Thumbs Up (Skin Tone)", str: thumbsUp },
        { name: "Korean Jamo", str: korean },
        { name: "Combined Characters", str: combined },
        { name: "Standard String", str: "hello" }
    ];

    testCases.forEach(({ name, str }) => {
        const gcString = new GCString(str);
        
        console.log(`\n--- Test: ${name} ---`);
        console.log(`Raw String: ${str}`);
        console.log(`Native .length: ${str.length}`);
        console.log(`GCString.length (UPCs/GCs): ${gcString.length}`);

        // Demonstrate iteration
        const gcs = [...gcString].join(' | ');
        console.log(`GCs (Iteration): ${gcs}`);
        
        // Assertions for comparison (for demonstration)
        const expectedGCs = gcString.length;
        if (str.length !== expectedGCs) {
            console.log(`✅ SUCCESS: GCString corrected the length from ${str.length} to ${expectedGCs}`);
        } else {
            console.log("NOTE: Native length was already correct.");
        }
    });
}

// Execute the demo
runDemo();
