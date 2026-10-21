# Course Creation

Most tools in this category give you a blank editor. Honen starts from the opposite
end: you describe what you want, or attach material you already have, and a course
agent builds the course while you watch and redirect it in conversation.

## What you can start from

You need either some text or one processed file. You can supply both.

| Source | Notes |
|---|---|
| Files | Any type, up to 1 GB each. PDF, Office, text, images and video are parsed automatically. Other formats become a raw source the agent opens and reads. |
| Screen recording | Recorded in the browser. Becomes an interactive walkthrough by default, not a video. |
| YouTube | By link, transcribed server-side. No upload needed. |
| GitHub repository | Public repositories are downloaded and flattened into one readable source. |
| Knowledge base | Documents from your workspace knowledge base, snapshotted into the course. |
| Granola | Meeting notes and transcripts, where the connection is configured. |
| MCP servers | Linear, Notion, HubSpot, Google Drive and others, available on the agent's first turn. |

Attached material is processed and read before the agent proposes anything, so its
first response refers to specifics in your document. Status is shown per file, and
course creation stays disabled until processing finishes, so the agent never starts
against a half-read source.

## Controls at creation

- **Brand.** Open Brand from the attachment menu. Workspace visual guidance and
  reference imagery inform generated images and explainer videos.
- **Content type.** Choose Course, Atom, or Assessment in the composer. A selected
  template supplies and locks the type until cleared.
- **Research.** When enabled, the agent searches the web and saves research notes
  before proposing an outline, so units are grounded in current sources.
- **Organization skills.** Workspaces can author reusable prompt fragments that
  inject house style or required framing into the brief.
- **Deep links.** `/dashboard/create-course?skill=<id>&kb=<itemId>` loads a
  workspace skill and focuses a Knowledge Base folder or document in the
  composer. The same `skill` and `kb` params work on
  `/dashboard/courses/<id>/manage/edit`. `itemId` is an alias for `kb`.
  `topic` can be added for free-text.

## How the build works

The agent reads first. It crawls any URL you provided, opens every attached source,
and searches the knowledge base when one is available. Only then does it ask what it
genuinely does not know: who the course is for, their level, how it should be
structured, and how long it should be. Anything already implied is skipped.
A template can instead supply up to three custom setup questions.

It then proposes a full outline: units, topics, learning goals, activity types per
topic, a project per unit where one fits, and the assessments called for by the selected template or brief. **Nothing is
built until you approve the outline.** Ask for changes in plain language and it
revises in place. On approval it creates the structure and generates every activity
in parallel. You can leave while it builds.

Length ranges from roughly three units of two topics up to six units of four, or a
custom shape you name. Structure presets are Academic (a reading, flashcards and a
quiz per topic), Project Based (a reading per topic and a project per unit), or Custom.

## The editor

Five views share one persistent chat sidebar:

- **Preview** is the real learner runtime pointed at your draft, not a mock. You can
  switch between the author's view and exactly what a learner sees.
- **Advanced Edit** is the structural editor: a course tree with panels for each unit,
  topic, activity, test and project.
- **Comments** collects course-wide feedback and threads attached to content.
- **Materials** manages sources after creation. Knowledge-base-linked material raises
  an alert when the original document changes, with one-click refresh.
- **Settings** covers details, marketing copy, people, AI style, brand, tutor,
  guardrails, citations, visibility and cloning.

The agent can generate and place images, produce and edit explainer videos, import PDF
pages as lecture slides, edit walkthroughs down to individual hotspots, and cite
sources. Image generation covers everything a course needs visually and all of it from
the same conversation: course thumbnails, lecture slides, comic panels, podcast cover
art and project reference images.

Its output is validated rather than trusted: structure is schema-checked, every
identifier is inventoried, and an automatic compile step writes the change back to the
live course. It confirms before destructive or bulk actions and verifies its own work
before reporting it complete.

## Nothing is destructive

Changes accumulate in a working draft. Applying a draft creates a revision. Version
history lists every revision with author and timestamp, a preview link, and rollback
on any of them, and a rollback creates a new draft rather than discarding anything.
Every message you send is a checkpoint. Drafts stay private until you publish, and
publishing is a separate, deliberate step.

## Keeping courses current

Courses are updated the same conversational way they were built, including from what
the analytics show: where cohorts stall, which topics learners struggle with, which
formats land. Learner progress survives updates.

## Courses, Assessments, and Atoms

AI can create and edit a complete Course, a standalone Assessment containing a test or project, or an Atom containing one lesson or exercise. Each supports sharing, assignments, progress, and LMS delivery. Authors review the working draft and the actual learner preview, then request revisions through the same conversation.

## Branding, Rules, and Skills

Create a workspace brand from a website, reference material, or a new brief. Preview its effect on readings and lectures and apply it across courses. Rules and Skills give the assistant reusable instructions for creating and revising learning content.

## Editing media

Generate, edit, or reuse images inside the course. Explainer-video scenes expose captions, narration, voices, and pictures for revision. The current video remains playable while a new version is built. Cards, quizzes, and tests can include image and video items.

## Reusable templates and publishing review

Team workspaces can offer Templates for Courses, Atoms, and Assessments with saved instructions, input starters, optional setup questions, Skills, source folders, covers, and course structure. Pick one in Create; the course keeps its saved template for future edits. See [Templates, Rules, and Skills](https://honen.com/llms/templates.md).

Publish to selected catalogs from the course. Where approvals are enabled, a submitted version goes to Publishing reviews while authors can keep editing their draft. Compare Changes, inspect the Course preview, comment, and approve or send back. See [Publishing and Review](https://honen.com/llms/publishing-and-review.md).

Readings and lecture slides can reuse original screenshots from source materials. Explainer-video generation uses the course’s resolved brand, including its visual guidance and available reference assets.
