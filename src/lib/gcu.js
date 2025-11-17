/**
 * Creates a closure that caches the Intl.Segmenter instance for grapheme segmentation.
 *
 * This function is called only once when the script loads.
 * The inner function (the actual segmenter) is then returned and used repeatedly,
 * benefiting from the cached Intl.Segmenter object.
 *
 * @param {string} [locale='en'] - The locale to use for segmentation rules.
 * @returns {function(string): string[]} A function that takes a string and returns an array of GCs.
 */
const segmentStringIntoGCs = (function(locale = 'en') {
    // 1. CACHING: The expensive Intl.Segmenter object is created only once here.
    // 'grapheme' is often the default, but we specify it for clarity.
    const graphemeSegmenter = new Intl.Segmenter(locale, {
        granularity: 'grapheme' 
    });

    /**
     * The internal function that performs the segmentation.
     * This is the function that is returned and repeatedly used by the GCString class.
     * @param {string} str - The input string to segment.
     * @returns {string[]} An array of GCs (Grapheme Clusters).
     */
    return function(str) {
        // 2. SEGMENTATION: Use Array.from to convert the iterable segments into a simple array of strings.
        // We use .map() to extract only the 'segment' string from the objects returned by .segment().
        return Array.from(graphemeSegmenter.segment(str)).map(s => s.segment);
    };
})();

// Helper function to check if a single GC is a Unicode whitespace character.
const isWhitespace = (gc) => {
    // \s matches all Unicode whitespace characters (e.g., space, tab, new line, Ideographic Space).
    return /^\s$/.test(gc); 
};

/**
 * Assumed closure function to segment the string, returning an array of GCs.
 * const segmentStringIntoGCs = (function(...) { ... })();
 */

// --- The GCString Class Implementation ---
class GCString {
    /**
     * The array of GCs (Grapheme Clusters). We use a private field #gcArray
     * to enforce immutability and encapsulation.
     * Note: This is a Stage 3/4 proposal feature in older JS environments,
     * but is standard in modern JS/TS. If not supported, use an underscore convention (_gcArray).
     */
    #gcArray;
    #rawString;


   /**
     * Creates an instance of GCString.
     * @param {string | GCString | null | undefined} input - The input to wrap.
     * It can be a native string, another GCString instance, or null/undefined (which defaults to "").
     */
    constructor(input) {
        let rawString;

        if (input instanceof GCString) {
            // Case 1: Input is another GCString instance. Access its private #rawString.
            rawString = input.#rawString;
        } else if (input === null || input === undefined) {
            // Case 2: Input is null or undefined (defaults to empty string)
            rawString = "";
        } else {
            // Case 3: Convert any other valid input to a string
            try {
                rawString = String(input);
            } catch (e) {
                // Catch rare cases where String() might fail (e.g., Symbol)
                throw new TypeError("GCString input must be coercible to a string.");
            }
        }

        this.#rawString = rawString;

        // Pre-calculate the Grapheme Cluster segments once
        this.#gcArray = segmentStringIntoGCs(rawString);
    }

    /**
     * Initializes a GCString instance by segmenting the input string once.
     * @param {string} str - The raw string to be segmented.
     */
    /* constructor(str) {
        if (typeof str !== 'string') {
            throw new Error("GCString constructor requires a string input.");
        }
        
        // Store the raw string privately
        this.#rawString = str;
        
        // 1. CALL TO CLOSURE: Call the segmenter closure ONCE to get the GC array.
        // This is the only expensive step.
        this.#gcArray = segmentStringIntoGCs(str);
    } */
    
    // --- Public Methods ---
    
    /**
     * Returns the length of the string based on Grapheme Clusters (UPCs).
     * @returns {number} The count of GCs in the string.
     */
    get length() {
        return this.#gcArray.length;
    }

    /**
     * Returns the GC at a specific User-Perceived Character (UPC) index.
     * This is the correct charAt() equivalent.
     * @param {number} index - The UPC/GC index.
     * @returns {string | undefined} The full Grapheme Cluster or undefined if out of bounds.
     */
    charAt(index) {
        // Accesses the private, segmented array.
        return this.#gcArray[index];
    }

