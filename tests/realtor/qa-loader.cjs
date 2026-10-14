module.exports = function(source) {
  if (this.resourcePath.endsWith('.css')) return 'module.exports=' + JSON.stringify(Object.fromEntries([...source.matchAll(/\.([a-zA-Z]+)\b/g)].map(m => [m[1], m[1]])));
  return require('typescript').transpileModule(source, { compilerOptions: { module: 1, jsx: 4, esModuleInterop: true } }).outputText;
};
