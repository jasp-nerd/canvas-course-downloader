/**
 * CourseList component that displays a list of course elements. It checks if the elements prop is valid and renders a list of links to the course items.
 * elements: {key: string, title: string}[]
 * activeKey: string
 * callback: function
 */
function CourseList({ elements, activeKey, callback }) {
  if (!elements || elements?.length === 0) {
    return null;
  }
  let courseSubtitle = "Course Menu";
  const { courseData } = useCourseContext();

  if (courseData) {
    courseSubtitle = courseData?.manifest?.courseTerm?.name || "Course Menu";
  }

  return (
    <div
      className='course-item-list'
      id='course_item_list'
      style={{
        position: "sticky", // Makes it sticky
        top: "0px", // Distance from top of screen when scrolling
        maxHeight: "calc(100vh - 40px)", // Optional: Keeps long menus scrollable within viewport
        overflowY: "auto", // Optional: Allows scrolling inside sidebar if menu is long
        flexShrink: 0, // Prevents content on the right from squishing the sidebar
        maxWidth: "192px",
      }}
    >
      <div
        className='couse_subtitle'
        style={{
          fontSize: "11px",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          margin: "3em 1em 0em 1.5em",
          paddingRight: "1em",
          color: "#273540",
        }}
      >
        <i>{courseSubtitle}</i>
      </div>
      <nav>
        <ul id='courseList' style={{ display: "block", listStyle: "none", padding: 0 }}>
          {elements.map((element, index) => (
            <li className={`course-item ${activeKey === element.key ? "active-course-item" : ""}`} key={element.key || index}>
              <a
                onClick={(e) => {
                  e.preventDefault();
                  handleCourseItemClick(element.key, callback);
                }}
                href='#'
              >
                {element.title}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

/**
 * HandleCourseItemClick function that is called when a course item is clicked. Currently, it does nothing but can be extended to handle navigation or other actions.
 * key: string
 * callback: function
 */
function handleCourseItemClick(key, callback) {
  console.log("Course item clicked:", key);
  if (callback) {
    callback(key);
  }
}
