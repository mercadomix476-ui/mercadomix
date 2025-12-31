module.exports = {
  process(src, filename) {
    return src.replace(/import\.meta\.env/g, 'globalThis.importMetaEnv');
  },
};