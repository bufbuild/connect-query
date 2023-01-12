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

import { ConnectError } from '@bufbuild/connect-web';
import { describe, expect, it } from '@jest/globals';
import { useQuery } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';
import { ElizaService } from 'generated-react/dist/eliza_connectweb';
import { spyOn } from 'jest-mock';

import { sleep, wrapper } from './jest/test-utils';
import { unaryHooks } from './unary-hooks';
import { fallbackTransport } from './use-transport';

const error = new ConnectError(
  "To use Connect, you must provide a `Transport`: a simple object that handles `unary` and `serverStream` requests. `Transport` objects can easily be created by using `@bufbuild/connect-web`'s exports `createConnectTransport` and `createGrpcWebTransport`. see: https://connect.build/docs/web/getting-started for more info.",
);

describe('fallbackTransport', () => {
  it('throws a helpful error message', async () => {
    await expect(Promise.reject(fallbackTransport.unary)).rejects.toThrow(
      error,
    );
    await expect(
      Promise.reject(fallbackTransport.serverStream),
    ).rejects.toThrow(error);
  });
});

describe('useTransport', () => {
  const consoleErrorSpy = spyOn(console, 'error').mockImplementation(() => {});
  const say = unaryHooks({
    methodInfo: ElizaService.methods.say,
    typeName: ElizaService.typeName,
  });

  it('throws the fallback error', async () => {
    const { result, rerender } = renderHook(
      () => useQuery({ ...say.useQuery(), retry: false }),
      wrapper(undefined, fallbackTransport),
    );
    rerender();

    expect(result.current.error).toStrictEqual(null);
    expect(result.current.isError).toStrictEqual(false);
    expect(consoleErrorSpy).not.toHaveBeenCalled();

    await sleep(10);

    expect(result.current.error).toStrictEqual(error);
    expect(result.current.isError).toStrictEqual(true);
    expect(consoleErrorSpy).toHaveBeenCalledWith(error);
  });
});
