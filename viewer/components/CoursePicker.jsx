/**
 * Course picker dialog that allows the user to select a course folder and load the course data. Utilizes the CourseContext to manage the course data and processing state.
 */
function CoursePicker() {
  const { handleFolderSelect, isProcessing } = useCourseContext();

  return (
    <div className='course-picker'>
      <h1>Welcome to the Offline Course Viewer</h1>
      <p>Please select a course folder to begin. The folder should contain the course content and metadata.</p>
      <button onClick={handleFolderSelect} disabled={isProcessing}>
        {isProcessing ? "Processing..." : "Select Course Folder"}
      </button>
    </div>
  );
}
