---
type: explanation
title: "Live lines"
description: "Line activations (a line rigged now) and anonymous activation: why they exist, the vocabulary, the liability promise, proof versus guesses, blind-signed passes, manage links, activating with a name, what activation routes may log, existing lines only, third parties and the mediator role, reminders."
---

# Live lines

People did not put rigged lines on SlackMap because most lines are rigged unofficially, and nobody wants to be officially associated with one. Activating a line says it is rigged now, until a date; deactivating says it is down. It only works if activating cannot be tied to the person.

**Activation** is the one word, in the UI and the code alike, so the terminology stays in sync: activate, extend, deactivate. Not "rig" or "report".

## The promise

ISA must be technically unable to know who activated a line anonymously. The reason is liability: "we cannot know", not "we promise not to look". Legally only proof counts: a correlation, like who was signed in around the time of an activation, is a smart guess that does not hold up officially, and the activation stays anonymous. So what must never exist is a record tying an anonymous activation to a person.

- A real member stands behind each activation. For an anonymous one the blind-signed pass proves that without saying which member; it is an industry standard kept simple, and reassuring to users who read about it.
- The anonymous activation routes never read the login, and their log lines carry nothing that could match them to the same browser's signed-in calls. Everything else keeps its logs as they are: analytics and debugging are not given up for this.
- Ownership is a manage link, not an account. Sharing it is how someone moves to another device or hands the activation to their crew, one mechanism for both.
- Reminders before expiry are a calendar event on the person's device and a banner on the card. ISA sends nothing.

## With a name

People who do not need anonymity can activate with their name instead. The name is only a label: such an activation is managed by the same manage link, so there is one way to manage every activation.

## What an activation is

Activating is an extension of a line that already exists. Creating a line stays the normal flow and says a line can be rigged there, not that anyone rigged it legally; only lines on the map can be activated.

This is the core idea: activations reach third parties that depend on knowing whether a line is actually rigged, as part of the line data they collect ([data access](data-access.md)). SlackMap is only the mediator; the person informs that the line is rigged, anonymously if they choose, without taking the responsibility for it. They support the safety of slacklining without involving themselves at all. Today aviation is the only place this information goes, but that may change, so it is never presented as aviation only.

Edge cases like a fake activation blocking a line until it expires are accepted, not designed around.