    /**
     * Returns the numeric Unicode code point value of the FIRST code point 
     * in the Grapheme Cluster (GC) at the specified GC/UPC index.
     * * @param {number} index - The GC/UPC index.
     * @returns {number | undefined} The code point value (a number), or undefined if index is out of bounds.
     */
    codePointAt(index) {
        // 1. Get the Grapheme Cluster (GC) string at the requested UPC index.
        const gc = this.#gcArray[index];
        
        // 2. Check bounds.
        if (gc === undefined) {
            return undefined;
        }
        
        // 3. Call the native string method on the single-GC string, starting at its index 0.
        // This safely returns the code point value of the FIRST code point in the GC.
        return gc.codePointAt(0);
    }

    /**
     * Returns an array containing ALL numeric Unicode code point values 
     * that compose the Grapheme Cluster (GC) at the specified GC/UPC index.
     * * @param {number} index - The GC/UPC index.
     * @returns {number[] | undefined} An array of code point numbers, or undefined if index is out of bounds.
     */
    codePoints(index) {
        // 1. Get the Grapheme Cluster (GC) string at the requested UPC index.
        const gc = this.#gcArray[index];
        
        // 2. Check bounds.
        if (gc === undefined) {
            return undefined;
        }

        const codePointArray = [];
        
        // 3. Iterate through the string (which is only the single GC) by code points.
        for (const segment of gc) {
            // Note: In modern JS, the string iterator iterates by code points, but codePointAt(0)
            // is the most direct way to get the numeric value of the first code point in a 
            // segment (which will be a single code point in this loop).
            codePointArray.push(segment.codePointAt(0));
        }

        return codePointArray;
    }


    slice(start, end) {
        // 1. Slice the internal GC array based on UPC indices.
        const slicedGCs = this.#gcArray.slice(start, end);
        // 2. Join the resulting GCs into a new string.
        const newString = slicedGCs.join('');
        // 3. Return a new, immutable GCString instance.
        return new GCString(newString); 
    }
   
    substring(indexA, indexB) {
        // 1. Normalize and swap indices (similar to native JS substring logic).
        let start = Math.max(0, indexA);
        let end = (indexB === undefined) ? this.length : Math.max(0, indexB);

        if (start > end) {
            [start, end] = [end, start]; // Swap
        }

        // 2. Call the internal slice logic.
        return this.slice(start, end);
    }

    /**
     * Checks if the GCString starts with the GCs of the searchString at a given position (UPC index).
     * @param {string} searchString - The string to search for.
     * @param {number} [position=0] - The GC/UPC index to start searching from.
     * @returns {boolean} True if the string starts with the searchString GCs; otherwise, false.
     */
    startsWith(searchString, position = 0) {
        // Convert the search string into its GC array representation
        const searchGCs = segmentStringIntoGCs(searchString);
        const searchLength = searchGCs.length;

        // Fast check: If the search string is longer than the available GCs, it can't match.
        if (searchLength + position > this.length) {
            return false;
        }

        // Compare GCs starting from the position
        for (let i = 0; i < searchLength; i++) {
            // If any GC in the sequence does not match, return false
            if (this.#gcArray[position + i] !== searchGCs[i]) {
                return false;
            }
        }
        
        // All GCs matched
        return true;
    }

    /**
     * Checks if the GCString ends with the GCs of the searchString.
     * @param {string} searchString - The string to search for.
     * @param {number} [endPosition] - The UPC index before which the string is considered truncated (exclusive). Defaults to count().
     * @returns {boolean} True if the string ends with the searchString GCs; otherwise, false.
     */
    endsWith(searchString, endPosition = this.length) {
        const searchGCs = segmentStringIntoGCs(searchString);
        const searchLength = searchGCs.length;

        // Calculate the index where the potential match must start
        const startPosition = endPosition - searchLength;

        // If the search string is longer than the section being checked, or start is negative, it can't match.
        if (startPosition < 0) {
            return false;
        }

        // Compare GCs starting from the calculated position
        for (let i = 0; i < searchLength; i++) {
            // We compare the GC from the main array at its start position plus the current index (i)
            // with the GC from the search array at index (i).
            if (this.#gcArray[startPosition + i] !== searchGCs[i]) {
                return false;
            }
        }
        
        // All GCs matched
        return true;
    }

    // Helper function to segment padString (assumed to be available)
    // const segmentStringIntoGCs = ... 

