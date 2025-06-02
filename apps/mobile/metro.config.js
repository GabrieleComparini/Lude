const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

module.exports = (() => {
const config = getDefaultConfig(__dirname);


// Add assets to the asset include patterns
config.resolver.assetExts.push('png', 'jpg', 'jpeg', 'gif', 'webp');
config.watchFolders = [...(config.watchFolders || []), './assets'];

// Improved CJS module support
config.resolver.sourceExts.push('cjs', 'mjs');
config.resolver.unstable_enablePackageExports = false;

// Add extraNodeModules for better module resolution
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  'date-fns': path.resolve(__dirname, 'node_modules/date-fns'),
};

return config;
})();