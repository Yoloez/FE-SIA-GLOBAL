const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

const config = getDefaultConfig(__dirname);

// Add alias resolver
config.resolver = {
  ...config.resolver,
  extraNodeModules: {
    shared: path.resolve(__dirname, "shared"),
  },
};

module.exports = withNativeWind(config, { input: "./global.css" });
