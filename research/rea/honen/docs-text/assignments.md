# Assignments

An assignment gives named internal learners, students, or groups work to complete in
the workspace. It names a course, or a slice of one, a set of people, an optional
deadline, and what "finished" means for that particular group.

The same course can be assigned three times to three teams with three different
completion bars and three different slices of content, and every learner is measured
only against the bar of the assignment they are on.

## Assigning part of a course

An assignment can cover a slice rather than a whole course, with no separate course to
build and maintain.

| You assign | The learner owes |
|---|---|
| A unit | Everything in it: every topic, its test, its projects |
| A topic | That topic's activities |
| A single activity | That activity alone |
| A unit test | That test alone |
| A project | That project alone |

These mix freely, and completion is measured against the narrowed content only. Links
take the learner straight to the assigned work rather than a course overview.

## Defining completion

Every assignment carries its own completion bar:

- **Activities per topic**: one, a specific number, or all of them.
- **Minimum quiz score**: a quiz counts toward its topic only at or above the bar,
  measured on the learner's best attempt.
- **Unit tests**: required or ignored, with an optional minimum score.
- **Projects**: required, or excluded from the bar for this group.

Where several whole-course assignments cover the same learner, the strictest value of
each setting applies, so nobody gets an easier bar by being assigned twice. Test bars
default to 80%.

## Recipients

Recipients are built from a tree: the whole workspace, any group including its
subgroups, named individuals, or any combination. Exclusions are first-class, so
"everyone in Engineering except these two" is a rule set once rather than a list
maintained forever.

The cohort maintains itself. Someone who joins Engineering picks up every assignment
targeting Engineering, including ones created months earlier; someone who leaves loses
them. Individuals can be toggled on or off a single assignment, and the reason a
person is included is always visible: directly assigned, via a group, workspace-wide,
or excluded.

Being assigned a course grants access to it, so there is no separate sharing step.

Assignments can also be created through the API, so an event in another system can
issue the right training at the right moment, and from inside an LMS through LTI deep
linking or the Google Classroom add-on.

## Reaching the learner

Delivery is in-app and by email, plus Slack, Microsoft Teams, Google Chat and
iMessage. Administrators control which channels push, and individuals can opt out.

Channel messages carry a signed auto-login link that lands the learner directly on the
assigned work; removing someone from an assignment invalidates their outstanding
links. Due-soon and overdue alerts fire automatically on thresholds the administrator
sets, once per person, with an optional custom message. Learners can also ask the
messaging bot what is due and get their assignments back sorted by date.

**Due dates are advisory by design.** A passed date marks the assignment overdue and
triggers the alert, but never blocks access, locks content or penalizes a score.

## What the learner sees

"My Assignments" collects assigned work with tabs, counts, filters and progress. The
what's-left checklist states the bar in plain language and then itemizes every
outstanding topic, test and project, with each row opening that specific item.

## What the instructor sees

Completion, average score and the bar in plain English across the assignments list;
an assigned-to table of every learner grouped by their group with progress, score,
time and status, sortable and filterable including overdue only; a drill-down from a
course's projects to a project roster to an individual submission rendered per project
type; and a queue of submissions awaiting review, oldest first.

Reminders are sent per learner and adapt to how far along the person is. The system
will not remind someone who has already finished, and reports when a learner will not
receive one because they have unsubscribed.

## Reporting

Every assignment reports completion across the assigned population, test scores,
project performance, time spent per activity, and which units and topics people
struggle with overall. Course analytics can be narrowed to one cohort and are measured
against that assignment's bar, so a one-unit assignment never reports a fraction of
its real completion. Any individual learner can be opened in full.

Two lenses exist deliberately and are never merged: a learner sees their progress
against the strictest bar covering them, while each instructor sees them against their
own assignment's bar.

## LMS grading

An assignment is the unit that creates a gradebook column in an external LMS; linking
a course without one creates no column. Grades post server-to-server over LTI 1.3, and
as a draft grade for the teacher to publish in Google Classroom. You choose what a
score means per line item: completion, pass/fail, or progress. A scoped assignment is
graded purely on its own completion.

## Managed conversationally

The workspace assistant can list assignments, inspect one including every assignee's
live progress, show one person's assignments across the workspace with overdue flags,
create assignments to any scope with due dates and inclusion or exclusion lists, and
remove them. It uses the same code paths as the dashboard. Setting completion criteria
and content scope remain in the editor. Reads that expose roster-wide progress require
management permission, so a learner cannot pull the cohort's numbers.

## Boundaries

- Certificates are issued per curriculum, so finishing a scoped assignment earns
  credit, analytics and an LMS grade but not a certificate.
- There is no CSV export of assignment data. Funder and regulator reporting is a
  separate capability; see [analytics and reporting](https://honen.com/llms/analytics-and-reporting.md).
- There are no bulk actions: no duplicate, no bulk selection, no bulk reminder.
- Scoped LMS launches land on the whole course. The scope-aware deep link is used by
  the messaging channels.
- Joining a group later adds the work correctly but sends no notification; those fire
  on creation and on edits that add people.
- Assignments require an organization workspace and are not available in personal
  workspaces.

## Assign a specific piece

Assignments can cover a course, unit, topic, reading, test, or project. The learner opens the assigned piece directly. Completing it does not mark unrelated course work complete. Single Activity Links can open one activity and return the learner to an allowed external destination afterward. Keep sharp settings support follow-up practice on an assignment.
