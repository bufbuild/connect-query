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
  MethodInfo,
  MethodInfoUnary,
  PartialMessage,
  ServiceType,
} from '@bufbuild/protobuf';
import { MethodKind } from '@bufbuild/protobuf';
import { describe, expect, it, jest } from '@jest/globals';
import { ElizaService } from 'generated-react/dist/eliza_connectweb';
import type { SayRequest, SayResponse } from 'generated-react/dist/eliza_pb';

import type { ConnectQueryKey } from './connect-query-key';
import { createQueryHooks, isSupportedMethod } from './create-query-hooks';
import type { Alike, Equal, Expect, ExpectFalse } from './jest/test-utils';
import type { UnaryHooks } from './unary-hooks';
import type { DisableQuery } from './utils';

describe('isSupportedMethod', () => {
  const patch = (kind: MethodKind) => ({
    ...ElizaService.methods.say,
    kind,
  });

  it('allows Unary methods', () => {
    const method = patch(MethodKind.Unary);
    const isSupported = isSupportedMethod(method);
    expect(isSupported).toBeTruthy();

    if (!isSupported) {
      // eslint-disable-next-line jest/no-conditional-expect -- this conditional is required for type inferencing
      expect('that this should not fail').toStrictEqual('a failure');
      return; // returning is necessary for TypeScript inference below
    }

    type ExpectType_Kind = Expect<Equal<typeof method.kind, MethodKind.Unary>>;
  });

  it('rejects all other methods', () => {
    expect(isSupportedMethod(patch(MethodKind.BiDiStreaming))).toBeFalsy();
    expect(isSupportedMethod(patch(MethodKind.ClientStreaming))).toBeFalsy();
    expect(isSupportedMethod(patch(MethodKind.ServerStreaming))).toBeFalsy();
  });
});

describe('createQueryHooks', () => {
  const service = ElizaService;

  it('creates hooks for unary methods', () => {
    const hooks = createQueryHooks({
      service: {
        ...service,
        methods: {
          ...service.methods,
          ['sayAgain']: {
            ...service.methods.say,
          },
        },
      },
    });

    type ExpectType_Say = Expect<
      Equal<typeof hooks.say, UnaryHooks<SayRequest, SayResponse>>
    >;

    type ExpectType_HooksKeys = Expect<
      Equal<[keyof typeof hooks], ['say' | 'sayAgain']>
    >;
    expect(Object.keys(hooks)).toStrictEqual(['say', 'sayAgain']);

    type ExpectType_Converse = ExpectFalse<
      Alike<keyof typeof hooks, 'converse'>
    >;
    expect(hooks).not.toHaveProperty('converse');

    type ExpectType_GetQueryKey = Equal<
      typeof hooks['say']['getQueryKey'],
      (
        input: DisableQuery | PartialMessage<SayRequest>,
      ) => ConnectQueryKey<SayRequest>
    >;
    expect(hooks.say).toHaveProperty('getQueryKey', expect.any(Function));

    type ExpectType_MethodInfo = Expect<
      Equal<
        typeof hooks['say']['methodInfo'],
        MethodInfoUnary<SayRequest, SayResponse>
      >
    >;
    expect(hooks.say).toHaveProperty('methodInfo', service.methods.say);

    expect(hooks.say).toHaveProperty('useQuery', expect.any(Function));
  });

  it('filters out non-unary methods', () => {
    const customService: ServiceType = {
      ...service,
      methods: {
        ['BiDiStreaming']: {
          name: 'BiDiStreaming',
          kind: MethodKind.BiDiStreaming,
        } as MethodInfo,
        ['ClientStreaming']: {
          name: 'ClientStreaming',
          kind: MethodKind.ClientStreaming,
        } as MethodInfo,
        ['ServerStreaming']: {
          name: 'ServerStreaming',
          kind: MethodKind.ServerStreaming,
        } as MethodInfo,
        ['Unary']: {
          name: 'Unary',
          kind: MethodKind.Unary,
        } as MethodInfo,
      },
    };

    const hooks = createQueryHooks({ service: customService });

    expect(Object.keys(hooks)).toStrictEqual(['Unary']);
  });

  it('skips unrecognized or missing method kinds', () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});

    const customService: ServiceType = {
      ...service,
      methods: {
        ['Missing']: {
          name: 'Missing',
        } as MethodInfo,
        ['Bad']: {
          name: 'Bad',
          kind: 'Bad',
        } as unknown as MethodInfo,
        ['Unary']: {
          name: 'Unary',
          kind: MethodKind.Unary,
        } as MethodInfo,
      },
    };

    const hooks = createQueryHooks({ service: customService });

    expect(Object.keys(hooks)).toStrictEqual(['Unary']);

    expect(console.error).toHaveBeenCalledWith(
      new Error('Invariant failed: unrecognized method kind: undefined'),
    );
    expect(console.error).toHaveBeenCalledWith(
      new Error('Invariant failed: unrecognized method kind: Bad'),
    );
  });
});
