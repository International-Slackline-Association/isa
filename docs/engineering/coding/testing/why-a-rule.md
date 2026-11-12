---
type: explanation
title: Why a unit test needs a rule
description: Why a unit test here exists only where a named rule allows it. What AI-written tests did to the suite, what a unit test is for, what was rejected, and why the rules bind new tests only.
related: [unit-tests.md]
---

# Why a unit test needs a rule

Agents write all the code now, so they write all the tests, and they copy the tests around them: one per function, asserting what the function does. The suite grew about sixfold in a year. Most of those tests restate the code. They break on a refactor, cost CI time on every push, give a false pass to the agent checking its own work, and are the template the next agent copies.

An agent verifies its change end to end, against the running system, and that run is the evidence. A unit test is only worth having for what that run cannot reach. The [policy](unit-tests.md) lists those cases. Everything else is a second copy of the code. Rejected: coverage targets, a test per function, tests as documentation of what the code already says.

The rules bind new tests only. The existing suite stays until the team has lived with the rules and decides to apply them backwards. Whatever checks the rules, a reviewer or a gate in CI, is guidance, not a wall: a test that slips past is a review matter, and nobody hardens the check against someone set on getting around it. The check reads the test against the policy; a fixed marker in the title checked by a regex was rejected because it never pushes back on a rule named by habit.
