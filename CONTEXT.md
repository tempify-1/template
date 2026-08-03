# Template

A Payload CMS + Next.js starter carrying a config-driven design system. Pages, forms and
navigation are described as typed data and rendered by an engine, rather than written as markup
per screen.

## Page composition

**Preset**:
A named, parameterised page pattern. The unit both developers and editors compose pages from.
_Avoid_: template, page type, variant

**Section**:
A full-width horizontal band of a page, holding one row of Columns.
_Avoid_: row, band, strip

**Column**:
A vertical division within a Section, holding an ordered list of Blocks.
_Avoid_: cell, panel, slot

**Block**:
A single unit of content placed inside a Column.
_Avoid_: component, widget, element

**Theme**:
A named semantic recolouring applied to a subtree of the page.
_Avoid_: palette, colour scheme, skin

## Interaction

**Layer**:
A stacked detail panel opened over a page, whose position in the stack is part of the URL.
_Avoid_: drawer, modal, overlay, panel

**Shell**:
The persistent chrome that every route in a route group renders inside.
_Avoid_: template, wrapper, frame

**Action**:
A named behaviour a config invokes by string rather than by link.
_Avoid_: handler, callback, event

## Forms

**Field**:
One entry in a form's configuration, describing a single thing being asked for.
_Avoid_: input, control

## Evidence

**Fixture**:
A committed, realistic config used as both worked example and regression surface.
_Avoid_: sample, mock, seed, story
