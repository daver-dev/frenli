# Feed page implementation steps

Plan for building `app/(tabs)/index.tsx` as the feed (Milestone 1).

- [ ] **1. Design the post item.** Decide what a single feed post looks like
      on screen using the fields on `Post` (`@/types`): a header row (avatar +
      username), the main image, and a footer (caption, like count, comment
      count, maybe a relative timestamp). This becomes the spec for `PostCard`.

- [ ] **2. Create a `PostCard` component** in `components/PostCard.tsx`. It
      takes a single `post: Post` prop and renders the layout from step 1.
      Use `Image` from `react-native` (remote images need an explicit
      width/height/aspectRatio) and `Text`/`View` from `@/components/Themed`
      for light/dark mode support, matching the existing screens.

- [x] **3. Add enough mock posts to test pagination** — done, `posts.ts` now
      has 15 posts (page size defaults to 10, so there are two pages).

- [ ] **4. Set up screen state** in the feed screen: an array of loaded
      `Post`s, the `nextCursor` from the last fetch, and a `loading` flag to
      avoid firing duplicate fetches.

- [ ] **5. Fetch the first page on mount** — `useEffect` calling
      `getFeedPage()` with no cursor, storing the results and `nextCursor`.

- [ ] **6. Render the list with `FlatList`** — `data` = posts array,
      `renderItem` = `PostCard`, `keyExtractor` = `post.id`. `FlatList` over
      `ScrollView` because it virtualizes and has scroll-position callbacks.

- [ ] **7. Implement "load more" via `onEndReached`** (with
      `onEndReachedThreshold` ~0.5). Bail out if `loading` or `nextCursor` is
      `undefined`; otherwise call `getFeedPage(nextCursor)`, append results,
      update `nextCursor`.

- [ ] **8. Add a loading footer** via `ListFooterComponent` — a spinner while
      a "load more" fetch is in flight, nothing once `nextCursor` is
      `undefined`.

- [ ] **9. Pick a styling approach** for `PostCard` and the feed screen —
      NativeWind (`className`, already configured via `global.css` /
      `tailwind.config.js`) vs. `StyleSheet.create` (used by the existing
      placeholder screens).

- [ ] **10. Replace the placeholder content** in `app/(tabs)/index.tsx` —
      remove the `EditScreenInfo`/"Tab One" boilerplate, rename the component
      (e.g. `FeedScreen`), wire in the `FlatList`. Optionally rename the "Home"
      tab title in `_layout.tsx` to "Feed".

- [ ] **11. Run it and test the golden path** — initial posts load, scrolling
      to the bottom fetches and appends the next page, the footer spinner
      appears/disappears correctly, and loading stops once `nextCursor` is
      exhausted.
