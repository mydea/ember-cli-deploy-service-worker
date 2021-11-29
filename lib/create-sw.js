const glob = require('glob');
const fs = require('fs');
const path = require('path');
const generateServiceWorkerFile = require('./generate-service-worker-file');

module.exports = function createSw({
  filePattern,
  ignorePattern,
  version,
  distDir,
  prepend,
}) {
  if (Array.isArray(ignorePattern)) {
    ignorePattern.push('sw.js');
  } else if (ignorePattern) {
    ignorePattern = [ignorePattern, 'sw.js'];
  } else {
    ignorePattern = 'sw.js';
  }
  let files = glob.sync(filePattern, { ignore: ignorePattern, cwd: distDir });

  let fileContent = generateServiceWorkerFile({ files, prepend, version });
  let swFilePath = path.join(distDir, 'sw.js');

  fs.writeFileSync(swFilePath, fileContent, 'utf-8');

  return path.relative(distDir, swFilePath);
};
