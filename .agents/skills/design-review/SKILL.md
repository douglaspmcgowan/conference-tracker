---
name: design-review
when_to_use: "Use to critique a rendered, built interface and return findings only. Not design, which plans an unbuilt one; not impeccable, which implements; not review, the router that selects this skill."
description: Review a built interface's information architecture, usability, and visual hierarchy; return prioritized findings only.
disable-model-invocation: true
provenance: promoted-from-command:v1
---

# /design-review [target] [--scope whole|<surface>]

The deliverable is evidence-backed findings. **This skill does not edit the target.**

## Gate and evidence

Confirm the target exists, can render safely, and has a named scope. Read the project's `DESIGN.md` and the relevant design-library guidance first. Capture the states the review needs: populated, empty, loading, error, and key interaction states where they exist; check desktop and narrow viewports unless the product is explicitly desktop-only. Record what was observed live versus inferred from source.

If the interface cannot render, report that constraint and route the underlying failure to `systematic-debugging`. **Never substitute a source-only critique for a live design review.**

## Review rubric

Assess only the stated scope across:

- primary job, information architecture, navigation, and progressive disclosure;
- visual hierarchy, layout, spacing, typography, color, and component consistency;
- controls, feedback, loading, empty, error, success, focus, and disabled states;
- charts, tables, labels, and dense-information readability;
- responsive behavior, overflow, contrast, and interaction affordance;
- Nielsen heuristics: visibility, control, recognition, error prevention, and recovery.

Every finding needs an exact locator, observed evidence, user impact, applicable principle, concrete fix direction, severity, and whether it calls for structural redesign or visual execution. **Do not manufacture findings**; name the strengths a later change must preserve.

## Verify and hand off

Independently re-check every blocker, major, or structural finding against captured evidence. Available reviewers may take independent rubric dimensions where their capabilities and file ownership permit; do not prescribe provider APIs, model tiers, or worker syntax. Drop taste-only or unsupported claims.

Return findings ordered by severity, with the live/inferred distinction, evidence locations, and the next owner: `design` for re-architecture, `impeccable` for visual implementation, `systematic-debugging` for an observed malfunction. A substantial report follows the shared brief rule and its three required surfaces.
