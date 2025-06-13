import { strict as assert } from 'assert';
import { urlParse } from './index.js'

const parseResult = urlParse('/a?a=1')
assert.equal(parseResult.pathname, '/a')
assert.equal(parseResult.search, '?a=1')
assert.equal(parseResult.hash, '')
assert.equal(parseResult.hostname, '')

assert.equal(urlParse('//w.w/a?a=1').hostname, 'w.w')
assert.equal(urlParse('https://w.w/a?a=1').protocol, 'https:')
assert.equal(urlParse('https://w.w/a?a=1').hostname, 'w.w')
assert.equal(urlParse('https://w.w/a?a=1').pathname, '/a')
