# Connect-Query

<!-- markdownlint-disable-next-line MD033 -- `p` tag is necessary for centering the image -->
<p align="center">
  <!-- markdownlint-disable-next-line MD033 -- `img` tag is necessary for setting width -->
  <img src="assets/connect-query@16x.png" width="50%" margin="auto" />
</p>

Connect-Query is an expansion pack for [TanStack Query](https://tanstack.com/query) (react-query), written in TypeScript and thoroughly tested.  It enables effortless communication with servers that speak the [Connect Protocol](https://connect.build/docs/protocol).

- [Connect-Query](#connect-query)
- [Quickstart](#quickstart)
  - [Generated Code](#generated-code)
  - [How to generate code](#how-to-generate-code)
- [Connect-Query API](#connect-query-api)
  - [`createQueryService`](#createqueryservice)
  - [`TransportProvider` (React only)](#transportprovider-react-only)
  - [`useTransport` (React only)](#usetransport-react-only)
  - [`UnaryHooks.createData`](#unaryhookscreatedata)
  - [`UnaryHooks.createUseQueryOptions`](#unaryhookscreateusequeryoptions)
  - [`UnaryHooks.getPartialQueryKey`](#unaryhooksgetpartialquerykey)
  - [`UnaryHooks.getQueryKey`](#unaryhooksgetquerykey)
  - [`UnaryHooks.methodInfo`](#unaryhooksmethodinfo)
  - [`UnaryHooks.setQueryData`](#unaryhookssetquerydata)
  - [`UnaryHooks.setQueriesData`](#unaryhookssetqueriesdata)
  - [`UnaryHooks.useInfiniteQuery` (React only)](#unaryhooksuseinfinitequery-react-only)
  - [`UnaryHooks.useMutation` (React only)](#unaryhooksusemutation-react-only)
  - [`UnaryHooks.useQuery` (React only)](#unaryhooksusequery-react-only)
  - [`ConnectQueryKey`](#connectquerykey)
  - [`ConnectPartialQueryKey`](#connectpartialquerykey)
- [Frequently Asked Questions](#frequently-asked-questions)
  - [Is this ready for production?](#is-this-ready-for-production)
  - [What is Connect-Query's relationship to Connect-Web and Protobuf-ES?](#what-is-connect-querys-relationship-to-connect-web-and-protobuf-es)
  - [What is `Transport`](#what-is-transport)
  - [What if I already use Connect-Web?](#what-if-i-already-use-connect-web)
  - [What if I use gRPC-web?](#what-if-i-use-grpc-web)
  - [Do I have to use a code generator?](#do-i-have-to-use-a-code-generator)
  - [What if I have a custom `Transport`?](#what-if-i-have-a-custom-transport)
  - [Does this only work with React?](#does-this-only-work-with-react)

# Quickstart

Connect-Query will immediately feel familiar to you if you've used TanStack Query.  It provides a set of convenient helpers that you can pass to the same TanStack Query functions you're already using:

```ts
import { useQuery } from '@tanstack/react-query';
import { example } from 'your-generated-code/example-ExampleService_connectquery';

export const Example: FC = () => {
  const { data } = useQuery(example.useQuery({}));
  return <div>{data}</div>;
};
```

**_That's it!_**

The code generator does all the work of turning your protobuf into something you can easily import.  TypeScript types all populate out-of-the-box.  Your documentation is also converted to [TSDoc](https://tsdoc.org/).

## Generated Code

This example shows the best developer experience using code generation.  Here's what that generated code looks like:

```ts title="your-generated-code/example-ExampleService_connectquery"
import { createQueryService } from "@bufbuild/connect-query";
import { MethodKind } from "@bufbuild/protobuf";
import { ExampleRequest, ExampleResponse } from "./example_pb.js";

export const example = createQueryService({
  service: {
    methods: {
      example: {
        name: "Example",
        kind: MethodKind.Unary,
        I: ExampleRequest,
        O: ExampleResponse,
      },
    },
    typeName: "your.company.com.example.v1.ExampleService",
  },
}).example;
```

If you want to use Connect Query dynamically without code generation, you can call `createQueryService` exactly as the generated code does.

## How to generate code

Consider this simple proto file:

```protobuf
syntax = "proto3";

package buf.connect.demo.example.v1;

message Nothing {}

message Todo {
  string id = 1;
  string name = 2;
  bool completed = 3;
}

message Todos {
  repeated Todo todos = 1;
}

service TodoService {
  rpc GetTodos(Nothing) returns (Todos);
  rpc AddTodo(Todo) returns (Nothing);
}
```

This file creates an RPC with the following:

- `GetTodos` takes no inputs and returns an array of `Todo`s.
- `AddTodo` adds a new `Todo` and returns nothing.

Next, tell Buf to use the two plugins with a new configuration file named `buf.gen.yaml`:

```yaml title="buf.gen.yaml"
version: v1
plugins:
  - plugin: es
    out: gen
    opt: target=ts
  - plugin: connect-query
    out: gen
    opt: target=ts
```

Then, add a line to the `scripts` section of your `package.json` to run `buf generate`.  

```json
"scripts": {
    ...
    "buf:generate": "buf generate example.proto"
},
```

Finally, tell Buf to generate code by running your command:

```bash
npm run buf:generate
```

Now you should see your generated code:

```tree
.
└── gen/
    ├── example_pb.ts
    └── example-TodoService_connectquery.ts
```

# Connect-Query API

## `createQueryService`

```ts
const createQueryService: <Service extends ServiceType>({
  service,
  transport,
}: {
    service: Service;
    transport?: Transport;
}) => QueryHooks<Service>
```

`createQueryService` is the main entrypoint for Connect-Query.

Pass in a service and you will receive an object with properties for each of your services and values that provide hooks for those services that you can then give to Tanstack Query.  The `ServiceType` TypeScript interface is provided by Protobuf-ES (`@bufbuild/protobuf`) while generated service definitions are provided by Connect-Web (`@bufbuild/connect-web`).

`Transport` refers to the mechanism by which your client will make the actual network calls.  If you want to use a custom transport, you can optionally provide one with a call to `useTransport`, which Connect-Query exports.  Otherwise, the default transport from React context will be used.  This default transport is placed on React context by the `TransportProvider`. Whether you pass a custom transport or you use `TransportProvider`, in both cases you'll need to use one of `@bufbuild/connect-web`'s exports `createConnectTransport` or `createGrpcWebTransport`.

Note that the most memory performant approach is to use the transport on React Context by using the `TransportProvider` because that provider is memoized by React, but also that any calls to `createQueryService` with the same service is cached by this function.

Here's an example of a simple usage:

```ts
export const { say } = createQueryService({
  service: {
    methods: {
      say: {
        name: "Say",
        kind: MethodKind.Unary,
        I: SayRequest,
        O: SayResponse,
      },
    },
    typeName: "buf.connect.demo.eliza.v1.ElizaService",
  },
});

const { data, isLoading, ...etc } = useQuery(say.useQuery());
```

## `TransportProvider` (React only)

```ts
const TransportProvider: FC<PropsWithChildren<{
  transport: Transport;
}>>;
```

`TransportProvider` is the main mechanism by which Connect-Query keeps track of the `Transport` used by your application.

Broadly speaking, "transport" joins two concepts:

  1. The protocol of communication.  For this there are two options: the [Connect Protocol](https://connect.build/docs/protocol/), or the [gRPC-Web Protocol](https://github.com/grpc/grpc/blob/master/doc/PROTOCOL-WEB.md).
  1. The protocol options.  The primary important piece of information here is the `baseUrl`, but there are also other potentially critical options like request credentials and binary wire format encoding options.

With these two pieces of information in hand, the transport provides the critical mechanism by which your app can make network requests.

To learn more about the two modes of transport, take a look at the npm package `@bufbuild/connect-web`.

To get started with Connect-Query, simply import a transport (either `createConnectTransport` or `createGrpcWebTransport` from `@bufbuild/connect-web`) and pass it to the provider.

```tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TransportProvider } from "@bufbuild/connect-query";

const queryClient = new QueryClient();

export const App() {
  const transport = createConnectTransport({
    baseUrl: "<your baseUrl here>",
  });
  return (
    <TransportProvider transport={transport}>
      <QueryClientProvider client={queryClient}>
         <YourApp />
      </QueryClientProvider>
    </TransportProvider>
  );
}
```

## `useTransport` (React only)

```ts
const useTransport: () => Transport;
```

Use this helper to get the default transport that's currently attached to the React context for the calling component.

## `UnaryHooks.createData`

```ts
const createData: (data: PartialMessage<O>) => O;
```

Use this to create a data object that can be used as `placeholderData` or initialData.

## `UnaryHooks.createUseQueryOptions`

```ts
const createUseQueryOptions: (
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
```

createUseQueryOptions is intended to be used with `useQuery`, but is not a hook.  Since hooks cannot be called conditionally (or in loops), it can sometimes be helpful to use `createUseQueryOptions` to prepare an input to TanStack's `useQuery` API.

## `UnaryHooks.getPartialQueryKey`

```ts
const getPartialQueryKey: () => ConnectPartialQueryKey;
```

This helper is useful for getting query keys matching a wider set of queries associated to this Connect `Service`, per TanStack Query's partial matching mechanism.

## `UnaryHooks.getQueryKey`

```ts
const getQueryKey: (input?: DisableQuery | PartialMessage<I>) => ConnectQueryKey<I>;
```

This helper is useful to manually compute the `queryKey` sent to TanStack Query.  Otherwise, this has no side effects.

## `UnaryHooks.methodInfo`

```ts
const methodInfo: MethodInfoUnary<I, O>;
```

This is the metadata associated with this method.

## `UnaryHooks.setQueryData`

```ts
const setQueryData: (
  updater: PartialMessage<O> | (
    (prev?: O) => PartialMessage<O>
  ),
  input?: PartialMessage<I>,
) => [
  queryKey: ConnectQueryKey<I>,
  updater: (prev?: O) => O | undefined
];
```

This helper is intended to be used with `QueryClient`s `setQueryData` function.

## `UnaryHooks.setQueriesData`

```ts
const setQueriesData: (
  updater: PartialMessage<O> | (
    (prev?: O) => PartialMessage<O>
  ),
) => [
  queryKey: ConnectPartialQueryKey,
  updater: (prev?: O) => O | undefined
];
```

This helper is intended to be used with `QueryClient`s `setQueriesData` function.

## `UnaryHooks.useInfiniteQuery` (React only)

```ts
const useInfiniteQuery: <ParamKey extends keyof PlainMessage<I>>(
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
```

This helper is intended to be used with `QueryClient`s `useInfiniteQuery` function.

## `UnaryHooks.useMutation` (React only)

```ts
const useMutation: (options?: {
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
```

This function is intended to be used with TanStack Query's `useMutation` API.

## `UnaryHooks.useQuery` (React only)

This function is intended to be used with Tanstack Query's `useQuery` API.

```ts
const useQuery: (
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
```

## `ConnectQueryKey`

```ts
type ConnectQueryKey<I extends Message<I>> = [
  serviceTypeName: string,
  methodName: string,
  input: PartialMessage<I>,
];
```

TanStack Query requires query keys in order to decide when the query should automatically update.

`QueryKey`s in TanStack Query are usually arbitrary, but Connect-Query uses the approach of creating a query key that begins with the least specific information: the service's `typeName`, followed by the method name, and ending with the most specific information to identify a particular request: the input message itself.

For example, for a query key might look like this:

```ts
[
  "buf.connect.demo.eliza.v1.ElizaService",
  "Say",
  { sentence: "hello there" },
]
```

## `ConnectPartialQueryKey`

This type is useful In situations where you want to use partial matching for TanStack Query `queryKey`s.

```ts
type ConnectPartialQueryKey = [
  serviceTypeName: string,
  methodName: string,
];
```

# Frequently Asked Questions

## Is this ready for production?

Buf has been using Connect-Query in production for some time.  Also, there is 100% mandatory test coverage in this project which covers quite a lot of edge cases.  That said, this package is given a `v0.x` semver to designate that it's a new project, and we want to make sure the API is exactly what our users want before we call it "production ready".  That also means that some parts of the API may change before `v1.0` is reached.

## What is Connect-Query's relationship to Connect-Web and Protobuf-ES?

Here is a high-level overview of how Connect-Query fits in with Connect-Web and Protobuf-ES:

<details>
<summary>flowchart</summary>

![connect-query_dependency_graph](./assets/connect-query_dependency_graph.png)

</details>

Your `*.proto` file serves as the primary input to the code generators `protoc-gen-connect-query` and `protoc-gen-es`.  Both of these code generators also rely on primitives provided by Protobuf-ES.  The Buf CLI produces the generated output.  The final generated code uses `Transport` from Connect-Web and generates a final Connect-Query API.  Then in your codebase you import the generated code.

## What is `Transport`

`Transport` is a regular JavaScript object with two methods, `unary` and `serverStream`:

```ts
/**
 * Transport represents the underlying transport for a client.
 * A transport implements a protocol, such as Connect or gRPC-web,
 * and allows for the concrete clients to be independent of the protocol.
 */
export interface Transport {
    /**
     * Call a unary RPC
     * a method that takes a single input message,
     * and responds with a single output message.
     */
    unary<
      I extends Message<I> = AnyMessage,
      O extends Message<O> = AnyMessage
    >(
      service: ServiceType,
      method: MethodInfo<I, O>,
      signal: AbortSignal | undefined,
      timeoutMs: number | undefined,
      header: HeadersInit | undefined,
      message: PartialMessage<I>
    ): Promise<UnaryResponse<O>>;

    /**
     * Call a server-streaming RPC
     * a method that takes a single input message,
     * and responds with zero or more output messages.
     */
    serverStream<
      I extends Message<I> = AnyMessage,
      O extends Message<O> = AnyMessage
    >(
      service: ServiceType,
      method: MethodInfo<I, O>,
      signal: AbortSignal | undefined,
      timeoutMs: number | undefined,
      header: HeadersInit | undefined,
      message: PartialMessage<I>
    ): Promise<StreamResponse<O>>;
}
```

While there are a lot of available options, the highlights are that `Transport` is the important mechanism by which calls to a gRPC-web or Connect backend are made from the browser.

## What if I already use Connect-Web?

You can use Connect-Web and Connect-Query together if you like!

## What if I use gRPC-web?

Connect-Query also supports gRPC-web!  All you need to do is make sure you call `createGrpcWebTransport` instead of `createConnectTransport`.

That said, we encourage you to check out the [Connect protocol](https://connect.build/docs/protocol/), a simple, POST-only protocol that works over HTTP/1.1 or HTTP/2. It supports server-streaming methods just like gRPC-Web, but is easy to debug in the network inspector.

## Do I have to use a code generator?

No.  The code generator just calls `createQueryService` with the arguments already added, but you are free to do that yourself if you wish.

## What if I have a custom `Transport`?

If the `Transport` attached to React Context via the `TransportProvider` isn't working for you, then you can override transport at every level.  For example, you can pass a custom transport directly to the lowest-level API like `UnaryHooks.useQuery`, but you can also pass it to `createQueryHooks` or even as high as `createQueryService`.  It's an optional argument for all of those cases and if you choose to omit the `transport` property, the `Transport` provided by `TransportProvider` will be used (only where necessary).

## Does this only work with React?

You can use Connect-Query with any TanStack variant (React, Solid, Svelte, Vue).  However, since the hooks APIs like `useQuery` and `useMutation` automatically infer `Transport` from React Context, these APIs will only work with React, as of now.  There is nothing else React specific in the Connect-Query codebase.  As we expand the scope of the project, we do hope to support all APIs on all TanStack Query variants.

| Connect-Query API       | React              | Solid              | Svelte             | Vue             |
| ----------------------- | ------------------ | ------------------ | ------------------ | ------------------ |
| `createQueryService`    | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: |
| `createQueryHooks`      | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: |
| `isSupportedMethod`     | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: |
| `disableQuery`          | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: |
| `unaryHooks`            | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: |
| `createData`            | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: |
| `createUseQueryOptions` | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: |
| `getPartialQueryKey`    | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: |
| `getQueryKey`           | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: |
| `methodInfo`            | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: |
| `setQueryData`          | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: |
| `setQueriesData`        | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: |
| `useInfiniteQuery`      | :heavy_check_mark: | :x:                | :x:                | :x:                |
| `useMutation`           | :heavy_check_mark: | :x:                | :x:                | :x:                |
| `useQuery`              | :heavy_check_mark: | :x:                | :x:                | :x:                |
| `useQuery`              | :heavy_check_mark: | :x:                | :x:                | :x:                |
| `useTransport`          | :heavy_check_mark: | :x:                | :x:                | :x:                |
| `TransportProvider`     | :heavy_check_mark: | :x:                | :x:                | :x:                |

> If you're a TanStack Query user that uses something other than React, we'd love to hear from you.  Please reach out to us on the [Buf Slack](https://join.slack.com/t/bufbuild/shared_invite/zt-f5k547ki-VDs_iC4TblNCu7ubhRD17w).

Say, for example, you're using Solid together with TanStack Query's `useQuery` API.  In this case you can use `UnaryHooks.createUseQueryOptions` instead of `UnaryHooks.useQuery`.  The only difference is that `createUseQueryOptions` requires you to pass in a `Transport` because it is not a hook and hooks are where transport is automatically inferred.
