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

import { beforeAll, describe, expect, it, jest } from "@jest/globals";
import { renderHook } from "@testing-library/react";
import { createQueryService } from "./create-query-service";
import { ElizaService } from "./jest/mock-data/eliza/eliza_connectweb";
import { isUnaryMethod } from "./utils";
import type { MethodInfo, PartialMessage } from "@bufbuild/protobuf";
import type { SayRequest, SayResponse } from "./jest/mock-data/eliza/eliza_pb";
import type { Equal, Expect } from "./jest/test-utils";
import {
  hardcodedResponse,
  patchGlobalThisFetch,
  wrapper,
} from "./jest/test-utils";
import { createConnectTransport } from "@bufbuild/connect-web";
import type { ConnectQueryKey } from "./connect-query-key";
import type { QueryFunctionContext } from "@tanstack/react-query";

describe("createQueryService", () => {
  beforeAll(() => {
    patchGlobalThisFetch(hardcodedResponse);
  });

  const service = ElizaService;
  const methodName = "say";
  const input: PartialMessage<SayResponse> = { sentence: "ziltoid" };

  it("uses a custom transport", () => {
    const baseUrl = "custom";
    const transport = createConnectTransport({ baseUrl });

    // @ts-expect-error(2322) intentionally overriding for a jest spy
    transport.unary = jest.spyOn(transport, "unary");

    renderHook(() => {
      const { queryFn } = createQueryService({
        service,
        transport,
      }).say.useQuery(input);
      // eslint-disable-next-line @typescript-eslint/no-floating-promises -- not necessary to await
      queryFn();
    }, wrapper());

    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining(baseUrl),
      expect.anything()
    );
    expect(transport.unary).toHaveBeenCalled();
  });

  it("contains the right options", () => {
    const hook = createQueryService({ service });

    const unaryMethods = Object.keys(service.methods).filter((key) =>
      isUnaryMethod(
        service.methods[key as keyof typeof service.methods] as MethodInfo
      )
    );
    expect(Object.keys(hook)).toHaveLength(unaryMethods.length);

    expect(hook).toHaveProperty(
      methodName,
      expect.objectContaining({
        methodInfo: service.methods[methodName],
        useQuery: expect.any(Function),
      })
    );
  });

  describe("useQuery", () => {
    it("has the appropriate properties", () => {
      const {
        result: { current: queryOptions },
      } = renderHook(
        () => createQueryService({ service }).say.useQuery(input),
        wrapper()
      );

      type typeEnabled = Expect<Equal<typeof queryOptions.enabled, boolean>>;
      expect(queryOptions).toHaveProperty("enabled", true);

      type typeQueryKey = Expect<
        Equal<typeof queryOptions.queryKey, ConnectQueryKey<SayRequest>>
      >;
      expect(queryOptions).toHaveProperty("queryKey", [
        service.typeName,
        service.methods[methodName].name,
        input,
      ]);

      type typeQueryFn = Expect<
        Equal<
          typeof queryOptions.queryFn,
          (
            context?:
              | QueryFunctionContext<ConnectQueryKey<SayRequest>>
              | undefined
          ) => Promise<SayResponse>
        >
      >;
      expect(queryOptions).toHaveProperty("queryFn", expect.any(Function));
    });
  });
});
