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

import type {
  AnyMessage,
  MethodInfoUnary,
  PartialMessage,
} from '@bufbuild/protobuf';
import { MethodKind } from '@bufbuild/protobuf';
import { describe, expect, it, jest } from '@jest/globals';
import { BigIntService } from 'generated-react/dist/eliza_connectweb';
import type { CountResponse } from 'generated-react/dist/eliza_pb';

import type { Equal, Expect } from './jest/test-utils';
import {
  assert,
  isAbortController,
  isUnaryMethod,
  protobufSafeUpdater,
} from './utils';

describe('isUnaryMethod', () => {
  it('returns true for unary methods', () => {
    expect(
      isUnaryMethod({
        kind: MethodKind.BiDiStreaming,
      } as unknown as MethodInfoUnary<AnyMessage, AnyMessage>),
    ).toBeFalsy();
    expect(
      isUnaryMethod({
        kind: MethodKind.ClientStreaming,
      } as unknown as MethodInfoUnary<AnyMessage, AnyMessage>),
    ).toBeFalsy();
    expect(
      isUnaryMethod({
        kind: MethodKind.ServerStreaming,
      } as unknown as MethodInfoUnary<AnyMessage, AnyMessage>),
    ).toBeFalsy();
  });

  it('returns false for non-unary methods', () => {
    expect(
      isUnaryMethod({
        kind: MethodKind.Unary,
      } as unknown as MethodInfoUnary<AnyMessage, AnyMessage>),
    ).toBeTruthy();
  });
});

describe('assert', () => {
  const message = 'assertion message';
  it('throws on a false condition', () => {
    expect(() => {
      assert(false, message);
    }).toThrow(`Invalid assertion: ${message}`);
  });

  it('does not throw on a true condition', () => {
    expect(() => {
      assert(true, message);
    }).not.toThrow();
  });
});

describe('isAbortController', () => {
  it('returns false for non-objects', () => {
    expect(isAbortController(true)).toBeFalsy();
    expect(isAbortController(false)).toBeFalsy();
    expect(isAbortController(0)).toBeFalsy();
    expect(isAbortController(1)).toBeFalsy();
    expect(isAbortController('a')).toBeFalsy();
    expect(isAbortController(undefined)).toBeFalsy();
    expect(isAbortController([])).toBeFalsy();
    expect(isAbortController(null)).toBeFalsy();
  });

  it('returns false for objects missing the AbortController properties', () => {
    expect(isAbortController({})).toBeFalsy();
    expect(isAbortController({ signal: undefined })).toBeFalsy();
    expect(isAbortController({ signal: null })).toBeFalsy();
    expect(isAbortController({ signal: {} })).toBeFalsy();
    expect(isAbortController({ signal: { aborted: undefined } })).toBeFalsy();
    expect(isAbortController({ signal: { aborted: true } })).toBeFalsy();
    expect(
      isAbortController({ signal: { aborted: true }, abort: undefined }),
    ).toBeFalsy();
  });

  it('returns true for the two necessary AbortController properties', () => {
    expect(
      isAbortController({
        signal: {
          aborted: false,
        },
        abort: () => {},
      }),
    ).toBeTruthy();

    expect(isAbortController(new AbortController())).toBeTruthy();
  });
});

describe('protobufSafeUpdater', () => {
  const { count: methodInfo } = BigIntService.methods;
  const input: PartialMessage<CountResponse> = {
    count: 1n,
  };
  const wrappedInput = new methodInfo.O(input);

  const output: PartialMessage<CountResponse> = {
    count: 2n,
  };
  const wrappedOutput = new methodInfo.O(output);

  it('handles a PartialMessage updater', () => {
    const updater = output;
    const safeUpdater = protobufSafeUpdater(updater, methodInfo.O);

    type ExpectType_Updater = Expect<
      Equal<typeof safeUpdater, (prev?: CountResponse) => CountResponse>
    >;
    expect(typeof safeUpdater).toStrictEqual('function');

    const result = safeUpdater(wrappedInput);
    type ExpectType_Result = Expect<Equal<typeof result, CountResponse>>;
    expect(result).not.toStrictEqual(wrappedInput);

    type ExpectType_BigInt = Expect<Equal<typeof result['count'], bigint>>;
    expect(typeof result.count).toStrictEqual('bigint');

    expect(wrappedInput.count).toStrictEqual(1n);
    expect(result.count).toStrictEqual(2n);
    expect(result).toStrictEqual(wrappedOutput);
    expect(result).toHaveProperty('clone');
  });

  it('handles a function updater', () => {
    const updater = jest.fn(() => new methodInfo.O({ count: 2n }));
    const safeUpdater = protobufSafeUpdater(updater, methodInfo.O);

    type ExpectType_Updater = Expect<
      Equal<typeof safeUpdater, (prev?: CountResponse) => CountResponse>
    >;
    expect(typeof safeUpdater).toStrictEqual('function');

    const result = safeUpdater(wrappedInput);
    expect(updater).toHaveBeenCalledWith(input);
    type ExpectType_Result = Expect<Equal<typeof result, CountResponse>>;
    expect(result).not.toStrictEqual(wrappedInput);

    type ExpectType_BigInt = Expect<Equal<typeof result['count'], bigint>>;
    expect(typeof result.count).toStrictEqual('bigint');

    expect(wrappedInput.count).toStrictEqual(1n);
    expect(result.count).toStrictEqual(2n);
    expect(result).toStrictEqual(wrappedOutput);
    expect(result).toHaveProperty('clone');
  });
});
