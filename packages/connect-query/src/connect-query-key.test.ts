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

import { makeConnectQueryKeyGetter } from './connect-query-key';
import { disableQuery } from './utils';

describe('makeQueryKey', () => {
  const queryKey = makeConnectQueryKeyGetter(
    'service.typeName',
    'methodInfo.name',
  );

  it('makes a query key with input', () => {
    const key = queryKey({ value: 'someValue' });
    expect(key).toStrictEqual([
      'service.typeName',
      'methodInfo.name',
      { value: 'someValue' },
    ]);
  });

  it('allows empty inputs', () => {
    const key = queryKey();
    expect(key).toStrictEqual([
      'service.typeName',
      'methodInfo.name',
      {}, // TODO(paul) is it better to have an empty object or have nothing?  the original implementation had an empty object
    ]);
  });

  it('makes a query key with a disabled input', () => {
    const key = queryKey(disableQuery);
    expect(key).toStrictEqual([
      'service.typeName',
      'methodInfo.name',
      {}, // TODO(paul) is it better to have an empty object or have nothing?  the original implementation had an empty object
    ]);
  });
});
