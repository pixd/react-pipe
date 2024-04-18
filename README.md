### Intercept an action and stop the previous thread

The simplest example.

```typescript
const action = useAction(PAGE_INIT);
```

```typescript
const action = useAction(PAGE_INIT, [pipe.latest]);
```

Returning a property example.

```typescript
const payload = useAction(PAGE_INIT, (action) => action.payload);
```

```typescript
const payload = useAction(PAGE_INIT, (action) => action.payload, [pipe.latest]);
```

Destruct an object example.

```typescript
const { payload } = useAction(PAGE_INIT, [pipe.destruct]);
```

```typescript
const { payload } = useAction(PAGE_INIT, [pipe.latest, pipe.destruct]);
```


### Intercept an action and keep the previous thread

The simplest example.

```typescript
const action = useAction(PAGE_INIT, [pipe.every]);
```

Returning a property example.

```typescript
const payload = useAction(PAGE_INIT, (action) => action.payload, [pipe.every]);
```

Destruct an object example.

```typescript
const { payload } = useAction(PAGE_INIT, [pipe.every, pipe.destruct]);
```


### Handle a `Promise` that returns a data or throws an error with stopping the previous thread

Let's assume that variable named `params` stores a query parameters.

```typescript
const response = usePipe((params) => getUser(params), [params]);
```

```typescript
const response = usePipe((params) => getUser(params), [pipe.latest, params]);
```

In this case, access to the data and to the error can be obtained through `response` and `response.error`. Eg:

```typescript
const dispatch = useDispatch();

const response = usePipe((params) => getUser(params), [params]);

usePipe((data) => dispatch({ type: 'RESOLVED_REQUEST', payload: data }), [response]);

usePipe((error) => dispatch({ type: 'REJECTED_REQUEST', payload: error }), [response.error]);
```


### Handle a `Promise` that returns `{ data, error }` with stopping the previous thread

```typescript
const { data, error } = usePipe((params) => getUser(params), [pipe.destruct, params]);
```

```typescript
const { data, error } = usePipe((params) => getUser(params), [pipe.latest, pipe.destruct, params]);
```


### Handle a `Promise` that returns `[data, error]` with stopping the previous thread

```typescript
const [data, error] = usePipe((params) => getUser(params), [pipe.destruct, params]);
```

```typescript
const [data, error] = usePipe((params) => getUser(params), [pipe.latest, pipe.destruct, params]);
```


### Handle a `Promise` that returns a data or throws an error without stopping the previous thread

Let's assume that variable named `params` stores a query parameters.

```typescript
const response = usePipe((params) => getUser(params), [pipe.every, params]);
```

In this case, access to the data and to the error can be obtained through `response` and `response.error`. Eg:

```typescript
const dispatch = useDispatch();

const response = usePipe((params) => getUser(params)), [pipe.every, params]);

usePipe((data) => dispatch({ type: 'RESOLVED_REQUEST', payload: data }), [response]);

usePipe((error) => dispatch({ type: 'REJECTED_REQUEST', payload: error }), [response.error]);
```

### Handle a `Promise` that returns `{ data, error }` without stopping the previous thread

```typescript
const { data, error } = usePipe((params) => getUser(params), [pipe.every, pipe.destruct, params]);
```

### Handle a `Promise` that returns `[data, error]` without stopping the previous thread

```typescript
const [data, error] = usePipe((params) => getUser(params), [pipe.every, pipe.destruct, params]);
```
