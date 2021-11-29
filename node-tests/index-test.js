const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const { assert } = chai;
const fs = require('fs-extra');

const stubProject = {
  name() {
    return 'my-project';
  },
};

describe('service-worker', function () {
  let subject, mockUi;

  beforeEach(function () {
    subject = require('./../index');
    mockUi = {
      verbose: true,
      messages: [],
      write() {},
      writeLine(message) {
        this.messages.push(message);
      },
      writeError(message) {
        this.messages.push(message);
      },
      writeDeprecateLine(message) {
        this.messages.push(message);
      },
      writeWarnLine(message) {
        this.messages.push(message);
      },
    };
  });

  it('has a name', function () {
    var result = subject.createDeployPlugin({
      name: 'test-plugin',
    });

    assert.equal(result.name, 'test-plugin');
  });

  describe('configuration', function () {
    it('provides default config', async function () {
      let plugin = subject.createDeployPlugin({ name: 'service-worker' });
      let context = {
        ui: mockUi,
        project: stubProject,
        config: {
          'service-worker': {},
        },
        distDir: 'test-dist-dir',
        distFiles: ['test-file'],
      };

      await plugin.beforeHook(context);

      assert.deepEqual(context.config['service-worker'], {});

      await plugin.configure(context);

      assert.strictEqual(
        context.config['service-worker'].filePattern,
        '**/*.{js,css,jpg,png,svg,gif}'
      );
      assert.strictEqual(
        context.config['service-worker'].ignorePattern,
        undefined
      );
      assert.strictEqual(context.config['service-worker'].prepend, undefined);
      assert.strictEqual(context.config['service-worker'].version, '1');
      assert.strictEqual(
        context.config['service-worker'].distDir(context),
        'test-dist-dir'
      );
      assert.deepEqual(context.config['service-worker'].distFiles(context), [
        'test-file',
      ]);
    });
  });

  describe('didBuild', function () {
    beforeEach(function () {
      fs.copySync('node-tests/fixtures', 'node-tests/tmp');
    });

    afterEach(function () {
      fs.removeSync('node-tests/tmp');
    });

    it('throws if no distDir is set', async function () {
      let plugin = subject.createDeployPlugin({ name: 'service-worker' });
      let context = {
        ui: mockUi,
        project: stubProject,
        config: {
          'service-worker': {
            filePattern: '**/*.{js,css,jpg,png,svg,gif}',
            ignorePattern: undefined,
            version: '1',
            distFiles: [],
          },
        },
      };

      await plugin.beforeHook(context);
      try {
        await plugin.didBuild(context);
      } catch (error) {
        assert.equal(
          error.message,
          'ember-cli-deploy-service-worker: `distDir` is not set. This means that you probably did not install ember-cli-deploy-build.'
        );
        return;
      }

      assert.fail('Error should be thrown when distDir does not exist');
    });

    it('throws if no distFiles is set', async function () {
      let plugin = subject.createDeployPlugin({ name: 'service-worker' });
      let context = {
        ui: mockUi,
        project: stubProject,
        config: {
          'service-worker': {
            filePattern: '**/*.{js,css,jpg,png,svg,gif}',
            ignorePattern: undefined,
            version: '1',
            distDir: 'node-tests/tmp',
          },
        },
      };

      await plugin.beforeHook(context);
      try {
        await plugin.didBuild(context);
      } catch (error) {
        assert.equal(
          error.message,
          'ember-cli-deploy-service-worker: `distFiles` is not set. This means that you probably did not install ember-cli-deploy-build.'
        );
        return;
      }

      assert.fail('Error should be thrown when distFiles does not exist');
    });

    it('works with basic setup', async function () {
      let plugin = subject.createDeployPlugin({ name: 'service-worker' });
      let context = {
        ui: mockUi,
        project: stubProject,
        config: {
          'service-worker': {
            filePattern: '**/*.{js,css,jpg,png,svg,gif}',
            ignorePattern: undefined,
            prepend: undefined,
            version: '1',
          },
        },
        distDir: 'node-tests/tmp',
        distFiles: ['index.html'],
      };

      await plugin.beforeHook(context);
      await plugin.configure(context);
      await plugin.didBuild(context);

      assert.strictEqual(
        context.distDir,
        'node-tests/tmp',
        'distDir is still correct'
      );
      assert.deepEqual(
        context.distFiles,
        ['index.html', 'sw.js'],
        'sw.js is added to distFiles'
      );

      assert.ok(fs.existsSync('node-tests/tmp/sw.js'));

      let swFileContent = fs.readFileSync('node-tests/tmp/sw.js', 'utf-8');

      assert.include(
        swFileContent,
        `let CACHE_URLS = [
  "assets/app-123.js",
  "assets/img/avatar-123.png",
  "assets/img/close-123.svg",
  "assets/vendor-123.js"
]`,
        'generated sw.js file contains correct list of files'
      );

      assert.include(
        swFileContent,
        "let CACHE_NAME = CACHE_KEY_PREFIX + '-1';",
        'generated sw.js file contains correct cache name'
      );

      assert.include(
        swFileContent,
        "let prependOption = '';",
        'generated sw.js file contains correct prepend'
      );
    });

    it('works with prepend', async function () {
      let plugin = subject.createDeployPlugin({ name: 'service-worker' });
      let context = {
        ui: mockUi,
        project: stubProject,
        config: {
          'service-worker': {
            filePattern: '**/*.{js,css,jpg,png,svg,gif}',
            ignorePattern: undefined,
            prepend: 'https://test-prepend.com',
            version: '1',
          },
        },
        distDir: 'node-tests/tmp',
        distFiles: ['index.html'],
      };

      await plugin.beforeHook(context);
      await plugin.configure(context);
      await plugin.didBuild(context);

      assert.ok(fs.existsSync('node-tests/tmp/sw.js'));

      let swFileContent = fs.readFileSync('node-tests/tmp/sw.js', 'utf-8');

      assert.include(
        swFileContent,
        `let CACHE_URLS = [
  "assets/app-123.js",
  "assets/img/avatar-123.png",
  "assets/img/close-123.svg",
  "assets/vendor-123.js"
]`,
        'generated sw.js file contains correct list of files'
      );

      assert.include(
        swFileContent,
        "let prependOption = 'https://test-prepend.com';",
        'generated sw.js file contains correct prepend'
      );
    });

    it('allows to ignore files', async function () {
      let plugin = subject.createDeployPlugin({ name: 'service-worker' });
      let context = {
        ui: mockUi,
        project: stubProject,
        config: {
          'service-worker': {
            filePattern: '**/*.{js,css,jpg,png,svg,gif}',
            ignorePattern: '**/*.png',
            prepend: undefined,
            version: '1',
          },
        },
        distDir: 'node-tests/tmp',
        distFiles: ['index.html'],
      };

      await plugin.beforeHook(context);
      await plugin.configure(context);
      await plugin.didBuild(context);

      assert.strictEqual(
        context.distDir,
        'node-tests/tmp',
        'distDir is still correct'
      );
      assert.deepEqual(
        context.distFiles,
        ['index.html', 'sw.js'],
        'sw.js is added to distFiles'
      );

      assert.ok(fs.existsSync('node-tests/tmp/sw.js'));

      let swFileContent = fs.readFileSync('node-tests/tmp/sw.js', 'utf-8');

      assert.include(
        swFileContent,
        `let CACHE_URLS = [
  "assets/app-123.js",
  "assets/img/close-123.svg",
  "assets/vendor-123.js"
]`,
        'generated sw.js file contains correct list of files'
      );
    });
  });
});
