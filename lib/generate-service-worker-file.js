module.exports = function generateServiceWorkerFile({
  files,
  prepend,
  version,
}) {
  return `// THIS FILE IS GENERATED BY ember-cli-deploy-service-worker

const CACHE_KEY_PREFIX = 'sw-asset-cache';

// Determine the base url for cache files by testing if the prepend starts with a protocol
let protocolRegex = /^(?:[a-z0-9]*:)?\\/\\//i;
let prependOption = '${prepend || ''}';
let prependIsAbsolute = protocolRegex.test(prependOption);

let cacheBaseUrl = prependIsAbsolute ? prependOption : self.location;
let cacheFilePrepend =
  prependIsAbsolute || prependOption === '/' ? '' : prependOption;

let CACHE_NAME = CACHE_KEY_PREFIX + '-${version}';

let CACHE_URLS = ${JSON.stringify(files, null, 2)}.map((file) => {
  return new URL(cacheFilePrepend + file, cacheBaseUrl).toString();
});

/*
 * Removes all cached requests from the cache that aren't in the CACHE_URLS
 * list.
 */
function pruneCurrentCache() {
  caches.open(CACHE_NAME).then((cache) => {
    return cache.keys().then((keys) => {
      keys.forEach((request) => {
        if (CACHE_URLS.indexOf(request.url) === -1) {
          cache.delete(request);
        }
      });
    });
  });
}

/*
 * Deletes all caches that start with the prefix, except for the
 * cache defined by currentCache
 */
function cleanupCaches(prefix, currentCache) {
  return caches.keys().then((cacheNames) => {
    cacheNames.forEach((cacheName) => {
      let isOwnCache = cacheName.indexOf(prefix) === 0;
      let isNotCurrentCache = cacheName !== currentCache;

      if (isOwnCache && isNotCurrentCache) {
        caches.delete(cacheName);
      }
    });
  });
};

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.all(
        CACHE_URLS.map((url) => {
          let request = new Request(url, { mode: 'cors' });
          return fetch(request)
            .then((response) => {
              if (response.status >= 400) {
                let error = new Error(
                  \`Request for \${url} failed with status \${response.statusText}\`
                );

                throw error;
              }

              return cache.put(url, response);
            })
            .catch(function (error) {
              console.error(\`Not caching \${url} due to \${error}\`);
            });
        })
      );
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      cleanupCaches(CACHE_KEY_PREFIX, CACHE_NAME),
      pruneCurrentCache(),
    ])
  );
});

self.addEventListener('fetch', (event) => {
  let isGETRequest = event.request.method === 'GET';
  let shouldRespond = CACHE_URLS.indexOf(event.request.url) !== -1;

  if (isGETRequest && shouldRespond) {
    event.respondWith(
      caches.match(event.request, { CACHE_NAME }).then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request.url, { mode: 'cors' });
      })
    );
  }
});
  `;
};
