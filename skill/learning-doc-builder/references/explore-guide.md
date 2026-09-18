# Explore guide: practice and further reading

Every doc ends with a "Practice and explore" section built from a fenced `related` block.
Its job is to turn reading into doing.
Put practice first, reading second.

## What to look for

1. **Hands-on practice for the exact skill the doc teaches.**
   GreatFrontEnd (`greatfrontend.com/questions/...`) is the first place to search for front-end topics.
   Look for multi-part series too - for data tables it has Data Table, II, III and IV, each adding a feature.
2. **The official docs page for each mechanism the doc leans on.**
   The React docs, the library's own guide, MDN for web platform behaviour.
3. **One accessible explainer or primary source** for any research claim the doc cites.

Aim for 4 to 6 links.
Fewer, better links beat a long list.

## How to verify every link

Never add a URL you have not opened in this session.

```bash
curl -s -o /dev/null -w '%{http_code}' -L -A 'Mozilla/5.0' "<url>"
```

- It must return 200.
- Read its page title or description and confirm it is about this doc's topic.
- Prefer stable, versioned URLs (for example TanStack's `/v8/docs/guide/...` pages, which resolve when `/latest/` paths do not).
- If a practice question is behind a paywall, say so in the `note`.

## The block

```related
[
  {
    "title": "Data Table II",
    "url": "https://www.greatfrontend.com/questions/user-interface/data-table-ii",
    "source": "GreatFrontEnd",
    "kind": "practice",
    "difficulty": "Medium",
    "note": "Add column sorting to the same table - the sorting section of this doc."
  }
]
```

- `kind` is `practice`, `read` or `watch`.
- `note` is one plain sentence saying why this link, tied to a section of the doc.
- `difficulty` is optional and only for practice.
