# Data fetching

Three hooks, in order of how much they decide for you: `useBrowsableQuery` (a query driven by the
URL), `useQuery` (a query you drive), `useRequest` (any HTTP call).

**Neighbours:** building the query → `@luminix/core` · what every hook here needs stable →
`getting-started.md`.

## `useQuery(query, options?)`

Runs a `@luminix/core` builder and returns `{ data, meta, links, loading, error, refresh }`. Fires
on mount and whenever `query`, `page`, `method` or `id` change — the builder must be stable.

```tsx
const builder = React.useMemo(
    () => model('post').query().where('status', 'published').orderBy('created_at', 'desc'),
    []);

const { data, loading, error, meta, refresh } = useQuery(builder, { page: 2 });
```

| Option | Type | Default | Notes |
|---|---|---|---|
| `method` | `'get' \| 'all' \| 'first' \| 'find'` | `'get'` | `get` paginates, `all` fetches everything, `first`/`find` fetch one record |
| `page` | `number` | `1` | `method: 'get'` only |
| `id` | `number \| string` | — | `method: 'find'` only |

`data` is always a `Collection` of models — `first` and `find` return one holding a single item, or
leave it `undefined` when nothing matched. `meta` (`current_page`, `last_page`, `total`,
`per_page`) and `links` are only filled by `method: 'get'`.

⚠️ Passing `null` as the builder pauses fetching, and `loading` stays `true` for as long as it is
paused. Branch on the value you passed in, not on `loading`.

### Conditional or dependent queries

Build the builder in a `useMemo` that returns `null` until its inputs exist, and memoize the
options object as well — an object literal there refetches on every render:

```tsx
const query = React.useMemo(() =>
    data.project?.id
        ? model('task').query().where('project_id', data.project.id).minified()
        : null,
    [data.project?.id]);

const { data: tasks, loading } = useQuery(query, React.useMemo(() => ({ page }), [page]));
```

## `useBrowsableQuery(factory)`

Same return as `useQuery`, with the page held in the URL. It reads `?page=` through
`useSearchParams`, forwards the whole search string to the builder as filters
(`query.include(searchParams)`), and when the current page overflows the last one it replaces the
URL with the last page instead of rendering an empty list. It needs a React Router context, and the
factory must be stable.

```tsx
const factory = React.useCallback(() => model('user').query().orderBy('name'), []);
const { data, loading, meta } = useBrowsableQuery(factory);
```

Because every search param reaches the builder, a filter UI only has to write to the query string:
`?q=foo&status=active` becomes the filters of the next request, and the URL stays shareable.

## `<PaginationProvider factory={...}>`

Runs `useBrowsableQuery` and publishes the result on a context, so a table and its pager read the
same query without prop drilling. `usePagination()` returns that value from any descendant.

```tsx
function PostList() {
    const factory = React.useCallback(
        () => model('post').query().orderBy('created_at', 'desc'), []);
    return (
        <PaginationProvider factory={factory}>
            <PostTable />
        </PaginationProvider>
    );
}

function PostTable() {
    const { data, loading, meta } = usePagination();
    if (loading) return <Spinner />;
    return (
        <>
            {data?.map((post) => <PostRow key={post.id} post={post} />)}
            <p>Page {meta?.current_page} of {meta?.last_page}</p>
        </>
    );
}
```

## `useRequest(options, errorBag?)`

For endpoints that are not a model query. Returns `{ response, loading, error, refresh }`, where
`response` is the parsed JSON body. It fires on mount and on every change of `options`, so declare
them at module scope or memoize.

```tsx
const API_OPTS = { route: 'luminix.stats.index', method: 'get' as const };

const { response, loading, error, refresh } = useRequest<StatsPayload>(API_OPTS);
```

| Option | Type | Notes |
|---|---|---|
| `method` | `HttpMethod` | **Required.** |
| `route` | `RouteGenerator` | Named backend route, resolved with `Route.url()`. |
| `url` | `string` | Used when there is no `route`. |
| `params` | `object` | Serialized into the query string. |
| everything else | `RequestOptions` | Handed to the client as request options. |

A 422 populates `errorBag` (default `'default'`), readable with `useErrors` → `form-requests.md`.
Any other failure carrying a `message` is stored in the same bag as a client error, and ends up in
`error`.
