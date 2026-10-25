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
  country: string;
  /** US schools only, so the guide can group them by state. */
  state?: string;
  /** The school's own Canvas help or login page. */
  source: string;
}

export const POLICIES: Policy[] = [
  {
    "name": "University of Alabama in Huntsville",
    "country": "United States",
    "state": "Alabama",
    "ends": "Archived after two years",
    "course": "Courses are taken out of Canvas after two years, once a year in January: \"Canvas courses will be subject to archival from the system after two (2) years.\" \"Canvas archiving will take place annually each January following the video archiving event.\"",
    "account": "Not stated.",
    "sources": [
      "https://www.uah.edu/etl/training-resources/faculty-and-staff?view=article&id=16874:etl-archiving-procedures&catid=919:enhanced-teaching-and-learning"
    ],
    "pageDate": "Modified 2024-01-02 (meta)"
  },
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
    "name": "California State University San Marcos",
    "country": "United States",
    "state": "California",
    "ends": "Access ends 2 weeks after grades due",
    "course": "Students lose access to a course two weeks after grades are due, unless the instructor changed it: \"By default, you will have access to your current courses for two weeks after grades are due. At that point you will no longer have access.\" \"Keep in mind your instructor may have manually changed this time period to either be longer or shorter.\"",
    "account": "Not stated.",
    "sources": [
      "https://www.csusm.edu/iits/services/ats/idesign/canvas/canvasstudentfaq/index.html"
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
    "name": "California State University, Los Angeles",
    "country": "United States",
    "state": "California",
    "ends": "Read-only after grades are in",
    "course": "Once the semester is over and grades are in, courses turn read-only: \"In Canvas once the semester is finished and grades have been turned in, the course will go into past courses and become read only.\"",
    "account": "Not stated.",
    "sources": [
      "https://www.calstatela.edu/cetl/edtech/using-canvas-first-time"
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
    "name": "Fresno State",
    "country": "United States",
    "state": "California",
    "ends": "Read-only 1 week after grades due",
    "course": "Courses turn read-only a week after grades are due: \"Courses become read-only 1 week after grades are due.\"",
    "account": "Not stated.",
    "sources": [
      "https://academics.fresnostate.edu/canvas/timeline.html"
    ],
    "pageDate": "Last Updated Apr 8, 2026"
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
    "name": "San Diego State University",
    "country": "United States",
    "state": "California",
    "ends": "Login ends 1 year after graduation",
    "course": "Not stated.",
    "account": "Your SDSUid and its data are deleted a year after graduation (90 days for others who leave); the page lists Canvas among the services the SDSUid opens but does not say Canvas ends: \"Students who are graduating, your SDSUid, M365 account, SDSU Google Workspace, and all associated data will be deleted one year from graduation.\" \"For all others (including credential/certificate programs) 90 days after the final day of the last enrolled semester.\"",
    "sources": [
      "https://it.sdsu.edu/get-help/topics/sdsuid"
    ],
    "pageDate": "Last Updated 6/5/26"
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
    "name": "Santa Clara University",
    "country": "United States",
    "state": "California",
    "ends": "Camino ends shortly after graduation",
    "course": "Not stated.",
    "account": "Camino, SCU's name for Canvas, is switched off shortly after graduation: \"Other services for students will also be discontinued shortly after graduation. This includes Camino, Duo, eduroam, LinkedIn Learning, Microsoft 365, Qualtrics, SmartPrint, and Xfinity on Campus.\" The same page calls it \"Camino (Canvas Learning Management System)\".",
    "sources": [
      "https://www.scu.edu/technology/get-connected/logins--accounts/"
    ],
    "pageDate": "Not shown"
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
    "name": "Metropolitan State University of Denver",
    "country": "United States",
    "state": "Colorado",
    "ends": "Login ends after three semesters",
    "course": "Not stated.",
    "account": "Canvas is not named in this policy, but the student account stays until three semesters without a course: \"Student accounts will be active while the student is actively enrolled and will remain active until the student has not completed a course for three consecutive semesters.\"",
    "sources": [
      "https://www.msudenver.edu/wp-content/uploads/2022/05/User_Account_Management_Policy_20220401.pdf",
      "https://www.msudenver.edu/policy/user-accounts/",
      "https://webapp.msudenver.edu/smc/ebird/temp.msudenver.edu/early-bird/2020/7/20-canvas.html"
    ],
    "pageDate": "Effective April 1, 2022 (PDF)"
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
    "name": "University of Northern Colorado",
    "country": "United States",
    "state": "Colorado",
    "ends": "Login ends about two semesters later",
    "course": "Courses stay view-only after the term: \"At the end of a term, you will retain view-only access to each of your courses indefinitely.\" \"Once a course concludes, participation is restricted automatically.\"",
    "account": "You keep access for about two semesters after you leave: \"If you choose to leave the University, become in-active, or graduate you will retain access for approximately two semesters after your last class registration.\" The student account is your Canvas login: \"Your UNC student account is your personal login for accessing most university services—including MyUNC, Canvas, and BearMail.\"",
    "sources": [
      "https://www.unco.edu/information-management-technology/services/online-learning-classrooms/canvas/",
      "https://www.unco.edu/information-management-technology/services/user-accounts-access/"
    ],
    "pageDate": "Not shown"
  },
  {
    "name": "Quinnipiac University",
    "country": "United States",
    "state": "Connecticut",
    "ends": "Read-only one year after term",
    "course": "IT keeps courses open for a year after the semester, then they turn read-only: \"continues until one year after the end of the semester.\" \"Students are permitted to participate throughout this entire window, and outside of these dates, they can access the course in a read-only mode.\"",
    "account": "Not stated.",
    "sources": [
      "https://qilt.qu.edu/knowledge-resources-learnings-posts/courses-can-i-change-the-participation-dates-of-my-course-in-canvas-for-faculty-staff"
    ],
    "pageDate": "Updated May 18, 2026"
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
    "name": "George Washington University Law School",
    "country": "United States",
    "state": "District of Columbia",
    "ends": "Read-only after term ends",
    "course": "The Law Library's Canvas guide says courses turn read-only when the term ends: \"Students and instructors are only able to interact with a course while the term is active; once the term ends, the Canvas course sites for that term enter a read only mode.\"",
    "account": "Not stated.",
    "sources": [
      "https://law.gwu.libguides.com/canvasguide/AllCourses"
    ],
    "pageDate": "Last Updated: Sep 23, 2026"
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
    "name": "Florida Atlantic University",
    "country": "United States",
    "state": "Florida",
    "ends": "Concluded two weeks after semester",
    "course": "Courses conclude two weeks after the semester and students lose access unless the instructor keeps it open: \"A course concludes two weeks after the end of the semester\". \"Students do not maintain access to the course in its read-only state.\" \"Concluded/Past courses do not appear on a student's All Courses list unless their instructor has enabled/requested the above options.\"",
    "account": "Not stated.",
    "sources": [
      "https://www.fau.edu/canvas/policies-procedures/"
    ],
    "pageDate": "Not shown"
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
    "name": "University of North Florida",
    "country": "United States",
    "state": "Florida",
    "ends": "Closed two weeks after semester",
    "course": "Since the end of Fall 2025, courses close to students two weeks after the semester: \"Under this policy, all term-based Canvas courses conclude two weeks after the end of each semester.\" \"Concluded courses are closed to student participation, marked with “(Archived)”, and moved to Past Enrollments.\"",
    "account": "Not stated.",
    "sources": [
      "https://cirt.domains.unf.edu/archives/45447"
    ],
    "pageDate": "Published 15 Dec 2025"
  },
  {
    "name": "Emory University",
    "country": "United States",
    "state": "Georgia",
    "ends": "Deleted after four years",
    "course": "Courses turn read-only for students soon after the semester and are deleted four years after they were created: \"By default, courses will become read-only for students shortly after a semester concludes.\" \"Canvas courses will remain in Canvas for four years from the date of creation.\" \"Regardless of course end dates, after four years Canvas courses will be permanently deleted.\"",
    "account": "Not stated.",
    "sources": [
      "https://canvas-support.emory.edu/reference/course-retention.html"
    ],
    "pageDate": "Not shown (sitemap lastmod 2026-07-13 for every page)"
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
    "name": "Ball State University",
    "country": "United States",
    "state": "Indiana",
    "ends": "Read-only for 3 years after term",
    "course": "Courses conclude at the end of the term and stay read-only for three years: \"In Canvas, courses conclude at the end of a term.\" \"Students can only view these past enrollment courses as ready-only.\" \"A concluded course remains accessible in Canvas, in a read-only state, for students and Faculty for 3 years.\"",
    "account": "Not stated.",
    "sources": [
      "https://www.bsu.edu/about/administrativeoffices/online-and-strategic-learning/canvas-at-ball-state/course-types-and-descriptions"
    ],
    "pageDate": "Not shown"
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
    "name": "Morgan State University",
    "country": "United States",
    "state": "Maryland",
    "ends": "2 years after graduation",
    "course": "Past courses stay viewable unless the instructor has concluded them: \"As long as the instructor has not concluded a course, you can access it\".",
    "account": "The student account, and Canvas with it, is purged two years after Commencement: \"After 2 years from the date of Commencement (or your last enrollment date), your current University student email account will be purged in accordance with our procedures.\" and \"This means you will not be able to access university resources such as WebSIS, Canvas, Google Apps (e.g., Gmail, Calendar, Google Drive), etc. once your account is purged.\"",
    "sources": [
      "https://www.morgan.edu/alumniemail",
      "https://www.morgan.edu/canvas4students"
    ],
    "pageDate": "Not shown"
  },
  {
    "name": "Salisbury University",
    "country": "United States",
    "state": "Maryland",
    "ends": "Access ends 2 weeks after term",
    "course": "Course dates give students access until two weeks after the semester ends: \"Course dates are set up for students to access courses one week prior to the semester start date to two weeks after the end of the semester.\"",
    "account": "Not stated.",
    "sources": [
      "https://www.salisbury.edu/administration/academic-affairs/instructional-design-delivery/cms/faculty-support/faqs-instructor.aspx",
      "https://www.salisbury.edu/administration/academic-affairs/instructional-design-delivery/cms/index.aspx"
    ],
    "pageDate": "Not shown"
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
    "name": "Boston College",
    "country": "United States",
    "state": "Massachusetts",
    "ends": "Login ends about 6 months later",
    "course": "Not stated.",
    "account": "BC lists end dates per graduating class; for May 2026 graduates the Agora login portal ends in late November. Canvas isn't named in the table: \"Once your BC account has expired, no recovery is possible through BC.\" \"Agora Portal November 28, 2026\"",
    "sources": [
      "https://www.bc.edu/content/bc-web/offices/its/sites/leaving-bc.html",
      "https://www.bc.edu/content/bc-web/sites/accessibility/technology-accessibility/canvas.html"
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
    "name": "University of Massachusetts Boston",
    "country": "United States",
    "state": "Massachusetts",
    "ends": "Login ends 2 years after graduation",
    "course": "Not stated.",
    "account": "The UMass Boston email account is deleted two years after graduation; Canvas isn't named on that page: \"All students keep their UMass Boston email account for two years after graduation, at which point it will be deleted.\"",
    "sources": [
      "https://www.umb.edu/it/software-systems/alumni/",
      "https://www.umb.edu/canvas/"
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
    "name": "Grand Rapids Community College",
    "country": "United States",
    "state": "Michigan",
    "ends": "Read-only, kept up to 2 years",
    "course": "Courses turn read-only at their end date and stay in Canvas for up to two years: \"When a course reaches its end date, Canvas automatically updates all enrollments to Completed / Concluded, and the course is placed in a read-only state.\" \"Courses remain available in Canvas for up to 2 years.\"",
    "account": "Not stated.",
    "sources": [
      "https://supportdesk.grcc.edu/TDClient/53/Portal/KB/ArticleDet?ID=4983"
    ],
    "pageDate": "Modified 2026-08-14 (meta)"
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
    "name": "University of St. Thomas",
    "country": "United States",
    "state": "Minnesota",
    "ends": "Read-only after end date",
    "course": "Courses turn read-only for students at the course end date and are archived a few weeks after the term: \"Once a course has reached its end date it becomes read-only for students; once the term has concluded it becomes read-only for faculty.\"",
    "account": "Not stated.",
    "sources": [
      "https://services.stthomas.edu/TDClient/1898/ClientPortal/KB/ArticleDet?ID=142120"
    ],
    "pageDate": "Modified 2026-09-28 (meta)"
  },
  {
    "name": "Missouri University of Science and Technology",
    "country": "United States",
    "state": "Missouri",
    "ends": "Login ends after 12 months",
    "course": "Not stated.",
    "account": "Canvas is not named on this UM System email procedures page, but student accounts are locked a year after the last term: \"Student accounts will be locked 12 months from the end of the last term enrolled.\" \"Locked accounts will have all content deleted 21 days after the lock date.\"",
    "sources": [
      "https://www.umsystem.edu/ums/is/electronic-mail-use-and-management-procedures",
      "https://canvas.mst.edu/"
    ],
    "pageDate": "Not shown"
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
    "name": "University of Missouri-Kansas City",
    "country": "United States",
    "state": "Missouri",
    "ends": "Login ends after 12 months",
    "course": "Not stated.",
    "account": "The UM System locks student accounts a year after the last term: \"Student accounts will be locked 12 months from the end of the last term enrolled.\" \"Locked accounts will have all content deleted 21 days after the lock date.\" Canvas isn't named there, but UMKC uses the same login for it: \"Your UMKC Username and password are used for Canvas, e-mail, and many other services.\"",
    "sources": [
      "https://www.umkc.edu/is/resources/quickstartguide.html",
      "https://www.umsystem.edu/ums/is/electronic-mail-use-and-management-procedures"
    ],
    "pageDate": "Not shown"
  },
  {
    "name": "University of Missouri-St. Louis",
    "country": "United States",
    "state": "Missouri",
    "ends": "Login ends after 12 months",
    "course": "Not stated.",
    "account": "Canvas is not named on this UM System email procedures page, but student accounts are locked a year after the last term: \"Student accounts will be locked 12 months from the end of the last term enrolled.\" \"Locked accounts will have all content deleted 21 days after the lock date.\"",
    "sources": [
      "https://www.umsystem.edu/ums/is/electronic-mail-use-and-management-procedures",
      "https://www.umsl.edu/technology/student-technology-guide/index.html"
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
    "name": "University of Montana",
    "country": "United States",
    "state": "Montana",
    "ends": "View-only after grade deadline",
    "course": "Courses conclude when final grades are due and then become view-only: \"By default, courses are set to conclude on the last day grades can be entered in GrizPortal at 11:59 PM.\" \"After courses are concluded, they move off the Canvas Dashboard into Courses > Past Enrollments.\" \"Students can perform the following actions by default within a concluded course: view grades, view course content, view Discussions and Assignments, and send a message to the instructor.\"",
    "account": "Not stated.",
    "sources": [
      "https://www.umt.edu/canvas/tip-sheets/files/concluding-a-course.pdf"
    ],
    "pageDate": "PDF created 29 Sep 2026 (metadata)"
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
    "name": "Montclair State University",
    "country": "United States",
    "state": "New Jersey",
    "ends": "Read-only after grade-change deadline",
    "course": "Courses turn read-only once the incomplete-grade deadline passes, unless the instructor sets course dates: \"Courses by default become read only after the deadline for incomplete grade change passes.\"",
    "account": "Not stated.",
    "sources": [
      "https://inside.montclair.edu/resources/canvas/canvas-administration"
    ],
    "pageDate": "Not shown"
  },
  {
    "name": "New Jersey Institute of Technology",
    "country": "United States",
    "state": "New Jersey",
    "ends": "Kept while you renew your password",
    "course": "Not stated.",
    "account": "Alumni keep Canvas as long as they keep their UCID password current: \"Can I still access my notes and homework information in Canvas after I graduate? Canvas can still be accessed, as long as you keep your UCID and password current.\" \"If you do not update your UCID password when prompted, your NJIT account will be deactivated, resulting in a loss of access to NJIT computing services and alumni email forwarding to your personal email address.\"",
    "sources": [
      "https://ist.njit.edu/transition-alumni-google-workspace-and-email"
    ],
    "pageDate": "Not shown"
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
    "name": "Stevens Institute of Technology",
    "country": "United States",
    "state": "New Jersey",
    "ends": "90 days after graduation",
    "course": "Not stated.",
    "account": "Student accounts switch to alumni accounts 90 days after graduation, and alumni lose Canvas: \"the Division of Information Technology will start automatic student de-provisioning 90 days after graduation.\" \"However, with this profile, alumni will no longer have access to student-facing applications within myStevens including all Microsoft 365 applications, Google Drive, Zoom, Canvas, Google apps, and others.\"",
    "sources": [
      "https://www.stevens.edu/it/governance-policy-standards/alumni-accounts-and-email-forwarding"
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
    "name": "Duke University",
    "country": "United States",
    "state": "North Carolina",
    "ends": "Read-only 21 days after term",
    "course": "Official course sites turn read-only three weeks after the term ends: \"Sites associated with an official course listed in DukeHub/DKU Hub will go into a concluded state 21 days after the official end of the term.\" \"A concluded state means that the site turns into read-only for all users enrolled in the site (including instructors).\" \"Concluded sites are removed from users’ dashboards but remain accessible via the Courses > All courses link.\"",
    "account": "Not stated.",
    "sources": [
      "https://go.canvas.duke.edu/instructors/using-canvas/end-term-site-behavior/"
    ],
    "pageDate": "Modified 2024-07-25 (meta)"
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
    "name": "University of North Carolina at Charlotte",
    "country": "United States",
    "state": "North Carolina",
    "ends": "Login ends 365 days after graduation",
    "course": "Not stated.",
    "account": "Your NinerNET login expires a year after graduating; the page does not name Canvas: \"Account expires 365 days after graduation\". Students who stop enrolling lose it sooner: \"Typically, accounts expire after two sequential semesters of no registration, or if student applies for specific term and does not register for classes.\"",
    "sources": [
      "https://services.help.charlotte.edu/TDClient/33/Portal/KB/ArticleDet?ID=534",
      "https://teaching.charlotte.edu/academic-technologies/canvas/"
    ],
    "pageDate": "Not shown"
  },
  {
    "name": "University of North Carolina Wilmington",
    "country": "United States",
    "state": "North Carolina",
    "ends": "Courses deleted after five years",
    "course": "Courses are deleted twice a year once they are five years old: \"This is part of our biannual cycle to manage data storage, where we remove academic courses that have been in the system for five years.\" \"As part of our regular maintenance plan, we will delete Summer and Fall 2021 courses in Canvas on Oct. 27.\"",
    "account": "Not stated.",
    "sources": [
      "https://uncw.edu/news/business-affairs/its/2026/09/summer-fall-2021-canvas-courses-deleted-oct-27.html",
      "https://www.uncw.edu/seahawk-life/services/technology/support/services/canvas"
    ],
    "pageDate": "September 18, 2026"
  },
  {
    "name": "Wake Forest University",
    "country": "United States",
    "state": "North Carolina",
    "ends": "Read-only after term ends",
    "course": "Courses turn read-only when the Canvas term ends, one to two weeks after grades are due: \"Canvas terms are set by the University to end 1-2 weeks after grades are due to the Registrar’s Office.\" \"When the Canvas term ends, courses move from the Dashboard to the Past Enrollments section of the All Courses page.\" \"When a course is in Past Enrollments, it is in a Read-Only mode.\"",
    "account": "Not stated.",
    "sources": [
      "https://canvas.wfu.edu/2021/01/canvas-courses-past-enrollments-and-end-dates/"
    ],
    "pageDate": "Modified 2023-11-14 (meta)"
  },
  {
    "name": "Case Western Reserve University",
    "country": "United States",
    "state": "Ohio",
    "ends": "180 days after graduation",
    "course": "Not stated.",
    "account": "Graduates keep Canvas for 180 days after their degree is conferred: \"You will have access to Canvas account for 180 days after your conferral date.\"",
    "sources": [
      "https://case.edu/utech/resources/student-resources/graduating-students-utech-access",
      "https://case.edu/utech/help/knowledge-base/canvas/canvas-information"
    ],
    "pageDate": "Updated 2026-10-22 (meta)"
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
    "name": "Rice University",
    "country": "United States",
    "state": "Texas",
    "ends": "Canvas ends 1 year after graduation",
    "course": "Not stated.",
    "account": "Student accounts stay active for a year after graduation, then lose Canvas: \"Student accounts remain active for one year following graduation. After the one-year period, student accounts become inactive.\" Then \"Once students become inactive, they will no longer have access to the following resources:\", which lists \"Campus systems such as Canvas and library journals\".",
    "sources": [
      "https://kb.rice.edu/64781"
    ],
    "pageDate": "Updated: 2026-06-12 (page)"
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
    "name": "Texas Tech University",
    "country": "United States",
    "state": "Texas",
    "ends": "Read-only after end date",
    "course": "When a course's end date passes it concludes and turns read-only: \"Once the course end date passes Canvas will: Conclude the course, shifting it into a Read Only status. Move the course from the Dashboard to the 'Past Enrollments' area of the Courses page.\"",
    "account": "Not stated.",
    "sources": [
      "https://www.depts.ttu.edu/online/canvas/raidercanvas-course-access-dates.php"
    ],
    "pageDate": "Mar 31, 2026 (footer timestamp)"
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
    "name": "University of Texas at Dallas",
    "country": "United States",
    "state": "Texas",
    "ends": "Courses kept for two years",
    "course": "UT Dallas keeps courses for two years: \"By policy, UTD retains courses in the LMS for two years.\" It moved from Blackboard to Canvas for Fall 2026: \"All academic courses will be offered through the Canvas LMS beginning with the Fall 2026 semester.\"",
    "account": "Not stated.",
    "sources": [
      "https://ets.utdallas.edu/elearning-services/canvas-migration/"
    ],
    "pageDate": "Not shown"
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
    "name": "University of Virginia",
    "country": "United States",
    "state": "Virginia",
    "ends": "6 months after graduation",
    "course": "Each past term gets an end date 90 days after UVA's term ends; the course then moves to Past Enrollments and turns read-only: \"As of December 2025, each previous term in Canvas will have an end date set 90 days after UVA's term end date.\" A past course \"cannot be edited\".",
    "account": "Graduates keep UVACanvas for a six-month grace period: \"individuals who have left UVA lose access to UVACanvas after their grace period. For students who graduated, the grace period is 6 months.\" After that: \"If someone who has left UVA attempts to log into UVACanvas after their grace period expires, they will get an error message indicating that they do not have an account.\"",
    "sources": [
      "https://lts-help.its.virginia.edu/m/essential-tips/l/1931208-what-are-the-important-policies-and-rules-for-uvacanvas-and-uvacanvas-connect"
    ],
    "pageDate": "Last Updated Sep 10, 2026 (shown on page; may belong to the sidebar article list)"
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
    "name": "Central Washington University",
    "country": "United States",
    "state": "Washington",
    "ends": "Read-only when grades are due",
    "course": "Courses turn read-only for students at midnight on the day grades are due: \"Courses conclude (become read-only) for students on the day grades are due at 11:59pm.\"",
    "account": "Not stated.",
    "sources": [
      "https://www.cwu.edu/academics/academic-resources/multimodal-learning/faculty-resources/canvas-help-support/canvas-procedure.pdf"
    ],
    "pageDate": "Updated 2025.02.18"
  },
  {
    "name": "Seattle University",
    "country": "United States",
    "state": "Washington",
    "ends": "Read-only after term ends",
    "course": "Courses turn read-only for students when the term ends: \"Once a term ends, courses go into ‘read only’ mode for students\".",
    "account": "Not stated.",
    "sources": [
      "https://www.seattleu.edu/canvas-help/faculty/canvas/faq/"
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
    "name": "Washington State University",
    "country": "United States",
    "state": "Washington",
    "ends": "Courses deleted after 5 years",
    "course": "Course content is kept five years after the fiscal year it was taught, then permanently removed: \"Canvas course content is retained for five years after the end of the fiscal year in which the course was taught.\" \"Once Canvas course content is removed as part of university record disposal requirements, it cannot be recovered.\"",
    "account": "Not stated.",
    "sources": [
      "https://its.wsu.edu/2026/01/22/canvas-course-content-removal-7-1/"
    ],
    "pageDate": "January 22, 2026"
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
    "name": "University of Wisconsin-Milwaukee",
    "country": "United States",
    "state": "Wisconsin",
    "ends": "Read-only after end date",
    "course": "Once the term, course and section end dates have passed, the course turns read-only: \"When the term, course, and section have all reached their respective end dates, all course enrollments are automatically set to Concluded. This makes the course read-only for Teachers and Students, and teachers will be unable to add new users.\"",
    "account": "Not stated.",
    "sources": [
      "https://kb.uwm.edu/cetl/91181",
      "https://uwm.edu/canvas/canvas-for-students/"
    ],
    "pageDate": "Updated 2025-08-11"
  },
  {
    "name": "University of Wisconsin-Stout",
    "country": "United States",
    "state": "Wisconsin",
    "ends": "Read-only after end date",
    "course": "Once the term, course and section end dates have passed, the course turns read-only: \"When the term, course, and section have all reached their respective end dates, all course enrollments are automatically set to Concluded. This makes the course read-only for Teachers and Students, and teachers will be unable to add new users.\" \"Students with a concluded status can access the course but cannot submit any material.\"",
    "account": "Not stated.",
    "sources": [
      "https://kb.uwstout.edu/91181",
      "https://kb.uwstout.edu/90087"
    ],
    "pageDate": "Updated 2025-08-11"
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
    "name": "Artevelde University of Applied Sciences",
    "country": "Belgium",
    "ends": "Login ends 1 Dec the next year",
    "course": "Not stated.",
    "account": "The Artevelde login is switched off in December of the next academic year; the privacy policy doesn't name Canvas: \"Your student account will be deactivated on 1 December of the following academic year after your deregistration or graduation.\" The Canvas login page says this account gives access to \"all our platforms, including Canvas.\"",
    "sources": [
      "https://www.arteveldehogeschool.be/en/privacy-policy",
      "https://canvaslogin.arteveldehogeschool.be/"
    ],
    "pageDate": "Not shown"
  },
  {
    "name": "Vrije Universiteit Brussel (VUB)",
    "country": "Belgium",
    "ends": "Login ends 31 Oct the next year",
    "course": "Not stated.",
    "account": "The VUB login, which is how students sign in to Canvas, is deleted in the autumn after graduating; Canvas isn't named on that page: \"After you graduate, your VUB account will be deleted automatically on 31 October of the subsequent academic year.\"",
    "sources": [
      "https://www.vub.be/en/studying-vub/practical-info-for-students/graduating-vub",
      "https://www.vub.be/en/canvas"
    ],
    "pageDate": "Modified 5 Nov 2025 (page metadata)"
  },
  {
    "name": "Ontario Tech University",
    "country": "Canada",
    "ends": "Courses close 120 days after end",
    "course": "Students lose concluded courses 120 days after the course ends (Teaching and Learning Centre Canvas FAQ): \"For students, access to concluded courses expires 120 days after the course ends.\" The reason given: \"Due to record retention requirements and storage requirements at the university, students will not be able to access Canvas courses after 120 days have past since the end of the course.\"",
    "account": "Not stated.",
    "sources": [
      "https://tlc.ontariotechu.ca/instructional-support/canvas/faqs.php",
      "https://ontariotechu.ca/canvas"
    ],
    "pageDate": "Not shown"
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
    "name": "University of Alberta",
    "country": "Canada",
    "ends": "Login cut back after graduating",
    "course": "Not stated.",
    "account": "After graduating, the account is cut back to Bear Tracks and Gmail; the page doesn't name Canvas: \"If you graduated with a degree from U of A, your existing U of A account will be reduced after your status is transitioned to Alumni.\" and \"At that time, you will have access to Bear Tracks and Gmail (with 100 MB of email storage) but will no longer have access to other Google apps\". Diploma and certificate graduates: \"If you graduate with a diploma or certificate, your account will transition to Bear Tracks and Gmail (with 100 MB of email storage) after the last day of the term.\"",
    "sources": [
      "https://www.ualberta.ca/en/information-services-and-technology/services/ccid-passwords/changes-to-u-of-a-accounts.html",
      "https://www.ualberta.ca/en/centre-for-teaching-and-learning/canvas-supports/index.html"
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
    "name": "Duke Kunshan University",
    "country": "China",
    "ends": "Read-only 21 days after term",
    "course": "Courses conclude three weeks after term: \"Sites associated with an official course listed in DukeHub/DKU Hub will go into a concluded state 21 days after the official end of the term.\" and \"A concluded state means that the site turns into read-only for all users enrolled in the site (including instructors).\" \"Concluded sites are removed from users’ dashboards but remain accessible via the Courses > All courses link.\"",
    "account": "Not stated.",
    "sources": [
      "https://ctl.dukekunshan.edu.cn/archives/canvas/faq"
    ],
    "pageDate": "Not shown"
  },
  {
    "name": "University of Copenhagen (Absalon = Canvas)",
    "country": "Denmark",
    "ends": "Read-only after term, archived",
    "course": "Faculty of Theology page: \"Gamle kursusrum på Absalon bliver automatisk arkiveret og fremgår ikke længere af din kursusoversigt.\" (old Absalon course rooms are archived automatically and no longer show in your course list) \"Forårskurser arkiveres 1. november / Efterårskurser arkiveres 1. juli.\" (spring courses are archived on 1 November, autumn courses on 1 July). KU's Absalon guide: \"Terms make it possible to end course rooms in a softer manner (“soft concluding”), so that users remain in the room and maintain a read-only access to the material.\"",
    "account": "Not stated.",
    "sources": [
      "https://teol.ku.dk/uddannelser/master-som-fleksibelt-forloeb/",
      "https://obl.ku.dk/ku-absalon/terms/",
      "https://science.ku.dk/teachinglearning/absalon/"
    ],
    "pageDate": "Not shown"
  },
  {
    "name": "Hong Kong University of Science and Technology (HKUST)",
    "country": "Hong Kong",
    "ends": "Read-only 6 weeks after term",
    "course": "Courses turn read-only at the Canvas term end date, six weeks after the official term: \"Term End Date 6 weeks after HKUST's official term end date\" and \"When a course reaches the course end date, the course will be completed and become concluded.\" Then \"the course is archived in a read-only state. Students may be restricted from viewing concluded courses.\" The student FAQ: \"After the course end date, the online content including the discussion forum will become read-only. You will be able to view the content that the instructor has published but you will not be able to participate in any way.\"",
    "account": "Student account ends four months after finishing; that page lists Canvas among the account's services: \"A student’s HKUST account will be terminated upon leaving the University.\" and \"Upon successful completion of the study, a four-month grace period will be granted to transition from a Student Account to an Alumni Account.\" The account is \"your key to university online services, including Wi-Fi, Canvas - LMS, etc.\" It does not say whether an Alumni Account keeps Canvas. \"Students are urged to back up or transfer files before termination.\"",
    "sources": [
      "https://cei.hkust.edu.hk/en-hk/elearning-platform-and-tools/faqs-instructors-tas",
      "https://cei.hkust.edu.hk/en-hk/alh-and-edtech/faqs-students",
      "https://itso.hkust.edu.hk/services/general-it-services/user-account/student/student-account"
    ],
    "pageDate": "Not shown"
  },
  {
    "name": "University College Cork",
    "country": "Ireland",
    "ends": "12 months after registration ends",
    "course": "Modules turn read-only after the academic year and are kept for five years: \"Modules will be made read-only following the end of academic year (using block code data from ITS). Modules will be retained online for 5 years.\"",
    "account": "Graduates keep a Canvas login for a year: \"Students will retain a login to Canvas for 12 months following end of registration, this will allow recent graduates to continue to access former learning materials and submissions.\" Also: \"They retain read-only access to former modules (subject to module availability).\" On leaving early: \"Students who withdraw from UCC will have their accounts and access to modules deleted.\"",
    "sources": [
      "https://www.ucc.ie/en/academicgov/policies/learning-policies/learning-platforms-data-retention-and-access/"
    ],
    "pageDate": "Updated 9 January 2026"
  },
  {
    "name": "University of Galway",
    "country": "Ireland",
    "ends": "180 days after course end",
    "course": "Not stated.",
    "account": "Accounts close 180 days after the official course end date (350 for PhD students), and Canvas goes with them: \"Student accounts in these categories will be disabled 180 days after the official course end date, typically 31st August of the final registered academic year.\" \"PhD student accounts will be disabled 350 days after the official course end date\"; \"After this grace period, students leaving University of Galway will lose access to: Canvas\".",
    "sources": [
      "https://www.universityofgalway.ie/information-solutions-services/services-for-students/campusaccount/graduatingstudents/",
      "https://www.universityofgalway.ie/information-solutions-services/services-for-students/canvas/"
    ],
    "pageDate": "Not shown"
  },
  {
    "name": "Keio University (K-LMS = Canvas)",
    "country": "Japan",
    "ends": "keio.jp apps end on leaving",
    "course": "Not stated.",
    "account": "On graduating, all keio.jp applications except Keio Mail stop: \"卒業・修了または後期博士課程の所定単位取得退学で義塾を離籍される皆様は、2026年9月19日(土)午前9時以降順次、keio.jpポータルおよび慶應メールを除くkeio.jpのすべてのアプリケーションが利用できなくなります。\" (those leaving Keio by graduating or completing their programme lose, from 9:00 on 19 Sep 2026, all keio.jp applications except the keio.jp portal and Keio Mail). The general rule: \"離籍後に使えなくなるもの 慶應メール(Google Workspace（旧 G Suite）の連絡先含む)を除くkeio.jpの全てのアプリケーション\" (unavailable after leaving: every keio.jp application except Keio Mail). Canvas is not named on those pages; Keio's keio.jp application list includes \"7-1-1. 授業で利用するシステム（「CanvasLMS」）\" (the system used in classes, CanvasLMS).",
    "sources": [
      "https://www.itc.keio.ac.jp/ja/news_keiojp_grad202609.html",
      "https://www.itc.keio.ac.jp/ja/keiojp_withdraw.html",
      "https://www.itc.keio.ac.jp/ja/keiojp_manual_application.html",
      "https://www.itc.keio.ac.jp/ja/keiojp_edu2.html"
    ],
    "pageDate": "最終更新日: 2026年7月23日; 最終更新日: 2026年7月16日"
  },
  {
    "name": "Eindhoven University of Technology (TU/e)",
    "country": "Netherlands",
    "ends": "Login ends 42 days after leaving",
    "course": "Not stated.",
    "account": "The TU/e login ends 42 days after enrolment ends unless you join the alumni portal; Canvas isn't named on that page: \"If you do not sign up to the TU/e Alumni Portal, your TU/e account will expire 42 days after the date of termination of enrollment, and you will therefore no longer have access to your TU/e email address or the files saved in your TU/e account.\"",
    "sources": [
      "https://educationguide.tue.nl/practical-info/student-administration/termination-of-enrollment/termination-of-enrollment-upon-graduation/what-do-i-need-to-consider-when-i-want-to-terminate-my-enrollment",
      "https://educationguide.tue.nl/programs/graduate-school/masters-programs/computer-science-and-engineering/graduation/administrative-process"
    ],
    "pageDate": "Not shown"
  },
  {
    "name": "Erasmus University Rotterdam",
    "country": "Netherlands",
    "ends": "Login ends within 2 months of leaving",
    "course": "Not stated.",
    "account": "The ERNA login ends when you deregister; Canvas isn't named on these pages: \"If you deregister, your ERNA account will be deactivated, and you will no longer have access to educational information and your e-mail.\" The graduation leaflet (PDF) gives a grace period: \"Je ERNA account wordt binnen twee maanden na je uitschrijving gedeactiveerd.\" (your ERNA account is deactivated within two months of deregistering) and \"Het is niet mogelijk om je account langer te blijven gebruiken.\" (you can't keep using the account longer).",
    "sources": [
      "https://www.eur.nl/en/education/practical-matters/registration/terminating-enrolment",
      "https://www.eur.nl/media/121917",
      "https://www.eur.nl/en/news/introduction-canvas"
    ],
    "pageDate": "Not shown"
  },
  {
    "name": "Maastricht University",
    "country": "Netherlands",
    "ends": "Read-only from November, 2 years on",
    "course": "Courses close about two years after their academic year: \"The end date is set for November, 2 years after the end of the academic year.\" Then \"After the end date, the course will change to “Concluded,” which means it is read-only for students and teachers.\"",
    "account": "Not stated.",
    "sources": [
      "https://library.maastrichtuniversity.nl/apps-tools/canvas-support/canvas-faq/"
    ],
    "pageDate": "Modified 17 Jul 2026 (page metadata)"
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
  },
  {
    "name": "University of Twente",
    "country": "Netherlands",
    "ends": "4 weeks after enrolment ends",
    "course": "Old courses stay readable: \"Courses are moved automatically to 'Past enrollments' two years after the end of the quartile. However, they are still accessible (read-only).\"",
    "account": "Canvas ends with the UT login, about four weeks after enrolment stops: \"Canvas is accessible as long as your ICT account is active.\" The account page: \"Student accounts are automatically deactivated four weeks after student enrolment has stopped\" (that page doesn't name Canvas). The staff page adds: \"This means that a student account will be permanently deleted from the Canvas database three years after leaving UT.\"",
    "sources": [
      "https://www.utwente.nl/en/educational-systems/student-applications/canvas-student/",
      "https://www.utwente.nl/en/service-portal/educational-support/educational-systems/canvas",
      "https://www.utwente.nl/en/service-portal/workplace-support/accounts-passwords/ut-account-incl.-activation-password-change"
    ],
    "pageDate": "Last update 14 Aug 2026 (student Canvas page); others Not shown"
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
    "name": "University of Auckland",
    "country": "New Zealand",
    "ends": "Login ends 4 weeks after semester",
    "course": "Not stated.",
    "account": "Login ends 4 weeks after your last semester; the page covers the university's electronic services and does not name Canvas: \"Electronic access will begin 4 weeks prior to your class start date and will end 4 weeks after the semester or quarter end date.\" Students enrolled in back-to-back terms keep it: \"For students with an active enrolment in consecutive semesters or quarters, access will be continuous.\" Doctoral candidates: \"Access will end 2 years after the start date of your completion year.\"",
    "sources": [
      "https://www.auckland.ac.nz/en/about-us/about-the-university/identity-and-access-management/online-services-access/student-access.html",
      "https://www.auckland.ac.nz/en/students/digital-tools-support.html"
    ],
    "pageDate": "Not shown"
  },
  {
    "name": "University of Oslo",
    "country": "Norway",
    "ends": "Read-only after term, deleted after 5 years",
    "course": "Rooms lock shortly after the semester and are deleted five years later: \"After you finish a course its Canvas room will be locked (read-only) shortly after the semester ends.\" Lock dates: \"Fall semester courses: usually February 1st\", spring and summer usually September 1st. \"Course rooms where the semester ended at least five years ago are automatically deleted.\"",
    "account": "Staff guide: \"Merk at brukere mister tilgangen til sin Canvasbruker når de ikke lenger har en aktiv tilknytning til UiO\" (users lose access to their Canvas user when they no longer have an active affiliation with UiO) and \"Studenter regnes som inaktive 180 dager etter at de har avsluttet studiene\" (students count as inactive 180 days after finishing their studies). The student page adds: \"Usually you have access to your Canvas rooms until you finish your study program.\"",
    "sources": [
      "https://www.uio.no/english/services/it/education/canvas/help/student/access-after-semester.html",
      "https://www.uio.no/for-ansatte/arbeidsstotte/sta/canvas/veiledninger/fs-canvas/hva-gjor-integrasjonen.html"
    ],
    "pageDate": "Last modified Oct. 8, 2025; Sist endret 9. jan. 2023"
  },
  {
    "name": "De La Salle University (AnimoSpace = Canvas)",
    "country": "Philippines",
    "ends": "Concluded at end of term",
    "course": "Staff FAQ: courses conclude automatically at the end of term and are archived: \"Courses in AnimoSpace will be automatically concluded for teachers. Concluded courses will be archived.\" In them \"New submissions cannot be uploaded.\" \"Teachers can extend the course end date by changing the Course Settings.\"",
    "account": "Not stated.",
    "sources": [
      "https://old.dlsu.edu.ph/offices/asist/faqs/",
      "https://old.dlsu.edu.ph/offices/asist/animospace/"
    ],
    "pageDate": "Not shown"
  },
  {
    "name": "Karolinska Institutet",
    "country": "Sweden",
    "ends": "365 days after finishing",
    "course": "Not stated.",
    "account": "Canvas named: \"You will keep access to your student account – including student email, Canvas, Ladok and Microsoft 365 – for 365 days after you finish your studies.\" Then: \"Towards the end of this period, you will receive a notice to your student email address with information about when your account will be closed.\"",
    "sources": [
      "https://education.ki.se/student-at-ki/information-about-your-studies/checklist-for-when-leaving-karolinska-institutet"
    ],
    "pageDate": "Page updated 10-09-2026"
  },
  {
    "name": "KTH Royal Institute of Technology",
    "country": "Sweden",
    "ends": "Read-only 60 days after course end",
    "course": "Staff page: \"Course rooms are deactivated 60 days after the course end date.\" and \"The rooms will be in a read-only state, which means that students will not be able to upload materials and assignments.\" Students \"can still see their assignments, feedback, results and grades.\"",
    "account": "Not stated.",
    "sources": [
      "https://intra.kth.se/en/utbildning/systemstod/canvas/administration/rutin-for-gamla-kursrum-i-canvas-1.1092061"
    ],
    "pageDate": "Last changed: Jul 17, 2026"
  },
  {
    "name": "Lund University",
    "country": "Sweden",
    "ends": "Login ends 2 semesters after last registration",
    "course": "Not stated.",
    "account": "Canvas isn't named on the closing page; the student account page says Canvas is part of the account. \"You keep your student account for two semesters after your last registration in Ladok.\" After the closure notice: \"From the date you receive the notice, you will have 30 days to access the account. After that, the account is deactivated, and you will no longer be able to log in.\"",
    "sources": [
      "https://www.lunduniversity.lu.se/current-students/student-services-and-support/it-resources-and-assistance/student-account/closing-your-student-account",
      "https://www.lunduniversity.lu.se/current-students/new-students/your-student-account"
    ],
    "pageDate": "Last updated: 19 Jun 2025"
  },
  {
    "name": "Umeå University",
    "country": "Sweden",
    "ends": "Login ends 2 years after studies",
    "course": "Not stated.",
    "account": "Canvas isn't named in the after-studies section (the same page lists Canvas among the services the UMU ID gives access to): \"Your UMU ID will be deactivated when two years have passed after your studies.\" Then: \"When two years have passed after completing your studies, your UMU ID user account will be deactivated and you can no longer log in to access university resources\".",
    "sources": [
      "https://www.umu.se/en/student/help-and-support/it-services/umu-id/",
      "https://www.umu.se/en/student/help-and-support/it-services/"
    ],
    "pageDate": "Latest update: 2025-09-10"
  },
  {
    "name": "University of Gothenburg",
    "country": "Sweden",
    "ends": "Login ends 12 months after last course",
    "course": "Not stated.",
    "account": "Student account page, which says the account is used for Canvas: \"After your last course registration has ended, your student account is kept for 12 months. After that, it is deleted.\" and \"You use your student account to log in to the Student Portal, Canvas and Ladok and other university services.\"",
    "sources": [
      "https://studentportal.gu.se/en/digital-tools/student-account",
      "https://studentportal.gu.se/english/e-services/canvas-and-gul/"
    ],
    "pageDate": "Last modified 10 November 2025"
  },
  {
    "name": "Uppsala University (Studium = Canvas)",
    "country": "Sweden",
    "ends": "1 year after last registered semester",
    "course": "Not stated.",
    "account": "Studium is named: \"A student account is active one year after the last semester in which you are registered.\" and \"As before, you can access all services during that time in, for example, Ladok and Studium.\" The Studium login page: \"If you are a former student, it may be because your account is no longer active. In that case, you will no longer have access to Studium.\"",
    "sources": [
      "https://www.uu.se/en/students/it-for-students/student-account",
      "https://www.uu.se/en/students/it-for-students/services-for-students/studium/log-in-to-studium",
      "https://www.uu.se/en/students/it-for-students/services-for-students/studium"
    ],
    "pageDate": "Last modified: 2025-02-21"
  },
  {
    "name": "National Taiwan University (NTU COOL = Canvas)",
    "country": "Taiwan",
    "ends": "Courses deleted after 7 years",
    "course": "Since September 2025, course data older than seven years is deleted at the start of each semester: \"自 114 學年 (2025 年 9 月) 起，我們將開始執行「課程資料保存期限七年」之政策。\" (from academic year 114, September 2025, we start a policy of keeping course data for seven years) and \"NTU COOL 將在每個學期開始後(第一學期 9/1，第二學期 3/1) ， 刪除七年前的課程資料\" (after each semester starts, 1 Sep and 1 Mar, NTU COOL deletes course data from seven years earlier). Afterwards \"課程刪除後，使用者 (包括教師、助教、學生、旁聽生)則無法再進入讓課程網頁\" (once a course is deleted, users, including teachers, TAs, students and auditors, can no longer open the course page).",
    "account": "Graduates can no longer sign in with the campus account: \"畢業生無法計中帳號登入 NTU COOL\" (graduates can't log in to NTU COOL with their computing-center account). To back up course data they can apply to link an outside account: \"請填寫以下表單以進行校外帳號的綁定申請喔！\" (please fill in the form to apply to bind an outside account).",
    "sources": [
      "https://epaper.ntu.edu.tw/view.php?id=34801&listid=355",
      "https://www.aca.ntu.edu.tw/w/aca/CIMDNews_21090209504161705"
    ],
    "pageDate": "Not shown"
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
    "name": "Newcastle University",
    "country": "United Kingdom",
    "ends": "Read-only after 18 months",
    "course": "Courses stay open for 18 months, then turn read-only: \"Courses on Canvas remain open for 18 months from the 1st of September of the academic year they are part of. After this period, the course transitions to read-only mode, preventing further interaction but still allowing content to be viewed.\"",
    "account": "Login ends 7 months after completing; Canvas isn't named on that page: \"Students retain access to IT facilities, including OneDrive, email and filestore, for 7 months after the successful completion of their studies.\" On withdrawal, the account expires \"two months from the date the withdrawn date is processed by the School.\"",
    "sources": [
      "https://www.ncl.ac.uk/learning-and-teaching/digital-technologies/canvas/sections/",
      "https://services.ncl.ac.uk/itservice/core-services/account-admin/accountexpirystudents/"
    ],
    "pageDate": "Not shown"
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
    "name": "Swansea University",
    "country": "United Kingdom",
    "ends": "Login ends at course end date",
    "course": "Not stated.",
    "account": "The account closes when the course ends, not at graduation, with 28 days' notice: \"Your access to an IT account is determined by your course end date and not your graduation date.\" \"Account closure means you will lose access to all University systems, including your email, OneDrive account and Office subscriptions.\" \"Account Closure notifications are delivered to your University email address 28 days, 14 days and 1 day before the account closes.\" The checklist says: \"Save any course material and submissions from Canvas\".",
    "sources": [
      "https://hwb.swansea.ac.uk/it-services/account-enquiry/leaving-the-university/",
      "https://www.swansea.ac.uk/study/student-life/canvas/"
    ],
    "pageDate": "Not shown"
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
    "name": "University of Manchester",
    "country": "United Kingdom",
    "ends": "IT account closes on a set date",
    "course": "Not stated.",
    "account": "The IT account, and Canvas with it, closes on a fixed date after finishing (1 August 2026 for 2026 finalists): \"Your IT account will close on Saturday, 1 August 2026. This means that you will no longer have access to your documents, email or Canvas course materials.\" For 2026 masters leavers: \"On the Wednesday, 6 January 2027, your IT account will close.\"",
    "sources": [
      "https://studentnews.manchester.ac.uk/2026/06/02/finalist-checklist/",
      "https://studentnews.manchester.ac.uk/2026/08/18/leaving-university-after-your-masters-what-you-need-to-know-and-do/"
    ],
    "pageDate": "2026-06-02 and 2026-08-18"
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
  }
];

// Schools confirmed on Canvas (from their own Canvas help or login page) whose own pages gave no
// written rule when we looked. Listed so students can find their school and its Canvas help page.
export const ON_CANVAS: OnCanvas[] = [
  {
    "name": "Auburn University",
    "country": "United States",
    "state": "Alabama",
    "source": "https://biggio.auburn.edu/instructional-technology/index.php"
  },
  {
    "name": "Jacksonville State University",
    "country": "United States",
    "state": "Alabama",
    "source": "https://www.jsu.edu/online/canvas_access.html"
  },
  {
    "name": "University of Alabama at Birmingham",
    "country": "United States",
    "state": "Alabama",
    "source": "https://www.uab.edu/elearning/academic-technologies/canvas"
  },
  {
    "name": "University of North Alabama",
    "country": "United States",
    "state": "Alabama",
    "source": "https://www.una.edu/its/canvas/"
  },
  {
    "name": "University of South Alabama",
    "country": "United States",
    "state": "Alabama",
    "source": "https://www.southalabama.edu/departments/usaonline/canvasfaq.html"
  },
  {
    "name": "Arizona State University",
    "country": "United States",
    "state": "Arizona",
    "source": "https://ulc.asu.edu/help-center/faqs/"
  },
  {
    "name": "Arkansas State University",
    "country": "United States",
    "state": "Arkansas",
    "source": "https://kb.astate.edu/books/it-policies-procedures/page/32-canvas-live-course-access-instructional-support-procedure"
  },
  {
    "name": "NorthWest Arkansas Community College",
    "country": "United States",
    "state": "Arkansas",
    "source": "https://www.nwacc.edu/administrativeservices/informationtechnology-256255/helpdesk/index.html"
  },
  {
    "name": "California State University, East Bay",
    "country": "United States",
    "state": "California",
    "source": "https://www.csueastbay.edu/online/canvas-migration/index.html"
  },
  {
    "name": "California State University, Fullerton",
    "country": "United States",
    "state": "California",
    "source": "https://fullerton.instructure.com"
  },
  {
    "name": "California State University, Sacramento",
    "country": "United States",
    "state": "California",
    "source": "https://www.csus.edu/information-resources-technology/canvas/canvas-for-students.html"
  },
  {
    "name": "California State University, San Bernardino",
    "country": "United States",
    "state": "California",
    "source": "https://www.csusb.edu/canvas"
  },
  {
    "name": "Chapman University",
    "country": "United States",
    "state": "California",
    "source": "https://canvas.chapman.edu/login"
  },
  {
    "name": "De Anza College",
    "country": "United States",
    "state": "California",
    "source": "https://deanza.instructure.com/login"
  },
  {
    "name": "East Los Angeles College",
    "country": "United States",
    "state": "California",
    "source": "https://ilearn.laccd.edu/login"
  },
  {
    "name": "Mt. San Antonio College",
    "country": "United States",
    "state": "California",
    "source": "https://www.mtsac.edu/canvas/index.html"
  },
  {
    "name": "Pasadena City College",
    "country": "United States",
    "state": "California",
    "source": "https://pasadena.edu/academics/pcc-online/canvas-support.php"
  },
  {
    "name": "Santa Monica College",
    "country": "United States",
    "state": "California",
    "source": "https://www.smc.edu/academics/online-learning/canvas.php"
  },
  {
    "name": "Santa Rosa Junior College",
    "country": "United States",
    "state": "California",
    "source": "https://de.santarosa.edu/faculty-information"
  },
  {
    "name": "UC Merced",
    "country": "United States",
    "state": "California",
    "source": "https://catcourses.ucmerced.edu"
  },
  {
    "name": "UC Riverside",
    "country": "United States",
    "state": "California",
    "source": "https://its.ucr.edu/canvas"
  },
  {
    "name": "UC Santa Cruz",
    "country": "United States",
    "state": "California",
    "source": "https://its.ucsc.edu/canvas"
  },
  {
    "name": "American University",
    "country": "United States",
    "state": "District of Columbia",
    "source": "https://www.american.edu/library/canvas/"
  },
  {
    "name": "Howard University",
    "country": "United States",
    "state": "District of Columbia",
    "source": "https://technology.howard.edu"
  },
  {
    "name": "Florida A&M University",
    "country": "United States",
    "state": "Florida",
    "source": "https://www.famu.edu/administration/campus-services/instructional-technology/index.php"
  },
  {
    "name": "Florida Gulf Coast University",
    "country": "United States",
    "state": "Florida",
    "source": "https://www.fgcu.edu/canvas/"
  },
  {
    "name": "Florida International University",
    "country": "United States",
    "state": "Florida",
    "source": "https://canvas.fiu.edu/"
  },
  {
    "name": "Florida SouthWestern State College",
    "country": "United States",
    "state": "Florida",
    "source": "https://www.fsw.edu/canvas"
  },
  {
    "name": "Florida State College at Jacksonville",
    "country": "United States",
    "state": "Florida",
    "source": "https://www.fscj.edu/academics/online-learning"
  },
  {
    "name": "Hillsborough Community College",
    "country": "United States",
    "state": "Florida",
    "source": "https://www.hcfl.edu/academics/hc-online/canvas-student-resources"
  },
  {
    "name": "Miami Dade College",
    "country": "United States",
    "state": "Florida",
    "source": "https://faq.mdc.edu/knowledgebase/how-do-i-log-into-blackboard/"
  },
  {
    "name": "Palm Beach State College",
    "country": "United States",
    "state": "Florida",
    "source": "https://www.pbsc.edu/canvas/"
  },
  {
    "name": "Santa Fe College",
    "country": "United States",
    "state": "Florida",
    "source": "https://www.sfcollege.edu/online/canvas-help/index.html"
  },
  {
    "name": "Seminole State College of Florida",
    "country": "United States",
    "state": "Florida",
    "source": "https://www.seminolestate.edu/online/canvas"
  },
  {
    "name": "University of South Florida",
    "country": "United States",
    "state": "Florida",
    "source": "https://www.usf.edu/innovative-education/digital-learning/digital-learning-resources/canvas.aspx"
  },
  {
    "name": "University of West Florida",
    "country": "United States",
    "state": "Florida",
    "source": "https://confluence.uwf.edu/spaces/public/pages/45225435/Canvas+Help+for+Instructors"
  },
  {
    "name": "Valencia College",
    "country": "United States",
    "state": "Florida",
    "source": "https://catalog.valenciacollege.edu/glossary/"
  },
  {
    "name": "College of Western Idaho",
    "country": "United States",
    "state": "Idaho",
    "source": "https://cwi.instructure.com/login/canvas"
  },
  {
    "name": "University of Idaho",
    "country": "United States",
    "state": "Idaho",
    "source": "https://uidaho.instructure.com/login/canvas"
  },
  {
    "name": "Indiana University Bloomington",
    "country": "United States",
    "state": "Indiana",
    "source": "https://uits.iu.edu/services/canvas/index.html"
  },
  {
    "name": "Ivy Tech Community College",
    "country": "United States",
    "state": "Indiana",
    "source": "https://www.ivytech.edu/student-services/ivylearn-canvas/"
  },
  {
    "name": "University of Notre Dame",
    "country": "United States",
    "state": "Indiana",
    "source": "https://learning.nd.edu/learning-technology/canvas/"
  },
  {
    "name": "Des Moines Area Community College",
    "country": "United States",
    "state": "Iowa",
    "source": "https://www.dmacc.edu/online/login.html"
  },
  {
    "name": "Iowa State University",
    "country": "United States",
    "state": "Iowa",
    "source": "https://celt.iastate.edu/prepare-and-teach/design-your-course/get-started-with-canvas/"
  },
  {
    "name": "Johnson County Community College",
    "country": "United States",
    "state": "Kansas",
    "source": "https://jccc.instructure.com"
  },
  {
    "name": "Murray State University",
    "country": "United States",
    "state": "Kentucky",
    "source": "https://www.murraystate.edu/online/current-students/index.aspx"
  },
  {
    "name": "Northern Kentucky University",
    "country": "United States",
    "state": "Kentucky",
    "source": "https://www.nku.edu/center-for-excellence-in-teaching-and-innovation/resources/technology/canvas-student/index.html"
  },
  {
    "name": "Loyola University New Orleans",
    "country": "United States",
    "state": "Louisiana",
    "source": "https://loyno.instructure.com/login/saml"
  },
  {
    "name": "Southeastern Louisiana University",
    "country": "United States",
    "state": "Louisiana",
    "source": "https://www.southeastern.edu/resources/howdoi/canvas/"
  },
  {
    "name": "University of Maryland",
    "country": "United States",
    "state": "Maryland",
    "source": "https://elms.umd.edu"
  },
  {
    "name": "Berklee College of Music",
    "country": "United States",
    "state": "Massachusetts",
    "source": "https://canvas.berklee.edu"
  },
  {
    "name": "Massachusetts Institute of Technology",
    "country": "United States",
    "state": "Massachusetts",
    "source": "https://web.mit.edu/canvas/about.html"
  },
  {
    "name": "Merrimack College",
    "country": "United States",
    "state": "Massachusetts",
    "source": "https://www.merrimack.edu/academics/centers-and-institutes/ctide/canvas/"
  },
  {
    "name": "Northeastern University",
    "country": "United States",
    "state": "Massachusetts",
    "source": "https://canvas.northeastern.edu/student-resources/"
  },
  {
    "name": "Salem State University",
    "country": "United States",
    "state": "Massachusetts",
    "source": "https://www.salemstate.edu/offices-and-services/information-technology-services/canvas"
  },
  {
    "name": "Suffolk University",
    "country": "United States",
    "state": "Massachusetts",
    "source": "https://www.suffolk.edu/about/directory/information-technology-services/accounts-and-access/canvas"
  },
  {
    "name": "University of Massachusetts Amherst",
    "country": "United States",
    "state": "Massachusetts",
    "source": "https://umamherst.instructure.com/login"
  },
  {
    "name": "Worcester Polytechnic Institute",
    "country": "United States",
    "state": "Massachusetts",
    "source": "https://canvas.wpi.edu/"
  },
  {
    "name": "Eastern Michigan University",
    "country": "United States",
    "state": "Michigan",
    "source": "https://canvas.emich.edu"
  },
  {
    "name": "Wayne State University",
    "country": "United States",
    "state": "Michigan",
    "source": "https://services.wayne.edu/TDClient/277/Portal/KB/ArticleDet?ID=20379"
  },
  {
    "name": "University of Minnesota Twin Cities",
    "country": "United States",
    "state": "Minnesota",
    "source": "https://canvas.umn.edu"
  },
  {
    "name": "Jackson State University",
    "country": "United States",
    "state": "Mississippi",
    "source": "https://www.jsums.edu/canvas/"
  },
  {
    "name": "Mississippi State University",
    "country": "United States",
    "state": "Mississippi",
    "source": "https://www.online.msstate.edu/faq/canvas"
  },
  {
    "name": "University of Southern Mississippi",
    "country": "United States",
    "state": "Mississippi",
    "source": "https://www.usm.edu/itech/campusid-faqs.php"
  },
  {
    "name": "Saint Louis University",
    "country": "United States",
    "state": "Missouri",
    "source": "https://www.slu.edu/provost/ltac-files/canvas-migration.php"
  },
  {
    "name": "St. Louis Community College",
    "country": "United States",
    "state": "Missouri",
    "source": "https://stlcc.edu/programs-academics/online-education/canvas.aspx"
  },
  {
    "name": "Webster University",
    "country": "United States",
    "state": "Missouri",
    "source": "https://www.webster.edu/technology/access-accounts.php"
  },
  {
    "name": "Metropolitan Community College (Omaha)",
    "country": "United States",
    "state": "Nebraska",
    "source": "https://www.mccneb.edu/about-mcc/it-services"
  },
  {
    "name": "College of Southern Nevada",
    "country": "United States",
    "state": "Nevada",
    "source": "https://csn.instructure.com/login/canvas"
  },
  {
    "name": "University of Nevada, Reno",
    "country": "United States",
    "state": "Nevada",
    "source": "https://www.unr.edu/tlt/tools-and-technologies/webcampus/getting-started"
  },
  {
    "name": "Bergen Community College",
    "country": "United States",
    "state": "New Jersey",
    "source": "https://bergen.edu/portalhelp/access-canvas/"
  },
  {
    "name": "Kean University",
    "country": "United States",
    "state": "New Jersey",
    "source": "https://www.kean.edu/canvas-lms"
  },
  {
    "name": "Middlesex College",
    "country": "United States",
    "state": "New Jersey",
    "source": "https://middlesexcc.instructure.com"
  },
  {
    "name": "Princeton University",
    "country": "United States",
    "state": "New Jersey",
    "source": "https://canvas.princeton.edu"
  },
  {
    "name": "Rowan University",
    "country": "United States",
    "state": "New Jersey",
    "source": "https://sites.rowan.edu/academic-affairs/facultycenter/resources/canvasresources/"
  },
  {
    "name": "Seton Hall University",
    "country": "United States",
    "state": "New Jersey",
    "source": "https://www.shu.edu/technology/canvas/index.html"
  },
  {
    "name": "New Mexico State University",
    "country": "United States",
    "state": "New Mexico",
    "source": "https://learning.nmsu.edu/"
  },
  {
    "name": "Columbia University",
    "country": "United States",
    "state": "New York",
    "source": "https://support.ctl.columbia.edu/809664"
  },
  {
    "name": "Hofstra University",
    "country": "United States",
    "state": "New York",
    "source": "https://www.hofstra.edu/about/administration/its/canvas-breach/"
  },
  {
    "name": "St. John's University",
    "country": "United States",
    "state": "New York",
    "source": "https://www.stjohns.edu/office-information-technology/academic-technology/canvas"
  },
  {
    "name": "The New School",
    "country": "United States",
    "state": "New York",
    "source": "https://canvas.newschool.edu"
  },
  {
    "name": "East Carolina University",
    "country": "United States",
    "state": "North Carolina",
    "source": "https://ecu.instructure.com/login"
  },
  {
    "name": "University of North Carolina at Greensboro",
    "country": "United States",
    "state": "North Carolina",
    "source": "https://uncg.instructure.com/"
  },
  {
    "name": "Western Carolina University",
    "country": "United States",
    "state": "North Carolina",
    "source": "https://www.wcu.edu/canvas/"
  },
  {
    "name": "Bowling Green State University",
    "country": "United States",
    "state": "Ohio",
    "source": "https://onlinedegree.bgsu.edu/faq/"
  },
  {
    "name": "University of Cincinnati",
    "country": "United States",
    "state": "Ohio",
    "source": "https://www.uc.edu/about/registrar/registration/registration-how-to-guide/catalyst-canvas.html"
  },
  {
    "name": "Oklahoma State University",
    "country": "United States",
    "state": "Oklahoma",
    "source": "https://canvas.okstate.edu/"
  },
  {
    "name": "Community College of Philadelphia",
    "country": "United States",
    "state": "Pennsylvania",
    "source": "https://ccp.instructure.com"
  },
  {
    "name": "Clemson University",
    "country": "United States",
    "state": "South Carolina",
    "source": "https://www.clemson.edu/canvas/"
  },
  {
    "name": "Middle Tennessee State University",
    "country": "United States",
    "state": "Tennessee",
    "source": "https://www.mtsu.edu/canvas/"
  },
  {
    "name": "University of Memphis",
    "country": "United States",
    "state": "Tennessee",
    "source": "https://www.memphis.edu/ctl/canvas/"
  },
  {
    "name": "University of Tennessee at Chattanooga",
    "country": "United States",
    "state": "Tennessee",
    "source": "https://www.utc.edu/canvas"
  },
  {
    "name": "Alamo Colleges District",
    "country": "United States",
    "state": "Texas",
    "source": "https://www.alamo.edu/sac/experience-sac/current-students/student-resources/canvas-for-students/"
  },
  {
    "name": "Collin College",
    "country": "United States",
    "state": "Texas",
    "source": "https://www.collin.edu/academics/elearning/student-canvas-resources.html"
  },
  {
    "name": "Houston City College (formerly Houston Community College)",
    "country": "United States",
    "state": "Texas",
    "source": "https://www.hccs.edu/current-students/technology-support/eagle-online-canvas-support/"
  },
  {
    "name": "University of Texas at Arlington",
    "country": "United States",
    "state": "Texas",
    "source": "https://oit.uta.edu/canvas/"
  },
  {
    "name": "University of Texas at Austin",
    "country": "United States",
    "state": "Texas",
    "source": "https://tech.utexas.edu/services-tools/canvas"
  },
  {
    "name": "UT San Antonio (UTSA)",
    "country": "United States",
    "state": "Texas",
    "source": "https://provost.utsa.edu/canvas/"
  },
  {
    "name": "Brigham Young University",
    "country": "United States",
    "state": "Utah",
    "source": "https://byucanvas.byu.edu/getting-started-with-canvas"
  },
  {
    "name": "Salt Lake Community College",
    "country": "United States",
    "state": "Utah",
    "source": "https://www.slcc.edu/student-tech-guide/canvas-help.aspx"
  },
  {
    "name": "Southern Utah University",
    "country": "United States",
    "state": "Utah",
    "source": "https://www.suu.edu/news/2026/05/canvas-incident.html"
  },
  {
    "name": "University of Utah",
    "country": "United States",
    "state": "Utah",
    "source": "https://digitallearning.utah.edu/support/canvas-help.php"
  },
  {
    "name": "Utah State University",
    "country": "United States",
    "state": "Utah",
    "source": "https://www.usu.edu/teach/help-topics/canvas/index.php"
  },
  {
    "name": "Utah Valley University",
    "country": "United States",
    "state": "Utah",
    "source": "https://www.uvu.edu/canvas/everyone/index.html"
  },
  {
    "name": "Northern Virginia Community College",
    "country": "United States",
    "state": "Virginia",
    "source": "https://www.nvcc.edu/student-resources/technology/canvas.html"
  },
  {
    "name": "Old Dominion University",
    "country": "United States",
    "state": "Virginia",
    "source": "https://www.odu.edu/technology-services/canvas"
  },
  {
    "name": "Eastern Washington University",
    "country": "United States",
    "state": "Washington",
    "source": "https://support.ewu.edu/support/solutions/folders/10000086854"
  },
  {
    "name": "Gonzaga University",
    "country": "United States",
    "state": "Washington",
    "source": "https://canvas.gonzaga.edu"
  },
  {
    "name": "University of Wisconsin-Green Bay",
    "country": "United States",
    "state": "Wisconsin",
    "source": "https://www.uwgb.edu/canvas/"
  },
  {
    "name": "University of Wisconsin-La Crosse",
    "country": "United States",
    "state": "Wisconsin",
    "source": "https://www.uwlax.edu/info/canvas/"
  },
  {
    "name": "University of Wisconsin-Oshkosh",
    "country": "United States",
    "state": "Wisconsin",
    "source": "https://www.uwosh.edu/canvas/"
  },
  {
    "name": "University of Wisconsin-Whitewater",
    "country": "United States",
    "state": "Wisconsin",
    "source": "https://www.uww.edu/canvas"
  },
  {
    "name": "University of Wyoming",
    "country": "United States",
    "state": "Wyoming",
    "source": "https://www.uwyo.edu/ctl/knowledge-base/wyocourses-information.html"
  },
  {
    "name": "Adelaide University (myLearning = Canvas)",
    "country": "Australia",
    "source": "https://adelaide.edu.au/about/news/2026/canvas-security-incident/"
  },
  {
    "name": "Swinburne University of Technology",
    "country": "Australia",
    "source": "https://www.swinburne.edu.au/student-login/submitting-work/"
  },
  {
    "name": "University of Canberra (UCLearn = Canvas)",
    "country": "Australia",
    "source": "https://www.canberra.edu.au/current-students/other-countries/enrolment-information/accessing-unit-material-online"
  },
  {
    "name": "Erasmus University College Brussels (EhB)",
    "country": "Belgium",
    "source": "https://www.erasmushogeschool.be/nl/studenten/cas-en-canvas"
  },
  {
    "name": "Karel de Grote University of Applied Sciences (KdG)",
    "country": "Belgium",
    "source": "https://www.kdg.be/helpdesk-canvas"
  },
  {
    "name": "Thomas More University of Applied Sciences",
    "country": "Belgium",
    "source": "https://thomasmore.be/en/international-what-canvas"
  },
  {
    "name": "Unisinos",
    "country": "Brazil",
    "source": "https://www.unisinos.br/graduacao/orientacoes-ead"
  },
  {
    "name": "OCAD University",
    "country": "Canada",
    "source": "http://www.ocadu.ca/news/updated-instructure/canvas-security-incident"
  },
  {
    "name": "University of British Columbia",
    "country": "Canada",
    "source": "https://it.ubc.ca/services/accounts-passwords/campus-wide-login-cwl"
  },
  {
    "name": "University of Saskatchewan",
    "country": "Canada",
    "source": "https://teaching.usask.ca/learning-technology/tools/canvas.php"
  },
  {
    "name": "Pontificia Universidad Católica de Chile (Canvas UC)",
    "country": "Chile",
    "source": "https://www.uc.cl/noticias/las-ventajas-de-canvas-la-nueva-plataforma-web-de-cursos/"
  },
  {
    "name": "Universidad de los Andes, Chile (CanvasUANDES)",
    "country": "Chile",
    "source": "https://www.uandes.cl/actualidad/noticias/como-utilizar-canvasuandes-guia-rapida-para-alumnos-y-profesores/"
  },
  {
    "name": "Universidad del Desarrollo (UDD)",
    "country": "Chile",
    "source": "https://auladigital.udd.cl/preguntas-frecuentes/"
  },
  {
    "name": "Universidad Diego Portales (UDP)",
    "country": "Chile",
    "source": "https://www.udp.cl/cms/wp-content/uploads/2021/06/moduloI.pdf"
  },
  {
    "name": "ESPOL (Escuela Superior Politécnica del Litoral)",
    "country": "Ecuador",
    "source": "https://www.espol.edu.ec/es/noticias/canvas-una-plataforma-para-mejorar-la-experiencia-academica-virtual-e-impulsar-la"
  },
  {
    "name": "American University in Cairo",
    "country": "Egypt",
    "source": "https://www.aucegypt.edu/digital-transformation/IT-services-catalog"
  },
  {
    "name": "Frankfurt School of Finance & Management",
    "country": "Germany",
    "source": "https://www.frankfurt-school.de/en/home/news/2026/07/canvas-incident"
  },
  {
    "name": "Ashesi University",
    "country": "Ghana",
    "source": "https://ashesi.edu.gh/alumni/"
  },
  {
    "name": "University of Iceland",
    "country": "Iceland",
    "source": "https://hi.is/nam/adgangur_ad_uglu_og_tolvukerfi"
  },
  {
    "name": "ITAM (Instituto Tecnológico Autónomo de México)",
    "country": "Mexico",
    "source": "https://exalumnos.itam.mx/boletin/2020/agosto/"
  },
  {
    "name": "ITESO",
    "country": "Mexico",
    "source": "https://estudiantes.iteso.mx/en/"
  },
  {
    "name": "Tecnológico de Monterrey",
    "country": "Mexico",
    "source": "https://tedu.tec.mx/es/canvas"
  },
  {
    "name": "Universidad Autónoma de Guadalajara (UAG)",
    "country": "Mexico",
    "source": "https://soportecanvas.uag.mx/assets/uso-de-canvas---alumnos-ene-2022.pdf"
  },
  {
    "name": "UPAEP",
    "country": "Mexico",
    "source": "https://upaep.mx/idd/manuales/pdf/915"
  },
  {
    "name": "HU University of Applied Sciences Utrecht",
    "country": "Netherlands",
    "source": "https://www.hu.nl/nieuws/hu-neemt-canvas-weer-in-gebruik"
  },
  {
    "name": "Tilburg University",
    "country": "Netherlands",
    "source": "https://www.tilburguniversity.edu/sites/default/files/download/Privacy%20Statement%20Canvas.pdf"
  },
  {
    "name": "Victoria University of Wellington (Nuku = Canvas)",
    "country": "New Zealand",
    "source": "https://www.wgtn.ac.nz/students/study/ako/access-your-courses-on-nuku"
  },
  {
    "name": "University of Bergen (Mitt UiB = Canvas)",
    "country": "Norway",
    "source": "https://www.uib.no/diguib/79169/l%C3%A6ringsplattform-mitt-uib"
  },
  {
    "name": "Universidad San Ignacio de Loyola (USIL)",
    "country": "Peru",
    "source": "https://contenidoscev.usil.edu.pe/canvas/manuales/Manual-Estudiantes-CANVAS.pdf"
  },
  {
    "name": "Ateneo de Manila University",
    "country": "Philippines",
    "source": "https://www.ateneo.edu/gsb/FAQs/Registration"
  },
  {
    "name": "University of the Witwatersrand (ulwazi = Canvas)",
    "country": "South Africa",
    "source": "https://www.wits.ac.za/ulwazi/"
  },
  {
    "name": "Universidad Francisco de Vitoria",
    "country": "Spain",
    "source": "https://www.ufv.es/preguntas-frecuentes-secretaria-de-alumnos/"
  },
  {
    "name": "Chalmers University of Technology",
    "country": "Sweden",
    "source": "https://www.chalmers.se/en/education/your-studies/services-and-tools/canvas/"
  },
  {
    "name": "University of St. Gallen (StudyNet = Canvas)",
    "country": "Switzerland",
    "source": "https://www.unisg.ch/en/studying/orientation/uni-abcs/"
  },
  {
    "name": "Heriot-Watt University",
    "country": "United Kingdom",
    "source": "https://www.hw.ac.uk/students/student-a-z-guide"
  },
  {
    "name": "Kingston University",
    "country": "United Kingdom",
    "source": "https://progspec.kingston.ac.uk/view/?d=1213509dd03edf59ca8f98b5240928"
  },
  {
    "name": "University of Birmingham",
    "country": "United Kingdom",
    "source": "https://intranet.birmingham.ac.uk/student/academic-support/online-learning/index.aspx"
  },
  {
    "name": "University of Stirling",
    "country": "United Kingdom",
    "source": "https://isnews.stir.ac.uk/2023/03/08/things-to-do-before-you-graduate-tie-up-library-and-it-loose-ends/"
  },
  {
    "name": "University of Wolverhampton",
    "country": "United Kingdom",
    "source": "https://www.wlv.ac.uk/courses/online-distance-learning/starting-out/"
  }
];
