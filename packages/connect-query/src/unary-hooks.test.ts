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

import type { ConnectError } from "@bufbuild/connect-web";
import { createConnectTransport } from "@bufbuild/connect-web";
import type {
  Message,
  MethodInfoUnary,
  PartialMessage,
} from "@bufbuild/protobuf";
import { MethodKind } from "@bufbuild/protobuf";
import {
  describe,
  jest,
  it,
  beforeAll,
  expect,
  beforeEach,
} from "@jest/globals";
import { renderHook, waitFor } from "@testing-library/react";
import { unaryHooks } from "./unary-hooks";
import type { Equal, Expect } from "./jest/test-utils";
import { sleep } from "./jest/test-utils";
import {
  hardcodedResponse,
  patchGlobalThisFetch,
  wrapper,
} from "./jest/test-utils";
import { disableQuery } from "./utils";
import type { DisableQuery } from "./utils";
import {
  ElizaService,
  BigIntService,
} from "./jest/mock-data/eliza/eliza_connectweb";
import type { CountResponse as CountResponse } from "./jest/mock-data/eliza/eliza_pb";
import { SayResponse } from "./jest/mock-data/eliza/eliza_pb";
import type {
  SayRequest,
  CountRequest as CountRequest,
} from "./jest/mock-data/eliza/eliza_pb";
import type { InfiniteData, QueryFunctionContext } from "@tanstack/react-query";
import { useQuery, useMutation, useInfiniteQuery } from "@tanstack/react-query";
import type {
  ConnectPartialQueryKey,
  ConnectQueryKey,
} from "./connect-query-key";
import { defaultOptions } from "./default-options";
import { spyOn } from "jest-mock";

const consoleErrorSpy = spyOn(console, "error");

