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
  Message,
  MethodInfo,
  PartialMessage,
  ServiceType,
} from '@bufbuild/protobuf';

import type { DisableQuery } from './utils';
import { disableQuery } from './utils';

/**
 * TanStack Query requires query keys in order to decide when the query should automatically update.
 * 
 * `QueryKey`s in TanStack Query are usually arbitrary, but Connect-Query uses the approach of creating a query key that begins with the least specific information: the service's `typeName`, followed by the method name, and ending with the most specific information to identify a particular request: the input message itself.
 * 
 * For example, for a query key might look like this:
 * 
 * @example
 * [
 *   "buf.connect.demo.eliza.v1.ElizaService",
 *   "Say",
 *   { sentence: "hello there" },
 * ]
 */
export type ConnectQueryKey<I extends Message<I>> = [
  serviceTypeName: string,
  methodName: string,
  input: PartialMessage<I>,
];

/**
 * This type is useful in situations where you want to use partial matching for TanStack Query `queryKey`s
 */
export type ConnectPartialQueryKey = [
  serviceTypeName: string,
  methodName: string,
];

/**
 * TanStack Query requires query keys in order to decide when the query should automatically update.
 * 
 * In Connect-Query, much of this is handled automatically by this function.
 * 
 * @see ConnectQueryKey for information on the components of Connect-Query's keys.
 */
export const makeConnectQueryKeyGetter =
  (typeName: ServiceType['typeName'], methodInfoName: MethodInfo['name']) =>
  <I extends Message<I>>(
    input?: DisableQuery | PartialMessage<I> | undefined,
  ): ConnectQueryKey<I> =>
    [typeName, methodInfoName, input === disableQuery || !input ? {} : input];
