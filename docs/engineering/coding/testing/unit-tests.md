---
type: policy
title: Unit tests
description: When a new unit test may exist and the kinds that qualify (a refusal a local run cannot provoke, a decision that must never run live, a validator or parser with many edge cases, a protocol detail the live system hides, a boundary outcome a local run cannot provoke, a marked exception), what a test may assert, mocking at the process boundary, whose test data a test may use, and how a developer adds a rule.
related: [why-a-rule.md]
nav: { order: 10 }
---

# Unit tests

Why: [why a unit test needs a rule](why-a-rule.md). These rules hold for every unit test added from now on, in every package of the repo. The existing suite is not yet held to them.

## The default

An agent verifies its change end to end, against the running system. A unit test exists only where that run cannot prove the same thing, and only in one of the kinds below. Nothing else earns one: not a new function, not a changed one, not a coverage number.

## The kinds

### 1. A refusal a local run cannot provoke

The refused caller is one a local run cannot be: a forged, expired or foreign token, another person's session, a machine's token, a caller without the grant. The test proves the caller is refused and nothing ran.


### 2. A decision that must never run live

A wrong answer would act on real data: another person's records changed, production credentials minted, a customer reached. The test proves the decision and that the action never happened.


### 3. A validator or parser with many edge cases

One table, one row per edge case, where an end-to-end run would need a run per row.


### 4. A protocol detail the live system hides

What the running system never shows its caller: a hash or signature format, a header forwarded or dropped, a value a log line must never carry.


### 5. A boundary outcome a local run cannot provoke

The outcome comes from a system outside the repo. The test proves what the code does with that outcome, and nothing about the outcome itself.

### 6. A marked exception

A test a person keeps on purpose where no other kind applies. The comment above it starts with `// Unit-Test-Rule Exception:` and says in one line what the test holds that an end-to-end run cannot. Only a human adds the marker; an agent never writes one, and a marker an agent wrote is removed in review. The Never list still holds. A reason that comes up twice is a rule in the making; see [changing the rules](#changing-the-rules).

## Never

- A test whose only evidence is a mock's configured return or an argument forwarded unchanged. Where a kind applies, a mocked boundary value may appear in the expected result when real code decided, transformed or triggered it.
- A test that must change when the implementation is refactored and the behaviour is not.
- A test of a private helper through anything but the public behaviour it serves.

## What a test asserts

- Outputs, thrown errors and state. An interaction (`toHaveBeenCalledWith`) only where the call is the behaviour: an email sent, an event published, an external system called, an audit log written.
- Mocks sit at the process boundary: database, HTTP, queues, clock, file system. Inside it, real objects.
- One behaviour per test, titled by the behaviour. Input variations go into one `it.each`, one row per distinct branch or boundary.
- The expected value is fixed before the call and tells the behaviour from a plausible wrong result. A presence check, a type check or a loose bound is not an assertion.

## Test data

- Test data belongs to the module it tests. A test builds another module's values from what that module publishes, never from its test helpers. Helpers that carry no module's data, like `catchTestError`, live in a testing package.

## Changing the rules

A developer who needs a test the rules refuse does not drop the test and does not argue it through in review: they add the kind to this doc in the same pull request, worded so that the next reader can apply it to a case the developer did not have in mind. The maintainer reviews the kind together with the test, and the test merges when the kind does. A reviewer's approval alone does not replace a rule, and the rules change in no other way.
