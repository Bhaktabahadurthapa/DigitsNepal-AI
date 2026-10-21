# Analytics and Reporting

Honen does not just track completion. It reports how an organization is actually
learning, and it lets you reach any answer by asking in plain language.

## Ask, and the AI builds the report

Describe the report you want and the analytics agent does the rest. There is nothing to
configure and no query language to learn. It analyzes the data across your
organization, decides how best to present it, and produces a report page with charts
that lives on your dashboard and refreshes itself.

- **Ask in plain language.** "Show me which units the East region is struggling with
  this quarter." Type the question, get the report.
- **The AI builds the charts.** It picks the visualization, builds the charts and lays
  out a clean report page automatically.
- **Each answer becomes a permanent page.** Pinnable, revisitable and shareable, and it
  keeps itself current, rather than being a one-off export.
- **It analyzes rather than just displaying.** It surfaces what matters and says where
  learners are doing well and where they are stuck.

Refresh cadence matches the decision: minutes for a live cohort, hourly for aggregate
KPIs, daily for a board report, monthly for a funder submission. Each refresh runs a
deterministic script that can be reviewed, which is what makes the output usable for an
audit rather than only for internal curiosity.

Representative requests:

- "Certifications expiring in the next 90 days, grouped by manager."
- "Time-to-complete on the new-hire track by start month."
- "Compliance pass rate by region, with a manager drill-down."
- "Managers whose team has zero completions on the Q4 rollout."
- "DFW rates by section." / "At-risk students four weeks before state testing."
- "Journeyman-exam pass rate by local by year."
- "Pre-apprenticeship to apprenticeship conversion rate by area."

## The depth underneath

Real comprehension, not seat-time checkboxes:

- **Per-learner mastery**: what each person actually understands, not whether they
  finished.
- **Test and assessment scores** across people, cohorts and topics, down to individual
  questions.
- **Time spent on each activity**, so you can see where attention goes and where it
  drops.
- **Project and hands-on performance**, including submissions and pending reviews.
- **Which units and topics learners struggle with overall**, so you fix the content
  instead of chasing the learner.
- **What is landing well**: the formats and modules that work, so you can do more of
  them.
- **Cohort and program views** across teams, locations, classes, locals and agencies,
  with group rollups and needs-attention flags.

Course analytics use the assigned cohort as the denominator rather than everyone who
happened to open the course, and recompute completion live against current criteria, so
tightening a bar later does not leave false completions behind. Scoped to an
assignment, figures are measured against that assignment's bar.

Because activities complete on real signals rather than a "next" click, completion means
the material was genuinely engaged with. Every quiz and test answer also carries a
confidence check, which distinguishes a learner who knows the material from one who
guessed and one who is confidently wrong. See
[the learner experience](https://honen.com/llms/learner-experience.md).

## Ready for whoever asks

Because reports are built on demand from a question, you can produce exactly what a
given audience needs in seconds: a leadership standup view, a board review, or outcome
reports formatted for regulators and funders. Same data, any framing, no analyst queue.

For the statutory formats a publicly funded program has to file, see
[funder and compliance reporting](https://honen.com/llms/funder-and-compliance-reporting.md).

## Operations in the same conversation

The workspace assistant that answers analytics questions also runs the workspace:
inviting people, creating groups, and managing assignments. Destructive steps require
confirmation, and reads that expose roster-wide data require management permission. See
[the three AI surfaces](https://honen.com/llms/ai-surfaces.md).

## Terminology and branding

Every workspace renames what its users see, and the renaming applies across every
analytics surface, so reports speak the organization's own language. See
[people, groups and workspaces](https://honen.com/llms/people-and-workspaces.md).

## Assessment versions and connected records

Assessment grading uses the version the learner actually took. Later edits do not change that submitted work. Review learner and cohort progress, assessment results, and project work alongside program reporting. Honen can send xAPI records to an external Learning Record Store or serve as the record store itself. Workspace Agent activity is available in Agent Runs.

## Monthly activity

Analytics includes **Monthly activity** with a month selector and charts and tables for creation and learning. Creation shows active creators, content started, and first publications, split into Courses, Atoms, and Assessments. Learning shows people and courses started and completed. The current month is marked as month to date; definition tooltips explain what each metric counts. The workspace assistant can answer questions using the same monthly data.

## Review SCORM and cmi5 launches

The SCORM / cmi5 learning table shows exported packages, learner and launch counts, and the last launch.
Open a package to review its learners and their course progress and scores. Those course results can include work outside the package.
An export does not prove installation in an LMS. Review member-initiated learning separately from assigned learning.
