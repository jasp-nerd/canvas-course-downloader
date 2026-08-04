/**
 * Main function that renders the assignments page.
 * @returns The main Assignments page component for the viewer.
 */

function AssignmentsPage() {
  const { courseData } = useCourseContext();
  if (!courseData) {
    return <div>Loading...</div>;
  }
  if (!courseData.Assignments) {
    return <div>No assignments available.</div>;
  }
  // Convert dictionary object or array into a flat array of assignments
  const assignmentList = Array.isArray(courseData.Assignments) ? courseData.Assignments : Object.values(courseData.Assignments);
  // sort assignments by reverse due date order
  assignmentList.sort((a, b) => {
    return new Date(b.due_at) - new Date(a.due_at);
  });
  if (courseData.Assignments) {
    return (
      <div className='page-div' style={{ marginBottom: "4em" }}>
        <h1 style={{ color: "#666666", fontSize: 28.8 }}>Assignments</h1>
        <CollapseTable title='Assignments'>
          {assignmentList.map((assignment, index) => (
            <CollapseListItemDetails
              key={assignment.id}
              closed={assignment?.availability_status?.status || "Unknown"} // Uses 'availability_status.status' from Canvas JSON
              title={assignment?.name || "No Title"} // Uses 'name' from Canvas JSON
              dueDate={assignment?.due_at ? fixDateFormat(assignment?.due_at) : "No Due Date"}
              grade={assignment?.submission?.score || "-"}
              maxGrade={assignment?.points_possible} // Uses 'points_possible' from Canvas JSON
              assignment={assignment}
              type={"assignment"}
            />
          ))}
        </CollapseTable>
      </div>
    );
  }
}
