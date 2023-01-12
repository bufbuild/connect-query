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

import type { CallOptions, Transport } from '@bufbuild/connect-web';
import type {
  Message,
  MethodInfo,
  PartialMessage,
  ServiceType,
} from '@bufbuild/protobuf';

/**
 * This helper "puts all the pieces" together to make an actual network request for a unary method.
 */
export const unaryFetch = async <I extends Message<I>, O extends Message<O>>({
  callOptions,
  input = {},
  methodInfo,
  transport,
  typeName,
}: {
  callOptions?: CallOptions | undefined;
  input?: PartialMessage<I> | undefined;
  methodInfo: MethodInfo<I, O>;
  transport: Transport;
  typeName: ServiceType['typeName'];
}) => {
  const response = await transport.unary<I, O>(
    { typeName, methods: {} }, // https://github.com/bufbuild/connect-web/pull/318
    methodInfo,
    callOptions?.signal,
    callOptions?.timeoutMs,
    callOptions?.headers,
    input,
  );
  return response.message;
};
