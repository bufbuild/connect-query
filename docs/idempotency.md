# Idempotency

## How does Protobuf-ES handle idempotency?

[Protobuf-ES](https://github.com/bufbuild/protobuf-es) exposes a [`MethodInfo` interface](https://github.com/bufbuild/protobuf-es/blob/19ba0c045a1f1f5d9de7ef4449e85edc215a62a6/packages/protobuf/src/service-type.ts#L52) which is also fundamentally used by Connect-Query.  The `MethodInfo` interface contains a field `idempotency` which is a user-provided indication whether the method will cause the same effect every time it is called (known as [idempotence](https://en.wikipedia.org/wiki/Idempotence)).  The value of this field refers to [`google/protobuf`](https://github.com/bufbuild/protobuf-es/blob/19ba0c045a1f1f5d9de7ef4449e85edc215a62a6/packages/protobuf/src/google/protobuf/descriptor_pb.ts#L1956):

```ts
/**
 * Is this method side-effect-free (or safe in HTTP parlance), or idempotent, or neither? HTTP based RPC implementation may choose GET verb for safe
 * methods, and PUT verb for idempotent methods instead of the default POST.
 *
 * @generated from enum google.protobuf.MethodOptions.IdempotencyLevel
 */
export enum MethodOptions_IdempotencyLevel {
  /**
   * @generated from enum value: IDEMPOTENCY_UNKNOWN = 0;
   */
  IDEMPOTENCY_UNKNOWN = 0,

  /**
   * implies idempotent
   *
   * @generated from enum value: NO_SIDE_EFFECTS = 1;
   */
  NO_SIDE_EFFECTS = 1,

  /**
   * idempotent, but may have side effects
   *
   * @generated from enum value: IDEMPOTENT = 2;
   */
  IDEMPOTENT = 2,
}
```

Protobuf-ES [modifies](https://github.com/bufbuild/protobuf-es/blob/19ba0c045a1f1f5d9de7ef4449e85edc215a62a6/packages/protobuf/src/create-descriptor-set.ts#L400) this slightly to drop `IDEMPOTENCY_UNKNOWN` and changes the variable casing:

```ts
export enum MethodIdempotency {
  /**
   * Idempotent, no side effects.
   */
  NoSideEffects = 1,

  /**
   * Idempotent, but may have side effects.
   */
  Idempotent = 2,
}
```

## How does TanStack Query handle idempotency?

While there's no primitive in TanStack specifically for handling idempotency, it's possibly to configure retry behavior.

### TanStack Query's `retry` option

This option exists for TanStack's `useQuery` and `useMutation` APIs.

You can pass `false` to stop a query from ever being retried.  This may be useful for an idempotent endpoint that has side effects because you may want to avoid repeatedly calling that same endpoint.  Otherwise if you pass `true` (the default) TanStack Query will retry infinitely.

Note that you can also pass a number which will retry the query a certain number of times (although, this is less relevant to idempotent endpoints)

### TanStack Query's `retryOnMount` option

This option exists only for TanStack's `useQuery` API.

If set to `false`, the query will not be retried on mount if it contains an error.  This could be useful for idempotency in apps with excessive or unintended remounting when interacting with APIs with side effects.

### TanStack Query's `retryDelay` option

This option exists for TanStack's `useQuery` and `useMutation` APIs.

While this function can be useful for configuring exponential or linear backoffs, it's not as useful when dealing with APIs with side effects where you'd largely want to control the extent of retrying with the `retry` option by setting it to `true` if you don't care about the side effects or or `false` if you do.

## How does Connect-Query handle idempotency?

Connect-Query doesn't specifically handle idempotency directly.  There are two main reasons for this which should make more sense now that you've got some context for what's possible from the above sections.

### Idempotency with Side Effects !== Never Retry

While there are other uses for this `idempotency` field, there's really no way for the Connect-Query library to determine, from this field alone, how you want to modify interactions with an idempotent API with side effects.  For example, you may not care about the side effects.  As you can see from the section above, these options are readily available in TanStack Query.

For example, if you have a Connect-Query usage that looks like this:

```ts
import { useQuery } from '@tanstack/react-query';
import { example } from '@my-company/my-connect-query-generated/example-ExampleService_connectquery';

const MyComponent = () => {
  const { data } = useQuery(example.useQuery());
  return <div>{data}</div>;
};
```

Since Connect-Query's helpers return simple objects, you can specify retry behavior as you would normally with TanStack Query:

```ts
  const { data } = useQuery({
    ...example.useQuery(),
    retry: false,
  });
```

This provides the simplest and most intuitive course of action.  It also avoids the pitfall of the library assuming you want to turn off retries for idempotent endpoints with side effects (which, may be difficult to debug if you are not aware of such a behavior).

### Rerendering has different semantics

The question of how a library like Connect-Query should automatically handle endpoints with side effects becomes more tricky when you consider frameworks that rerender when you mount and unmount components.  TanStack Query handles this by utilizing a cache, but even then, there's no in-built consideration for endpoints with side effects since the developer is left to determine this behavior using query keys (which function as cache invalidators).

In these contexts, as with the above example, it is most correct to let the user specifically define retry characteristics using TanStack Query's existing options rather than inventing a new set of options or trying to automatically infer what the behavior should be.

## Conclusion

Hopefully this document helps explain how you should handle idempotent endpoints with side effects when using Connect-Query.  If you have a use-case where what TanStack Query provides is not sufficient, or where you think Connect-Query can infer behavior with 100% accuracy, then please [submit an issue](https://github.com/bufbuild/connect-query/issues/new) and let us know!
