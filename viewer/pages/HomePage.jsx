/**
 * Home Page component that displays the home page content. It checks if the courseData is available and renders the appropriate content.
 */
function HomePage() {
  const { courseData } = useCourseContext();
  if (!courseData) {
    return <div>Loading...</div>;
  }
  if (!courseData.FrontPage) {
    return <div>No course home page available.</div>;
  } else if (courseData.FrontPage) {
    return courseData.FrontPage.body ? (
      <div className='page-div'>
        <h1 style={{ color: "#666666", fontSize: 28.8 }}>{courseData.manifest.course}</h1>
        <div id='home-page-content' dangerouslySetInnerHTML={{ __html: courseData.FrontPage.body }} />
      </div>
    ) : (
      <div>No content available for the course home page.</div>
    );
  }
}
