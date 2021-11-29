# ember-cli-deploy-service-worker

A plugin for ember-cli-deploy to generate a service worker for caching assets.

This has been heaviliy influenced by [ember-service-worker-asset-cache](https://github.com/DockYard/ember-service-worker-asset-cache), which is sadly not comptible with Embroider.

## Compatibility

- Ember.js v3.20 or above
- Ember CLI v3.20 or above
- Node.js v12 or above

## Installation

```
ember install ember-cli-deploy-service-worker
```

## Usage

Add it to your deploy config:

```js
// config/deploy.js

let ENV = {
  'service-worker': {}
};
```

Now, when deploying your app with ember-cli-deploy, it will build a service worker in `sw.js` and register this.
This service worker will try to cache all configured files for future access.

### Configuration options

Here you can find the default configuration options:

```js
let ENV = {
  'service-worker': {
    filePattern: '**/*.{js,css,jpg,png,svg,gif}',
    ignorePattern: undefined,
    prepend: undefined,
    version: '1',
  },
};
```

- **filePattern**: A glob-pattern (or array of patterns) of files to cache with the service worker
- **ignorePattern**: Optionally, provide a glob-pattern (or array of patterns) of files to _not_ cache
- **prepend**: Optionally, provide a prepend URL to add in front of all cached URLs.
- **version**: This can be used to force cache invalidation. Change this to ensure all files are re-fetched.

### Notes on development

This addon will always register a service worker at `./sw.js`.
However, by default this is an empty file that does nothing.
The placeholder `sw.js` file is generated when you run `ember install ember-cli-deploy-service-worker`,
alternatively you can also generate it via `ember g ember-cli-deploy-service-worker`.

### Notes on caching

You need to make sure that the `sw.js` file itself is not cached on the server. For example, if you use `ember-cli-deploy-s3` to upload your assets, you could use a configuration like this:

```js
let uncachedFilesGlobPattern = 'sw.js';

let ENV = {
  's3-assets': {
    fileIgnorePattern: uncachedFilesGlobPattern,
    bucket: config.bucket,
    region: config.region,
  },

  's3-assets-no-cache': {
    filePattern: uncachedFilesGlobPattern,
    cacheControl: 'no-cache, no-store, must-revalidate',
    bucket: config.bucket,
    region: config.region,
    manifestPath: null,
    allowOverwrite: true,
  },
};
```

## Contributing

See the [Contributing](CONTRIBUTING.md) guide for details.

## License

This project is licensed under the [MIT License](LICENSE.md).
