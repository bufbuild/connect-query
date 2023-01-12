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
  CallOptions,
  ConnectError,
  Transport,
} from '@bufbuild/connect-web';
import type {
  Message,
  MethodInfoUnary,
  PartialMessage,
  PlainMessage,
  ServiceType,
} from '@bufbuild/protobuf';
import type {
  GetNextPageParamFunction,
  QueryFunctionContext,
} from '@tanstack/react-query';

import type {
  ConnectPartialQueryKey,
  ConnectQueryKey,
} from './connect-query-key';
import { makeConnectQueryKeyGetter } from './connect-query-key';
import { unaryFetch } from './fetch';
import { useTransport } from './use-transport';
import type { DisableQuery } from './utils';
import {
  assert,
  disableQuery,
  isUnaryMethod,
  protobufSafeUpdater,
  unreachableCase,
} from './utils';

/**
 * The set of data and hooks that a unary method supports.
 */
export interface UnaryHooks<I extends Message<I>, O extends Message<O>> {
  /**
   * Use this to create a data object that can be used as `placeholderData` or `initialData`.
   */
  createData: (data: PartialMessage<O>) => O;

  /**
   * createUseQueryOptions is intended to be used with `useQuery`, but is not a hook.  Since hooks cannot be called conditionally (or in loops), it can sometimes be helpful to use `createUseQueryOptions` to prepare an input to TanStack's `useQuery` API.
   *
   * The caveat being that if you go the route of using `createUseQueryOptions` you must provide transport.  You can get transport from the `useTransport` export.  If you cannot use hooks to retrieve transport, then look at the documentation for `TransportProvider` to learn more about how to use Connect-Web's createConnectTransport` or `createGrpcWebTransport`APIs.
   */
  createUseQueryOptions: (
    input: DisableQuery | PartialMessage<I> | undefined,
    options: {
      getPlaceholderData?: (enabled: boolean) => PartialMessage<O> | undefined;

      onError?: (error: ConnectError) => void;
      transport: Transport;
      callOptions?: CallOptions | undefined;
    },
  ) => {
    enabled: boolean;
    queryKey: ConnectQueryKey<I>;
    queryFn: (context?: QueryFunctionContext<ConnectQueryKey<I>>) => Promise<O>;
    placeholderData?: () => O;
    onError?: (error: ConnectError) => void;
  };

  /**
   * This helper is useful for getting query keys matching a wider set of queries associated to this Connect `Service`, per TanStack Query's partial matching mechanism.
   */
  getPartialQueryKey: () => ConnectPartialQueryKey;

  /**
   * This helper is useful to manually compute the `queryKey` sent to TanStack Query.  Otherwise, this has no side effects.
   */
  getQueryKey: (input?: DisableQuery | PartialMessage<I>) => ConnectQueryKey<I>;

  /**
   * This is the metadata associated with this method.
   */
  methodInfo: MethodInfoUnary<I, O>;

  /**
   *
   * This helper is intended to be used with `QueryClient`s `setQueryData` function.
   */
  setQueryData: (
    updater: PartialMessage<O> | ((prev?: O) => PartialMessage<O>),
    input?: PartialMessage<I>,
  ) => [queryKey: ConnectQueryKey<I>, updater: (prev?: O) => O | undefined];

  /**
   * This helper is intended to be used with `QueryClient`s `setQueriesData` function.
   */
  setQueriesData: (
    updater: PartialMessage<O> | ((prev?: O) => PartialMessage<O>),
  ) => [queryKey: ConnectPartialQueryKey, updater: (prev?: O) => O | undefined];

  /**
   * This helper is intended to be used with `QueryClient`s `useInfiniteQuery` function.
   */
  useInfiniteQuery: <ParamKey extends keyof PlainMessage<I>>(
    input: DisableQuery | PartialMessage<I>,
    options: {
      pageParamKey: ParamKey;
      getNextPageParam: (lastPage: O, allPages: O[]) => unknown;

      onError?: (error: ConnectError) => void;
      transport?: Transport | undefined;
      callOptions?: CallOptions | undefined;
    },
  ) => {
    enabled: boolean;
    queryKey: ConnectQueryKey<I>;
    queryFn: (
      context: QueryFunctionContext<
        ConnectQueryKey<I>,
        PlainMessage<I>[ParamKey]
      >,
    ) => Promise<O>;
    getNextPageParam: GetNextPageParamFunction<O>;
    onError?: (error: ConnectError) => void;
  };

  /**
   * This function is intended to be used with TanStack Query's `useMutation` API.
   */
  useMutation: (options?: {
    onError?: (error: ConnectError) => void;
    transport?: Transport | undefined;
    callOptions?: CallOptions | undefined;
  }) => {
    mutationFn: (
      input: PartialMessage<I>,
      context?: QueryFunctionContext<ConnectQueryKey<I>>,
    ) => Promise<O>;
    onError?: (error: ConnectError) => void;
  };

