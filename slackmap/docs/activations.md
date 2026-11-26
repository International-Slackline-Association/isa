---
type: explanation
title: "Activations"
description: "Line and spot activations (a line or a spot's area rigged) and anonymous activation: why they exist, the vocabulary, the anonymity promise, blind-signed passes, manage links, activating with a name, what activation routes may log, existing lines and spots only, spots and the lines inside them, third parties and the mediator role, reminders."
---

# Activations

This feature lets people share that a line is rigged; there are different reasons for this to be relevant. Activating a line says it is rigged, until a date; deactivating says it is down. It only works if activating cannot be tied to the person.

**Activation** is the one word, in the UI and the code alike, so the terminology stays in sync: activate, extend, deactivate. Not "rig" or "report".

## The promise

ISA must be technically unable to know who activated a line anonymously: "we cannot know", not "we promise not to look". What must never exist is a record tying an anonymous activation to a person; nothing else is given up for it.

- A real member stands behind each activation.
- The anonymous activation routes never read the login, and their log lines carry nothing that could match them to the same browser's signed-in calls. Everything else keeps its logs as they are: analytics and debugging are not given up for this.
- An anonymous activation is in the history of its line or spot and the activity feeds too, only as "the line was activated" or "the spot was activated": no person, and its time only to the hour.
- Ownership is a manage link, not an account. Sharing it is how someone moves to another device or hands the activation to their crew, one mechanism for both.
- Reminders before expiry are a calendar event on the person's device and a banner on the card. ISA sends nothing.

## With a name

People who do not want anonymity can activate with their name instead. The name is only a label: such an activation is managed by the same manage link, so there is one way to manage every activation.

## What an activation is

Activating is an extension of a line or spot that already exists. Creating a line stays the normal flow and says a line can be rigged there; only lines and spots on the map can be activated.

This is the core idea: activations reach third parties that depend on knowing whether a line is actually rigged, as part of the line data they collect ([data access](data-access.md)), or from the file of active lines and spots once they are partners. SlackMap is only the mediator; the person informs that the line is rigged, anonymously if they choose. They support the safety of slacklining.

## Spots

A spot usually holds several lines, so people activate the spot instead of each line, with one manage link. An active spot says its area is rigged now, not which lines: most spots have no mapped line, and which line lies in which spot is fuzzy. A line inside an active spot is not active itself.
