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
import type {
  Message,
  MethodInfo,
  MethodInfoUnary,
  ServiceType,
} from '@bufbuild/protobuf';
import { MethodKind } from '@bufbuild/protobuf';

import type { UnaryHooks } from './unary-hooks';
import { unaryHooks } from './unary-hooks';
import { unreachableCase } from './utils';

/**
 * This is an array of supported `MethodKind`s
 */
export const supportedMethodKinds = [MethodKind.Unary];

/**
 * This is a convenience type that returns the `MethodKind`s that are supported by Connect-Query
 */
export type SupportedMethodKinds = MethodKind.Unary;

/**
 * This predicate returns true if the service is a kind that's supported by Connect-Query.
 *
 * Today, only Unary services are supported.
 */
export const isSupportedMethod = <I extends Message<I>, O extends Message<O>>(
  method: MethodInfo<I, O>,
): method is IsSupportedMethod<I, O> => {
  return supportedMethodKinds.includes(method.kind);
};

/**
 * A Convenience TypeScript type that validates that a given MethodInfo is supported
 */
export type IsSupportedMethod<
  I extends Message<I>,
  O extends Message<O>,
> = MethodInfoUnary<I, O>;

/** This explicitly states the `MethodKind`s that are supported by Connect-Query and provides a means to convert those kinds into the Hooks types (e.g. UnaryHooks) */
export interface SupportedMethodInfo<MI extends MethodInfo> {
  // in the future, this type is constructed so that new method kinds can be added like this:
  // [MethodKind.BiDiStreaming]: MethodInfoBiDiStreaming<infer I, infer O> ? BiDiStreamingHooks<I, O> : never

  /** this is a mapping from a unary method kind to the hooks a unary method supports */
  [MethodKind.Unary]: MI extends MethodInfoUnary<infer I, infer O>
    ? UnaryHooks<I, O>
    : never;
}

/** This is a helper for `QueryHooks` */
type SupportedHooks<MI extends MethodInfo> =
  MI['kind'] extends keyof SupportedMethodInfo<MI>
    ? SupportedMethodInfo<MI>[MI['kind']]
    : never;

/**
 * QueryHooks is a object that provides all the functionality you need to use TanStack Query with a Connect server.
 *
 * The properties are generated from the method name, and the values of the object depend on the method's kind (i.e. Unary, ServerStreaming, ClientStreaming, BiDiStreaming).
 *
 * Note: Today, only Unary method kinds are supported.
 */
export type QueryHooks<Service extends ServiceType> = {
  [Method in keyof Service['methods'] as Exclude<
    Method,
    keyof SupportedHooks<Service['methods'][Method]>
  >]: SupportedHooks<Service['methods'][Method]>;
};

/**
 * Chances are, what you want to use is `createQueryService`.
 *
 * This helper creates the necessary hooks (stored in a object with one key for each method).
 *
 * It does not, however, provide any caching (like `createQueryService` does) which means that each time you call this function it will generate a fresh set of hooks, even if you call with the same service and transport.
 */
export const createQueryHooks = <Service extends ServiceType>({
  service: { typeName, methods },
  transport,
}: {
  service: Service;
  transport?: Transport | undefined;
}): QueryHooks<Service> =>
  Object.entries(methods).reduce(
    (accumulator, [localName, methodInfo]) => {
      switch (methodInfo.kind) {
        case MethodKind.Unary: {
          return {
            ...accumulator,
            [localName]: unaryHooks({
              methodInfo,
              typeName,
              transport,
            }),
          };
        }

        case MethodKind.BiDiStreaming:
          // not implemented
          return accumulator;

        case MethodKind.ClientStreaming:
          // not implemented
          return accumulator;

        case MethodKind.ServerStreaming:
          // not implemented
          return accumulator;

        default:
          console.error(
            unreachableCase(
              methodInfo,
              `unrecognized method kind: ${
                (methodInfo as { kind: string }).kind
              }`,
            ),
          );
          return accumulator;
      }
    },
    // eslint-disable-next-line @typescript-eslint/prefer-reduce-type-parameter -- making this change causes the wrong overload to be selected
    {} as QueryHooks<Service>,
  );
