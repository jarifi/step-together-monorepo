const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// This is the line that fixes your current error:
config.transformer.unstable_allowRequireContext = true;

module.exports = config;