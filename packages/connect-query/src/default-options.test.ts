// Copyright 2021-2022 Buf Technologies, Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { describe, expect, it } from '@jest/globals';

import { defaultOptions } from './default-options';

describe('defaultOptions', () => {
  const {
    queries: { queryKeyHashFn: hash },
  } = defaultOptions;

  it('hashes primitives', () => {
    expect(hash('a')).toStrictEqual(hash('a'));
    expect(hash(1)).toStrictEqual(hash(1));
    expect(hash(NaN)).toStrictEqual(hash(NaN));
    expect(hash(null)).toStrictEqual(hash(null));
    expect(hash(undefined)).toStrictEqual(hash(undefined));
    expect(hash(true)).toStrictEqual(hash(true));
    expect(hash(['a'])).toStrictEqual(hash(['a']));
    expect(hash({ a: 'a' })).toStrictEqual(hash({ a: 'a' }));

    expect(hash(Symbol('a'))).toStrictEqual(hash(Symbol('a')));
    expect(hash(1n)).toStrictEqual(hash(1n));
    expect(hash(/ziltoid/)).toStrictEqual(hash(/ziltoid/));
    expect(hash(new Date(1))).toStrictEqual(hash(new Date(1)));

    // not equal
    expect(hash(() => {})).not.toStrictEqual(hash(() => {}));
    expect(hash(new Set(['a', 'b']))).not.toStrictEqual(
      hash(new Set(['a', 'b'])),
    );
    expect(hash(new Map([['a', 'b']]))).not.toStrictEqual(
      hash(new Map([['a', 'b']])),
    );
  });

  it('only guarantees referential consistency', () => {
    const func = () => {};
    expect(hash(func)).toStrictEqual(hash(func));

    const set = new Set(['a', 'b']);
    expect(hash(set)).toStrictEqual(hash(set));

    const map = new Map([['a', 'b']]);
    expect(hash(map)).toStrictEqual(hash(map));
  });

  it('ignores object insertion order', () => {
    expect(hash({ a: 1, b: 2 })).toStrictEqual(hash({ b: 2, a: 1 }));
  });

  it('handles circular references', () => {
    interface Ziltoid {
      theOmniscient: true;
      ziltoid?: Ziltoid;
    }
    const ziltoid: Ziltoid = { theOmniscient: true };
    ziltoid.ziltoid = ziltoid;
    expect(hash(ziltoid)).toStrictEqual(hash(ziltoid));
  });
});
