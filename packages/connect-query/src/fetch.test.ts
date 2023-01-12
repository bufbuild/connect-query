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

import { createConnectTransport } from '@bufbuild/connect-web';
import { beforeAll, describe, expect, it } from '@jest/globals';
import { ElizaService } from 'generated-react/dist/eliza_connectweb';
import type { SayResponse } from 'generated-react/dist/eliza_pb';
import { SayRequest } from 'generated-react/dist/eliza_pb';

import { unaryFetch } from './fetch';
import type { Equal, Expect } from './jest/test-utils';
import {
  hardcodedResponse,
  mockCallOptions,
  mockTransportOption,
  patchGlobalThisFetch,
} from './jest/test-utils';

describe('unaryFetch', () => {
  beforeAll(() => {
    patchGlobalThisFetch(hardcodedResponse);
  });

  const transport = createConnectTransport({
    baseUrl: '',
  });

  const fetchOptions = {
    input: new SayRequest(),
    methodInfo: ElizaService.methods.say,
    transport,
    typeName: ElizaService.typeName,
  }; // satisfies Parameters<typeof unaryFetch>[0];

  it('has the correct return type', () => {
    expect.assertions(0);
    const promise = unaryFetch(fetchOptions);
    type ExpectType_Promise = Expect<
      Equal<typeof promise, Promise<SayResponse>>
    >;
  });

  it('returns a message', async () => {
    const response = await unaryFetch(fetchOptions);
    expect(response.toJson()).toStrictEqual(hardcodedResponse);
  });

  it('can handle empty inputs', async () => {
    const response = await unaryFetch({
      ...fetchOptions,
      input: undefined,
    });
    expect(response.toJson()).toStrictEqual(hardcodedResponse);
  });

  it('is aware of AbortSignal signals', () => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises -- it is not necessary to await this promise
    unaryFetch({
      ...fetchOptions,
      callOptions: mockCallOptions,
    });

    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('eliza'),
      expect.objectContaining({
        signal: mockCallOptions.signal,
      }),
    );
  });

  it('is aware of timeoutMs callOption', () => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises -- it is not necessary to await this promise
    unaryFetch({
      ...fetchOptions,
      callOptions: { timeoutMs: mockCallOptions.timeoutMs },
      transport: mockTransportOption,
    });

    expect(mockTransportOption.unary).toHaveBeenCalledWith(
      expect.anything(), // service
      expect.anything(), // method
      undefined, // signal
      mockCallOptions.timeoutMs, // timeoutMs
      undefined, // headers
      expect.anything(), // input
    );
  });

  it('is aware of headers callOption', () => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises -- it is not necessary to await this promise
    unaryFetch({
      ...fetchOptions,
      callOptions: { headers: mockCallOptions.headers },
      transport: mockTransportOption,
    });

    expect(mockTransportOption.unary).toHaveBeenCalledWith(
      expect.anything(), // service
      expect.anything(), // method
      undefined, // signal
      undefined, // timeoutMs
      mockCallOptions.headers, // headers
      expect.anything(), // input
    );
  });
});
