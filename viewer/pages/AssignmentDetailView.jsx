/**
 * Renders the per assignment details, allowing users to see the description and their submission.
 * @param {Object} assignment - The assignment to render.
 * @returns {JSX.Element|null} The assignment detail view.
 */
function AssignmentDetailView({ assignment }) {
  if (!assignment) {
    return <h1>No Assignment Selected</h1>;
  }
  // date must be in format Sat Jun 3, 2023 12:50pm
  // assignment?.due_at is in format 2023-06-03T19:50:15-04:00
  function customDateFormat(date) {
    const dateObj = new Date(date);
    const dayOfWeek = dateObj.toLocaleDateString("en-US", {
      weekday: "short",
    });
    const month = dateObj.toLocaleDateString("en-US", { month: "short" });
    const day = dateObj.toLocaleDateString("en-US", { day: "numeric" });
    const year = dateObj.toLocaleDateString("en-US", { year: "numeric" });
    const time = dateObj.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "numeric",
    });
    return `${dayOfWeek} ${month} ${day}, ${year} ${time}`;
  }
  function pointsDisplay(assignment) {
    if (assignment?.grading_type == "points") {
      return (
        <>
          <strong>
            {assignment?.submission?.score || (assignment?.submission?.missing ? "0" : "-")}/{assignment?.points_possible}
          </strong>
          {" Points"}
        </>
      );
    }
    if (assignment?.grading_type == "not_graded") {
      return <></>;
    }
    if (assignment?.grading_type == "pass_fail") {
      return <>{assignment?.submission?.grade == "complete" ? "Complete" : "Incomplete"}</>;
    }
    return <>error</>;
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        marginBottom: "8em",
      }}
    >
      <div className='assignment-student-header'>
        <span style={{ display: "flex", flexDirection: "column" }}>
          <span className='assignment-student-header-title'>{assignment?.name}</span>
          <span style={{ fontSize: "14px", fontWeight: "bold" }}>
            Due: {assignment?.due_at ? customDateFormat(assignment?.due_at) : "Not Set"}
          </span>
        </span>
        <span
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: "0.5em",
          }}
        >
          <span>
            {assignment.submission?.late && !assignment.submission?.missing && <ContextPill type='late' />}
            {assignment.submission?.missing && <ContextPill type='missing' />}
          </span>
          <span
            style={{
              fontSize: "1.5em",
              textAlign: "right",
            }}
          >
            {pointsDisplay(assignment)}
          </span>
        </span>
      </div>
      <div
        className='assignment-information'
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "left",
          padding: "1em",
        }}
      >
        {typeof assignment?.lock_explanation === "string" && <span>{assignment.lock_explanation}</span>}
      </div>
      <div className='assignment-details' dangerouslySetInnerHTML={{ __html: assignment?.description }} />
      <AssignmentRubric rubric={assignment?.rubric} />
      {assignment?.submission?.attachments && <CanvasSubmission assignment={assignment} />}
      {/*<span>Debug: {assignment?.id}</span>*/}
    </div>
  );
}
