module.exports = function (api) {
  api.cache(true);
  return {
    // unstable_transformImportMeta: rewrites `import.meta` (used by zustand v5's ESM build)
    // so the web bundle runs as a classic script. Default flips on in SDK 55; needed in 53.
    presets: [["babel-preset-expo", { unstable_transformImportMeta: true }]],
  };
};
