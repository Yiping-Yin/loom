import test from 'node:test';
import assert from 'node:assert/strict';
import { nextLocalClock } from '../lib/sync/use-profile-sync';

test('nextLocalClock advances monotonically even if the wall clock is equal/backwards', () => {
  assert.equal(nextLocalClock(100, 100), 101); // equal → +1
  assert.equal(nextLocalClock(100, 90), 101);  // backwards → prev+1
  assert.equal(nextLocalClock(100, 250), 250); // forward → wall clock
});
