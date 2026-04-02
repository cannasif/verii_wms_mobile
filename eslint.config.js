// Keep this config minimal and dependency-free.
// Expo's build linting was failing on `hugeicons-react-native` because it
// spreads props that include a reserved `key` into SVG elements.
module.exports = [
  {
    ignores: ['node_modules/hugeicons-react-native/**'],
  },
];