  /**
   * This function is intended to be used with Tanstack Query's `useQuery` API.
   */
  useQuery: (
    input?: DisableQuery | PartialMessage<I>,
    options?: {
      getPlaceholderData?: (enabled: boolean) => PartialMessage<O> | undefined;

      onError?: (error: ConnectError) => void;
      transport?: Transport | undefined;
      callOptions?: CallOptions | undefined;
    },
  ) => {
    enabled: boolean;
    queryKey: ConnectQueryKey<I>;
    queryFn: (context?: QueryFunctionContext<ConnectQueryKey<I>>) => Promise<O>;
    placeholderData?: () => O;
    onError?: (error: ConnectError) => void;
  };
}

/**
 * A helper function that will configure the set of hooks a Unary method supports.
 */
export const unaryHooks = <I extends Message<I>, O extends Message<O>>({
  methodInfo,
  typeName,
  transport: topLevelCustomTransport,
}: {
  methodInfo: MethodInfoUnary<I, O>;
  typeName: ServiceType['typeName'];
  transport?: Transport | undefined;
}): UnaryHooks<I, O> => {
  if (!isUnaryMethod(methodInfo)) {
    throw unreachableCase(
      methodInfo,
      `unaryHooks was passed a non unary method, ${
        (methodInfo as { name: string }).name
      }`,
    );
  }

  const getQueryKey = makeConnectQueryKeyGetter(typeName, methodInfo.name);

  const createUseQueryOptions: UnaryHooks<I, O>['createUseQueryOptions'] = (
    input,
    { callOptions, getPlaceholderData, onError, transport },
  ) => {
    const enabled = input !== disableQuery;

    assert(
      transport !== undefined, // eslint-disable-line @typescript-eslint/no-unnecessary-condition -- yes, it's true that according to the types it should not be possible for a user to pass `undefined` for transport, but it's much nicer to catch them here if they do (as in, without TypeScript or in a insufficiently sound TypeScript configuration).
      'createUseQueryOptions requires you to provide a Transport.  If you want automatic inference of Transport, try using the useQuery helper.',
    );

    return {
      enabled,

      ...(getPlaceholderData
        ? {
            placeholderData: () =>
              new methodInfo.O(getPlaceholderData(enabled)),
          }
        : {}),

      queryFn: async (context) => {
        assert(enabled, 'queryFn does not accept a disabled query');
        return unaryFetch({
          callOptions: callOptions ?? context,
          input,
          methodInfo,
          transport,
          typeName,
        });
      },

      queryKey: getQueryKey(input),

      ...(onError ? { onError } : {}),
    };
  };

  return {
    createData: (input) => new methodInfo.O(input),

    createUseQueryOptions,

    getPartialQueryKey: () => [typeName, methodInfo.name],

    getQueryKey,

    methodInfo,

    setQueriesData: (updater) => [
      [typeName, methodInfo.name],
      protobufSafeUpdater(updater, methodInfo.O),
    ],

    setQueryData: (updater, input) => [
      getQueryKey(input),
      protobufSafeUpdater(updater, methodInfo.O),
    ],

    useInfiniteQuery: (
      input,
      {
        transport: optionsTransport,
        getNextPageParam,
        pageParamKey,
        onError,
        callOptions,
      },
    ) => {
      const contextTransport = useTransport();
      const transport =
        optionsTransport ?? topLevelCustomTransport ?? contextTransport;
      return {
        enabled: input !== disableQuery,

        getNextPageParam,

        queryFn: async (context) => {
          assert(
            input !== disableQuery,
            'queryFn does not accept a disabled query',
          );

          return unaryFetch({
            callOptions: callOptions ?? context,
            input: {
              ...input,
              [pageParamKey]: context.pageParam,
            },
            methodInfo,
            transport,
            typeName,
          });
        },

        queryKey: getQueryKey(input),

        ...(onError ? { onError } : {}),
      };
    },

    useMutation: ({
      transport: optionsTransport,
      callOptions,
      onError,
    } = {}) => {
      const contextTransport = useTransport();
      const transport =
        optionsTransport ?? topLevelCustomTransport ?? contextTransport;

      return {
        mutationFn: async (input, context) =>
          unaryFetch({
            callOptions: callOptions ?? context,
            input,
            methodInfo,
            transport,
            typeName,
          }),
        ...(onError ? { onError } : {}),
      };
    },

    useQuery: (input, options = {}) => {
      const contextTransport = useTransport();
      const transport =
        options.transport ?? topLevelCustomTransport ?? contextTransport;

      return createUseQueryOptions(input, {
        ...options,
        transport,
      });
    },
  };
};