describe("unaryHooks", () => {
  it("produces the intended API surface", () => {
    const say = unaryHooks({
      methodInfo: ElizaService.methods.say,
      typeName: ElizaService.typeName,
    });

    type expect = Expect<
      Equal<
        keyof typeof say,
        | "createData"
        | "getPartialQueryKey"
        | "getQueryKey"
        | "methodInfo"
        | "setQueriesData"
        | "setQueryData"
        | "useInfiniteQuery"
        | "useMutation"
        | "useQuery"
      >
    >;

    const matchers: Record<keyof typeof say, unknown> = {
      createData: expect.any(Function),
      getPartialQueryKey: expect.any(Function),
      getQueryKey: expect.any(Function),
      methodInfo: expect.objectContaining(ElizaService.methods.say),
      setQueriesData: expect.any(Function),
      setQueryData: expect.any(Function),
      useInfiniteQuery: expect.any(Function),
      useQuery: expect.any(Function),
      useMutation: expect.any(Function),
    };

    const sorter = (a: string, b: string) => a.localeCompare(b);
    expect(Object.keys(say).sort(sorter)).toStrictEqual(
      Object.keys(matchers).sort(sorter)
    );

    expect(say).toMatchObject(matchers);
  });

  it("throws when provided non unary services", () => {
    expect(() => {
      unaryHooks({
        methodInfo: {
          ...ElizaService.methods.say,
          // @ts-expect-error(2322) intentionally incorrect
          kind: MethodKind.BiDiStreaming,
        },
        service: ElizaService,
      });
    }).toThrow("unaryHooks was passed a non unary method, Say");
  });

  it("uses a custom transport", () => {
    patchGlobalThisFetch(hardcodedResponse);
    const baseUrl = "custom";
    const transport = createConnectTransport({ baseUrl });
    const input: PartialMessage<SayRequest> = { sentence: "ziltoid" };

    // @ts-expect-error(2322) intentionally overriding for a jest spy
    transport.unary = jest.spyOn(transport, "unary");

    renderHook(() => {
      const { queryFn } = unaryHooks({
        methodInfo: ElizaService.methods.say,
        typeName: ElizaService.typeName,
        transport,
      }).useQuery(input);
      // eslint-disable-next-line @typescript-eslint/no-floating-promises -- not necessary to await
      queryFn();
    }, wrapper());

    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining(baseUrl),
      expect.anything()
    );

    expect(transport.unary).toHaveBeenCalled();
  });

  describe("createData", () => {
    const { createData } = unaryHooks({
      methodInfo: BigIntService.methods.count,
      typeName: BigIntService.typeName,
    });

    it("creates data as expected", () => {
      const partial: PartialMessage<CountResponse> = {
        count: 1n,
      };
      const expected = new BigIntService.methods.count.O(partial);

      expect(createData(partial)).toStrictEqual(expected);
    });
  });

  describe("getPartialQueryKey", () => {
    const { getPartialQueryKey } = unaryHooks({
      methodInfo: ElizaService.methods.say,
      typeName: ElizaService.typeName,
    });
    type typeGetQuery = Expect<
      Equal<typeof getPartialQueryKey, () => ConnectPartialQueryKey>
    >;

    it("returns a partial query key", () => {
      expect(getPartialQueryKey()).toStrictEqual([
        "buf.connect.demo.eliza.v1.ElizaService",
        "Say",
      ]);
    });
  });

  describe("getQueryKey", () => {
    const { getQueryKey } = unaryHooks({
      methodInfo: ElizaService.methods.say,
      typeName: ElizaService.typeName,
    });
    type typeGetQuery = Expect<
      Equal<
        typeof getQueryKey,
        (
          input?: DisableQuery | PartialMessage<SayRequest>
        ) => ConnectQueryKey<SayRequest>
      >
    >;

    it("returns a simple query key with an input", () => {
      const sentence = { sentence: "ziltoid" };
      expect(getQueryKey(sentence)).toStrictEqual([
        "buf.connect.demo.eliza.v1.ElizaService",
        "Say",
        sentence,
      ]);
    });

    it("returns handles disableQuery", () => {
      expect(getQueryKey(disableQuery)).toStrictEqual([
        "buf.connect.demo.eliza.v1.ElizaService",
        "Say",
        {},
      ]);
    });

    it("returns handles no input", () => {
      expect(getQueryKey()).toStrictEqual([
        "buf.connect.demo.eliza.v1.ElizaService",
        "Say",
        {},
      ]);
      expect(getQueryKey(undefined)).toStrictEqual([
        "buf.connect.demo.eliza.v1.ElizaService",
        "Say",
        {},
      ]);
    });
  });

  describe("methodInfo", () => {
    it("attaches the methodInfo for convenience", () => {
      const say = unaryHooks({
        methodInfo: ElizaService.methods.say,
        typeName: ElizaService.typeName,
      });

      type expect = Expect<
        Equal<typeof say.methodInfo, MethodInfoUnary<SayRequest, SayResponse>>
      >;
      expect(say.methodInfo).toStrictEqual(ElizaService.methods.say);
    });
  });

  describe("setQueriesData & setQueryData", () => {
    const methodInfo = BigIntService.methods.count;
    const { setQueryData, setQueriesData } = unaryHooks({
      methodInfo,
      typeName: BigIntService.typeName,
      transport: createConnectTransport({ baseUrl: "no-op" }),
    });

    /** @returns 2n */
    const partialUpdater = new methodInfo.O({ count: 2n });

    /** @returns input + 1n */
    const functionUpdater = ({ count }: { count: bigint } = { count: 1n }) =>
      new methodInfo.O({
        count: count + 1n,
      });
    const request = { add: 2n };

    const { useQuery: useQueryCq } = unaryHooks({
      methodInfo: BigIntService.methods.count,
      typeName: BigIntService.typeName,
    });

    beforeAll(() => {
      patchGlobalThisFetch({
        count: 1, // note, this isn't a BigInt on purpose, to exercise the serialization (since, fetch returns json)
      });
    });

    describe("setQueriesData", () => {
      it("returns the correct queryKey", () => {
        const [queryKey] = setQueriesData(partialUpdater);
        type typeQueryKey = Expect<
          Equal<typeof queryKey, ConnectPartialQueryKey>
        >;
        expect(queryKey).toStrictEqual([
          "buf.connect.demo.eliza.v1.BigIntService",
          "Count",
        ]);
      });

      it("allows a partial message updater", async () => {
        const { queryClient, ...rest } = wrapper({ defaultOptions });
        const { result, rerender } = renderHook(
          () => useQuery(useQueryCq(request)),
          rest
        );
        type typeData = Expect<
          Equal<typeof result.current.data, CountResponse | undefined>
        >;

        await waitFor(() => {
          expect(result.current.isSuccess).toBeTruthy();
        });

        // this value comes from the globalThis.fetch patch in the beforeAll
        expect(result.current.data?.count).toStrictEqual(1n);

        queryClient.setQueriesData(...setQueriesData(partialUpdater));
        rerender();

        // this value comes from the partial updater
        expect(result.current.data?.count).toStrictEqual(2n);
      });
    });

    describe("setQueryData", () => {
      it("returns the correct queryKey", () => {
        const [queryKey] = setQueryData(partialUpdater, request);
        type typeQueryKey = Expect<
          Equal<typeof queryKey, ConnectQueryKey<CountRequest>>
        >;
        expect(queryKey).toStrictEqual([
          "buf.connect.demo.eliza.v1.BigIntService",
          "Count",
          request,
        ]);
      });

      it("allows a partial message updater", async () => {
        const { queryClient, ...rest } = wrapper({ defaultOptions });

        const { result, rerender } = renderHook(
          () => useQuery(useQueryCq(request)),
          rest
        );

        await waitFor(() => {
          expect(result.current.isSuccess).toBeTruthy();
        });

        expect(typeof result.current.data?.count).toStrictEqual("bigint");

        // this value comes from the globalThis.fetch patch in the beforeAll
        expect(result.current.data?.count).toStrictEqual(1n);

        queryClient.setQueryData(...setQueryData(partialUpdater, request));
        rerender();

        // this value comes from the partial updater
        expect(result.current.data?.count).toStrictEqual(2n);
      });

      it("allows a function updater", async () => {
        const { queryClient, ...rest } = wrapper({ defaultOptions });

        const { result, rerender } = renderHook(
          () => useQuery(useQueryCq(request)),
          rest
        );

        type typeData = Expect<
          Equal<typeof result.current.data, CountResponse | undefined>
        >;

        await waitFor(() => {
          expect(result.current.isSuccess).toBeTruthy();
        });

        // this value comes from the globalThis.fetch patch in the beforeAll
        expect(result.current.data?.count).toStrictEqual(1n);

        queryClient.setQueryData(...setQueryData(functionUpdater, request));
        rerender();

        // this value comes from the partial updater
        expect(result.current.data?.count).toStrictEqual(2n);
      });
    });
  });

  describe("useInfiniteQuery", () => {
    const { useInfiniteQuery: useInfiniteQueryCq, getQueryKey } = unaryHooks({
      methodInfo: BigIntService.methods.count,
      typeName: BigIntService.typeName,
    });

    beforeEach(() => {
      let count = 0;
      patchGlobalThisFetch((_ = "") => {
        count += 1;
        return {
          count,
        };
      });
    });

    it("integrates with `useInfiniteQuery`", async () => {
      const input = { add: 0n };

      const { result, rerender } = renderHook(
        () =>
          useInfiniteQuery(
            useInfiniteQueryCq(input, {
              pageParamKey: "add",
              getNextPageParam: (lastPage) => Number(lastPage.count),
            })
          ),
        wrapper({ defaultOptions })
      );

      expect(result.current.data).toStrictEqual(undefined);
      await waitFor(() => {
        expect(result.current.isSuccess).toBeTruthy();
      });

      expect(result.current.data?.pageParams).toStrictEqual([undefined]);

      expect(result.current.data?.pages).toHaveLength(1);
      expect(result.current.data?.pages[0].count).toStrictEqual(1n);

      // execute a single increment
      await result.current.fetchNextPage();
      rerender();

      expect(result.current.data?.pages).toHaveLength(2);
      expect(result.current.data?.pages[1].count).toStrictEqual(2n);

      // execute two increments at once
      await result.current.fetchNextPage();
      await result.current.fetchNextPage();
      rerender();

      expect(result.current.data?.pages).toHaveLength(4);
      expect(result.current.data?.pages[2].count).toStrictEqual(3n);
      expect(result.current.data?.pages[3].count).toStrictEqual(4n);
    });

    it("is disabled when input matches the `disableQuery` symbol", async () => {
      const { result } = renderHook(
        () =>
          useInfiniteQueryCq(disableQuery, {
            pageParamKey: "add",
            getNextPageParam: (lastPage) => Number(lastPage.count),
          }),
        wrapper()
      );

      expect(result.current).toHaveProperty("enabled", false);

      await expect(result.current.queryFn).rejects.toThrow(
        "Invalid assertion: queryFn does not accept a disabled query"
      );
    });

    it("allows a pageParam for the queryFn", async () => {
      const input = { add: 1n };
      const getNextPageParam = (lastPage: CountResponse) =>
        Number(lastPage.count);
      const { result } = renderHook(
        () =>
          useInfiniteQueryCq(input, {
            pageParamKey: "add",
            getNextPageParam,
          }),
        wrapper()
      );

      expect(result.current.getNextPageParam).toStrictEqual(getNextPageParam);

      const { count } = await result.current.queryFn({
        pageParam: 1n,
        queryKey: getQueryKey(input),
        meta: {},
      });

      expect(count).toStrictEqual(1n);
    });

    describe("onError", () => {
      beforeEach(() => {
        consoleErrorSpy.mockReset();
      });

      it("doesn't use onError if it isn't passed", () => {
        const { result } = renderHook(
          // @ts-expect-error(2345) intentionally missing
          () => useInfiniteQueryCq({}, {}),
          wrapper()
        );
        expect(result.current.onError).toBeUndefined();
        expect(consoleErrorSpy).not.toHaveBeenCalled();
      });

      it("allows for a passthrough onError", async () => {
        const onError = jest.fn();
        const { result, rerender } = renderHook(
          () =>
            useQuery({
              // @ts-expect-error(2345) intentionally invalid input
              ...useInfiniteQueryCq({ nope: "nope nope" }, { onError }),
              queryFn: async () => Promise.reject("error"),
              retry: false,
            }),
          wrapper()
        );
        rerender();

        expect(result.current.error).toStrictEqual(null);
        expect(result.current.isError).toStrictEqual(false);
        expect(onError).toHaveBeenCalledTimes(0);
        expect(consoleErrorSpy).not.toHaveBeenCalled();

        await sleep(10);

        expect(result.current.error).toStrictEqual("error");
        expect(result.current.isError).toStrictEqual(true);
        expect(onError).toHaveBeenCalledTimes(1);
        expect(consoleErrorSpy).toHaveBeenCalledWith("error");
      });
    });
  });

  describe("useMutation", () => {
    const {
      useMutation: useMutationCq,
      useQuery: useQueryCq,
      setQueryData,
      getQueryKey,
    } = unaryHooks({
      methodInfo: BigIntService.methods.count,
      typeName: BigIntService.typeName,
    });

    beforeEach(() => {
      let count = 0;
      patchGlobalThisFetch((body = '{"add": 0}') => {
        let add = 0;
        if (body) {
          try {
            const request = JSON.parse(body) as CountRequest;
            add = Number(request.add);
          } catch (error) {
            add = 0;
          }
        }

        count += add;

        return {
          count,
        };
      });
    });

    it("makes a mutation call", async () => {
      /** this input will add one to the total count */
      const input = { add: 1n };

      const { queryClient, ...rest } = wrapper({ defaultOptions });

      const { result } = renderHook(
        () => ({
          mut: useMutation({
            ...useMutationCq(),
            mutationKey: getQueryKey(input),
            onSuccess: () => {
              const queryKey = getQueryKey(input);
              const { count = 0n } =
                queryClient.getQueryData<CountResponse>(queryKey) ?? {};

              queryClient.setQueryData(
                ...setQueryData({ count: count + input.add }, input)
              );
            },
          }),
          get: useQuery(useQueryCq(input)),
        }),
        rest
      );

      await waitFor(() => {
        expect(result.current.mut.isIdle).toBeTruthy();
        expect(result.current.get.isSuccess).toBeTruthy();
      });

      expect(result.current.get.data?.count).toStrictEqual(1n);
      expect(result.current.mut.data).toStrictEqual(undefined);

      result.current.mut.mutate(input);

      await waitFor(() => {
        expect(result.current.mut.isSuccess).toBeTruthy();
        expect(result.current.get.isSuccess).toBeTruthy();
      });

      expect(result.current.mut.data?.count).toStrictEqual(2n);
      expect(result.current.get.data?.count).toStrictEqual(2n);
    });
  });

  describe("useQuery", () => {
    const say = unaryHooks({
      methodInfo: ElizaService.methods.say,
      typeName: ElizaService.typeName,
    });

    describe("types", () => {
      it("has the intended API surface", () => {
        type params = Parameters<typeof say.useQuery>;
        type typeUseQueryParams0 = Expect<
          Equal<
            params[0],
            PartialMessage<SayRequest> | typeof disableQuery | undefined
          >
        >;

        type typeUseQueryParams1 = Expect<
          Equal<
            params[1],
            | {
                getPlaceholderData?: () => PartialMessage<SayResponse>;
                onError?: (error: ConnectError) => void;
              }
            | undefined
          >
        >;

        type typeUseQueryParams2 = Expect<Equal<params["length"], 0 | 1 | 2>>;

        type typeUseQueryKeys = Expect<
          Equal<
            keyof ReturnType<typeof say.useQuery>,
            | "enabled"
            | "getPlaceholderData"
            | "onError"
            | "queryFn"
            | "queryKey"
          >
        >;

        const { result } = renderHook(
          () =>
            say.useQuery(undefined, {
              onError: jest.fn(),
              getPlaceholderData: jest.fn(() => new SayResponse()),
            }),
          wrapper()
        );

        expect(
          Object.keys(result.current).sort((a, b) => a.localeCompare(b))
        ).toStrictEqual([
          "enabled",
          "getPlaceholderData",
          "onError",
          "queryFn",
          "queryKey",
        ]);
      });
    });

    describe("enabled", () => {
      it("has the correct type", () => {
        expect.assertions(0);
        const { result } = renderHook(() => say.useQuery({}), wrapper());
        type typeExpect = Expect<Equal<typeof result.current.enabled, boolean>>;
      });

      it("is enabled when input does not match the `disableQuery` symbol", () => {
        const { result } = renderHook(() => say.useQuery({}), wrapper());

        expect(result.current).toHaveProperty("enabled", true);
      });

      it("is enabled with an empty input", () => {
        const { result } = renderHook(() => say.useQuery(), wrapper());

        expect(result.current).toHaveProperty("enabled", true);
      });

      it("is disabled when input matches the `disableQuery` symbol", () => {
        const { result } = renderHook(
          () => say.useQuery(disableQuery),
          wrapper()
        );

        expect(result.current).toHaveProperty("enabled", false);
      });
    });

    describe("getPlaceholderData", () => {
      const placeholderSentence: PartialMessage<SayResponse> = {
        sentence: "placeholder",
      };

      const input: PartialMessage<SayRequest> = { sentence: "ziltoid" };

      it("has the correct type", () => {
        expect.assertions(0);
        const { result } = renderHook(() => say.useQuery(), wrapper());
        type typeGetPlaceholderData = Expect<
          Equal<
            typeof result.current.getPlaceholderData,
            (() => Message<SayResponse>) | undefined
          >
        >;
      });

      it("passes through getPlaceholderData, when provided", () => {
        const getPlaceholderData = jest.fn(() => placeholderSentence);
        const { result } = renderHook(
          () => say.useQuery(input, { getPlaceholderData }),
          wrapper()
        );

        expect(result.current).toHaveProperty(
          "getPlaceholderData",
          expect.any(Function)
        );
        expect(getPlaceholderData).not.toHaveBeenCalled();

        const response = (
          result.current.getPlaceholderData as () => Message<SayResponse>
        )();

        expect(getPlaceholderData).toHaveBeenCalledWith();
        expect(response.toJSON()).toStrictEqual(placeholderSentence);
        expect(response).toBeInstanceOf(SayResponse);
      });

      it("does not pass through getPlaceholderData if not provided", () => {
        const { result } = renderHook(() => say.useQuery(input), wrapper());

        expect(result.current).not.toHaveProperty("getPlaceholderData");
      });
    });

    describe("onError", () => {
      beforeEach(() => {
        consoleErrorSpy.mockReset();
      });

      it("doesn't use onError if it isn't passed", () => {
        const { result } = renderHook(() => say.useQuery(), wrapper());
        expect(result.current.onError).toBeUndefined();
      });

      it("allows for a passthrough onError", async () => {
        const onError = jest.fn();
        const { result, rerender } = renderHook(
          () =>
            useQuery({
              // @ts-expect-error(2345) intentionally invalid input
              ...say.useQuery({ nope: "nope nope" }, { onError }),
              queryFn: async () => Promise.reject("error"),
              retry: false,
            }),
          wrapper()
        );
        rerender();

        expect(result.current.error).toStrictEqual(null);
        expect(result.current.isError).toStrictEqual(false);
        expect(onError).toHaveBeenCalledTimes(0);
        expect(consoleErrorSpy).not.toHaveBeenCalled();

        await sleep(10);

        expect(result.current.error).toStrictEqual("error");
        expect(result.current.isError).toStrictEqual(true);
        expect(onError).toHaveBeenCalledTimes(1);
        expect(consoleErrorSpy).toHaveBeenCalledWith("error");
      });
    });

    describe("queryFn", () => {
      beforeAll(() => {
        patchGlobalThisFetch(hardcodedResponse);
      });

      const input: PartialMessage<SayRequest> = { sentence: "ziltoid" };

      it("has the correct type", () => {
        expect.assertions(0);
        const { result } = renderHook(() => say.useQuery(), wrapper());
        type typeQueryFn = Expect<
          Equal<
            typeof result.current.queryFn,
            (
              context?:
                | QueryFunctionContext<ConnectQueryKey<SayRequest>>
                | undefined
            ) => Promise<SayResponse>
          >
        >;
      });

      it("generates a query function", () => {
        const { result } = renderHook(() => say.useQuery(input), wrapper());

        expect(result.current).toHaveProperty("queryFn", expect.any(Function));
      });

      it("throws when the `queryFn` is passed `disabledQuery` symbol as an input", async () => {
        const { result } = renderHook(
          () => say.useQuery(disableQuery),
          wrapper()
        );

        await expect(result.current.queryFn).rejects.toStrictEqual(
          new Error(
            "Invalid assertion: queryFn does not accept a disabled query"
          )
        );
      });

      it("calls `fetch` via the `queryFn` with the right inputs", async () => {
        const { result } = renderHook(() => say.useQuery(input), wrapper());

        const response = await result.current.queryFn();
        expect(response.toJSON()).toStrictEqual(hardcodedResponse);
        expect(globalThis.fetch).toHaveBeenCalledWith(
          expect.stringContaining("eliza"),
          expect.objectContaining({ body: JSON.stringify(input) })
        );
      });
    });

    describe("queryKey", () => {
      const input: PartialMessage<SayRequest> = { sentence: "ziltoid" };

      it("has the correct type", () => {
        expect.assertions(0);
        const { result } = renderHook(() => say.useQuery(), wrapper());
        type typeQueryKey = Expect<
          Equal<
            typeof result.current.queryKey,
            [string, string, PartialMessage<SayRequest>]
          >
        >;
      });

      it("generates a query key", () => {
        const { result } = renderHook(() => say.useQuery(input), wrapper());

        expect(result.current).toHaveProperty("queryKey", [
          ElizaService.typeName,
          ElizaService.methods.say.name,
          { sentence: "ziltoid" },
        ]);
      });
    });
  });
});
