import { module, test } from 'qunit';
import { visit, currentURL } from '@ember/test-helpers';
import { setupApplicationTest } from 'ember-qunit';

module('Acceptance | application', function (hooks) {
  setupApplicationTest(hooks);

  test('it boots', async function (assert) {
    await visit('/');

    assert.strictEqual(currentURL(), '/');
  });
});
