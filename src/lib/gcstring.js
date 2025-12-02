/**
 * Create segmenter closure - instantiated once, reused for all GCString instances.
 * Uses Intl.Segmenter with undefined locale (grapheme boundaries are locale-independent).
 * @returns {Function} A function that segments a string into grapheme clusters
 */
const segmentIntoGraphemes = (() => {
  const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
  
  return (str) => {
    return [...segmenter.segment(str)].map(s => s.segment);
  };
})();

/**
 * GCString - A grapheme cluster aware string wrapper class.
 * 
 * This class wraps JavaScript strings and provides methods that operate on
 * user-perceived characters (grapheme clusters) rather than code units or code points.
 * This ensures correct handling of emojis, combining characters, regional indicators,
 * and other complex Unicode sequences.
 * 
 * @example
 * const gc = new GCString("👨‍👩‍👧‍👦 Hello");
 * gc.length       // 7 (grapheme count, not code units)
 * gc.charAt(0)    // "👨‍👩‍👧‍👦" (entire family emoji)
 * gc.slice(0, 1)  // GCString("👨‍👩‍👧‍👦")
 */

class GCString {
  #value;
  #graphemes;
  
  /**
   * Creates a new GCString instance.
   * @param {string} str - The string to wrap
   */
  constructor(str) {
    this.#value = String(str);
    this.#graphemes = Object.freeze(segmentIntoGraphemes(this.#value));
  }
  
  /**
   * Gets the underlying primitive string value.
   * @returns {string} The original string
   */
  get value() {
    return this.#value;
  }
  
  /**
   * Gets the frozen array of grapheme clusters.
   * @returns {Array<string>} Immutable array of grapheme clusters
   */
  get graphemes() {
    return this.#graphemes;
  }
  
  /**
   * Gets the number of grapheme clusters (user-perceived characters).
   * @returns {number} The grapheme cluster count
   * @example
   * new GCString("👨‍👩‍👧‍👦").length  // 1 (not 11 code units)
   */
  get length() {
    return this.#graphemes.length;
  }
  
  /**
   * Gets the number of UTF-16 code units (JavaScript's native string length).
   * @returns {number} The code unit count
   */
  get codeUnitLength() {
    return this.#value.length;
  }
  
  /**
   * Returns the grapheme cluster at the specified index.
   * @param {number} index - Zero-based grapheme index
   * @returns {string} The grapheme cluster at the index, or empty string if out of bounds
   * @example
   * new GCString("👨‍👩‍👧‍👦 Hi").charAt(0)  // "👨‍👩‍👧‍👦"
   */
  charAt(index) {
    return this.#graphemes[index] || '';
  }
  
  /**
   * Returns the grapheme cluster at the specified index, supporting negative indices.
   * @param {number} index - Grapheme index (negative counts from end)
   * @returns {string|undefined} The grapheme cluster, or undefined if out of bounds
   * @example
   * new GCString("Hello").at(-1)  // "o"
   */
  at(index) {
    const i = index < 0 ? this.#graphemes.length + index : index;
    return this.#graphemes[i];
  }
  
