const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Enable package.json "exports" field resolution so subpath imports like
// @hookform/resolvers/zod resolve correctly in Metro.
config.resolver.unstable_enablePackageExports = true;

module.exports = config;
