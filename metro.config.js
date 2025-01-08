const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add this configuration to reduce file watching
config.watchFolders = [__dirname];
config.resolver.nodeModulesPaths = [__dirname + '/node_modules'];
config.watcher = {
  watchman: {
    crawlSymlinks: false,
  },
};

module.exports = config;
