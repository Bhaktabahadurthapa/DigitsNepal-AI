# The Learner Experience

Honen supports your content and puts every learner on their own optimal path to
mastery, with a 24/7 AI tutor alongside them. The result is faster completion, deeper
understanding, and people who are actually ready to do the work.

The learner chooses the format. Authoring one topic produces several ways through it,
and every path counts the same progress.

## Choosing a way in

Each topic opens on a start screen: where the learner is, what they will learn, and
the ways to take it, grouped into three phases. One option is recommended based on
what they have done and what they prefer, and that phase is already open. Where only
one option exists, the picker is skipped.

| Phase | Options |
|---|---|
| Learn | Reading, visual lecture, explainer video, podcast |
| Practice and reinforce | Flashcards, comic, jam, arcade |
| Prove | Quiz |

Full detail in [activity and project types](https://honen.com/llms/activities-and-projects.md).

**Split view.** On desktop a learner can open a second pane and run two formats side
by side: read while the podcast plays, or keep flashcards next to the article. Mobile
collapses to a single pane.

## The AI tutor

A tutor is available on every activity, by voice or text, and persists as the learner
moves between topics. Courses can name it and give it a personality and avatar.

What distinguishes it is that it can act on the interface, not just talk: flip a
flashcard, shuffle the deck, select a quiz answer and reveal the explanation, mark a
reading complete, play or seek the podcast, turn a comic page, change the song, open
a second pane. When it wants to move the learner to a different topic it has to ask
first.

In standard mode it is a conversational tutor with tools matched to the current
activity. In advanced mode it uses a stronger model, writes formatted answers with
code and images, accepts file attachments, and (only where the course creator has
enabled each capability) can search the knowledge base, search the course, generate
images, and move the learner on.

It notices when a learner stalls, switches format on its own, queues the right
flashcards at the right moment, and uses Socratic questioning rather than supplying
answers outright.

**Assessment integrity.** During a test the tutor's search and image tools are
withdrawn, enforced both in the agent and on every request. Attachment reading is
disabled whenever the learner has an unsubmitted test anywhere in the course.

## Personalization

A learner who has completed onboarding can turn on personalization for a reading, and
it rewrites around their interests, level and any instructions they have written, for
example "short explanations with examples, no jargon". The rewrite streams in place
and progress counts identically to the original. Personalization currently applies to
readings.

Separately, the same course adapts for different audiences and reading levels, and
translates into Spanish and other languages on demand. A module can be tightened to a
30-minute class period or a 10-minute mobile podcast without rebuilding the course.

## Citations in readings

Where a reading is grounded in a knowledge base source, claims carry a numbered
inline citation. Hovering shows the source title and the cited passage; clicking opens
the full source, and workspace members can follow through to the document itself.

Visibility is configured per course across six levels: hidden, attribution (name
only), excerpt (name and passage), workspace (full source for members, the default),
granted (full source for those with knowledge base access), and full (everyone).
Authors additionally see a warning when a cited passage no longer matches the current
source; learners do not.

Readings built purely from an uploaded file are grounded in that file but do not
produce citation links.

## Progress and completion

Nothing completes on a "next" click. Each activity completes on a real signal:

- a reading at 95% scrolled
- flashcards at 80% of the deck seen
- a video at 90% watched
- a quiz on submission
- a lecture or comic when every slide or page has been viewed

A reading containing interactive widgets only counts once the widgets have been used.

A learner who is not finished sees a specific list of what remains, not a percentage.
Finishing opens a completion screen with a letter grade, a certificate card and the
achievements earned. Consecutive-day streaks run alongside, with milestone emails at
3, 7, 14 and 30 days, and twenty achievement badges across completion, variety, tutor
time, mastery and streaks.

Certificates are verifiable, carry unique IDs, are shareable to LinkedIn and
downloadable as PDF, and are backed by AI-graded mastery across quizzes, projects and
simulations rather than time spent. Certificates are issued per curriculum rather than
per individual course.

## Standalone activities

Any topic or single activity can be delivered on its own through a standalone link:
no course navigation, just the work and a single onward action when it is done.
Progress still counts toward the course. This is what makes a Honen activity usable
inside a chat message, an email, an onboarding flow, or another product.

## Ongoing practice

Keep sharp revisits earlier topics during a course and provides check-ins afterward. Assignment owners can set a practice cadence. Study banks collect cards and questions for due-first practice, spaced repetition, and freeform review from a course or dashboard.

## Advanced tutor

The Advanced tutor supports rich chat, file and photo attachments, and optional search of the course and approved Knowledge Base material. Authors can enable diagrams and topic navigation and set guardrails for safety, academic integrity, and course scope.

## Listen to a reading

Read aloud plays readings and highlights the current passage. The player offers voice and speed choices, position control, and optional image descriptions.
Use Listen to reopen a closed player. Read image descriptions speaks the accessibility description, which can differ from the caption.
