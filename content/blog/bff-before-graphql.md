---
title: We added a BFF layer before reaching for GraphQL
summary: One table page was making 1 + 1 + N network calls and pulling every bill into the browser. A thin server layer that serves one screen at a time fixed it, and three months later it caught a cross-user data leak before it shipped.
date: 2026-09-11
tags: [architecture, bff, caching]
minutes: 5
---

> [!TLDR]
> One table page was making 1 + 1 + N network calls and pulling every bill into the browser.
> A thin server layer that speaks "one screen at a time" fixed it.
> Three months later it runs 80 routes across 9 features, and it caught a cross-user data leak before it shipped.

## Before: a React app talking straight to the backend

Standard setup.
React, React Query, generated API client.
Every page called the backend directly.

The bills worklist table needed three things per row: the bill, its summary, and its pending approvers.
Those lived behind three different endpoints.

So the page did this:

```ts
// 1 call: every bill, no paging
useQuery({ queryFn: () => getBills({ page_size: 9999 }) });

// 1 call: the summary strip
useQuery({ queryFn: () => getWorklistSummary() });

// N calls: one per bill on screen, to get approvers
useQueries(
  bills.map((b) => ({
    queryFn: () => getBillApprovals({ bill_id: b.id }),
  })),
);
```

Then TanStack Table filtered, sorted, searched, and paginated all 9,999 rows in the browser.

Three problems, in order of pain:

1. **N+1.** 50 rows on screen meant 52 requests before the table was usable.
2. **Fetch everything.** The browser downloaded the whole bill corpus to show page 1 of 10.
3. **Stitching in the UI.** Every screen re-wrote its own "join bill to approver" logic, and they drifted.

## Why not GraphQL?

GraphQL solves the shape problem, not the "where does the join and the auth check live" problem.
A BFF answers both, on the server you already deploy, with zero new infra.
If we ever need GraphQL, it plugs in behind the BFF, not instead of it.

## After: one call per screen

The BFF is a set of resource routes on the same Express server that already does our SSR.
Each route serves exactly one screen.

```ts
// app/routes/bff-payables-worklist-route.tsx
export const loader = async ({ request }) => {
  await requirePermission(request, Permission.BILL_READ); // 1. guard first

  const { client } = await createServerApiClient(request); // 2. user's token, per request
  const bills = await getCached(userId, () =>
    getBills({ client, query: { include: "approvals,vendor" } }),
  ); // 3. one backend call

  const page = paginate(sort(filter(bills, params)), params); // 4. compute on the server

  return respond(worklistSchema.parse(page)); // 5. validated contract
};
```

The browser now sends one request: `GET /bff/worklist?tab=review&q=acme&page=1`.
It gets back 10 rows, a total, and per-tab counts.
Nothing else.

![Before: the browser makes 52 requests and filters 9,999 rows in JavaScript. After: one call to the BFF, which checks permission, caches per user, makes one backend call, computes the page on the server, and returns 10 rows.](images/blog/bff-sequence.png "Before: 52 requests and a client-side join. After: one request, computed on the server.")

## The bug you will hit in week one

If you add a BFF, you now own two caches you did not own before.
Both bit us.

**1. The browser HTTP cache.**
We set `Cache-Control: private, max-age=10` on BFF responses.
Reasonable.
Then user A logged out, user B logged in on the same laptop, and the browser replayed A's worklist JSON to B for 10 seconds.
The fix was one line: `Vary: Cookie`.
The lesson was bigger: every BFF response is per-user, so treat every cache header as a security setting.

**2. The in-memory server cache.**
A BFF loader that caches "the bills list" is a cross-tenant leak waiting to happen.
Ours is keyed by `userId`, and a review agent now blocks any PR where a cache key is anything else.

> [!GOTCHA]
> The guard pattern that came out of it: `requirePermission()` is the first statement in every loader, tenant scope comes from the token and never from a query param, and a fetch error fails loud instead of returning an empty list.

## What the BFF grew into

Once the layer existed, things kept landing on it because it was the obvious place.

- **Server-side filter, sort, search, paginate.** The table emits state, the BFF does the work. Search is debounced at 600ms and adjacent tabs are prefetched.
- **One contract per screen.** Each route returns exactly what its page renders. That is the GraphQL benefit, without the GraphQL.
- **A shared toolkit.** `app/lib/bff` holds cache, compute, CSV, and response helpers. Written once, used by 9 features.
- **The route triple.** Every table page ships list + CSV export + filter options as three sibling routes. New pages copy the shape instead of designing one.
- **A notification system.** The BFF owns a durable inbox (SQLite), a connected-tab presence map, and catch-up delivery after a closed tab. None of that needed a new service.

Plus two I did not expect:

- **Upload proxying.** File uploads go through the BFF as an async job with a status endpoint and streamed progress.
- **Attachment safety.** The BFF refuses to hand out a URL for a quarantined or unscanned file. That check lives in one place now.

## When to add one

Add a BFF when you can say yes to two of these:

1. A screen needs data from more than one endpoint to render.
2. The browser is doing joins, filters, or pagination on the full dataset.
3. You already run a Node server for SSR.
4. Auth, tenant scoping, or cache rules are copy-pasted across pages.

Skip it if you have one backend, one client, and the backend already returns page-shaped data.

> [!RECAP]
>
> - GraphQL fixes the shape problem; a BFF fixes the shape problem and the auth/cache problem, with no new infra.
> - Every BFF response is per-user - `Cache-Control` and every cache key are security settings, not performance knobs.
> - Once the layer exists, uploads, notifications, and export tend to land on it too.

---

Numbers: 80 BFF routes, 9 features, 213 files, one leak caught before production.

What did I miss?
If you have run a BFF for longer than three months, I want to hear what broke.
Find me on [LinkedIn](https://www.linkedin.com/in/ninawekunal/).
