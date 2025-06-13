import { strict as assert } from 'assert';
import { compareVersion } from './compareVersion.js';

assert(compareVersion('100', '>', '99.9'), true);
assert(compareVersion('100.1', '>', '100'), true);
assert(compareVersion('100.2', '>', '100.1'), true);
assert(compareVersion('9.21.3', '<', '9.22'), true);
assert(compareVersion('100', '>=', '100.0'), true);
assert(compareVersion('100', '<=', '100.0'), true);
assert(compareVersion('100', '=', '100.0'), true);
assert(compareVersion('100.0', '=', '100.0'), true);
assert(compareVersion('100', '>=', '100.0.0'), true);
