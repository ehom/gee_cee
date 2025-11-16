// jest.config.js
export default {
  testEnvironment: 'node',
  // ADD THIS BLOCK to explicitly tell Jest to use babel-jest for .js and .mjs files
  transform: {
    // This regular expression matches .js and .mjs files in your source and test folders
    '^.+\\.(js|mjs)$': 'babel-jest',
  },
  // Ensure the module is found correctly:
  moduleFileExtensions: ['js', 'json', 'jsx', 'ts', 'tsx', 'node', 'mjs'],
};
