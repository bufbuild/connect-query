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

export { createQueryService } from './create-query-service';
export type {
  QueryHooks,
  SupportedMethodInfo,
  IsSupportedMethod,
  SupportedMethodKinds,
} from './create-query-hooks';
export {
  createQueryHooks,
  supportedMethodKinds,
  isSupportedMethod,
} from './create-query-hooks';
export type { ConnectQueryKey, ConnectPartialQueryKey } from './connect-query-key';
export type { UnaryHooks } from './unary-hooks';
export { unaryHooks } from './unary-hooks';
export { disableQuery } from './utils';
export { useTransport, TransportProvider } from './use-transport';
