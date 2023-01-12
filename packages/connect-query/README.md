# @bufbuild/connect-query

This is the runtime library package for Connect-Query.  You'll find its code generator at [@bufbuild/protoc-gen-connect-query](https://www.npmjs.com/package/@bufbuild/protoc-gen-connect-query).

Connect-Query is an expansion pack for [TanStack Query](https://tanstack.com/query) (react-query), written in TypeScript and thoroughly tested.  It enables effortless communication with servers that speak the [Connect Protocol](https://connect.build/docs/protocol).

The procedures are defined in a [Protocol Buffer](https://developers.google.com/protocol-buffers) schema implemented by your backend, and Connect-Query generates the clients and related types to access the backend with TanStack Query. The clients support two protocols: gRPC-web, and Connect's own protocol.

To get started, head over to the [docs](https://connect.build/docs/query/getting-started) for a tutorial, or take a look at [our examples](https://github.com/bufbuild/connect-query/examples) for integration with various frameworks.
