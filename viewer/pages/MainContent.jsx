function MainContent() {
      const [showCourseList, setShowCourseList] = useState(true);
      const { activeKey, selectedAssignmentId, selectedPageUrl, selectedDiscussionId, selectedAnnouncementId, navigateToSection } =
        useNavigation();

      const { courseData } = useCourseContext();

      const elements = React.useMemo(() => {
        if (!courseData) return [];
        console.log("Course data:", courseData);
        const list = [];
        if (courseData.FrontPage) {
          list.push({ key: "frontpage", title: "Home" });
        }
        if (courseData.Assignments) {
          list.push({ key: "assignments", title: "Assignments" });
          list.push({ key: "grades", title: "Grades" });
        }
        if (courseData.Modules) {
          list.push({ key: "modules", title: "Modules" });
        }
        if (courseData.Discussions && Object.keys(courseData.Discussions || {}).length > 0) {
          list.push({ key: "discussions", title: "Discussions" });
        }
        if (courseData.Files && (courseData.Files?.files?.length > 0 || courseData.Files?.folders?.length > 1)) {
          list.push({ key: "files", title: "Files" });
        }
        if (courseData.Pages) {
          list.push({ key: "pages", title: "Pages" });
        }
        if (courseData.Announcements) {
          list.push({ key: "announcements", title: "Announcements" });
        }
        return list;
      }, [courseData]);

      // Set initial active key safely in useEffect when course data loads
      useEffect(() => {
        if (courseData && !activeKey) {
          if (courseData.FrontPage) {
            navigateToSection("frontpage");
          } else if (elements.length > 0) {
            navigateToSection(elements[0].key);
          }
        }
      }, [courseData, elements, activeKey]);

      // Find selected assignment object if viewing one
      const currentAssignment = React.useMemo(() => {
        if (!selectedAssignmentId || !courseData?.Assignments) return null;
        const list = Array.isArray(courseData.Assignments) ? courseData.Assignments : Object.values(courseData.Assignments);
        return list.find((a) => String(a.id) === String(selectedAssignmentId));
      }, [selectedAssignmentId, courseData]);

      // Find selected page object if viewing one
      const currentPage = React.useMemo(() => {
        if (!selectedPageUrl || !courseData?.Pages) return null;
        const list = Array.isArray(courseData.Pages) ? courseData.Pages : Object.values(courseData.Pages);
        return list.find(
          (p) =>
            String(p.url) === String(selectedPageUrl) ||
            String(p.page_id) === String(selectedPageUrl) ||
            String(p.id) === String(selectedPageUrl),
        );
      }, [selectedPageUrl, courseData]);

      // Dynamic breadcrumbs based on navigation state, never show breadcrumb for frontpage
      const breadcrumbList = React.useMemo(() => {
        const crumbs = [];
        if (activeKey === "assignments") {
          crumbs.push({
            title: "Assignments",
            callback: () => navigateToSection("assignments"),
          });
          if (currentAssignment) {
            crumbs.push({ title: currentAssignment.name });
          }
        } else if (activeKey === "pages") {
          crumbs.push({
            title: "Pages",
            callback: () => navigateToSection("pages"),
          });
          if (currentPage) {
            crumbs.push({ title: currentPage.title || "Page Details" });
          }
        } else if (activeKey === "frontpage") {
          return crumbs;
        } else {
          crumbs.push({
            title: activeKey.charAt(0).toUpperCase() + activeKey.slice(1),
          });
        }
        return crumbs;
      }, [activeKey, currentAssignment, currentPage]);
      return (
        <main style={{ marginLeft: "0px", width: "100%" }}>
          <div className='top-nav'>
            <button id='courseMenuToggle' style={{ cursor: "pointer" }} onClick={() => setShowCourseList(!showCourseList)}>
              <svg width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round'>
                <line x1='3' y1='12' x2='21' y2='12'></line>
                <line x1='3' y1='6' x2='21' y2='6'></line>
                <line x1='3' y1='18' x2='21' y2='18'></line>
              </svg>
            </button>
            <TopBreadcrumbs list={breadcrumbList} />
          </div>
          <div
            className='bottom_section'
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "flex-start", // Prevents full-height stretching so stickiness works
              marginRight: "20px",
              marginLeft: "20px",
            }}
          >
            {showCourseList && <CourseList elements={elements} activeKey={activeKey} callback={(key) => navigateToSection(key)} />}
            {renderActiveContent(activeKey, currentAssignment, currentPage, selectedDiscussionId, selectedAnnouncementId)}
          </div>
        </main>
      );
    }
    /**
     * Switch statement to render the appropriate content based on the activeKey. It currently handles the "frontPage" case and a default case for other keys.
     */
    function renderActiveContent(activeKey, currentAssignment, currentPage, selectedDiscussionId, selectedAnnouncementId) {
      switch (activeKey) {
        case "assignments":
          return currentAssignment ? <AssignmentDetailView assignment={currentAssignment} /> : <AssignmentsPage />;
        case "grades":
          return <GradesPage />;
        case "modules":
          return <ModulesPage />;
        case "pages":
          return currentPage ? <PageDetailView page={currentPage} /> : <PagesPage />;
        case "files":
          return <FilesPage />;
        case "discussions":
          return selectedDiscussionId ? <DiscussionDetailView discussionId={selectedDiscussionId} /> : <DiscussionsPage />;
        case "announcements":
          return selectedAnnouncementId ? <AnnouncementDetailPage /> : <AnnouncementsPage />;
        case "frontpage":
          return <HomePage />;
        default:
          return (
            <div className='canvas_content'>
              We are sorry, but the section you are trying to visit has either not been implemenented or there is a problem with the course data.
              <h1>Active key: {activeKey}</h1>
            </div>
          );
          break;
      }
    }