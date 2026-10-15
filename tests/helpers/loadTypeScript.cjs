const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');
const ts = require('typescript');

/** Evaluate TS services with explicit native-module substitutes in Node. */
exports.createLoader = function createLoader(mocks = {}) {
  const modules = new Map();
  const requests = [];
  function load(filename) {
    filename = path.resolve(filename);
    if (modules.has(filename)) return modules.get(filename).exports;
    const module = { exports: {} };
    modules.set(filename, module);
    const normalRequire = createRequire(filename);
    const source = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
    }).outputText;
    const requireMock = name => {
      requests.push(name);
      if (Object.hasOwn(mocks, name)) return mocks[name];
      if (/\.(jpg|png)$/.test(name)) return name;
      if (name.startsWith('@/')) {
        const candidate = path.resolve(__dirname, '../..', name.slice(2));
        if (name.endsWith('.json')) return normalRequire(candidate);
        return load(fs.existsSync(`${candidate}.ts`) ? `${candidate}.ts` : path.join(candidate, 'index.ts'));
      }
      if (name.startsWith('.') && !name.endsWith('.json')) {
        const candidate = path.resolve(path.dirname(filename), name);
        return load(fs.existsSync(`${candidate}.ts`) ? `${candidate}.ts` : path.join(candidate, 'index.ts'));
      }
      return normalRequire(name);
    };
    new Function('require', 'module', 'exports', '__DEV__', source)(requireMock, module, module.exports, false);
    return module.exports;
  }
  return { load, modules, requests };
};
