// When Canvas access ends, from each university's own pages. Every quote was checked on its
// source page on the date below; recheck before changing a row, and change CHECKED with it.
// Research notes: course clock (what happens to a course after its term) and account clock
// (what happens to your login after you leave); you keep a course only while both allow it.

export const CHECKED = '2026-10-24';

export interface Policy {
  name: string;
  country: string;
  /** US schools only, so the guide can group them by state. */
  state?: string;
  /** The short answer: when access ends after graduating or leaving. */
  ends: string;
  /** What happens to a course after its term, with the school's words in quotes. */
  course: string;
  /** What happens to your login after you graduate or leave. */
  account: string;
  sources: string[];
  pageDate: string;
}

export interface OnCanvas {
  name: string;
  state: string;
  /** The school's own Canvas help or login page. */
  source: string;
}

export const POLICIES: Policy[] = [
  {
    "name": "University of Alaska Fairbanks",
    "country": "United States",
    "state": "Alaska",
    "ends": "Login ends after 1 year",
    "course": "Not stated.",
    "account": "Your University of Alaska account expires a year after your last semester: \"Student accounts expire three semesters (one year) after the last day of the last semester of attendance.\"",
    "sources": [
      "https://service.alaska.edu/TDClient/36/Portal/KB/ArticleDet?ID=51"
    ],
    "pageDate": "Modified 2025-07-23 (meta)"
  },
  {
    "name": "Northern Arizona University",
    "country": "United States",
    "state": "Arizona",
    "ends": "Read-only after end date",
    "course": "Courses turn read-only the day after they end: \"The day after the official End Date of a course (which is usually the last day of the session), student access will change to 'read-only' so they may view content, grades and comments, but may no longer submit work.\"",
    "account": "Not stated.",
    "sources": [
      "https://servicenow.nau.edu/sp?id=kb_article&article=KB0018136"
    ],
    "pageDate": "Not shown"
  },
  {
    "name": "Cal Poly Pomona",
    "country": "United States",
    "state": "California",
    "ends": "Read-only after grades due",
    "course": "Courses turn read-only about five days after grades are due: \"Approximately five days after grades are due, that term's Canvas courses will automatically convert to a read-only state and will be removed from students' Canvas dashboards.\" They stay for four years: \"Official CPP courses remain available in Canvas for 4 years. Beyond those 4 years, an additional 3 years of courses will be backed up to a repository and can be restored to Canvas upon request.\"",
    "account": "Not stated.",
    "sources": [
      "https://www.cpp.edu/cafe/canvas/policies-and-procedures.shtml"
    ],
    "pageDate": "Not shown"
  },
  {
    "name": "Cal Poly San Luis Obispo",
    "country": "United States",
    "state": "California",
    "ends": "Two years after graduation",
    "course": "Courses are deleted after five years: \"Once the 5 years timeline has passed, courses will be deleted from Cal Poly Canvas.\"",
    "account": "Login through the portal stops two years after graduating: \"When a student graduates from Cal Poly, their access to Canvas will no longer work via the Portal (my.calpoly.edu) after two years and their Canvas participation will remain in Canvas for 5 years.\"",
    "sources": [
      "https://canvassupport.calpoly.edu/retention"
    ],
    "pageDate": "Not shown"
  },
  {
    "name": "California Institute of Technology (Caltech)",
    "country": "United States",
    "state": "California",
    "ends": "Concluded at next term's Add Day",
    "course": "Student enrollments conclude after the next term's Add Day, and nothing is deleted: \"Student and TA enrollments conclude after Add Day of the following term if all students in all sections of the course have been given a final grade in REGIS\". \"No course content or student data is deleted, but enrollments, grades, and submissions are archived in non-active areas of Canvas sites\".",
    "account": "Not stated.",
    "sources": [
      "https://canvas.caltech.edu/general-information"
    ],
    "pageDate": "Not shown"
  },
  {
    "name": "California State University, Long Beach",
    "country": "United States",
    "state": "California",
    "ends": "Read-only after the term",
    "course": "Courses close and become read-only when the term ends: \"When an academic term ends in Canvas, courses will typically become inactive or closed. Students will not be able to access or participate in the course by submitting assignments, posting on discussion boards, and etc. without the instructor's permission.\" and \"Once a course has concluded, it becomes \"read-only.\"\"",
    "account": "Not stated.",
    "sources": [
      "https://www.csulb.edu/academic-technology-services/canvas-at-the-beach/canvas-faqs"
    ],
    "pageDate": "Not shown"
  },
  {
    "name": "California State University, Northridge",
    "country": "United States",
    "state": "California",
    "ends": "Canvas expires after graduation",
    "course": "Not stated.",
    "account": "Canvas is listed under \"Access To Services/Software That Will Expire After Graduation\", with no date given. The ePortfolio stays: \"You will retain access to your CSUN Canvas ePortfolio account.\"",
    "sources": [
      "https://www.csun.edu/it/it-help-center/resources/i-want/it-faqs/it-faqs-students/information-technology-graduation"
    ],
    "pageDate": "Not shown"
  },
  {
    "name": "Pepperdine University",
    "country": "United States",
    "state": "California",
    "ends": "About 90 days after graduation",
    "course": "Not stated.",
    "account": "Your network account, and with it Canvas, ends about 90 days after you graduate: \"Approximately 90-days after graduation or discontinuation of classes, students will lose access to their Pepperdine network accounts\" and \"When your student network account is disabled, you will lose access to the LMS and similar tools\". The Canvas page lists among those without access \"Alumni (graduated students with disabled University network accounts)\".",
    "sources": [
      "https://community.pepperdine.edu/it/alumni/checklist.htm",
      "https://community.pepperdine.edu/it/tools/canvas/"
    ],
    "pageDate": "Not shown"
  },
  {
    "name": "San José State University",
    "country": "United States",
    "state": "California",
    "ends": "One year after graduation",
    "course": "Not stated.",
    "account": "Access to SJSU applications, Canvas included, lasts a year: \"Upon graduation, students will have access to SJSU applications (including their @sjsu.edu Gmail accounts) for 1 year.\" This is on the School of Information's page, under the heading \"Post-graduation access to SJSU applications, including Google/Gmail and Canvas\".",
    "sources": [
      "https://ischool.sjsu.edu/sjsu-applications"
    ],
    "pageDate": "February 2, 2024 (shown on page, not labelled as updated)"
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
    "pageDate": "Edited 2025-09-10 (Zendesk meta)",
    "state": "California"
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
    "pageDate": "June 2, 2026",
    "state": "California"
  },
  {
    "name": "UC Davis",
    "country": "United States",
    "state": "California",
    "ends": "Closes once no longer enrolled",
    "course": "Not stated.",
    "account": "Canvas starts closing when you are no longer enrolled: \"Computing account access removal and closing start once you are no longer enrolled. Your computing account and any student work-related accounts start to close, including Oasis, Canvas, and other apps.\" Core services then \"close in 3 days\". To get back in: \"If you need access to Canvas again, you will need to request the department of your major to temporarily sponsor you for access.\"",
    "sources": [
      "https://ucdavisit.service-now.com/kb_view.do?sysparm_article=KB0000129"
    ],
    "pageDate": "Last modified 2026-07-09"
  },
  {
    "name": "UC Irvine",
    "country": "United States",
    "state": "California",
    "ends": "Alumni can still view courses",
    "course": "Courses stay viewable after the term unless the instructor restricts them: \"by default students can still view your course in a read-only state after the end of a term.\"",
    "account": "Alumni keep Canvas while their UCInetID is active: \"Alumni with an active UCInetID will retain access to EEE+. They may also still sign in to Canvas to view previous courses.\"",
    "sources": [
      "https://uci.service-now.com/kb_view.do?sysparm_article=KB0012297",
      "https://edtechtools.eee.uci.edu/uci-canvas/"
    ],
    "pageDate": "KB article modified 2024-08-23; instructor page not shown"
  },
  {
    "name": "UC San Diego",
    "country": "United States",
    "state": "California",
    "ends": "Read-only after the term",
    "course": "Courses are archived read-only shortly after the term: \"Once your a course concludes, it becomes read-only.\" For Spring 2026 the schedule lists \"06/20/2026: Student submission period ends in Canvas\" and \"06/29/2026: Course archived (read-only state)\". Past courses are under All Courses, but \"instructors have the option to hide their course sites, making them inaccessible to students\".",
    "account": "Not stated.",
    "sources": [
      "https://edtech.ucsd.edu/instructional-tools/canvas/schedule.html",
      "https://support.ucsd.edu/kb_view.do?sysparm_article=KB0034645"
    ],
    "pageDate": "Schedule page not shown; KB article modified 2023-07-28"
  },
  {
    "name": "UC Santa Barbara",
    "country": "United States",
    "state": "California",
    "ends": "Email-only login after graduation",
    "course": "Not stated.",
    "account": "After graduating your NetID only works for email: \"After graduating, you will have an active netid that is only good for umail.\" The campus IT page says \"Upon separating from campus, you will no longer have an active UCSBNetID and you will no longer have access to campus services.\"",
    "sources": [
      "https://www.identity.ucsb.edu/ucsbnetid/faq",
      "https://www.connect.ucsb.edu/accounts/leaving-ucsb"
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
    "pageDate": "Modified 2026-09-16 (meta)",
    "state": "California"
  },
  {
    "name": "Colorado State University",
    "country": "United States",
    "state": "Colorado",
    "ends": "Closed a few weeks after term",
    "course": "Courses close for students a few weeks after the semester: \"Courses close a few weeks after each semester ends\". Student enrollments are removed \"365 days after student’s last class\".",
    "account": "Your account goes when your NetID expires: \"When a user’s NetID expires, the user account and their enrollments are removed from Canvas.\"",
    "sources": [
      "https://canvas.colostate.edu/course-dates-for-students/",
      "https://canvas.colostate.edu/enrollment-access/"
    ],
    "pageDate": "Not shown"
  },
  {
    "name": "Colorado State University Global",
    "country": "United States",
    "state": "Colorado",
    "ends": "Read-only after 30 days",
    "course": "Full access for 30 days after the last class, then read-only via Past Enrollments: \"Students have full-access to Canvas courses for 30 days from the last day of class.\"",
    "account": "Access ends at graduation: \"once your degree has been conferred and you are officially graduated, you will no longer have access to Canvas.\"",
    "sources": [
      "https://csuglobalhelp.knowledgeowl.com/help/can-i-access-a-previous-course"
    ],
    "pageDate": "Modified 2026-02-20 (page)"
  },
  {
    "name": "University of Colorado Boulder",
    "country": "United States",
    "state": "Colorado",
    "ends": "Closed three weeks after term",
    "course": "Students lose the course three weeks after the semester by default: \"By default, students lose access to their Canvas courses three weeks after the end of the semester.\" After the end date, \"the course will no longer appear on students’ dashboards, and students will no longer be able to access the course.\"",
    "account": "Not stated.",
    "sources": [
      "https://oit.colorado.edu/services/teaching-learning-applications/canvas/help/end-semester-best-practices",
      "https://oit.colorado.edu/node/19636"
    ],
    "pageDate": "Not shown"
  },
  {
    "name": "University of Colorado Denver",
    "country": "United States",
    "state": "Colorado",
    "ends": "Read-only after term",
    "course": "Courses turn read-only on the last day of the semester: \"For students, the course automatically concludes on the last day of the semester. Students can access content from a concluded course in a read-only format.\" Instructors can restrict this.",
    "account": "Not stated.",
    "sources": [
      "https://www.ucdenver.edu/tips/resources/end-of-semester-canvas-course-checklist-for-instructors"
    ],
    "pageDate": "Not shown"
  },
  {
    "name": "University of Denver",
    "country": "United States",
    "state": "Colorado",
    "ends": "Until you graduate or leave",
    "course": "Access varies by course: \"Access to past courses varies by course, department and college. Students may retain access until they graduate and/or leave the institution unless otherwise noted by the instructor.\"",
    "account": "Not stated.",
    "sources": [
      "https://www.du.edu/otl/learning-management-system-guidelines"
    ],
    "pageDate": "Not shown"
  },
  {
    "name": "Yale University",
    "country": "United States",
    "state": "Connecticut",
    "ends": "Login locked after a year",
    "course": "Past courses stay viewable but locked: \"Courses that are past their Term Dates or manually set Course Participation Dates are still visible to all instructors and participants, but prevent participation or modification after that date.\" Term end dates are \"set globally for August 31st\".",
    "account": "Your NetID is locked a year after your last class: \"12 months after your last class The student’s Yale email account is deactivated. The student’s NetID is locked, preventing access to most Yale systems.\"",
    "sources": [
      "https://help.canvas.yale.edu/a/920489-courses-in-past-terms",
      "https://cybersecurity.yale.edu/iam/identity-lifecycles/student-identity-lifecycle"
    ],
    "pageDate": "Updated on Oct 16, 2025 (Canvas page); modified 2026-04-01 (meta, IAM page)"
  },
  {
    "name": "University of Delaware",
    "country": "United States",
    "state": "Delaware",
    "ends": "Deleted after 5 years",
    "course": "Instructors can close a course after the term, and sites are deleted after five years: \"Instructors can restrict access to course materials after the course term has ended.\" and \"As of August 2022, Canvas sites older than 5 years are deleted as part of the new Course Data Retention process.\"",
    "account": "Not stated.",
    "sources": [
      "https://www.udel.edu/home/it/ask-it/for-students/leaving-ud/"
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
    "pageDate": "Modified 2026-01-28 (meta)",
    "state": "District of Columbia"
  },
  {
    "name": "Florida State University",
    "country": "United States",
    "state": "Florida",
    "ends": "Read-only for up to a year",
    "course": "Courses are read-only after they end: \"As a student, you will default to having read-only access to your course for up to a year after it ends.\" Instructors can restrict access.",
    "account": "Not stated.",
    "sources": [
      "https://support.canvas.fsu.edu/kb/article/961-how-user-enrollments-and-course-access-work-in-canvas/"
    ],
    "pageDate": "Last updated 2026-04-08 (page says it is shown in preview mode)"
  },
  {
    "name": "University of Central Florida",
    "country": "United States",
    "state": "Florida",
    "ends": "Deleted after six years",
    "course": "Courses become read-only when they conclude: after the end date students can view content \"but they aren’t able to actively participate in the course\". \"Academic courses are retained for six (6) years after the semester they were last offered\", and \"Once a course is permanently deleted, it cannot be recovered.\"",
    "account": "Not stated.",
    "sources": [
      "https://cdl.ucf.edu/support/webcourses/guides/retention-and-deletion-guide/",
      "https://cdl.ucf.edu/teach/course/end-semester-checklist/"
    ],
    "pageDate": "Modified 2026-10-15 and 2026-06-03 (meta)"
  },
  {
    "name": "University of Florida",
    "country": "United States",
    "state": "Florida",
    "ends": "Viewable after term ends",
    "course": "Courses close at the end of term but stay viewable: \"Your course will close automatically at the end of the semester based on the default semester end dates.\" \"By default, courses are set up so that students can view their work (e.g. what they submitted for an assignment or a discussion).\" Instructors can restrict this.",
    "account": "Not stated.",
    "sources": [
      "https://elearning.ufl.edu/instructor-help/faqs/"
    ],
    "pageDate": "Not shown"
  },
  {
    "name": "Georgia Institute of Technology",
    "country": "United States",
    "state": "Georgia",
    "ends": "Read-only after 2 weeks",
    "course": "Courses go read-only two weeks after term and are deleted after seven years: \"Banner-provisioned courses become read-only two weeks after term end and are deleted 7 years later.\" \"Once deleted, courses and content cannot be restored.\"",
    "account": "Not stated.",
    "sources": [
      "https://sites.gatech.edu/dlt-blog/2025/11/21/georgia-tech-canvas-data-retention-what-you-need-to-know/"
    ],
    "pageDate": "Published 2025-11-21"
  },
  {
    "name": "Boise State University",
    "country": "United States",
    "state": "Idaho",
    "ends": "Closed at term end",
    "course": "Courses close when the term ends by default: \"By default, Canvas courses start and end on the term dates so they are not accessible to students after the term ends.\"",
    "account": "Not stated.",
    "sources": [
      "https://talk.confluence.boisestate.edu/wiki/spaces/LTS/pages/166199312/Canvas+Course+Availability"
    ],
    "pageDate": "Updated 2025-01-07 (page)"
  },
  {
    "name": "Brigham Young University-Idaho",
    "country": "United States",
    "state": "Idaho",
    "ends": "Courses deleted after a year",
    "course": "Courses are deleted a year after they ran: \"Courses on Canvas will be deleted a year after they were live. Therefore, alumni may not have access to any past courses.\"",
    "account": "Alumni keep their Canvas login: \"As an alumni, you will retain access to Canvas for as long as your account is active.\"",
    "sources": [
      "https://td.byui.edu/TDClient/79/ITHelpCenter/KB/Article/17006/Alumni-Account-Accesses"
    ],
    "pageDate": "Modified 2026-10-22 (page)"
  },
  {
    "name": "Illinois Institute of Technology",
    "country": "United States",
    "state": "Illinois",
    "ends": "Read-only after term ends",
    "course": "Courses become read-only: \"Students can still view the homepage, syllabus, and modules in read-only mode\", but \"Instructors can restrict student access entirely by adjusting a setting in the course.\"",
    "account": "Not stated.",
    "sources": [
      "https://today.iit.edu/?p=152007"
    ],
    "pageDate": "Posted 2025-01-23"
  },
  {
    "name": "Illinois State University",
    "country": "United States",
    "state": "Illinois",
    "ends": "About 10 days after term",
    "course": "Courses close shortly after the term: \"Students will retain access to past courses until approximately 10 days after the end of the academic term for which the course was offered.\" Instructors can change this with the Participation setting.",
    "account": "Not stated.",
    "sources": [
      "https://help.illinoisstate.edu/technology/support-topics/canvas/canvas-course-access-timeline"
    ],
    "pageDate": "Not shown"
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
    "pageDate": "Not shown",
    "state": "Illinois"
  },
  {
    "name": "University of Chicago",
    "country": "United States",
    "state": "Illinois",
    "ends": "No end while on Canvas",
    "course": "Not stated.",
    "account": "Graduates keep Canvas access: \"You will have access to Canvas for as long as Canvas is the preferred LMS for UChicago.\" The FAQ still advises \"downloading all materials and saving to another location\".",
    "sources": [
      "https://courses.uchicago.edu/faq/"
    ],
    "pageDate": "Not shown"
  },
  {
    "name": "University of Illinois Chicago",
    "country": "United States",
    "state": "Illinois",
    "ends": "Courses archived after 3 years",
    "course": "Old courses are archived each summer: \"Canvas courses that are over 3 years old are flagged for archival (SUYY) and then archived by default every June 1.\" Student access after the term is not stated.",
    "account": "Not stated.",
    "sources": [
      "https://learning.uic.edu/resources/canvas-learning-management-system/"
    ],
    "pageDate": "Not shown"
  },
  {
    "name": "University of Illinois Urbana-Champaign",
    "country": "United States",
    "state": "Illinois",
    "ends": "About a year after last term",
    "course": "Past courses stay viewable only if the instructor allows it: \"If your instructor allows course content to be viewable after the course ends\", you find it under Past Enrollments; if it is missing, \"that means your instructor has restricted access to course content after the course ended\".",
    "account": "Canvas access ends when your student status expires: \"Your student affiliation will expire approximately 1 year after your last registered semester, regardless of your graduation date.\" After that you lose \"Access to online courses (Canvas, Compass 2g, Moodle, etc.)\".",
    "sources": [
      "https://answers.illinois.edu/51006",
      "https://answers.illinois.edu/152440"
    ],
    "pageDate": "Updated 2024-10-23 (51006); Updated 2026-04-08 (152440)"
  },
  {
    "name": "Indiana State University",
    "country": "United States",
    "state": "Indiana",
    "ends": "Deleted after 18 months",
    "course": "Course sites are deleted 18 months after the term: Canvas \"Course Sites (standard, for-credit courses)\" are kept \"18 months from the end date of the term in which they were taught.\"",
    "account": "Not stated.",
    "sources": [
      "https://indstate.teamdynamix.com/TDClient/1851/Portal/KB/ArticleDet?ID=82722"
    ],
    "pageDate": "Modified 2026-05-29 (meta)"
  },
  {
    "name": "University of Iowa",
    "country": "United States",
    "state": "Iowa",
    "ends": "Login ends at next semester",
    "course": "Courses go read-only and are later deleted: in years 2 to 5 \"access continues in read-only view from the Courses page unless an instructor/admin previously checked the box to restrict students from viewing within the course settings\"; in year 6 \"All course enrollments removed (students, teachers, etc.)\"; in year 7 \"Course is deleted from ICON and cannot be restored.\"",
    "account": "Graduates keep ICON (Iowa's Canvas) for one more semester: \"You will be able to access ICON until the beginning of the fall semester if you graduate in the spring or summer, and until the beginning of the spring semester if you graduate in the fall. However, individual courses may be made \"inactive\" by instructors at any time.\"",
    "sources": [
      "https://teach.its.uiowa.edu/icon/icon-course-archiving",
      "https://its.uiowa.edu/it-services-students/students-what-happens-your-it-services-when-you-leave-or-graduate"
    ],
    "pageDate": "Not shown"
  },
  {
    "name": "Kansas State University",
    "country": "United States",
    "state": "Kansas",
    "ends": "Access ends after 2 years",
    "course": "Not stated.",
    "account": "Canvas stays open for two years after your last enrollment: \"Students actively enrolled within the last 2 years continue to have access to the following services: Parchment transcripts, Canvas, Mediasite, Zoom, and in VetMed Echo360.\" The list of what students lose includes \"Canvas (after 2 years)\".",
    "sources": [
      "https://www.k-state.edu/it/resources/leaving/"
    ],
    "pageDate": "Updated 2026-08-05 (page footer and meta)"
  },
  {
    "name": "University of Kansas",
    "country": "United States",
    "state": "Kansas",
    "ends": "Access ends after 210 days",
    "course": "Course data is kept five years: the access table lists Canvas as \"210 days (data retained five years)\".",
    "account": "Students lose Canvas 210 days after leaving: \"Students lose access to email and most other technology systems and services 210 days after they leave the university. However, accounts may be disabled immediately at the discretion of the university.\"",
    "sources": [
      "https://technology.ku.edu/leaving-ku"
    ],
    "pageDate": "Not shown"
  },
  {
    "name": "University of Kentucky",
    "country": "United States",
    "state": "Kentucky",
    "ends": "Login ends nine months after",
    "course": "Not stated.",
    "account": "Your linkblue login is removed nine months after your last class: \"students will have nine months from the time of their final class until their account is deprovisioned.\"",
    "sources": [
      "https://its.uky.edu/offboarding/account-deprovisioning"
    ],
    "pageDate": "Not shown"
  },
  {
    "name": "Tulane University",
    "country": "United States",
    "state": "Louisiana",
    "ends": "Account expires after one year",
    "course": "Not stated.",
    "account": "Your Tulane account, which is what signs you in to Canvas, expires a year after you leave: \"Student accounts expire one year after leaving the University.\" The policy lists what the account covers: \"access to services such as Canvas or Banner\". The School of Social Work warns its students that \"they will lose access to Canvas once degrees have been conferred\".",
    "sources": [
      "https://it.tulane.edu/user-account-policy",
      "https://tssw.tulane.edu/tssw-commencement"
    ],
    "pageDate": "Not shown"
  },
  {
    "name": "Johns Hopkins University",
    "country": "United States",
    "state": "Maryland",
    "ends": "180 days after graduation",
    "course": "Courses are deleted after five years: \"In Canvas, academic courses will be deleted after 5 years after the term end date (date when courses are complete).\"",
    "account": "Graduates lose Canvas when their JHED login stops: graduates without another affiliation \"will no longer have access to any products, resources, or applications that require single sign on (SSO) using their Johns Hopkins credentials (JHED ID) after their 180-day grace period\", and the list includes Canvas.",
    "sources": [
      "https://registrar.jhu.edu/policies/canvas-course-archival-and-retention/",
      "https://alumni.jhu.edu/inquire/alumni-email-accounts"
    ],
    "pageDate": "Last revised 2023-08-21 (registrar page)"
  },
  {
    "name": "University of Maryland (Smith School of Business)",
    "country": "United States",
    "state": "Maryland",
    "ends": "270 days after graduation",
    "course": "Not stated.",
    "account": "The Smith School's IT page says the Canvas account lasts two semesters: \"Canvas accounts remain active for 270 days (2 full semesters) after graduation.\"",
    "sources": [
      "https://networth.rhsmith.umd.edu/smith/tools-resources/account-information-smith-it"
    ],
    "pageDate": "Not shown"
  },
  {
    "name": "Harvard Graduate School of Design",
    "country": "United States",
    "state": "Massachusetts",
    "ends": "View-only for past courses",
    "course": "Graduates can still view their own past courses: \"Limited Canvas access will continue through HarvardKey, but graduates will only be able to view courses they were enrolled in as a student.\"",
    "account": "HarvardKey keeps working for Canvas, per the same sentence. Not stated how long.",
    "sources": [
      "https://www.gsd.harvard.edu/?p=2512119"
    ],
    "pageDate": "Modified 2025-12-02 (meta)"
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
    "pageDate": "Not shown",
    "state": "Massachusetts"
  },
  {
    "name": "MIT Sloan School of Management",
    "country": "United States",
    "state": "Massachusetts",
    "ends": "Set by each instructor",
    "course": "MIT Sloan's guide says it varies: \"Each instructor determines whether they want their students to be able to access their Canvas course and its content (e.g. assignments, files, and quizzes) after any given term ends.\"",
    "account": "Graduates switch from Kerberos to an alumni login: \"Recent graduates should continue to log in using Kerberos by clicking the Student button on log in page for MIT Canvas until the July 1st following their graduation.\" After that they log in through Infinite Connection.",
    "sources": [
      "https://mitsloanedtech.mit.edu/support/how-to-access-canvas-as-mit-sloan-alumni/"
    ],
    "pageDate": "Modified 2022-09-30 (meta)"
  },
  {
    "name": "Tufts University",
    "country": "United States",
    "state": "Massachusetts",
    "ends": "Login closes 90 days after graduation",
    "course": "Concluded courses are excluded: \"You will have access to Canvas, including your personal Files and your course sites, until your Tufts account expires. This excludes any course sites that an instructor has concluded.\"",
    "account": "Accounts close after 90 days: \"Tufts usernames and passwords will be active for 90 days after graduation.\" Canvas is listed among the accounts you lose \"At the end of 90 days\".",
    "sources": [
      "https://tuftsedtech.screenstepslive.com/s/18992/m/73355/l/1600166-what-happens-to-my-canvas-content-when-i-leave-tufts",
      "https://it.tufts.edu/guides/leaving-tufts"
    ],
    "pageDate": "Not shown"
  },
  {
    "name": "University of Massachusetts Dartmouth",
    "country": "United States",
    "state": "Massachusetts",
    "ends": "Account deleted after 12 months",
    "course": "Not stated.",
    "account": "Your UMassD Logon account is deleted a year after you leave (the page does not name Canvas): \"Students who are graduating or leave the university in good standing have access to their UMassD Logon accounts and UMassD email for 12 months after their degree completion / leave date.\"",
    "sources": [
      "https://www.umassd.edu/cits/policies/umassd-logon-account-eligibility/"
    ],
    "pageDate": "Dated 2025-12-15 (meta)"
  },
  {
    "name": "University of Massachusetts Lowell",
    "country": "United States",
    "state": "Massachusetts",
    "ends": "Courses deleted after five years",
    "course": "Instructors see two years of courses, older ones are archived and then deleted: \"providing instructor access to two academic years of courses in the Canvas production environment while archiving older courses for five years. Each year, at the start of the academic year, courses from the sixth academic year will be deleted.\"",
    "account": "Your account stays open two years: \"Your account will remain active for two years after graduation from UMass Lowell.\" The page does not name Canvas.",
    "sources": [
      "https://www.uml.edu/myuml/submissions/2026/2026-04-15-14-28-21-transition-to-canvas-information.aspx",
      "https://www.uml.edu/it/account-assistance.aspx"
    ],
    "pageDate": "Posted 2026-04-15 (URL); account page not shown"
  },
  {
    "name": "Michigan Technological University",
    "country": "United States",
    "state": "Michigan",
    "ends": "Closed after term by default",
    "course": "Old courses are closed to students: \"Accessing old courses in Canvas is not available by default.\" The instructor can ask the teaching centre to copy the content into a new course for you.",
    "account": "Not stated.",
    "sources": [
      "https://servicedesk.mtu.edu/TDClient/1801/Portal/KB/ArticleDet?ID=53816"
    ],
    "pageDate": "Modified 2024-10-01 (meta)"
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
    "pageDate": "Modified 2026-08-31 (meta)",
    "state": "Michigan"
  },
  {
    "name": "University of Missouri",
    "country": "United States",
    "state": "Missouri",
    "ends": "Account deleted after 12 months",
    "course": "Not stated.",
    "account": "Canvas is not named, but the university account is deleted a year after your last term: \"Former students will no longer be eligible for a University account 12 months from the end of the last term enrolled. Students who are no longer eligible for a university account will be deleted and the student will lose access to Office 365, email and all other electronic resources.\" \"Students may request a one-time extension for their account not to exceed one year.\"",
    "sources": [
      "https://doit.missouri.edu/services/accounts-and-access/account-expiration/"
    ],
    "pageDate": "Not shown"
  },
  {
    "name": "Washington University in St. Louis",
    "country": "United States",
    "state": "Missouri",
    "ends": "Courses close after 365 days",
    "course": "Courses stay open about a year after the semester: \"Generally, courses will be available for 365 days after the end of the semester.\" \"Instructors or admin can make changes and end access sooner.\"",
    "account": "Your login keeps working for Canvas after graduation: \"After graduation, your WashU Key continues to remain active for Canvas, even though you are no longer a current student.\" The 365-day course rule still applies.",
    "sources": [
      "https://it.washu.edu/access-services-after-leaving-washu/"
    ],
    "pageDate": "Not shown"
  },
  {
    "name": "Montana State University",
    "country": "United States",
    "state": "Montana",
    "ends": "Closed at course end date",
    "course": "Students lose the course at its end date: \"Once the course reaches the end date, students no longer have access.\"",
    "account": "Not stated.",
    "sources": [
      "https://www.montana.edu/ecat/help/instructors/terms/index.html"
    ],
    "pageDate": "Not shown"
  },
  {
    "name": "University of Nebraska-Lincoln",
    "country": "United States",
    "state": "Nebraska",
    "ends": "Access ends two terms later",
    "course": "Not stated.",
    "account": "Canvas access ends two terms after graduation: \"Graduating students will lose access to Canvas two terms after graduation (For example: Students will lose access at the end of December 2024 if they graduate in May 2024).\" Students not enrolled for three consecutive terms lose it too: \"their account will go inactive after that third term ends.\"",
    "sources": [
      "https://nusupport.nebraska.edu/TDClient/33/Portal/KB/Article/291/Unable-to-Access-Canvas"
    ],
    "pageDate": "Modified 2024-05-29 (meta)"
  },
  {
    "name": "University of Nevada, Las Vegas",
    "country": "United States",
    "state": "Nevada",
    "ends": "Hidden after 2 weeks",
    "course": "Courses are hidden two weeks after the semester: \"Courses will be hidden from students 2 weeks after the semester ends.\"",
    "account": "Not stated.",
    "sources": [
      "https://help.unlv.edu/TDClient/33/IT-Support-Portal/KB/ArticleDet?ID=817"
    ],
    "pageDate": "Modified 2023-02-16 (meta)"
  },
  {
    "name": "Dartmouth College",
    "country": "United States",
    "state": "New Hampshire",
    "ends": "Account expires after 60 days",
    "course": "Not stated. The Canvas article only advises: \"You should download all course information as you progress through your program and as the course ends\".",
    "account": "Your Dartmouth account ends about 60 days after graduation (the warning covers all accounts, not Canvas by name): \"Your Dartmouth account expires approximately 60 days after graduation, and cannot be extended\".",
    "sources": [
      "https://services.dartmouth.edu/TDClient/1806/Portal/KB/ArticleDet?ID=108570",
      "https://services.dartmouth.edu/TDClient/1806/Portal/KB/ArticleDet?ID=108537"
    ],
    "pageDate": "Modified 2026-05-27 and 2026-03-18 (meta)"
  },
  {
    "name": "Keene State College",
    "country": "United States",
    "state": "New Hampshire",
    "ends": "Login removed next semester",
    "course": "Courses stay open unless the instructor closes them: \"KSC students retain access to the course unless the faculty has closed it.\"",
    "account": "Accounts are removed in the next cleanup cycle: \"KSC removes student accounts twice a year – a month into the start of both the fall and spring semesters. May graduates are removed during the fall cycle.\"",
    "sources": [
      "https://td.usnh.edu/TDClient/60/Portal/KB/ArticleDet?ID=1301",
      "https://td.usnh.edu/TDClient/60/Portal/KB/ArticleDet?ID=3197"
    ],
    "pageDate": "Modified 2026-08-27 and 2026-08-28 (meta)"
  },
  {
    "name": "Plymouth State University",
    "country": "United States",
    "state": "New Hampshire",
    "ends": "Read-only after next term",
    "course": "Courses stay open one more term, then go read-only: \"Students and faculty will continue to have full access to the course until the end of the next full, standard term.\" and \"After the following term the course will go to a read only state\".",
    "account": "Alumni keep only email: \"PSU Alumni retain access to IT resources until a month into the start of the semester following graduation. At that time, their account automatically transitions to an Alumni Account where they retain access to just their PSU e-mail account indefinitely\".",
    "sources": [
      "https://td.usnh.edu/TDClient/60/Portal/KB/ArticleDet?ID=3895",
      "https://td.usnh.edu/TDClient/60/Portal/KB/ArticleDet?ID=3197"
    ],
    "pageDate": "Modified 2026-08-27 and 2026-08-28 (meta)"
  },
  {
    "name": "University of New Hampshire",
    "country": "United States",
    "state": "New Hampshire",
    "ends": "Read-only after 4 weeks",
    "course": "Courses go read-only four weeks after the term: \"After 4 weeks the course will go to a read-only state and will be removed from the Dashboard and Default Course list for the student.\" Instructors can also tick \"Restrict Students from viewing course after end date\".",
    "account": "Access lasts until a month into the next semester: \"departing or graduating students will retain access to myCourses until 30 days after the start of the next semester after departure or graduation (R+30).\" Online CPS students get longer: \"UNH CPS Online students retain access to Canvas and WebCat for 3 years after graduation.\"",
    "sources": [
      "https://td.usnh.edu/TDClient/60/Portal/KB/ArticleDet?ID=1301",
      "https://td.usnh.edu/TDClient/60/Portal/KB/ArticleDet?ID=1103",
      "https://td.usnh.edu/TDClient/60/Portal/KB/ArticleDet?ID=3197"
    ],
    "pageDate": "Modified 2026-08-27, 2026-09-03 and 2026-08-28 (meta)"
  },
  {
    "name": "Rutgers University",
    "country": "United States",
    "state": "New Jersey",
    "ends": "Kept with active NetID",
    "course": "Instructors can close courses after the term: \"Access to course material can be limited by the instructor after the conclusion of the semester.\"",
    "account": "Canvas stays open while your NetID does, and alumni keep it: \"Access maintained with an active NetID.\" \"After graduation, an active NetID is maintained for alumni.\"",
    "sources": [
      "https://it.rutgers.edu/access-to-rutgers-technology-resources-for-graduating-students/"
    ],
    "pageDate": "Not shown"
  },
  {
    "name": "University of New Mexico",
    "country": "United States",
    "state": "New Mexico",
    "ends": "Access ends 2 weeks after term",
    "course": "Students lose access two weeks after the course ends: \"Registered students will have access beginning on the course start date through two weeks past the course end date.\" Past courses are not listed for students: \"Students cannot see Past Enrollments in our Canvas instance.\"",
    "account": "Not stated.",
    "sources": [
      "https://canvasinfo.unm.edu/instructors/common-types-of-canvas-courses.html",
      "https://canvasinfo.unm.edu/students/index.html"
    ],
    "pageDate": "Not shown"
  },
  {
    "name": "Cornell University",
    "country": "United States",
    "state": "New York",
    "ends": "Deleted after six years",
    "course": "Courses are deleted after six years: \"All course content and user participation will be deleted six years after the close of a course.\" Students see a completed course only if \"The instructor has allowed you to continue to view the completed course.\"",
    "account": "The Canvas login outlives graduation: \"Your Canvas account will remain active for up to five years.\" \"If there is no activity after five years, the account will be deleted.\"",
    "sources": [
      "https://teaching.cornell.edu/node/2230",
      "https://it.cornell.edu/students/what-happens-when-you-graduate-steps-take-becoming-alum"
    ],
    "pageDate": "Not shown"
  },
  {
    "name": "University of North Carolina at Chapel Hill",
    "country": "United States",
    "state": "North Carolina",
    "ends": "Ends at graduation",
    "course": "Course access ends after the term by default: \"Course access ends after the term ends unless the instructor specified a different end date.\" The FAQ adds: \"By default, students can no longer access a Canvas course at the end of the calendar month when the course ended (e.g. Fall semester course access ends Jan. 1).\"",
    "account": "Canvas ends when you leave: \"Canvas access ends immediately after leaving the University.\" The graduating checklist lists Canvas under \"The following services are terminated immediately after graduation:\".",
    "sources": [
      "https://edtech.unc.edu/service/canvas/canvas-processes/",
      "https://tdx.unc.edu/TDClient/33/Portal/KB/ArticleDet?ID=79",
      "https://edtech.unc.edu/service/canvas/canvas-faq/"
    ],
    "pageDate": "Modified 2026-08-25 and 2026-08-13 (meta)"
  },
  {
    "name": "Kent State University",
    "country": "United States",
    "state": "Ohio",
    "ends": "Read-only after term ends",
    "course": "After the term end date the course becomes view-only: \"Students can view a course, email instructors, and download submitted work. Students can no longer participate (e.g., complete assignments) in the course.\"",
    "account": "Not stated.",
    "sources": [
      "https://www.kent.edu/canvas/faculty-faqs"
    ],
    "pageDate": "Not shown"
  },
  {
    "name": "Miami University",
    "country": "United States",
    "state": "Ohio",
    "ends": "Login lasts a year",
    "course": "Not stated.",
    "account": "Alumni keep their Miami accounts for a year: \"If you are classified as an Alum, your access will remain for one year post graduation\". Accounts are then suspended and \"permanently deleted 30 days after being suspended\".",
    "sources": [
      "https://miamioh.teamdynamix.com/TDClient/1813/Portal/KB/ArticleDet?ID=6842"
    ],
    "pageDate": "Modified 2026-06-03 (meta)"
  },
  {
    "name": "Ohio State University",
    "country": "United States",
    "state": "Ohio",
    "ends": "Login lasts two years",
    "course": "How long course content stays is up to the instructor: \"the length of time that course content remains on Carmen is at the discretion of the instructor.\"",
    "account": "You can log in for two years after graduating: \"You will be able to log in to Carmen for two years after graduation\".",
    "sources": [
      "https://it.osu.edu/technology-access-after-graduation"
    ],
    "pageDate": "Not shown"
  },
  {
    "name": "Ohio University",
    "country": "United States",
    "state": "Ohio",
    "ends": "Read-only after term ends",
    "course": "Courses become read-only: \"After the term ends, students will retain read-only access to the course.\"",
    "account": "Unused alumni accounts are closed after 18 months: \"Student and alumni accounts that have not been logged into for 18 months will be deactivated.\" Then \"Former students, alumni, and guest accounts are deleted 30 days after deactivation.\"",
    "sources": [
      "https://www.ohio.edu/news/2025/01/end-term-canvas-assessment-management-ohio-faculty",
      "https://help.ohio.edu/TDClient/30/Portal/KB/ArticleDet?ID=57"
    ],
    "pageDate": "Published 2025-01-17 (news); Modified 2026-06-01 (meta, KB 57)"
  },
  {
    "name": "University of Oklahoma",
    "country": "United States",
    "state": "Oklahoma",
    "ends": "Instructor decides",
    "course": "Past courses are only open if the instructor allows it: \"To access completed courses, you must contact the instructor. Course access is at the discretion of the instructor.\"",
    "account": "Not stated.",
    "sources": [
      "https://itsupport.ou.edu/TDClient/30/Unified/KB/Article/3346/Canvas-Getting-Started-with-Canvas-for-Students"
    ],
    "pageDate": "Modified 2026-08-07 (meta)"
  },
  {
    "name": "Oregon State University",
    "country": "United States",
    "state": "Oregon",
    "ends": "Read-only while login lasts",
    "course": "Past courses stay read-only while your login works: \"Students will retain read-only access to all courses listed in Past Enrollments for as long as their OSU login is active.\" Older sites are archived once a year: \"instructors should have read-only access to past-term courses for the last two academic years. All other past-term courses are archived.\"",
    "account": "Your login lasts a year after graduating: \"ONID accounts remain active for one year after graduation. They are then deactivated for one term, after which they are deleted.\"",
    "sources": [
      "https://learn.oregonstate.edu/using-canvas",
      "https://onid.oregonstate.edu/account-eligibility-and-duration"
    ],
    "pageDate": "Modified 2025-08-19 (meta); ONID page modified 2025-04-14 (meta)"
  },
  {
    "name": "Portland State University",
    "country": "United States",
    "state": "Oregon",
    "ends": "Login ends after 1 year",
    "course": "Not stated.",
    "account": "Your Odin login expires a year after your last term: \"1 year from the end of the last term of attendance; access will expire when the grace period ends\". After that, \"former students and employees will have limited system access, primarily to myPSU and Banweb\".",
    "sources": [
      "https://www.pdx.edu/oit/odin-account-standard"
    ],
    "pageDate": "Not shown"
  },
  {
    "name": "University of Oregon",
    "country": "United States",
    "state": "Oregon",
    "ends": "One year after last term",
    "course": "Not stated.",
    "account": "Canvas lasts a year after your last term: \"For one calendar year after your last term of eligible enrollment, you have access to: Email and Canvas\".",
    "sources": [
      "https://service.uoregon.edu/TDClient/2030/Portal/KB/ArticleDet?ID=68176"
    ],
    "pageDate": "Modified 2026-05-20 (meta)"
  },
  {
    "name": "Carnegie Mellon University",
    "country": "United States",
    "state": "Pennsylvania",
    "ends": "When Andrew ID expires",
    "course": "Instructors decide: \"Access to past courses is decided upon by instructors.\"",
    "account": "Canvas lasts as long as your Andrew ID: \"You will keep access to Canvas for as long as your Andrew ID is active.\" And \"Your student account will expire as soon as 90 days after you graduate.\"",
    "sources": [
      "https://www.cmu.edu/canvas/faqs/index.html",
      "https://www.cmu.edu/computing/services/security/identity-access/account/transition.html"
    ],
    "pageDate": "Not shown"
  },
  {
    "name": "Drexel University",
    "country": "United States",
    "state": "Pennsylvania",
    "ends": "Read-only after course ends",
    "course": "Finished courses stay readable: \"Students will maintain read-only access to their courses after the end date.\" Drexel is moving from Blackboard, and \"Blackboard Learn Original courses become read-only\" on December 31, 2026.",
    "account": "Not stated.",
    "sources": [
      "https://servicedesk.drexel.edu/TDClient/277/Portal/KB/Article/20270/Student-Resources-for-Canvas",
      "https://drexel.edu/provost/news-events/announcements/2026/January/drexel-moving-to-canvas"
    ],
    "pageDate": "Announcement dated January 12, 2026; KB article not shown"
  },
  {
    "name": "Penn State University",
    "country": "United States",
    "state": "Pennsylvania",
    "ends": "A few weeks after leaving",
    "course": "Not stated.",
    "account": "Canvas access ends a few weeks after you leave: your access to \"Office 365, Canvas, Wi-Fi, and computer labs\" \"only lasts for a few additional weeks after your departure.\" The account then drops to Limited status, which reaches Canvas only \"If you are enrolled in a course that has been added to Canvas\".",
    "sources": [
      "https://sites.psu.edu/countdowntocapandgown/countdown-to-cap-and-gown/technology-after-graduation/",
      "https://security.psu.edu/services/penn-state-accts/acct-type/"
    ],
    "pageDate": "Not shown"
  },
  {
    "name": "Temple University",
    "country": "United States",
    "state": "Pennsylvania",
    "ends": "About 30 days after graduating",
    "course": "Courses are kept until a retention period ends: \"all courses will remain until their retention period.\" The period itself is not stated.",
    "account": "Canvas access ends about a month after graduation: \"Approximately 30 days after graduating\". Temple adds: \"Make sure to keep copies of files you uploaded to your courses.\"",
    "sources": [
      "https://help.temple.edu/TDClient/277/Portal/KB/Article/20180/Access-to-Temple-Tech-resources-after-you-graduate",
      "https://help.temple.edu/TDClient/277/Portal/KB/ArticleDet?ID=20089"
    ],
    "pageDate": "Not shown"
  },
  {
    "name": "University of Pennsylvania",
    "country": "United States",
    "ends": "Login never expires",
    "course": "Course sites are kept for five years, but an instructor can lock students out: \"Canvas sites are retained in Penn’s Canvas environment for five years from the term during which the course was offered\"; \"Faculty may choose to enable a setting that completely prevents students from accessing a Canvas site after a term ends\".",
    "account": "Login never expires: \"PennKeys do not expire, so students can still log into Canvas after graduation\" (Penn Carey Law runs a separate Canvas and is excluded).",
    "sources": [
      "https://infocanvas.upenn.edu/students/canvas-after-graduation/"
    ],
    "pageDate": "Modified 2026-02-27 (meta)",
    "state": "Pennsylvania"
  },
  {
    "name": "University of Pittsburgh",
    "country": "United States",
    "state": "Pennsylvania",
    "ends": "When no longer registered",
    "course": "Not stated.",
    "account": "Canvas closes when you stop being a student: \"Your Canvas account is disabled when you are no longer a registered student.\" Pitt advises: \"Download any assignments, grades, or course materials you want to retain before your status changes.\"",
    "sources": [
      "https://services.pitt.edu/TDClient/33/Portal/KB/ArticleDet?ID=11"
    ],
    "pageDate": "Not shown"
  },
  {
    "name": "Brown University",
    "country": "United States",
    "state": "Rhode Island",
    "ends": "Lost at graduation",
    "course": "Instructors may allow read-only access for a limited time: \"your instructor can choose whether or not to allow you continued read-only access to the course after it concludes up to a maximum 5 years or when you graduate (whichever comes first).\"",
    "account": "Canvas goes when you graduate: \"Alumni students will lose access after they graduate.\" and \"your access may be removed at any time after final grades are submitted.\"",
    "sources": [
      "https://help.canvas.brown.edu/a/1865190-what-happens-when-a-canvas-course-concludes",
      "https://graduateschool.brown.edu/transitioning-brown"
    ],
    "pageDate": "Updated on Apr 28, 2026"
  },
  {
    "name": "University of Tennessee, Knoxville",
    "country": "United States",
    "state": "Tennessee",
    "ends": "Access ends when you leave",
    "course": "Courses turn read-only after the term and are deleted after six years: \"Outside of these Term Dates, students cannot participate in courses.\" Courses stay active for years 1 to 3, are archived for years 3 to 6, and \"At year 6 after the term end date of a course, the course will be deleted from the archive.\"",
    "account": "Canvas access ends on the day you leave UT, set by graduation or your last term: \"Your access to Canvas will end on your Left UT date.\" The retention standard adds: \"As students leave the university, their accounts get dropped out of Canvas along with their grades, submissions, and participation.\"",
    "sources": [
      "https://oit.utk.edu/teachingtools/online/standard-for-retaining-canvas-courses/",
      "https://utk.teamdynamix.com/TDClient/2277/OIT-Portal/KB/ArticleDet?ID=142043",
      "https://oit.utk.edu/teachingtools/online/canvas-key-dates/"
    ],
    "pageDate": "Retention standard: Version 2, October 2026 (revision history); leaving checklist modified 2026-08-05 (meta)"
  },
  {
    "name": "Baylor University",
    "country": "United States",
    "state": "Texas",
    "ends": "Access ends 10 days after classes",
    "course": "Students can only use a course between its start and end dates, and by default \"the default end date is 10-days after the official last day of class\". Instructors can extend it.",
    "account": "Not stated.",
    "sources": [
      "https://canvas.web.baylor.edu/support/canvas/frequently-asked-questions"
    ],
    "pageDate": "Not shown"
  },
  {
    "name": "Southern Methodist University (SMU)",
    "country": "United States",
    "state": "Texas",
    "ends": "Read-only while login lasts",
    "course": "Courses become read-only when they end and are kept for years: \"Concluded courses become read-only for students and access to past quizzes is restricted.\" On retention: \"SACSCOC requires SMU to keep all student records (LMS courses) for 5 years; however, our Institutional Planning and Effectiveness office has requested a 10-year retention.\"",
    "account": "Access lasts as long as your SMU login stays active: \"Student access remains active as long as Single-Sign On (SSO) remains active by resetting the account password once each year.\"",
    "sources": [
      "https://www.smu.edu/oit/academictech/instructional-guidelines/lms-guidelines"
    ],
    "pageDate": "Not shown"
  },
  {
    "name": "Texas A&M University",
    "country": "United States",
    "state": "Texas",
    "ends": "Access ends at graduation",
    "course": "Courses move to Past Enrollments as read-only after the term's \"Available Until\" date: \"After the Course Available Until date has passed, courses will be removed from the Canvas dashboard for faculty, TAs, and students. Courses will then move to the Past Enrollments section under All Courses as a Read only course\".",
    "account": "Canvas is on the list of services that stop at graduation: \"Access to the following Texas A&M services end upon graduation\", which includes \"Access to Canvas\".",
    "sources": [
      "https://www.it.tamu.edu/services/services-for-you/graduating-students.html",
      "https://lms.tamu.edu/course-management/index.html"
    ],
    "pageDate": "Modified October 14, 2026 (graduating students page)"
  },
  {
    "name": "Texas State University",
    "country": "United States",
    "state": "Texas",
    "ends": "Read-only once concluded",
    "course": "Concluded courses stay as read-only archives and academic courses are not deleted: \"Concluding a course archives all course content. Instructors and students can no longer participate in the course, and it is marked read-only.\" Also: \"Due to academic course retention policies, academic courses (courses with associated rosters) cannot be deleted by the course instructor or by ITAC.\" When a course concludes after the term is not stated.",
    "account": "Not stated.",
    "sources": [
      "https://services.txst.edu/TDClient/39/ITAC/KB/Article/134/Canvas-Frequently-Asked-Questions"
    ],
    "pageDate": "Modified 2026-01-30 (meta)"
  },
  {
    "name": "University of Houston",
    "country": "United States",
    "state": "Texas",
    "ends": "Access ends 14 days after term",
    "course": "Students lose access two weeks after the session: \"Students will have access to courses up to 14 days after a session closes.\"",
    "account": "Not stated.",
    "sources": [
      "https://www.uh.edu/canvas/faculty/canvas-procedures/"
    ],
    "pageDate": "Updated 2025-08-15 (meta)"
  },
  {
    "name": "University of North Texas",
    "country": "United States",
    "state": "Texas",
    "ends": "Access ends 1 week after term",
    "course": "Students keep access for one week after the term, then lose it: students \"will retain access until one (1) week after the term ends unless the instructor has altered the course start and end dates in the course settings\". The FAQ adds: \"Once the end date of a course has been reached, students will no longer have access to a course's content.\"",
    "account": "Not stated.",
    "sources": [
      "https://lms.unt.edu/canvas-policies.html",
      "https://lms.unt.edu/resources/canvas-faq.html"
    ],
    "pageDate": "Updated 2025-07-29 (meta)"
  },
  {
    "name": "Utah Tech University",
    "country": "United States",
    "state": "Utah",
    "ends": "Closed about 2 weeks after term",
    "course": "Courses close about two weeks after the semester: \"Students only have access to courses through the end of the semester + approximately two weeks beyond that.\"",
    "account": "Not stated.",
    "sources": [
      "https://help.utahtech.edu/kb/article/178-incomplete-students-in-canvas/"
    ],
    "pageDate": "Updated 2023-04-13 (page)"
  },
  {
    "name": "Weber State University",
    "country": "United States",
    "state": "Utah",
    "ends": "Archived after seven years",
    "course": "Past courses stay available for seven years: \"Students can access past Canvas courses for 7 years from the semester end date. After this, courses will be archived and no longer available.\"",
    "account": "Not stated.",
    "sources": [
      "https://www.weber.edu/online/course-archiving.html"
    ],
    "pageDate": "Not shown"
  },
  {
    "name": "George Mason University",
    "country": "United States",
    "state": "Virginia",
    "ends": "Read-only, deleted after 4 years",
    "course": "Courses turn read-only two weeks after they end, unless the instructor hides them, and are deleted after four years: \"Students can continue to access the course, but only to view content (read only mode)\" and \"Course sites will be retained in the system for four years, and then will be permanently deleted.\"",
    "account": "Not stated.",
    "sources": [
      "https://its.gmu.edu/knowledge-base/publish-participate-canvas-course/",
      "https://its.gmu.edu/knowledge-base/learning-management-system-course-retention-guidelines/"
    ],
    "pageDate": "Modified 2026-07-23 (meta)"
  },
  {
    "name": "James Madison University",
    "country": "United States",
    "state": "Virginia",
    "ends": "Removed at graduation",
    "course": "Not stated.",
    "account": "Canvas access ends at graduation and is not restored: \"Your access to Canvas will be removed at graduation.\" and \"Once this access is removed and your account is showing you are a Graduate, that access cannot be reinstated nor can the files be accessed.\"",
    "sources": [
      "https://www.jmu.edu/news/computing/2026/04-30-jmu-account-info-for-graduates.shtml",
      "https://help.jmu.edu/TDClient/277/Portal/KB/ArticleDet?ID=20520"
    ],
    "pageDate": "Posted 2026-04-30 (news); KB modified 2026-07-28 (meta)"
  },
  {
    "name": "Liberty University",
    "country": "United States",
    "state": "Virginia",
    "ends": "Read-only, may be archived",
    "course": "Past courses stay viewable but read-only, and may later be archived: \"you will have read-only access and will not be able to change existing items or submit new work\" and \"past courses may be archived at a later time, and you will no longer have access to the materials inside the course\".",
    "account": "Not stated.",
    "sources": [
      "https://www.liberty.edu/information-services/wp-content/uploads/Canvas-Accessing-Past-Courses.pdf"
    ],
    "pageDate": "Not shown"
  },
  {
    "name": "Virginia Commonwealth University",
    "country": "United States",
    "state": "Virginia",
    "ends": "Deleted after 5 years",
    "course": "Courses five or more years old are deleted for good: \"VCU Learning Management Systems will begin permanently deleting Canvas Courses that are 5 or more years old on June 1, 2026\" and \"Once these courses have been deleted, there will be no option for retrieval.\"",
    "account": "Not stated.",
    "sources": [
      "https://blogs.vcu.edu/learning-systems/2026/02/09/reminder-hard-deletes-and-upcoming-course-shells/"
    ],
    "pageDate": "Posted 2026-02-09"
  },
  {
    "name": "Virginia Tech",
    "country": "United States",
    "state": "Virginia",
    "ends": "Read-only after term",
    "course": "Concluded courses are read-only and instructors decide on access after the term: \"A concluded course is read-only.\" and \"It is up to the discretion of each instructor to allow access to course materials after the term date has passed.\"",
    "account": "Not stated.",
    "sources": [
      "https://4help.vt.edu/sp?id=kb_article&sysparm_article=KB0013021",
      "https://4help.vt.edu/sp?id=kb_article&sysparm_article=KB0016376"
    ],
    "pageDate": "Not shown"
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
    "pageDate": "\"Last Updated: 3mo ago\" (timestamp 08-07-2026)",
    "state": "Washington"
  },
  {
    "name": "Western Washington University",
    "country": "United States",
    "state": "Washington",
    "ends": "Login ends after 1 quarter",
    "course": "Not stated.",
    "account": "Your account goes one quarter after you stop enrolling: \"Universal Accounts are retained for a one quarter period after a student is unenrolled from classes (excluding Summer).\"",
    "sources": [
      "https://atus.wwu.edu/kb/after-leaving-western-when-will-my-account-be-deleted"
    ],
    "pageDate": "Not shown"
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
    "pageDate": "Updated 2026-06-15 and 2026-04-27",
    "state": "Wisconsin"
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

// Schools confirmed on Canvas (from their own Canvas help or login page) whose own pages gave no
// written rule when we looked. Listed so students can find their school and its Canvas help page.
export const ON_CANVAS: OnCanvas[] = [
  {
    "name": "Auburn University",
    "state": "Alabama",
    "source": "https://www.auburn.edu/canvas"
  },
  {
    "name": "Jacksonville State University",
    "state": "Alabama",
    "source": "https://www.jsu.edu/online/canvas_access.html"
  },
  {
    "name": "University of Alabama at Birmingham",
    "state": "Alabama",
    "source": "https://www.uab.edu/elearning/academic-technologies/canvas"
  },
  {
    "name": "University of Alabama in Huntsville",
    "state": "Alabama",
    "source": "https://www.uah.edu/oit"
  },
  {
    "name": "University of North Alabama",
    "state": "Alabama",
    "source": "https://una.instructure.com/"
  },
  {
    "name": "University of South Alabama",
    "state": "Alabama",
    "source": "https://usaonline.southalabama.edu"
  },
  {
    "name": "Arizona State University",
    "state": "Arizona",
    "source": "https://canvas.asu.edu/"
  },
  {
    "name": "Arkansas State University",
    "state": "Arkansas",
    "source": "https://arkansasstateuniversity.instructure.com/"
  },
  {
    "name": "NorthWest Arkansas Community College",
    "state": "Arkansas",
    "source": "https://nwacc.instructure.com/login/saml"
  },
  {
    "name": "California State University, Fullerton",
    "state": "California",
    "source": "https://fullerton.instructure.com"
  },
  {
    "name": "California State University, Los Angeles",
    "state": "California",
    "source": "https://calstatela.instructure.com"
  },
  {
    "name": "California State University, Sacramento",
    "state": "California",
    "source": "https://csus.instructure.com"
  },
  {
    "name": "Chapman University",
    "state": "California",
    "source": "https://canvas.chapman.edu/login"
  },
  {
    "name": "De Anza College",
    "state": "California",
    "source": "https://deanza.instructure.com/login"
  },
  {
    "name": "East Los Angeles College",
    "state": "California",
    "source": "https://ilearn.laccd.edu/login"
  },
  {
    "name": "Fresno State",
    "state": "California",
    "source": "https://academics.fresnostate.edu/canvas/students"
  },
  {
    "name": "Mt. San Antonio College",
    "state": "California",
    "source": "https://mtsac.instructure.com/login"
  },
  {
    "name": "Pasadena City College",
    "state": "California",
    "source": "https://canvas.pasadena.edu/login"
  },
  {
    "name": "San Diego State University",
    "state": "California",
    "source": "https://its.sdsu.edu/software/canvas"
  },
  {
    "name": "Santa Clara University",
    "state": "California",
    "source": "https://www.scu.edu/training/resources/students/new-student-technical-support/camino---learning-management-system/"
  },
  {
    "name": "Santa Monica College",
    "state": "California",
    "source": "https://smc.instructure.com/login"
  },
  {
    "name": "Santa Rosa Junior College",
    "state": "California",
    "source": "https://canvas.santarosa.edu/login"
  },
  {
    "name": "UC Merced",
    "state": "California",
    "source": "https://catcourses.ucmerced.edu"
  },
  {
    "name": "UC Riverside",
    "state": "California",
    "source": "https://its.ucr.edu/canvas"
  },
  {
    "name": "UC Santa Cruz",
    "state": "California",
    "source": "https://its.ucsc.edu/canvas"
  },
  {
    "name": "Metropolitan State University of Denver",
    "state": "Colorado",
    "source": "https://webapp.msudenver.edu/smc/ebird/temp.msudenver.edu/early-bird/2020/7/20-canvas.html"
  },
  {
    "name": "University of Northern Colorado",
    "state": "Colorado",
    "source": "https://www.unco.edu/canvas/"
  },
  {
    "name": "Quinnipiac University",
    "state": "Connecticut",
    "source": "https://quinnipiac.instructure.com/"
  },
  {
    "name": "American University",
    "state": "District of Columbia",
    "source": "https://www.american.edu/library/canvas/"
  },
  {
    "name": "Howard University",
    "state": "District of Columbia",
    "source": "https://canvas.howard.edu/login"
  },
  {
    "name": "Florida A&M University",
    "state": "Florida",
    "source": "https://famu.instructure.com/login"
  },
  {
    "name": "Florida Atlantic University",
    "state": "Florida",
    "source": "https://www.fau.edu/canvas/getting-started/"
  },
  {
    "name": "Florida Gulf Coast University",
    "state": "Florida",
    "source": "https://fgcu.instructure.com/login"
  },
  {
    "name": "Florida International University",
    "state": "Florida",
    "source": "https://canvas.fiu.edu/"
  },
  {
    "name": "Florida State College at Jacksonville",
    "state": "Florida",
    "source": "https://fscj.instructure.com/login"
  },
  {
    "name": "Hillsborough Community College",
    "state": "Florida",
    "source": "https://hcc.instructure.com/login"
  },
  {
    "name": "Miami Dade College",
    "state": "Florida",
    "source": "https://mdc.instructure.com/login"
  },
  {
    "name": "Santa Fe College",
    "state": "Florida",
    "source": "https://sfcollege.instructure.com/login"
  },
  {
    "name": "Seminole State College of Florida",
    "state": "Florida",
    "source": "https://seminolestate.instructure.com/login"
  },
  {
    "name": "University of North Florida",
    "state": "Florida",
    "source": "https://unf.instructure.com/login"
  },
  {
    "name": "University of South Florida",
    "state": "Florida",
    "source": "https://usflearn.instructure.com/login"
  },
  {
    "name": "University of West Florida",
    "state": "Florida",
    "source": "https://uwf.instructure.com/login"
  },
  {
    "name": "Valencia College",
    "state": "Florida",
    "source": "https://valenciacollege.instructure.com/login"
  },
  {
    "name": "Emory University",
    "state": "Georgia",
    "source": "https://canvas.emory.edu/login"
  },
  {
    "name": "College of Western Idaho",
    "state": "Idaho",
    "source": "https://cwi.instructure.com/login/canvas"
  },
  {
    "name": "University of Idaho",
    "state": "Idaho",
    "source": "https://uidaho.instructure.com/login/canvas"
  },
  {
    "name": "Ball State University",
    "state": "Indiana",
    "source": "https://www.bsu.edu/about/administrativeoffices/online-and-strategic-learning/canvas-at-ball-state"
  },
  {
    "name": "Indiana University Bloomington",
    "state": "Indiana",
    "source": "https://uits.iu.edu/services/canvas/index.html"
  },
  {
    "name": "Ivy Tech Community College",
    "state": "Indiana",
    "source": "https://www.ivytech.edu/student-services/ivylearn-canvas/"
  },
  {
    "name": "University of Notre Dame",
    "state": "Indiana",
    "source": "https://learning.nd.edu/learning-technology/canvas/"
  },
  {
    "name": "Des Moines Area Community College",
    "state": "Iowa",
    "source": "https://dmacc.instructure.com"
  },
  {
    "name": "Iowa State University",
    "state": "Iowa",
    "source": "https://celt.iastate.edu/prepare-and-teach/design-your-course/get-started-with-canvas/"
  },
  {
    "name": "Johnson County Community College",
    "state": "Kansas",
    "source": "https://jccc.instructure.com"
  },
  {
    "name": "Murray State University",
    "state": "Kentucky",
    "source": "https://murraystate.instructure.com/"
  },
  {
    "name": "Northern Kentucky University",
    "state": "Kentucky",
    "source": "https://nku.instructure.com/"
  },
  {
    "name": "Loyola University New Orleans",
    "state": "Louisiana",
    "source": "https://loyno.instructure.com/login/saml"
  },
  {
    "name": "Southeastern Louisiana University",
    "state": "Louisiana",
    "source": "https://southeastern.instructure.com/"
  },
  {
    "name": "Morgan State University",
    "state": "Maryland",
    "source": "https://www.morgan.edu/canvas"
  },
  {
    "name": "Salisbury University",
    "state": "Maryland",
    "source": "https://www.salisbury.edu/administration/academic-affairs/instructional-design-delivery/cms/index.aspx"
  },
  {
    "name": "Berklee College of Music",
    "state": "Massachusetts",
    "source": "https://canvas.berklee.edu"
  },
  {
    "name": "Boston College",
    "state": "Massachusetts",
    "source": "https://www.bc.edu/content/bc-web/sites/accessibility/technology-accessibility/canvas.html"
  },
  {
    "name": "Merrimack College",
    "state": "Massachusetts",
    "source": "https://www.merrimack.edu/academics/centers-and-institutes/ctide/canvas/"
  },
  {
    "name": "Northeastern University",
    "state": "Massachusetts",
    "source": "https://canvas.northeastern.edu/"
  },
  {
    "name": "Salem State University",
    "state": "Massachusetts",
    "source": "https://www.salemstate.edu/offices-and-services/information-technology-services/canvas"
  },
  {
    "name": "Suffolk University",
    "state": "Massachusetts",
    "source": "https://www.suffolk.edu/about/directory/information-technology-services/accounts-and-access/canvas"
  },
  {
    "name": "University of Massachusetts Amherst",
    "state": "Massachusetts",
    "source": "https://umamherst.instructure.com/login"
  },
  {
    "name": "University of Massachusetts Boston",
    "state": "Massachusetts",
    "source": "https://www.umb.edu/canvas/"
  },
  {
    "name": "Worcester Polytechnic Institute",
    "state": "Massachusetts",
    "source": "https://canvas.wpi.edu/"
  },
  {
    "name": "Eastern Michigan University",
    "state": "Michigan",
    "source": "https://canvas.emich.edu"
  },
  {
    "name": "Wayne State University",
    "state": "Michigan",
    "source": "https://services.wayne.edu/TDClient/277/Portal/KB/ArticleDet?ID=20266"
  },
  {
    "name": "University of Minnesota Twin Cities",
    "state": "Minnesota",
    "source": "https://canvas.umn.edu"
  },
  {
    "name": "University of St. Thomas",
    "state": "Minnesota",
    "source": "https://stthomas.instructure.com"
  },
  {
    "name": "Jackson State University",
    "state": "Mississippi",
    "source": "https://jsums.instructure.com/login/saml"
  },
  {
    "name": "Mississippi State University",
    "state": "Mississippi",
    "source": "https://www.online.msstate.edu/faq/canvas"
  },
  {
    "name": "University of Southern Mississippi",
    "state": "Mississippi",
    "source": "https://www.usm.edu/canvas"
  },
  {
    "name": "Missouri University of Science and Technology",
    "state": "Missouri",
    "source": "https://canvas.mst.edu/"
  },
  {
    "name": "Saint Louis University",
    "state": "Missouri",
    "source": "https://www.slu.edu/provost/ltac-files/canvas-migration.php"
  },
  {
    "name": "St. Louis Community College",
    "state": "Missouri",
    "source": "https://stlcc.edu/programs-academics/online-education/canvas.aspx"
  },
  {
    "name": "University of Missouri-Kansas City",
    "state": "Missouri",
    "source": "https://umkc.instructure.com"
  },
  {
    "name": "University of Missouri-St. Louis",
    "state": "Missouri",
    "source": "https://umsl.instructure.com"
  },
  {
    "name": "Webster University",
    "state": "Missouri",
    "source": "https://www.webster.edu/technology/access-accounts.php"
  },
  {
    "name": "University of Montana",
    "state": "Montana",
    "source": "https://www.umt.edu/canvas/"
  },
  {
    "name": "Metropolitan Community College (Omaha)",
    "state": "Nebraska",
    "source": "https://mccneb.instructure.com"
  },
  {
    "name": "College of Southern Nevada",
    "state": "Nevada",
    "source": "https://csn.instructure.com/login/canvas"
  },
  {
    "name": "University of Nevada, Reno",
    "state": "Nevada",
    "source": "https://www.unr.edu/tlt/tools-and-technologies/webcampus/getting-started"
  },
  {
    "name": "Bergen Community College",
    "state": "New Jersey",
    "source": "https://bergen.instructure.com"
  },
  {
    "name": "Kean University",
    "state": "New Jersey",
    "source": "https://kean.instructure.com"
  },
  {
    "name": "Middlesex College",
    "state": "New Jersey",
    "source": "https://middlesexcc.instructure.com"
  },
  {
    "name": "Montclair State University",
    "state": "New Jersey",
    "source": "https://inside.montclair.edu/resources/canvas"
  },
  {
    "name": "New Jersey Institute of Technology",
    "state": "New Jersey",
    "source": "https://canvas.njit.edu"
  },
  {
    "name": "Princeton University",
    "state": "New Jersey",
    "source": "https://canvas.princeton.edu"
  },
  {
    "name": "Rowan University",
    "state": "New Jersey",
    "source": "https://rowan.instructure.com"
  },
  {
    "name": "Stevens Institute of Technology",
    "state": "New Jersey",
    "source": "https://sit.instructure.com"
  },
  {
    "name": "New Mexico State University",
    "state": "New Mexico",
    "source": "https://learning.nmsu.edu/"
  },
  {
    "name": "Columbia University",
    "state": "New York",
    "source": "https://support.ctl.columbia.edu/809664"
  },
  {
    "name": "Hofstra University",
    "state": "New York",
    "source": "https://hofstra.instructure.com"
  },
  {
    "name": "St. John's University",
    "state": "New York",
    "source": "https://stjohns.instructure.com"
  },
  {
    "name": "The New School",
    "state": "New York",
    "source": "https://canvas.newschool.edu"
  },
  {
    "name": "Duke University",
    "state": "North Carolina",
    "source": "https://ctl.duke.edu/technology/canvas/"
  },
  {
    "name": "East Carolina University",
    "state": "North Carolina",
    "source": "https://ecu.instructure.com/login"
  },
  {
    "name": "University of North Carolina at Charlotte",
    "state": "North Carolina",
    "source": "https://canvas.charlotte.edu/"
  },
  {
    "name": "University of North Carolina at Greensboro",
    "state": "North Carolina",
    "source": "https://uncg.instructure.com/"
  },
  {
    "name": "Bowling Green State University",
    "state": "Ohio",
    "source": "https://canvas.bgsu.edu"
  },
  {
    "name": "Case Western Reserve University",
    "state": "Ohio",
    "source": "https://case.edu/utech/help/knowledge-base/canvas/canvas-information"
  },
  {
    "name": "University of Cincinnati",
    "state": "Ohio",
    "source": "https://www.uc.edu/about/registrar/registration/registration-how-to-guide/catalyst-canvas.html"
  },
  {
    "name": "Oklahoma State University",
    "state": "Oklahoma",
    "source": "https://canvas.okstate.edu/"
  },
  {
    "name": "Community College of Philadelphia",
    "state": "Pennsylvania",
    "source": "https://ccp.instructure.com"
  },
  {
    "name": "Clemson University",
    "state": "South Carolina",
    "source": "https://clemson.instructure.com/login"
  },
  {
    "name": "Middle Tennessee State University",
    "state": "Tennessee",
    "source": "https://www.mtsu.edu/canvas/"
  },
  {
    "name": "University of Memphis",
    "state": "Tennessee",
    "source": "https://www.memphis.edu/umtech/service_catalog/software/canvas.php"
  },
  {
    "name": "University of Tennessee at Chattanooga",
    "state": "Tennessee",
    "source": "https://www.utc.edu/canvas"
  },
  {
    "name": "Alamo Colleges District",
    "state": "Texas",
    "source": "https://www.alamo.edu/sac/experience-sac/current-students/student-resources/canvas-for-students/"
  },
  {
    "name": "Collin College",
    "state": "Texas",
    "source": "https://www.collin.edu/academics/elearning/student-canvas-resources.html"
  },
  {
    "name": "Houston City College (formerly Houston Community College)",
    "state": "Texas",
    "source": "https://www.hccs.edu/current-students/technology-support/eagle-online-canvas-support/"
  },
  {
    "name": "Rice University",
    "state": "Texas",
    "source": "https://tss.rice.edu/services/accounts-access"
  },
  {
    "name": "Texas Tech University",
    "state": "Texas",
    "source": "https://www.depts.ttu.edu/ithelpcentral/"
  },
  {
    "name": "UT San Antonio (UTSA)",
    "state": "Texas",
    "source": "https://provost.utsa.edu/canvas/"
  },
  {
    "name": "University of Texas at Arlington",
    "state": "Texas",
    "source": "https://oit.uta.edu/canvas/"
  },
  {
    "name": "University of Texas at Austin",
    "state": "Texas",
    "source": "https://tech.utexas.edu/services-tools/canvas"
  },
  {
    "name": "Brigham Young University",
    "state": "Utah",
    "source": "https://byucanvas.byu.edu/getting-started-with-canvas"
  },
  {
    "name": "Salt Lake Community College",
    "state": "Utah",
    "source": "https://www.slcc.edu/student-tech-guide/canvas-help.aspx"
  },
  {
    "name": "University of Utah",
    "state": "Utah",
    "source": "https://digitallearning.utah.edu/support/canvas-help.php"
  },
  {
    "name": "Utah State University",
    "state": "Utah",
    "source": "https://www.usu.edu/teach/help-topics/canvas/index.php"
  },
  {
    "name": "Utah Valley University",
    "state": "Utah",
    "source": "https://www.uvu.edu/canvas/everyone/index.html"
  },
  {
    "name": "Northern Virginia Community College",
    "state": "Virginia",
    "source": "https://www.nvcc.edu/student-resources/technology/canvas.html"
  },
  {
    "name": "Old Dominion University",
    "state": "Virginia",
    "source": "https://www.odu.edu/technology-services/canvas"
  },
  {
    "name": "University of Virginia",
    "state": "Virginia",
    "source": "https://canvas.virginia.edu/students-getting-started"
  },
  {
    "name": "Central Washington University",
    "state": "Washington",
    "source": "https://canvas.cwu.edu"
  },
  {
    "name": "Eastern Washington University",
    "state": "Washington",
    "source": "https://canvas.ewu.edu"
  },
  {
    "name": "Gonzaga University",
    "state": "Washington",
    "source": "https://canvas.gonzaga.edu"
  },
  {
    "name": "Seattle University",
    "state": "Washington",
    "source": "https://canvas.seattleu.edu (DNS alias of seattleu.instructure.com)"
  },
  {
    "name": "Washington State University",
    "state": "Washington",
    "source": "https://canvas.wsu.edu (redirects to wsu.instructure.com)"
  },
  {
    "name": "University of Wisconsin-Milwaukee",
    "state": "Wisconsin",
    "source": "https://uwm.edu/canvas/canvas-for-students/"
  },
  {
    "name": "University of Wyoming",
    "state": "Wyoming",
    "source": "https://www.uwyo.edu/ctl/knowledge-base/wyocourses-information.html"
  }
];
