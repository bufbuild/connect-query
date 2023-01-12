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

import type { Transport } from '@bufbuild/connect-web';
import { createConnectTransport } from '@bufbuild/connect-web';
import { jest } from '@jest/globals';
import type { QueryClientConfig } from '@tanstack/react-query';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { JSXElementConstructor, PropsWithChildren } from 'react';

import { TransportProvider } from '../use-transport';

/**
 * in these tests, `globalThis.fetch` has been manually mocked by `patchGlobThisFetch` to always respond with this response.
 */
export const hardcodedResponse = { sentence: 'success' };

/**
 * This test-only helper patches `globalThis.fetch` to always return the same hardcoded response, irrespective of the inputs.
 *
 * If you pass a non-function as the mockValue, any call to `globalThis.fetch` will indiscriminately return that value.  However, if you pass a function, that function will be called on the input to `globalThis.fetch` (to be exact, the second argument: the one that contains the data).  That function's output will then be the return value of any calls to `globalThis.fetch` with the same input.
 */
export const patchGlobalThisFetch = <T,>(
  mockValue: T extends (...args: unknown[]) => infer U ? U : T,
) => {
  globalThis.fetch = jest.fn<typeof globalThis.fetch>(
    async (_, init = { body: null }) =>
      Promise.resolve({
        json: async () =>
          Promise.resolve(
            typeof mockValue === 'function' ? mockValue(init.body) : mockValue,
          ),
        headers: new Headers({ 'content-type': 'application/json' }),
        status: 200,
      } as Response),
  );
};

/**
 * A utils wrapper that supplies Tanstack Query's `QueryClientProvider` as well as Connect-Query's `TransportProvider`.
 */
export const wrapper = (
  config?: QueryClientConfig,
  transport = createConnectTransport({
    baseUrl: 'https://demo.connect.build',
  }),
): {
  wrapper: JSXElementConstructor<PropsWithChildren>;
  queryClient: QueryClient;
} => {
  const queryClient = new QueryClient(config);
  return {
    wrapper: ({ children }) => (
      <TransportProvider transport={transport}>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </TransportProvider>
    ),
    queryClient,
  };
};

/**
 * Asserts X and Y are equal
 */
export type Equal<X, Y> = (<T>() => T extends X ? 1 : 2) extends <
  T,
>() => T extends Y ? 1 : 2
  ? true
  : false;

/**
 * Asserts X and Y are not equal
 */
export type NotEqual<X, Y> = true extends Equal<X, Y> ? false : true;

/**
 * Helper for `Alike`
 */
type MergeInsertions<T> = T extends object
  ? { [K in keyof T]: MergeInsertions<T[K]> }
  : T;

/**
 * Similar to `Equal`, but will contend with unions
 */
export type Alike<X, Y> = Equal<MergeInsertions<X>, MergeInsertions<Y>>;

/**
 * Will error if the condition is false
 */
export type Expect<T extends true> = T;

/**
 * Will error if the condition is true
 */
export type ExpectFalse<T extends false> = T;

/**
 * Asserts that a given type is any
 *
 * see https://stackoverflow.com/questions/49927523/disallow-call-with-any/49928360#49928360
 */
export type IsAny<T> = 0 extends T & 1 ? true : false;

/**
 * A test-only helper to increase time (necessary for testing react-query)
 */
export const sleep = async (timeout: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, timeout);
  });

/** this mock is intended to be passed to useContext */
export const mockTransportContext = {
  unary: jest.fn().mockImplementation(() => ({ message: hardcodedResponse })),
  serverStream: jest.fn(),
} as Transport;

/** this mock is intended to be passed to a top level helper like `unaryHooks` */
export const mockTransportTopLevel = {
  unary: jest.fn().mockImplementation(() => ({ message: hardcodedResponse })),
  serverStream: jest.fn(),
} as Transport;

/** this mock is intended to be passed directly to a helper like `useQuery` */
export const mockTransportOption = {
  unary: jest.fn().mockImplementation(() => ({ message: hardcodedResponse })),
  serverStream: jest.fn(),
} as Transport;

export const mockCallOptions = {
  signal: new AbortController().signal,
  timeoutMs: 9000,
  headers: new Headers({
    'Content-Type': 'application/x-shockwave-flash; version="1"',
  }),
}; // satisfies CallOptions;
