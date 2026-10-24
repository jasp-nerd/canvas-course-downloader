// When Canvas access ends, from each university's own pages. Every quote was checked on its
// source page on the date below; recheck before changing a row, and change CHECKED with it.
// Research notes: course clock (what happens to a course after its term) and account clock
// (what happens to your login after you leave); you keep a course only while both allow it.

export const CHECKED = '2026-10-24';

export interface Policy {
  name: string;
  country: string;
  /** The short answer: when access ends after graduating or leaving. */
  ends: string;
  /** What happens to a course after its term, with the school's words in quotes. */
  course: string;
  /** What happens to your login after you graduate or leave. */
  account: string;
  sources: string[];
  pageDate: string;
}

export const POLICIES: Policy[] = [
  {
    "name": "University of Pennsylvania",
    "country": "United States",
    "ends": "Login never expires",
    "course": "Course sites are kept for five years, but an instructor can lock students out: \"Canvas sites are retained in Penn’s Canvas environment for five years from the term during which the course was offered\"; \"Faculty may choose to enable a setting that completely prevents students from accessing a Canvas site after a term ends\".",
    "account": "Login never expires: \"PennKeys do not expire, so students can still log into Canvas after graduation\" (Penn Carey Law runs a separate Canvas and is excluded).",
    "sources": [
      "https://infocanvas.upenn.edu/students/canvas-after-graduation/"
    ],
    "pageDate": "Modified 2026-02-27 (meta)"
  },
  {
    "name": "University of Michigan",
    "country": "United States",
    "ends": "Read-only after 2 weeks",
    "course": "Full access for two weeks, then read-only, unless the instructor configures it differently: \"Most courses allow students/alumni full access to the course for two weeks after the end of the term\" and \"read-only access beyond that date\".",
    "account": "Same article covers alumni and gives no account cut-off date. It warns: \"Canvas is not meant to be used for storage\".",
    "sources": [
      "https://teamdynamix.umich.edu/TDClient/30/Portal/KB/ArticleDet?ID=119"
    ],
    "pageDate": "Modified 2026-08-31 (meta)"
  },
  {
    "name": "University of Wisconsin–Madison",
    "country": "United States",
    "ends": "No end date",
    "course": "By default students keep viewing concluded courses (instructor-facing KB): \"By default, student access check boxes are not selected, meaning students can view courses before and after course dates\".",
    "account": "No account end date: \"There is currently no deactivation timeline for Canvas accounts at UW-Madison; most individuals with access to Canvas and other Learn@UW-Madison tools will be able to log in indefinitely, as long as their NetID/Shibboleth credentials are active\".",
    "sources": [
      "https://kb.wisc.edu/helpdesk/76452",
      "https://kb.wisc.edu/141489"
    ],
    "pageDate": "Updated 2026-06-15 and 2026-04-27"
  },
  {
    "name": "Stanford University",
    "country": "United States",
    "ends": "120 days after graduating",
    "course": "Read-only without a time limit while the SUNet ID is active: \"By default, Canvas is set up so students have read-only access to content in past courses indefinitely\". Class recordings and courses that instructors restrict are excluded.",
    "account": "Access ends 120 days after graduation: \"Once students graduate, there is a 120 day grace period which their SUNet is still active and they can access Canvas. After the 120 days, students can no longer access Canvas and its courses.\"",
    "sources": [
      "https://canvashelp.stanford.edu/hc/en-us/articles/1500000114382-Student-access-to-course-content-after-the-quarter-ends"
    ],
    "pageDate": "Edited 2025-09-10 (Zendesk meta)"
  },
  {
    "name": "University of Washington (Seattle)",
    "country": "United States",
    "ends": "5 years after leaving",
    "course": "Courses are deleted after five years: \"courses are deleted five years after the end of the academic year in which they were offered\".",
    "account": "Five years after leaving: \"Former students retain access to Canvas for five years past separation.\"",
    "sources": [
      "https://uwconnect.uw.edu/it?id=kb_article_view&sysparm_article=KB0034584"
    ],
    "pageDate": "\"Last Updated: 3mo ago\" (timestamp 08-07-2026)"
  },
  {
    "name": "Harvard Medical School (Harvard University)",
    "country": "United States",
    "ends": "Limited, your own courses",
    "course": "Not stated.",
    "account": "Limited, and only your own courses: \"After graduation, limited Canvas access will continue through HarvardKey, but graduates will only be able to view courses they were enrolled in as a student.\" Rules differ between Harvard schools.",
    "sources": [
      "https://it.hms.harvard.edu/service/canvas"
    ],
    "pageDate": "Not shown"
  },
  {
    "name": "Georgetown University",
    "country": "United States",
    "ends": "21 years after graduating",
    "course": "Instructors decide per course: \"Access to specific courses and content in Canvas might be modified, blocked, or completely removed by the instructor.\"",
    "account": "Login lasts 21 years: \"Most Georgetown alumni will maintain their access to Canvas for twenty-one (21) years after graduation.\"",
    "sources": [
      "https://uis.georgetown.edu/alumni-it-services/"
    ],
    "pageDate": "Modified 2026-01-28 (meta)"
  },
  {
    "name": "UC Berkeley",
    "country": "United States",
    "ends": "Course sites deleted after 7 years",
    "course": "Course sites are deleted after seven years, each June: \"bCourses sites for academic courses are retained for seven years after the end of the Academic Year (AY) in which the course was offered\".",
    "account": "Not stated on the official pages found.",
    "sources": [
      "https://ue.berkeley.edu/news/new-course-retention-policy-bcourses-sites"
    ],
    "pageDate": "June 2, 2026"
  },
  {
    "name": "Northwestern University",
    "country": "United States",
    "ends": "While your NetID is active",
    "course": "Read-only after term: \"Most courses at Northwestern go into a read-only state after the term for the course has ended\". Sites stay active four years and are deleted at eight: \"All CAESAR-based course sites will be actively available in Northwestern Canvas for four years from the conclusion of the course’s term\"; \"Once eight years have passed from a course’s end date, the course site is deleted\".",
    "account": "Tied to the NetID: \"Students retain access to Canvas generally as long as they have an active NetID.\"",
    "sources": [
      "https://www.it.northwestern.edu/departments/it-services-support/teaching/canvas-onboarding-for-students.html",
      "https://services.northwestern.edu/TDClient/30/Portal/Requests/ServiceOffering/278/CourseLife-Canvas-Course-Site-Lifecycle-and-Management-Application"
    ],
    "pageDate": "Not shown"
  },
  {
    "name": "UCLA",
    "country": "United States",
    "ends": "2 weeks into the next term",
    "course": "Access is cut, not made read-only: \"You lose access to course sites two weeks into the start of the following term.\" To keep access longer, the student asks the instructor.",
    "account": "Not stated.",
    "sources": [
      "https://dts.ucla.edu/initiatives/learning-technology-experience/student-faq"
    ],
    "pageDate": "Modified 2026-09-16 (meta)"
  },
  {
    "name": "University of Sussex",
    "country": "United Kingdom",
    "ends": "14 months after your course",
    "course": "Not stated separately.",
    "account": "Canvas stays for 14 months, counted from the last day of the course: \"Services you will retain access to for 14 months after the last day of your course\" (Canvas is on the list). The page also says access to many services ends \"on the last day of your course (not graduation)\".",
    "sources": [
      "https://www.sussex.ac.uk/its/help/faq?faqid=5"
    ],
    "pageDate": "Last updated 26 May 2026"
  },
  {
    "name": "Queen’s University Belfast",
    "country": "United Kingdom",
    "ends": "60 days after completion",
    "course": "Not stated.",
    "account": "60 days after completion for completed, graduated and alumni students: \"Canvas Access removed 60 days after completion.\" On withdrawal or dismissal: \"Access may be revoked immediately, depending on request from School, Academic Services or other.\"",
    "sources": [
      "https://www.qub.ac.uk/directorates/InformationServices/Services/ITServiceDesk/ITAccessAfterLeavingQUBStudent/"
    ],
    "pageDate": "Last Updated: July 2025"
  },
  {
    "name": "University of Liverpool",
    "country": "United Kingdom",
    "ends": "Shortly after your end date",
    "course": "Not stated.",
    "account": "Whole IT account closes soon after you finish: \"Your IT account – including your University email, M Drive, Canvas and access to most University systems – will close shortly after your official end date or graduation, if later.\" Also: \"Once your account is closed, we can’t recover any files\".",
    "sources": [
      "https://news.liverpool.ac.uk/2025/06/20/what-happens-to-your-it-account-after-graduation/"
    ],
    "pageDate": "2025-06-20"
  },
  {
    "name": "Liverpool John Moores University",
    "country": "United Kingdom",
    "ends": "About 90 days after completion",
    "course": "Not stated.",
    "account": "About 90 days after completion, not after graduation: \"Your university IT account usually expires approximately 90 days after the completion of your programme of study\"; \"This does not mean 90 days after graduation\"; \"You will be able to log-on to Canvas up until your account expires, including during your 90 days grace period\".",
    "sources": [
      "https://www.ljmu.ac.uk/ithelp/user-accounts-and-security/account-expiration"
    ],
    "pageDate": "Not shown"
  },
  {
    "name": "University of Toronto (Quercus = Canvas)",
    "country": "Canada",
    "ends": "Read-only 1 month after term",
    "course": "Read-only one month after term (teaching-centre course life cycle): \"1 month after the end of term: The course becomes read-only for students, teaching assistants, and designers.\"",
    "account": "Not stated.",
    "sources": [
      "https://teaching.utoronto.ca/resources/course-life-cycle/"
    ],
    "pageDate": "Last Modified 23 October 2026"
  },
  {
    "name": "Simon Fraser University",
    "country": "Canada",
    "ends": "4 months after the last class",
    "course": "Four months after the last class: \"For courses completed in Canvas Cloud on January 1, 2026 or later, access will be available for four months after the final day of class.\" Older courses: \"Access to courses that you completed in Canvas prior to December 31, 2025 has ended as of April 30, 2026\". The page sits in SFU's Continuing Studies section.",
    "account": "Not stated.",
    "sources": [
      "https://www.sfu.ca/continuing-studies/programs-and-courses/online-and-distance-education/technical-support.html"
    ],
    "pageDate": "Not shown"
  },
  {
    "name": "University of Sydney",
    "country": "Australia",
    "ends": "While you are a student",
    "course": "Read-only after semester: \"Once a semester has finished, you will still be able to review content and files from past subjects, but won’t be able to submit assignments, take quizzes or add to discussions.\"",
    "account": "Only while you are a student: \"You can access your units in Canvas for the entire time you are a student at the University.\" The page says nothing about access after graduation.",
    "sources": [
      "https://www.sydney.edu.au/students/canvas.html"
    ],
    "pageDate": "Last updated 02 June 2026"
  },
  {
    "name": "University of Technology Sydney",
    "country": "Australia",
    "ends": "Kept after graduation",
    "course": "Past subjects stay listed. Subjects you withdraw from are lost.",
    "account": "Kept after graduation, with a login change: \"All the subjects you previously studied should remain available to you in Canvas even after you graduate\"; \"If you have graduated from UTS, you need to use your alumni email address, not your student email address, to log in to Canvas\".",
    "sources": [
      "https://www.uts.edu.au/for-students/current-students/managing-your-course/your-enrolment/retrieving-subject-outlines-and-subject-information"
    ],
    "pageDate": "Not shown"
  },
  {
    "name": "RMIT University",
    "country": "Australia",
    "ends": "The day you graduate",
    "course": "Not stated.",
    "account": "Cut on graduation day: \"You will lose access to all RMIT systems and software on the day you graduate (unless you’re continuing your studies with RMIT)\". The research-student page names Canvas: \"withdraw access to RMIT systems, including Canvas and myRMIT. This will occur on the day you graduate\".",
    "sources": [
      "https://www.rmit.edu.au/students/my-course/graduation/apply",
      "https://www.rmit.edu.au/students/my-course/research-students/submission-examination/completion-graduation"
    ],
    "pageDate": "Not shown"
  },
  {
    "name": "Queensland University of Technology",
    "country": "Australia",
    "ends": "2 years after graduating",
    "course": "Not stated.",
    "account": "Two years for alumni: \"Student alumni retain access to their completed units on Canvas for two years, however some units may be made unavailable earlier by the Unit Coordinator.\" For coursework students the clock starts on \"the day you graduate or have your degree conferred\".",
    "sources": [
      "https://qutvirtual4.qut.edu.au/web/qut/after-leaving-qut/access-to-systems"
    ],
    "pageDate": "Not shown"
  },
  {
    "name": "University of Melbourne",
    "country": "Australia",
    "ends": "12 months after leaving",
    "course": "Not stated.",
    "account": "Account disabled after 12 months: \"Your University of Melbourne student account will be disabled following a 12-month grace period\". Download first, \"before the end of this period when your data will be revoked from University systems\".",
    "sources": [
      "https://studentit.unimelb.edu.au/student-offboarding/download-other-data/canvas-lms"
    ],
    "pageDate": "Last updated 18 Aug 2026"
  },
  {
    "name": "Vrije Universiteit Amsterdam",
    "country": "Netherlands",
    "ends": "90 days after deregistering",
    "course": "Staff guide (Faculty of Law): \"Ongeveer zes maanden na afloop van de cursus kunt u geen wijzigingen meer aanbrengen en studenten kunnen niets meer uploaden\" and \"De cursus blijft nog ongeveer twee jaar zichtbaar in Canvas om materiaal te exporteren/downloaden\" (about six months after the course, no more uploads; the course stays visible for about two more years). Also \"Ongeveer 2 jaar na afloop van de cursus, zal de gehele cursus uit Canvas verdwijnen\" (the whole course disappears about two years after it ends).",
    "account": "90 days after deregistration: \"From your deregistration date, your VUnetID will remain active for 90 days and you will retain access to your VUmail, Canvas and other services.\" A graduate is deregistered \"on the last day of the month of in which you graduate\" [sic].",
    "sources": [
      "https://vu.nl/nl/medewerker/rechtsgeleerdheid-wegwijzer/canvas-rch-gebruik-en-ondersteuning",
      "https://vu.nl/en/student/registration-and-enrolment/deregistration"
    ],
    "pageDate": "Laatst gewijzigd 9 september 2026; last updated 26 August 2026"
  },
  {
    "name": "University of Amsterdam (UvA)",
    "country": "Netherlands",
    "ends": "90 days after leaving",
    "course": "Not stated. The Canvas page only explains how to find older courses: \"Can’t see older courses on your dashboard?\"",
    "account": "Account rule, Canvas not named: \"You can continue to use your UvAnetID and the UvA’s facilities for 90 days after terminating your enrolment\"; \"After that, your account will be closed and you'll no longer have access to the UvA's digital environment\". Canvas login uses the UvAnetID: \"with your UvAnetID and two-step verification\".",
    "sources": [
      "https://student.uva.nl/en/information/terminating-your-enrolment-on-graduation",
      "https://student.uva.nl/en/information/canvas"
    ],
    "pageDate": "Last modified 28-04-2026; 15-07-2026"
  }
];
