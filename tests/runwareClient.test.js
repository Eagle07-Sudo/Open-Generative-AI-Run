import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseRunwareErrorDetails } from '../packages/studio/src/providers/runwareClient.js';

describe('runwareClient parseRunwareErrorDetails', () => {
  it('uses code when message is generic Runware placeholder', () => {
    const { message, code } = parseRunwareErrorDetails({
      errors: [
        {
          message: 'An error has occurred please read documentation for additional details.',
          code: 'Runware\\Architectures::getArchitectureById(): Argument #1 ($architectureId) must be of type int',
        },
      ],
    });
    assert.match(message, /getArchitectureById/);
    assert.equal(code, 'Runware\\Architectures::getArchitectureById(): Argument #1 ($architectureId) must be of type int');
  });
});
