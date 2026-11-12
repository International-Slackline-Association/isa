---
type: policy
title: Coding rules
description: The repo-wide coding rules and conventions every change obeys, and what the code review holds a change against.
related: [../how-we-build.md]
---

# Coding rules

Why: [how we build](../how-we-build.md). These hold for every change in the repo. A scope may add its own rules in its `docs/`; they hold for changes there in addition to these.

## The boundary

- Whatever a change affects outside its logical boundary is found and updated in the same change, however many hops away. Consumers point in; the owner never lists them.
- Behaviour others depend on counts, even where it was never promised.
- What the change cannot reach, it names.
- The boundary itself does not move unasked.

## Personal data

- Personal data never reaches a log, a response, a file or a reader beyond its purpose.

## Modularity

- Package by feature, not by layer: a thing is colocated in the lowest folder that contains everything it is about.
- Encapsulation: a module's internals stay behind its public interface; nothing outside reaches in.
- Dependency direction: dependencies point one way, downward, and never form a cycle. A module depends on what is below it and knows nothing of who consumes it.
- Stable dependencies: the consumer depends on the provider, never the reverse. The owner never points back.

## What an agent does not decide alone

- A new component, layer, abstraction, fallback path, second way of doing the same thing, a branch per edge case, or a new noun or a second name for an existing one, is a decision the human takes. An agent that needs one asks first.
- Similar code is not made into a shared abstraction by an agent unasked; reuse is proposed to the human.

## Operability

- Every crossing of the process boundary leaves a log line, with its outcome.
- Every state change of a business entity leaves a log line.
- Every caught error leaves a log line before it is handled or rethrown.
- One operation can be followed end to end from its logs.
- How a line is shaped is the scope's established logging.

## Runs locally

- A change runs and is verified locally.
- A run that needs access to real AWS or another external system justifies the reason in the change.
