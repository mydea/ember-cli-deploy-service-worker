/* eslint-disable ember-es6-class/no-object-extend */
/* eslint-disable ember/avoid-leaking-state-in-ember-objects */

'use strict';
const BasePlugin = require('ember-cli-deploy-plugin');
const createSw = require('./lib/create-sw');

module.exports = {
  name: require('./package').name,

  createDeployPlugin(options) {
    let DeployPlugin = BasePlugin.extend({
      name: options.name,
      runAfter: 'build',

      defaultConfig: {
        filePattern: '**/*.{js,css,jpg,png,svg,gif}',
        ignorePattern: undefined,
        version: '1',
        prepend: undefined,
      },

      async didBuild(context) {
        let filePattern = this.readConfig('filePattern');
        let ignorePattern = this.readConfig('ignorePattern');
        let version = this.readConfig('version');
        let prepend = this.readConfig('prepend');
        let { distDir, distFiles } = context;

        if (!distDir) {
          throw new Error(
            'ember-cli-deploy-service-worker: `distDir` is not set. This means that you probably did not install ember-cli-deploy-build.'
          );
        }

        if (!Array.isArray(distFiles)) {
          throw new Error(
            'ember-cli-deploy-service-worker: `distFiles` is not set. This means that you probably did not install ember-cli-deploy-build.'
          );
        }

        let swFilePath = createSw({
          filePattern,
          ignorePattern,
          distDir,
          version,
          prepend,
        });

        distFiles.push(swFilePath);
      },
    });

    return new DeployPlugin();
  },

  included() {
    this._super.included.apply(this, arguments);

    this._fixFingerprintingSettings();
  },

  contentFor(type, config) {
    if (
      config.environment !== 'test' &&
      type === 'body-footer' &&
      !config._serviceWorkerRegistrationInjected
    ) {
      config._serviceWorkerRegistrationInjected = true;
      return `<script>
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js')
    .catch((error) => {
      console.error('Could not setup service worker: ' + error);
    });
  }
</script>`;
    }
  },

  _fixFingerprintingSettings() {
    let app = this._findHost();

    // Fix fingerprinting options to work
    if (
      app.options?.fingerprint?.enabled !== false &&
      app.project.findAddonByName('broccoli-asset-rev')
    ) {
      let fingerprintOptions = app.options.fingerprint || {};

      // Ensure sw.js file is not fingerprinted
      let exclude = fingerprintOptions.exclude || [];
      if (!exclude.includes('sw.js')) {
        exclude.push('sw.js');

        fingerprintOptions.exclude = exclude;
        app.options.fingerprint = fingerprintOptions;
      }
    }
  },
};
