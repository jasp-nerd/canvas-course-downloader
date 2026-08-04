/**
 * Top Breadcrumbs component that displays navigation breadcrumbs for the course.
 * @param {Object} props
 * @param {{title: string, callback?: function}[]} props.list
 */
function TopBreadcrumbs({ list = [] }) {
  const { courseData } = useCourseContext();
  const { navigateToSection } = useNavigation();

  if (!courseData) {
    return null;
  }

  const courseTitle = courseData?.manifest?.course;

  return (
    <nav aria-label='breadcrumb'>
      <ol className='top-breadcrumbs'>
        {courseTitle && (
          <li className='breadcrumb-item' style={{ cursor: "pointer" }} onClick={() => navigateToSection("frontpage")}>
            {courseTitle}
          </li>
        )}

        {Array.isArray(list) &&
          list.map((item, index) => (
            <li
              key={item.id || index}
              className='breadcrumb-item'
              onClick={item.callback}
              style={item.callback ? { cursor: "pointer" } : undefined}
            >
              {item.title}
            </li>
          ))}
      </ol>
    </nav>
  );
}