  /**
   * Extracts a section of the string by grapheme positions and returns a new GCString.
   * @param {number} start - Starting grapheme index (inclusive)
   * @param {number} [end] - Ending grapheme index (exclusive)
   * @returns {GCString} A new GCString containing the extracted section
   * @example
   * new GCString("👨‍👩‍👧‍👦 Hello").slice(0, 1)  // GCString("👨‍👩‍👧‍👦")
   */
  slice(start, end) {
    return new GCString(this.#graphemes.slice(start, end).join(''));
  }
  
  /**
   * Extracts graphemes between two indices, swapping them if start > end.
   * @param {number} start - Starting grapheme index
   * @param {number} [end] - Ending grapheme index
   * @returns {GCString} A new GCString containing the substring
   */
  substring(start, end) {
    start = Math.max(0, start);
    end = end === undefined ? this.#graphemes.length : Math.max(0, end);
    if (start > end) [start, end] = [end, start];
    return new GCString(this.#graphemes.slice(start, end).join(''));
  }
  
  /**
   * Extracts graphemes starting at a position with a specified length.
   * @deprecated Use slice() instead
   * @param {number} start - Starting grapheme index (negative counts from end)
   * @param {number} [length] - Number of graphemes to extract
   * @returns {GCString} A new GCString containing the substring
   */
  substr(start, length) {
    if (start < 0) start = Math.max(this.#graphemes.length + start, 0);
    const end = length === undefined ? undefined : start + length;
    return new GCString(this.#graphemes.slice(start, end).join(''));
  }
  
  /**
   * Returns the grapheme index of the first occurrence of a search string.
   * @param {string|GCString} searchString - The string to search for
   * @param {number} [position=0] - The grapheme index to start searching from
   * @returns {number} The grapheme index of the match, or -1 if not found
   * @example
   * new GCString("Hello 👋 World").indexOf("👋")  // 6
   */
  indexOf(searchString, position = 0) {
    const search = searchString instanceof GCString ? 
      searchString.#graphemes : 
      segmentIntoGraphemes(String(searchString));
    
    for (let i = position; i <= this.#graphemes.length - search.length; i++) {
      let match = true;
      for (let j = 0; j < search.length; j++) {
        if (this.#graphemes[i + j] !== search[j]) {
          match = false;
          break;
        }
      }
      if (match) return i;
    }
    return -1;
  }
  
  /**
   * Returns the grapheme index of the last occurrence of a search string.
   * @param {string|GCString} searchString - The string to search for
   * @param {number} [position] - The grapheme index to start searching backwards from
   * @returns {number} The grapheme index of the match, or -1 if not found
   */
  lastIndexOf(searchString, position) {
    const search = searchString instanceof GCString ? 
      searchString.#graphemes : 
      segmentIntoGraphemes(String(searchString));
    
    const start = position === undefined ? 
      this.#graphemes.length - search.length : 
      Math.min(position, this.#graphemes.length - search.length);
    
    for (let i = start; i >= 0; i--) {
      let match = true;
      for (let j = 0; j < search.length; j++) {
        if (this.#graphemes[i + j] !== search[j]) {
          match = false;
          break;
        }
      }
      if (match) return i;
    }
    return -1;
  }
  
  /**
   * Determines whether the string contains a search string.
   * @param {string|GCString} searchString - The string to search for
   * @param {number} [position=0] - The grapheme index to start searching from
   * @returns {boolean} true if the search string is found, false otherwise
   */
  includes(searchString, position = 0) {
    return this.indexOf(searchString, position) !== -1;
  }
  
  /**
   * Determines whether the string starts with a search string.
   * @param {string|GCString} searchString - The string to search for
   * @param {number} [position=0] - The grapheme index to start checking from
   * @returns {boolean} true if the string starts with the search string
   */
  startsWith(searchString, position = 0) {
    return this.indexOf(searchString, position) === position;
  }
  
  /**
   * Determines whether the string ends with a search string.
   * @param {string|GCString} searchString - The string to search for
   * @param {number} [endPosition] - Treat the string as if it were this length
   * @returns {boolean} true if the string ends with the search string
   */
  endsWith(searchString, endPosition) {
    const end = endPosition === undefined ? this.#graphemes.length : endPosition;
    const search = searchString instanceof GCString ? 
      searchString : new GCString(searchString);
    return this.lastIndexOf(search, end - search.length) === end - search.length;
  }
  
  /**
   * Splits the string into an array of GCStrings using a separator.
   * @param {string|RegExp} separator - The separator pattern (empty string splits into graphemes)
   * @param {number} [limit] - Maximum number of splits
   * @returns {Array<GCString>} Array of GCString instances
   * @example
   * new GCString("👋 Hi").split('')  // [GCString("👋"), GCString(" "), GCString("H"), GCString("i")]
   */
  split(separator, limit) {
    if (separator === '') {
      const parts = limit === undefined ? 
        this.#graphemes : 
        this.#graphemes.slice(0, limit);
      return parts.map(g => new GCString(g));
    }
    
    if (separator instanceof RegExp) {
      const parts = this.#value.split(separator, limit);
      return parts.map(p => new GCString(p));
    }
    
    const parts = this.#value.split(String(separator), limit);
    return parts.map(p => new GCString(p));
  }
  
  /**
   * Pads the string from the start to reach a target grapheme length.
   * @param {number} targetLength - The target grapheme length
   * @param {string} [padString=' '] - The string to pad with
   * @returns {GCString} A new padded GCString
   * @example
   * new GCString("Hi").padStart(5, "👋")  // GCString("👋👋👋Hi")
   */
  padStart(targetLength, padString = ' ') {
    const padGC = new GCString(padString);
    const padNeeded = targetLength - this.#graphemes.length;
    
    if (padNeeded <= 0) return new GCString(this.#value);
    
    const fullPads = Math.floor(padNeeded / padGC.length);
    const partialPad = padNeeded % padGC.length;
    
    const padding = padGC.#value.repeat(fullPads) + 
                    padGC.slice(0, partialPad).#value;
    
    return new GCString(padding + this.#value);
  }
  
  /**
   * Pads the string from the end to reach a target grapheme length.
   * @param {number} targetLength - The target grapheme length
   * @param {string} [padString=' '] - The string to pad with
   * @returns {GCString} A new padded GCString
   */
  padEnd(targetLength, padString = ' ') {
    const padGC = new GCString(padString);
    const padNeeded = targetLength - this.#graphemes.length;
    
    if (padNeeded <= 0) return new GCString(this.#value);
    
    const fullPads = Math.floor(padNeeded / padGC.length);
    const partialPad = padNeeded % padGC.length;
    
    const padding = padGC.#value.repeat(fullPads) + 
                    padGC.slice(0, partialPad).#value;
    
    return new GCString(this.#value + padding);
  }
  
  /**
   * Repeats the string a specified number of times.
   * @param {number} count - Number of times to repeat (must be non-negative)
   * @returns {GCString} A new GCString with the repeated content
   */
  repeat(count) {
    return new GCString(this.#value.repeat(count));
  }
  
  /**
   * Iterator that yields each grapheme cluster.
   * Enables for...of loops and spreading.
   * @yields {string} Each grapheme cluster
   * @example
   * for (const char of new GCString("👋 Hi")) { console.log(char); }
   */
  *[Symbol.iterator]() {
    for (const grapheme of this.#graphemes) {
      yield grapheme;
    }
  }
  
  /**
   * Converts all characters to lowercase.
   * @returns {GCString} A new GCString in lowercase
   */
  toLowerCase() {
    return new GCString(this.#value.toLowerCase());
  }
  
  /**
   * Converts all characters to uppercase.
   * @returns {GCString} A new GCString in uppercase
   */
  toUpperCase() {
    return new GCString(this.#value.toUpperCase());
  }
  
  /**
   * Converts to lowercase using locale-specific rules.
   * @param {string|string[]} [locale] - Locale or array of locales
   * @returns {GCString} A new GCString in lowercase
   */
  toLocaleLowerCase(locale) {
    return new GCString(this.#value.toLocaleLowerCase(locale));
  }
  
  /**
   * Converts to uppercase using locale-specific rules.
   * @param {string|string[]} [locale] - Locale or array of locales
   * @returns {GCString} A new GCString in uppercase
   */
  toLocaleUpperCase(locale) {
    return new GCString(this.#value.toLocaleUpperCase(locale));
  }
  
  /**
   * Removes whitespace from both ends of the string.
   * @returns {GCString} A new trimmed GCString
   */
  trim() {
    return new GCString(this.#value.trim());
  }
  
  /**
   * Removes whitespace from the start of the string.
   * @returns {GCString} A new trimmed GCString
   */
  trimStart() {
    return new GCString(this.#value.trimStart());
  }
  
  /**
   * Removes whitespace from the end of the string.
   * @returns {GCString} A new trimmed GCString
   */
  trimEnd() {
    return new GCString(this.#value.trimEnd());
  }
  
  /**
   * Returns the primitive string value.
   * @returns {string} The underlying string
   */
  toString() {
    return this.#value;
  }
  
  /**
   * Returns the primitive value (same as toString).
   * @returns {string} The underlying string
   */
  valueOf() {
    return this.#value;
  }
  
  /**
   * Concatenates strings together.
   * @param {...(string|GCString)} strings - Strings to concatenate
   * @returns {GCString} A new GCString with concatenated content
   * @example
   * new GCString("Hello").concat(" ", "👋")  // GCString("Hello 👋")
   */
  concat(...strings) {
    const combined = this.#value + strings.map(s => 
      s instanceof GCString ? s.#value : String(s)
    ).join('');
    return new GCString(combined);
  }
}

export default GCString;