    // --- Inside the GCString class ---

    // Private helper to generate the padding GC array
    #generatePadding(targetCount, currentCount, padString) {
        const paddingCount = targetCount - currentCount;
        if (paddingCount <= 0) return [];

        const padGCs = segmentStringIntoGCs(padString);
        const resultGCs = [];
        
        // Efficiently repeat the padding GCs
        for (let i = 0; i < paddingCount; i++) {
            // Use modulo to cycle through the pad GC sequence
            resultGCs.push(padGCs[i % padGCs.length]);
        }
        return resultGCs;
    }

    padStart(targetLength, padString = ' ') {
        const currentCount = this.length;
        
        // 1. Generate the padding GCs
        const paddingGCs = this.#generatePadding(targetLength, currentCount, padString);

        // 2. Combine: [Padding GCs] + [Original GCs]
        const newGCs = paddingGCs.concat(this.#gcArray);

        // 3. Return new GCString
        return new GCString(newGCs.join(''));
    }

    padEnd(targetLength, padString = ' ') {
        const currentCount = this.length;
        
        // 1. Generate the padding GCs
        const paddingGCs = this.#generatePadding(targetLength, currentCount, padString);
        
        // 2. Combine: [Original GCs] + [Padding GCs]
        const newGCs = this.#gcArray.concat(paddingGCs);

        // 3. Return new GCString
        return new GCString(newGCs.join(''));
    }

    /**
     * Removes leading and trailing Unicode whitespace GCs.
     * @returns {GCString} A new GCString instance.
     */
    trim() {
        // Find the start index (first non-whitespace GC)
        let startIndex = 0;
        const count = this.length;

        while (startIndex < count && isWhitespace(this.#gcArray[startIndex])) {
            startIndex++;
        }

        // Find the end index (last non-whitespace GC)
        let endIndex = count;
        // Start checking from the end, but only up to the determined startIndex
        while (endIndex > startIndex && isWhitespace(this.#gcArray[endIndex - 1])) {
            endIndex--;
        }

        // If the string is all whitespace, startIndex === endIndex, and slice returns an empty string.
        return this.slice(startIndex, endIndex);
    }

    /**
     * Removes leading (left) Unicode whitespace GCs. (Equivalent to trimStart).
     * @returns {GCString} A new GCString instance.
     */
    trimLeft() {
        let startIndex = 0;
        const count = this.length;

        while (startIndex < count && isWhitespace(this.#gcArray[startIndex])) {
            startIndex++;
        }

        // Slice from the first non-whitespace GC to the end of the string.
        return this.slice(startIndex, count);
    }

    /**
     * Removes trailing (right) Unicode whitespace GCs. (Equivalent to trimEnd).
     * @returns {GCString} A new GCString instance.
     */
    trimRight() {
        const count = this.length;
        let endIndex = count;

        // Check from the end backward until the first non-whitespace GC is found.
        while (endIndex > 0 && isWhitespace(this.#gcArray[endIndex - 1])) {
            endIndex--;
        }

        // Slice from the start of the string up to the determined endIndex.
        return this.slice(0, endIndex);
    }

    /**
     * Splits the GCString into an array of strings using a GC-aware separator.
     * @param {string} separator - The string used to divide the GCString.
     * @param {number} [limit] - A value limiting the number of segments returned.
     * @returns {string[]} An array of standard JavaScript strings.
     */
    split(separator, limit) {
        const result = [];
        const count = this.length;
        
        // --- 1. Handle Empty String Separator Case ("") ---
        if (separator === "") {
            // Per JavaScript's split, splitting by "" should return an array of single characters.
            // Since #gcArray already contains single GCs, we return a copy of it up to the limit.
            const splitLimit = limit === undefined ? count : Math.min(limit, count);
            for (let i = 0; i < splitLimit; i++) {
                result.push(this.#gcArray[i]);
            }
            return result;
        }

        // --- 2. Segment the Separator ---
        const separatorGCs = segmentStringIntoGCs(separator);
        const separatorLength = separatorGCs.length;
        
        // If the separator is empty after segmentation (e.g., passing an empty string), 
        // the behavior is undefined, but often treated like non-empty string split.
        if (separatorLength === 0) {
            // Per native JS split behavior, returns the original string in an array.
            return limit === 0 ? [] : [this.toString()];
        }
        
        // --- 3. Sequence Matching and Splitting ---
        let currentSegmentStart = 0;
        
        for (let i = 0; i < count; i++) {
            // Check if we have reached the limit
            if (limit !== undefined && result.length >= limit - 1) {
                break; // Stop before adding the last (unsplit) segment
            }
            
            // Check if the separator sequence matches starting at index 'i'
            let isMatch = true;
            if (i + separatorLength <= count) {
                for (let j = 0; j < separatorLength; j++) {
                    // Compare GCs from the main array with GCs from the separator array
                    if (this.#gcArray[i + j] !== separatorGCs[j]) {
                        isMatch = false;
                        break;
                    }
                }
            } else {
                isMatch = false; // Not enough GCs left to match the separator
            }
            
            if (isMatch) {
                // Found a match: Push the segment BEFORE the separator
                const segmentGCs = this.#gcArray.slice(currentSegmentStart, i);
                result.push(segmentGCs.join(''));
                
                // Move the start index past the separator sequence
                currentSegmentStart = i + separatorLength;
                
                // Jump the main loop index to avoid re-checking separator GCs
                i += separatorLength - 1; 
            }
        }
        
        // --- 4. Add the final segment ---
        // If the limit hasn't been met, add the remainder of the string as the last element.
        if (limit === undefined || result.length < limit) {
            const finalSegmentGCs = this.#gcArray.slice(currentSegmentStart);
            result.push(finalSegmentGCs.join(''));
        }

        return result;
    }

    // --- Inside the GCString class ---
    // We use a private field to cache the map
    #gcIndexMap; 

    /**
     * Creates or retrieves a map that converts a raw string's code unit index 
     * to the correct GC/UPC index.
     * e.g., If the 3rd GC starts at raw string index 8, map[8] = 3.
     * @returns {number[]} The map array.
     */
    #getCodeUnitIndexToGCIndexMap() {
        if (this.#gcIndexMap) {
            return this.#gcIndexMap;
        }

        const map = new Array(this.#rawString.length + 1);
        let codeUnitIndex = 0;

        for (let gcIndex = 0; gcIndex < this.#gcArray.length; gcIndex++) {
            const gc = this.#gcArray[gcIndex];
            // For every code unit spanned by the GC, map it to the current GC index
            for (let i = 0; i < gc.length; i++) {
                map[codeUnitIndex + i] = gcIndex;
            }
            codeUnitIndex += gc.length;
        }
        // The very end of the string (where length is) maps to the total count
        map[this.#rawString.length] = this.length; 
        this.#gcIndexMap = map;
        return map;
    }

    /**
     * Translates a native code unit index to the correct GC/UPC index.
     * @param {number} codeUnitIndex - The index returned by the native regex engine.
     * @returns {number} The GC/UPC index.
     */
    #mapCodeUnitIndexToGCIndex(codeUnitIndex) {
        const map = this.#getCodeUnitIndexToGCIndexMap();
        if (codeUnitIndex < 0 || codeUnitIndex > map.length - 1) {
            return -1; // Or handle as appropriate for out-of-bounds
        }
        return map[codeUnitIndex];
    }

    // --- Inside the GCString class ---

    /**
     * Executes a search for a match in the GCString using a regular expression.
     * Corrects the 'index' property of the match object to be the GC/UPC index.
     * @param {RegExp | string} regexp - The regular expression to match against.
     * @returns {RegExpMatchArray | null} A match array with a corrected GC/UPC index, or null.
     */
    match(regexp) {
        // 1. Run the native match on the raw string
        const matchArray = this.#rawString.match(regexp);

        if (!matchArray) {
            return null;
        }

        // 2. Translate the index only for non-global matches, as global matches 
        // often don't include the index property in the results array elements.
        if (!regexp.global && matchArray.index !== undefined) {
            matchArray.index = this.#mapCodeUnitIndexToGCIndex(matchArray.index);
        }
        
        // Note: If you want to handle global match results to be GC/UPC indexed, 
        // you must use matchAll() and iterate (see below).
        
        return matchArray;
    }

    // --- Inside the GCString class ---

    /**
     * Returns an iterator of all results matching a regular expression against the GCString.
     * Each match result object's 'index' property is corrected to the GC/UPC index.
     * @param {RegExp | string} regexp - The regular expression to match against. Must be global (/g).
     * @returns {IterableIterator<RegExpMatchArray>} An iterator yielding match objects with corrected indices.
     * @throws {TypeError} If the RegExp is not global.
     */
    *matchAll(regexp) {
        // 1. Ensure the regexp is global, as required by the native method
        if (!regexp.global) {
            throw new TypeError("RegExp must be global (/g) for matchAll().");
        }

        // 2. Run the native matchAll on the raw string
        const matchIterator = this.#rawString.matchAll(regexp);

        // 3. Iterate through the native results and yield corrected results
        for (const match of matchIterator) {
            if (match.index !== undefined) {
                // Translate the code unit index to the GC/UPC index
                match.index = this.#mapCodeUnitIndexToGCIndex(match.index);
            }
            // Yield the match object with the corrected index
            yield match;
        }
    }
 
    /**
     * Replaces the first occurrence of a pattern (string or RegExp) with a replacement string.
     * The operation is GC/UPC-aware and returns a new GCString instance.
     * @param {RegExp | string} pattern - The pattern to search for.
     * @param {string | function} replacement - The string or function to use as replacement.
     * @returns {GCString} A new GCString instance with the replacement applied.
     * @throws {Error} If the pattern is a global RegExp, as it should use replaceAll().
     */
    replace(pattern, replacement) {
        // 1. Check for global flag: replace() should only handle the first match.
        if (pattern instanceof RegExp && pattern.global) {
            throw new Error("GCString.replace() should not be used with global RegEx. Use replaceAll() instead.");
        }

        // 2. Perform the native replacement on the raw string.
        // The native method handles replacement functions and capture groups correctly.
        const nativeMatch = this.#rawString.match(pattern);
        
        // If no match is found, return the original GCString instance immediately.
        if (!nativeMatch) {
            return this;
        }

        // If the replacement is a simple string, we can use the native method directly.
        // If the replacement is a function, we must let the native method execute it.
        const newRawString = this.#rawString.replace(pattern, replacement);

        // If the pattern was just a simple string, native replace() is sufficient and correct.
        // If the pattern was a RegExp, the complexity below is needed to verify the result boundaries.
        
        // NOTE: For simplicity and to leverage the highly optimized native replacement engine, 
        // we use the new raw string to create the new GCString. This is the most robust approach.

        // 3. Create and return the new GCString instance.
        // This step automatically re-segments the new string, making the resulting object GC-aware.
        return new GCString(newRawString);
    }

    /**
     * Replaces ALL occurrences of a pattern (string or global RegExp) with a replacement.
     * This method leverages the native String.prototype.replaceAll() for performance and 
     * returns a new GCString instance.
     * @param {RegExp | string} pattern - The pattern to search for. Must be a global RegExp or a string.
     * @param {string | function} replacement - The string or function to use as replacement.
     * @returns {GCString} A new GCString instance with all replacements applied.
     */
    replaceAll(pattern, replacement) {
        // 1. Perform the replacement on the private raw string using the native method.
        // This handles all complexity (global search, replacement functions, capture groups).
        const newRawString = this.#rawString.replaceAll(pattern, replacement);
        
        // 2. Instantiate and return a new GCString.
        // The constructor immediately runs the segmenter closure on the new raw string,
        // ensuring the result is GC/UPC-aware and immutable.
        return new GCString(newRawString);
    }

    /**
     * Executes a search for a match in the GCString using a regular expression
     * and returns the GC/UPC index of the first match.
     * @param {RegExp | string} regexp - The regular expression to search with.
     * @returns {number} The GC/UPC index of the first match, or -1 if no match is found.
     */
    search(regexp) {
        // 1. Run the GCString.match() method.
        // This executes the native search and ensures the 'index' property is translated 
        // from a code unit index to a GC/UPC index.
        const matchArray = this.match(regexp);

        // 2. Return the corrected index from the match object, or -1.
        if (!matchArray) {
            return -1;
        }
        
        // The match() method already guaranteed that matchArray.index is the correct 
        // GC/UPC index (assuming the pattern was not global).
        // The native search() method ignores the /g flag anyway, so this works perfectly.
        return matchArray.index;
    }


    toLowerCase() {
        // 1. Delegate the conversion to the highly optimized native method.
        const newRawString = this.#rawString.toLowerCase();
        
        // 2. Wrap the resulting string in a new GCString instance.
        return new GCString(newRawString);
    }

    toUpperCase() {
        // 1. Delegate the conversion to the highly optimized native method.
        const newRawString = this.#rawString.toLocaleUpperCase();
        
        // 2. Wrap the resulting string in a new GCString instance.
        return new GCString(newRawString);
    }

    /**
     * Converts all the alphabetic characters in a GCString to lowercase, 
     * taking into account the host environment's current locale.
     * @param {string | string[]} [locales] - A string or array of locale tags.
     * @returns {GCString} A new, lowercase, and GC-aware GCString instance.
     */
    toLocaleLowerCase(locales) {
        // 1. Delegate the conversion to the native string method.
        const newRawString = this.#rawString.toLocaleLowerCase(locales);

        // 2. Wrap the resulting string in a new GCString instance.
        // The constructor will re-segment the new string based on the locale-specific changes.
        return new GCString(newRawString);
    }

    /**
     * Converts all the alphabetic characters in a GCString to uppercase, 
     * taking into account the host environment's current locale.
     * @param {string | string[]} [locales] - A string or array of locale tags.
     * @returns {GCString} A new, uppercase, and GC-aware GCString instance.
     */
    toLocaleUpperCase(locales) {
        // 1. Delegate the conversion to the native string method.
        const newRawString = this.#rawString.toLocaleUpperCase(locales);

        // 2. Wrap the resulting string in a new GCString instance.
        // The constructor will re-segment the new string based on the locale-specific changes.
        return new GCString(newRawString);
    }
    
    /**
     * Concatenates the GCString with the string representations of the arguments.
     * Arguments can be native strings or other GCString instances.
     * @param {...(string | GCString)} strings - Items to concatenate.
     * @returns {GCString} A new, GC-aware GCString instance.
     */
    concat(...strings) {
        // 1. Map all arguments to their raw string representation.
        const stringArgs = strings.map(arg => 
            (arg instanceof GCString) ? arg.toString() : String(arg)
        );

        // 2. Delegate the core concatenation logic to the native engine.
        // We use spread syntax to pass the array elements as arguments to native concat.
        const newRawString = this.#rawString.concat(...stringArgs);

        // 3. Wrap the result in a new GCString, making it GC-aware.
        return new GCString(newRawString);
    }

    /**
     * Compares the GCString with another string (or GCString) according to the 
     * current locale's sort order rules.
     * @param {string | GCString} compareString - The string to compare against.
     * @param {string | string[]} [locales] - A string or array of locale tags.
     * @param {object} [options] - An object containing properties to customize the comparison.
     * @returns {number} A negative, positive, or zero value indicating sort order.
     */
    localeCompare(compareString, locales, options) {
        // 1. Ensure the comparison argument is a raw string.
        const rawCompareString = (compareString instanceof GCString) 
                                 ? compareString.toString() 
                                 : String(compareString);

        // 2. Delegate the entire comparison to the native string method.
        return this.#rawString.localeCompare(rawCompareString, locales, options);
    }

    /**
     * Returns the Unicode Normalization Form of the string.
     * @param {string} [form='NFC'] - The normalization form to use ('NFC', 'NFD', 'NFKC', or 'NFKD').
     * @returns {GCString} A new, normalized, and GC-aware GCString instance.
     */
    normalize(form = 'NFC') {
        // 1. Delegate the normalization to the native string method.
        const newRawString = this.#rawString.normalize(form);

        // 2. Wrap the resulting string in a new GCString instance.
        // The constructor will re-segment the new string based on the normalized form.
        return new GCString(newRawString);
    }

    /**
     * Returns the raw string this GCString was created from.
     * @returns {string}
     */
    toString() {
        return this.#rawString;
    }

    /**
     * Enables iteration using 'for...of' loops and the spread operator.
     * The GCString object is now Iterable, yielding each GC.
     */
    [Symbol.iterator]() {
        // Return an iterator for the private GC array.
        return this.#gcArray[Symbol.iterator]();
    }
}

export default GCString;
