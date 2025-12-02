#!/usr/bin/env node

import GCString from '../../src/lib/gcu.js';
import GCStringD from '../../src/lib/gcu_d.js';


function log(title, value) {
  console.log('--- ' + title + ' ---');
  console.log(value);
  console.log('');
}


// Test 1: Basic features
const s1 = new GCString('👨‍👩‍👧‍👦 Hello');

log('Original value', s1.value);

log('Grapheme length', s1.length);

log('Code unit length', s1.codeUnitLength);

log('charAt(0)', s1.charAt(0));

log('charAt(1)', s1.charAt(1));

log('slice(0,1)', s1.slice(0,1).value);


// Test 2: Indexing
const s2 = new GCString('a👩‍❤️‍💋‍👨b😀c');

log('String', s2.value);

log('Graphemes', s2.graphemes);

log('Index of 😀', s2.indexOf('😀'));

log('Last index of a', s2.lastIndexOf('a'));

log('Includes 💋', s2.includes('💋'));


// Test 3: startsWith / endsWith
const s3 = new GCString('👋Hi😀');

log('startsWith(👋)', s3.startsWith('👋'));

log('endsWith(😀)', s3.endsWith('😀'));


// Test 4: split
const s4 = new GCString('👋🙂👍');

log('split("")', s4.split('').map(x => x.value));


// Test 5: padStart / padEnd
const s5 = new GCString('Hi');

log('padStart(5,"👋")', s5.padStart(5,'👋').value);

log('padEnd(5,"😀")', s5.padEnd(5,'😀').value);


// Test 6: repeat
const s6 = new GCString('🙂');

log('repeat(4)', s6.repeat(4).value);


// Test 7: substring / substr
const s7 = new GCString('👨‍🌾a😀b');

log('substring(0,2)', s7.substring(0,2).value);

log('substr(1,2)', s7.substr(1,2).value);


// Test 8: Iteration
let iter = [];
for (const g of s7) iter.push(g);

log('Iterator graphemes', iter);


// Test 9: Case transforms
const s9 = new GCString('Straße');

log('toUpperCase()', s9.toUpperCase().value);

log('toLocaleUpperCase("de")', s9.toLocaleUpperCase('de').value);


// Test 10: trim
const s10 = new GCString('   😀 Hi   ');

log('trim()', s10.trim().value);

log('trimStart()', s10.trimStart().value);

log('trimEnd()', s10.trimEnd().value);

