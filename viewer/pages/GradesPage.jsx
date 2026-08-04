/**
 * The grades page displays all of the grades for the course. It includes the ability to sort by due date, name,
 * submitted date, status, and assignment group. It also includes the ability to filter by grading period and to
 * group by assignment group.
 * @returns {React.Component} The grades page.
 */
function GradesPage() {
  const { courseData } = useCourseContext();
  const { useState, useMemo } = React;
  if (!courseData) {
    return <div>Loading...</div>;
  }
  if (!courseData.Assignments) {
    return <div>No grades available.</div>;
  }

  // Convert dictionary object or array into a flat array of grades
  let gradeList = Array.isArray(courseData.Assignments) ? courseData.Assignments : Object.values(courseData.Assignments);

  // Set the default sorting method for the grades page
  let [sortBy, setSortBy] = useState("due");
  // Set the default grading period to all
  let [selectedGradingPeriod, setSelectedGradingPeriod] = useState("all");
  // Get the grading periods from the course data
  let gradingPeriods = undefined;
  if (courseData?.GradingPeriods?.grading_periods) {
    gradingPeriods = courseData.GradingPeriods.grading_periods;
  }
  // Filter out the assignments that will not be graded grading_type: "not_graded",
  // Filter the active assignments by their grading_period_id
  // and sort by the selected sortBy value
  gradeList = gradeList
    .filter(
      (assignment) =>
        assignment.grading_type !== "not_graded" &&
        (selectedGradingPeriod === "all" ||
          (assignment?.submission?.grading_period_id != null &&
            String(assignment.submission.grading_period_id) === String(selectedGradingPeriod))),
    )
    .sort((a, b) => {
      if (sortBy === "due") {
        const aDate = a.due_at ? new Date(a.due_at) : new Date(0);
        const bDate = b.due_at ? new Date(b.due_at) : new Date(0);
        return aDate - bDate;
      } else if (sortBy === "name") {
        return (a.name || "").localeCompare(b.name || "");
      } else if (sortBy === "submitted") {
        const aSub = a.submission?.submitted_at ? new Date(a.submission.submitted_at) : new Date(0);
        const bSub = b.submission?.submitted_at ? new Date(b.submission.submitted_at) : new Date(0);
        return aSub - bSub;
      } else if (sortBy === "status") {
        return (a.submission?.workflow_state || "").localeCompare(b.submission?.workflow_state || "");
      } else if (sortBy === "assignment_group") {
        return (Number(a.assignment_group_id) || 0) - (Number(b.assignment_group_id) || 0);
      }
      return 0;
    });

  let assignmentGroups = undefined;
  if (courseData?.AssignmentGroups) {
    assignmentGroups = courseData.AssignmentGroups;
  }

  let useAssignmentGroupsForWeighting = courseData?.manifest?.useAssignmentGroupsForWeighting || false;

  //Assignment details open/closed state management. Default to all closed.
  const [openStates, setOpenStates] = useState(() => {
    const initial = {};
    gradeList.forEach((m) => {
      initial[m.id] = true;
    });
    return initial;
  });
  // Derived state: If AT LEAST ONE detail is open, button action is "Hide All Details".
  // If ALL modules are collapsed (none are open), button action is "Show All Details".
  const isAnyOpen = useMemo(() => {
    return Object.values(openStates).some((isOpen) => isOpen === true);
  }, [openStates]);

  // Toggle individual module header click
  const handleToggleModule = (id) => {
    setOpenStates((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Master button toggle handler
  const handleMasterToggle = () => {
    const nextState = !isAnyOpen; // If any open -> hide all details (false); if all closed -> show all details (true)
    const updated = {};
    gradeList.forEach((m) => {
      updated[m.id] = nextState;
    });
    setOpenStates(updated);
  };
  const handleItemType = (item) => {
    if (!item || !item.type) return "assignment"; // Default to assignment if type is missing
    if (item?.quiz_lti && item?.quiz_lti == true) {
      return "quiz";
    }
    return item.type.toLowerCase(); // Return the type in lowercase for consistency
  };
  return (
    <div className='page-div' style={{ marginBottom: "4em" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h1 style={{ color: "#666666", fontSize: 28.8 }}>Grades</h1>
        <button
          onClick={handleMasterToggle}
          style={{
            backgroundColor: "#f2f4f4",
            border: "1px solid #e8eaec",
            padding: "8px 14px 8px 14px",
            borderRadius: "3px",
            cursor: "pointer",
            fontSize: "16px",
            color: "#273540",
          }}
        >
          {!isAnyOpen ? "Hide All Details" : "Show All Details"}
        </button>
      </div>
      <div
        className='grades-sorting'
        style={{
          marginBottom: ".5em",
          marginTop: ".5em",
          display: "flex",
          flexDirection: "row",
          justifyContent: "left",
        }}
      >
        {gradingPeriods && (
          <span
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "left",
              gap: "0.5em",
              fontSize: "1em",
              marginRight: "2em",
            }}
          >
            <label htmlFor='grading_period'>
              <strong>Grading Period</strong>
            </label>

            <select
              name='grading_period'
              id='grading_period'
              className='dropdown-select'
              onChange={(e) => setSelectedGradingPeriod(e.target.value)}
              value={selectedGradingPeriod}
            >
              <option value='all'>All Grading Periods</option>
              {gradingPeriods.map((period) => (
                <option key={period.id} value={period.id}>
                  {period.title || period.display_name}
                </option>
              ))}
            </select>
          </span>
        )}
        <span
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "left",
            gap: "0.5em",
            fontSize: "1em",
          }}
        >
          <label htmlFor='grades-sorting-dropdown'>
            <strong>Arrange By</strong>
          </label>
          <select id='grades-sorting-dropdown' className='dropdown-select' onChange={(e) => setSortBy(e.target.value)} value={sortBy}>
            <option value='due'>Due Date</option>
            <option value='name'>Name</option>
            <option value='submitted'>Submitted Date</option>
            <option value='assignment_group'>Assignment Group</option>
          </select>
        </span>
        <span
          style={{
            display: "flex",
            flexGrow: 1,
            justifyContent: "right",
            marginRight: "2em",
          }}
        >
          Total:{" "}
          {calculateTotalWeightedGrade(gradeList, useAssignmentGroupsForWeighting ? assignmentGroups : undefined)
            ? calculateTotalWeightedGrade(gradeList, useAssignmentGroupsForWeighting ? assignmentGroups : undefined)?.toFixed(2) + "%"
            : "N/A"}
        </span>
      </div>
      <table className='grades-table'>
        <thead>
          <tr className='grades-table-header'>
            <th>Name</th>
            <th>Due</th>
            <th>Submitted</th>
            <th>Status</th>
            <th>Score</th>
            <th></th>
          </tr>
        </thead>
        <tbody className='grades-table-body'>
          {gradeList.map((grade, index) => (
            <GradeTableRow
              assignment={grade}
              detailsHidden={openStates[grade.id] ?? true}
              hideDetailCallback={() => handleToggleModule(grade.id)}
              assignmentGroups={assignmentGroups}
              key={index + grade.id}
            />
          ))}
          {assignmentGroups &&
            assignmentGroups.length > 0 &&
            assignmentGroups.map((group, index) => (
              <tr className='grade-row' key={index}>
                <td colSpan='4'>
                  <strong>{group.name}</strong>
                </td>
                <td style={{ textAlign: "center" }}>
                  <strong>
                    {calculateGradeForGroup(group, gradeList)?.percentage?.toFixed(2)
                      ? calculateGradeForGroup(group, gradeList)?.percentage?.toFixed(2) + "%"
                      : "N/A"}
                  </strong>
                </td>
                <td style={{ textAlign: "right" }}>
                  <strong style={{ whiteSpace: "nowrap" }}>
                    {calculateGradeForGroup(group, gradeList)?.totalPointsEarned?.toFixed(2) || "N/A"} /{" "}
                    {calculateGradeForGroup(group, gradeList)?.totalPointsPossible?.toFixed(2) || "N/A"}
                  </strong>
                </td>
              </tr>
            ))}
          <tr className='grade-row grade-row-total'>
            <td colSpan='4' style={{ textAlign: "left", textWrap: "nowrap" }}>
              <strong>Total</strong>
            </td>
            <td style={{ textAlign: "center" }}>
              <strong>
                {calculateTotalWeightedGrade(gradeList, useAssignmentGroupsForWeighting ? assignmentGroups : undefined)
                  ? calculateTotalWeightedGrade(gradeList, useAssignmentGroupsForWeighting ? assignmentGroups : undefined)?.toFixed(2) + "%"
                  : "N/A"}
              </strong>
            </td>
            <td style={{ textAlign: "center" }}>
              {useAssignmentGroupsForWeighting && <strong>
                {calculateTotalPoints(gradeList)?.totalPointsEarned?.toFixed(2) || "N/A"} /{" "}
                {calculateTotalPoints(gradeList)?.totalPointsPossible?.toFixed(2) || "N/A"}
              </strong>}
            </td>
          </tr>
        </tbody>
      </table>
      <div className='group-weighting'>
        {!useAssignmentGroupsForWeighting || !assignmentGroups || assignmentGroups.length === 0 ? (
          <p className='no-weighting-text'>Course assignments are not weighted.</p>
        ) : (
          <div className='weighting-container'>
            <h3 className='weighting-title'>Course Weighting</h3>
            <table className='weighting-table'>
              <thead>
                <tr>
                  <th>Group</th>
                  <th>Weight</th>
                </tr>
              </thead>
              <tbody>
                {assignmentGroups.map((group, index) => (
                  <tr key={group.id || index}>
                    <td>{group.name}</td>
                    <td>{group.group_weight !== undefined && group.group_weight !== null ? `${group.group_weight}%` : "N/A"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
/**
 * Renders a single table row for the grade table
 * @param {Object} props
 * @param {Object} props.assignment - The assignment to render
 * @param {boolean} props.detailsHidden - Whether the details are hidden
 * @param {Function} props.hideDetailCallback - The callback to hide the details
 * @param {Array<Object>} props.assignmentGroups - The assignment groups
 * @returns a single table row for the grade table
 */
function GradeTableRow({ assignment, detailsHidden, hideDetailCallback, assignmentGroups }) {
  const { navigateToAssignment } = useNavigation();
  const { reconnectFolder } = useCourseContext();

  let assignmentGroupName = "Unknown Assignment Group";
  if (assignmentGroups && assignmentGroups.length > 0) {
    // takes a list of assignment groups and finds the name of the group that matches the assignment's group ID
    assignmentGroupName =
      assignmentGroups.filter((group) => group.id === assignment.assignment_group_id)[0]?.name || "Unknown Assignment Group";
  }
  let checkmark = (
    <svg viewBox='0 0 1920 1920' xmlns='http://www.w3.org/2000/svg' style={{ height: "16px", width: "16px" }}>
      <path d='M1827.701 303.065 698.835 1431.801 92.299 825.266 0 917.564 698.835 1616.4 1919.869 395.234z' />
    </svg>
  );
  let xmark = (
    <svg viewBox='0 0 1920 1920' xmlns='http://www.w3.org/2000/svg' style={{ height: "16px", width: "16px" }}>
      <path d='M954.64 826.418 426.667 298.445 298.445 426.667 826.418 954.64l-527.973 527.973 128.222 128.222 527.973-527.973 527.973 527.973 128.222-128.222-527.973-527.973 527.973-527.973-128.222-128.222z' />
    </svg>
  );
  const renderGrade = (assignment) => {
    const { grading_type, points_possible, submission } = assignment || {};

    if (grading_type === "points") {
      return `${submission?.score ?? "-"} / ${points_possible ?? "-"}`;
    }

    if (grading_type === "pass_fail") {
      return submission?.grade === "complete" ? checkmark : xmark;
    }

    if (grading_type === "not_graded") {
      return "-";
    }
    if (grading_type == "letter_grade") {
      return `${submission?.score} (${submission?.grade})`;
    }

    return "-";
  };

  return (
    <>
      <tr className='grade-row' key={assignment.id}>
        <td style={{ maxWidth: "30%" }}>
          <a
            href='#'
            className='assignment-link'
            onClick={() => {
              reconnectFolder();
              navigateToAssignment(assignment?.id);
            }}
          >
            {assignment.name}
          </a>
          <div style={{ fontSize: "14px", color: "rgb(39, 53, 64)" }}>{assignmentGroupName}</div>
        </td>
        <td>{assignment.due_at ? fixDateFormat(assignment.due_at) : ""}</td>
        <td style={{ textAlign: "left" }}>
          {assignment.submission?.submitted_at ? fixDateFormat(assignment.submission?.submitted_at) : ""}
        </td>
        <td style={{ textAlign: "left" }}>
          {assignment.submission?.late && !assignment.submission?.missing && <ContextPill type='late' />}
          {assignment.submission?.missing && <ContextPill type='missing' />}
        </td>
        <td style={{ textAlign: "left", whiteSpace: "nowrap" }}>{renderGrade(assignment)}</td>
        <td>
          {/*Add details button, count twoards final grade, and (comments)?*/}
          {!assignment?.score_statistics ? null : (
            <svg
              viewBox='0 0 1920 1920'
              xmlns='http://www.w3.org/2000/svg'
              style={{
                width: "16px",
                height: "16px",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                cursor: "pointer",
                backgroundColor: "#f2f4f4",
                borderRadius: "4px",
                border: "1px solid #e8eaec",
                color: "rgb(99, 109, 117)",
                padding: ".5em",
              }}
              onClick={hideDetailCallback}
            >
              <path
                d='M1709.289 959.673v854.604H341.808v-797.744h113.947v683.797H1595.34V959.673h113.948ZM1840.35 434.57l79.65 81.586-797.63 779.627-364.518-356.54 79.649-81.36 284.868 278.488 717.982-701.801ZM455.789 105v341.956h341.956v113.947H455.789v341.728H341.842V560.903H0V446.956h341.842V105h113.947Zm1082.533 341.876v113.947h-626.71V446.876h626.71Z'
                fillRule='evenodd'
              />
            </svg>
          )}
          {!assignment?.omit_from_final_grade ? null : (
            <svg
              viewBox='0 0 1920 1920'
              xmlns='http://www.w3.org/2000/svg'
              style={{
                width: "16px",
                height: "16px",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                cursor: "pointer",
                backgroundColor: "#f2f4f4",
                borderRadius: "4px",
                border: "1px solid #e8eaec",
                color: "rgb(99, 109, 117)",
                padding: ".5em",
              }}
              onClick={hideDetailCallback}
            >
              <path
                d='M960 0c530.193 0 960 429.807 960 960s-429.807 960-960 960S0 1490.193 0 960 429.807 0 960 0Zm0 101.053c-474.384 0-858.947 384.563-858.947 858.947S485.616 1818.947 960 1818.947 1818.947 1434.384 1818.947 960 1434.384 101.053 960 101.053Zm-9.32 1221.49c-80.024 0-145.128 65.105-145.128 145.129 0 80.024 65.104 145.128 145.128 145.128 80.024 0 145.128-65.104 145.128-145.128 0-80.024-65.104-145.128-145.128-145.128Zm192.785-968.859h-385.57l93.901 851.327h197.768l93.901-851.327Z'
                fillRule='evenodd'
              />
            </svg>
          )}
        </td>
      </tr>
      <tr
        style={{
          display: detailsHidden || !assignment?.omit_from_final_grade ? "none" : "table-row",
        }}
        className='grade-row-details'
        key={`${assignment.id}-details`}
      >
        <td colSpan='6' style={{ padding: "0.5em 1em" }}>
          <strong>This Assignment does not count twoards the final grade.</strong>
        </td>
      </tr>
      <tr
        style={{
          display: detailsHidden || !assignment?.score_statistics ? "none" : "table-row",
        }}
        className='grade-row-details'
        key={`${assignment.id}-details2`}
      >
        <td colSpan='6' style={{ padding: "0.5em 1em" }}>
          <table
            style={{
              maxWidth: "90%",
              minWidth: "80%",
              borderCollapse: "collapse",
            }}
          >
            <thead style={{ borderBottom: "1px solid #ccc" }}>
              <tr
                style={{
                  width: "100%",
                }}
              >
                <th colSpan='3' style={{ textAlign: "left" }}>
                  Score Details
                </th>
                <th style={{ textAlign: "right", paddingRight: "1em" }}>
                  <a onClick={hideDetailCallback} className='assignment-link' style={{ float: "right", fontWeight: "normal" }}>
                    Close
                  </a>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className='grade-row' style={{ fontSize: "14px", color: "rgb(39, 53, 64)" }}>
                <td>
                  Mean: {assignment?.score_statistics?.mean || "-"} <br /> Median: {assignment?.score_statistics?.median || "-"}{" "}
                </td>
                <td>
                  High: {assignment?.score_statistics?.max || "-"} <br /> Upper Quartile: {assignment?.score_statistics?.median || "-"}{" "}
                </td>
                <td>
                  Low: {assignment?.score_statistics?.min || "0"} <br /> Lower Quartile: {assignment?.score_statistics?.median || "-"}{" "}
                </td>
                <td>
                  <ScoreDistributionGraph assignment={assignment} />
                </td>
              </tr>
            </tbody>
          </table>
        </td>
      </tr>
    </>
  );
}
