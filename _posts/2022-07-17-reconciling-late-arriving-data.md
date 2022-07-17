---
title: A Better Data Structure for Reconciling Late-Arriving Collections of Data
date: 2022-07-17 9:45:00 -08:00
description: Managing conflict resolution in offline-friendly data stores
tags: post
---

I’m a big fan of approaches to web development that take offline support seriously. Air travel and subway commutes aside, offline-friendly patterns dramatically improve UX by enabling optimistic UI updates in the much more common scenario of a flaky network or a slow API.

While you could roll your own, implementations like [Replicache's "Realtime Sync"](https://replicache.dev/) make it easy to implement this pattern across your app: update the UI right away, store all data locally, and then lazily sync changes to your API in the background.

This last bit—lazily syncing changes to your API—sounds deceptively simple. I've learned the hard way that whenever there's more than one device involved and significant delays in syncing updates (e.g. a device comes back online after a few hours of offline edits), you end up having to reconcile conflicting changes. There's a reason [Replicache makes you write your own conflict resolution](https://doc.replicache.dev/how-it-works#conflict-resolution)—it's often domain specific and tricky to get right.

I've dealt with this problem when syncing user settings to the BeFunky API and more recently when building a [podcast app](https://www.adblockpodcast.com/). In both cases, users can be logged-in even if they're offline (at least for a short while), and when they come back online their updated settings must be reconciled.

This post is an attempt at finding a common solution for merging simple out-of-sync collections of user data.

## A high level view of the problem

The best mental model I've found for thinking about merging collections of data (think objects or arrays) from various devices is Git branches. Two principles emerge:

1. Merging branches is trivial when they don't modify the same files. Thus, if two collections' changed keys/indices don't overlap, they'll merge without conflicts.

2. Git keeps track of what changed (additions and removals) and when it changed (timestamps). It's not enough to simply know the final state of two branches to merge them reliably, it's helpful to know how they both changed over time.

## Dealing with Arrays

[Adblock Podcast](https://www.adblockpodcast.com/) has a "Listen Later" feature, stored as an array of episode IDs that get removed once the podcast has been listened to. Imagine this scenario on a subway commute:

- Three episodes are in the "Listen Later" queue: `[A1, B2, C3]`
- User listens to the second episode on their phone: `[A1, C3]`. They're in the subway so the data doesn't sync.
- At the office, they open the web app in a browser and finish listening to the third episode `[A1, B2]` and queue up another one: `[N0, A1, B2]`.
- At lunch, they pull out their phone and it finally syncs up with the API. 

```
API State: [N0, A1, B2]
Phone State: [A1, C3]
Ideal Merge: [N0, A1]
```

If we just know the state of the API and the phone, it's unclear what to do with items `N0`, `B2`, & `C3`. It's essential to know the diff from the phone:

```
API State: [N0, A1, B2]
Phone Diff: (Remove B2)
Easy Merge: [N0, A1]
```

Suddenly, the problem gets much simpler.

Keep in mind that it's important to diff the array's values, not its indices. From the API's perspective, `B2` is at index 2 and from the phone's perspective, `B2` is at index 1. Thus, sending an standard JS Array Diff (e.g. a [JSON Patch](https://jsonpatch.com/)) isn't going to cut it.

Instead, ensure each value has a unique & stable identifier. In the case of episode IDs, the ID itself will do, but in other cases you may want to use a hash or UUID. 

## Store a timestamp with every change

In the above example, the conflict was relatively easy to resolve b/c the phone and browser mutated different array items.

When multiple devices update the same item in a collection, a conflict occurs, much like a Git merge of two branches that modify the same files. Unlike Git, we can't press pause and sort out the conflict manually, so the resolution I usually reach for is "newest change wins". 

To accurately do this it's important to know when a change was made on the client, not just when that change was synced to the server. This may seem like an edge case, but there's nothing worse than a device coming back online after a couple hours and syncing stale data, overwriting more recent changes!

Storing a timestamp for each piece of data in a collection could look something like this: 

```js
// Data structure that's easy to diff & merge
const listenLaterAddedItems = {
  N0: <timestamp>,
  A1: <timestamp>,
};
const listenLaterRemovedItems = {
  B2: <timestamp>,
  C3: <timestamp>,
};
// Derived state for other purposes (e.g. rendering)
const listenLaterArray = Object.keys(listenLaterAddedItems);
```

*Notice we also track removed items to avoid re-adding an item from a stale update when it has been more recently removed. Ugh!*

This is just pseudocode and it's already looking more complex than I'd like. All of this just to store a simple array of episode ids?

Fortunately, this pattern generalizes pretty well to any collection of data where:
- Each piece of data has a unique and stable identifier
- Preserving item order isn't essential
- Old items should be replaced by newer items with the same key

If you're interested in trying it out, I wrote a small library that implements this pattern, making it easy to sync collections between multiple clients and an API: <br>
[github.com/micahjon/timestamp-collection](https://github.com/micahjon/timestamp-collection)

- Stores a collection of unique keys, each with a timestamp and an optional value

```js
listenLaterCollection.add('A1');
// Stored as { A1: [<timestamp>] }, representing array ['A1']

podcastProgressCollection.add('A1', Date.now(), 14.2)
// Stored as { A1: [<timestamp>, 14.2] }, representing object { A1: 14.2 }
```

- `add()` and `remove()` methods that only mutate the collection if the timestamp is newer

- `get()` computed properties with stable references, making it trivial to derive an array (or any other data structure) and use it for rendering with minimal performance impact.

```js
// store.js
// Will return same array reference if IDs have not changed
export const getEpisodeIds = () => listenLaterCollection.get(Object.keys); 

// listen-later.js
export const ListenLater = () => {
  const episodeIds = getEpisodeIds();

  useEffect(() => {
    // episodeIds reference needs to be stable or this will run every time
  }, [episodeIds]);
}
```

- A built-in hash that makes it easy to compare collections (e.g. on client and API) to know if they're identical and avoid syncing data when they are.

- You can import/export the entire collection or a subtree of recent changes as JSON, making it easy to sync without sending the whole thing over the wire.

I have a hard time believing that someone else hasn't already written this sort of thing, but I haven't been able to find it. If you know of a library that implements this pattern already, or have other suggestions, please let me know!