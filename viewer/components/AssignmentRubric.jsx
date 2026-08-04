/**
 * This function renders the rubric for an assignment's detailed view.
 * @param {*} rubric - The rubric for the assignment.
 * @returns The rubric component for the assignment.
 */
function AssignmentRubric({ rubric }) {
  if (!Array.isArray(rubric) || rubric.length === 0) {
    return null;
  }

  return (
    <div className='assignment-rubric-container' style={{ marginTop: "1em" }}>
      <h3
        style={{
          fontSize: "1.1em",
          marginBottom: "0.5em",
          color: "#273540",
        }}
      >
        Rubric
      </h3>
      <table
        className='rubric-table'
        style={{
          width: "100%",
          borderCollapse: "collapse",
          border: "1px solid #e8eaec",
          fontSize: "14px",
        }}
      >
        <thead>
          <tr style={{ backgroundColor: "#f2f4f4", textAlign: "left" }}>
            <th
              style={{
                padding: "8px 12px",
                borderBottom: "1px solid #ccc",
              }}
            >
              Criteria
            </th>
            <th
              style={{
                padding: "8px 12px",
                borderBottom: "1px solid #ccc",
              }}
            >
              Ratings
            </th>
            <th
              style={{
                padding: "8px 12px",
                borderBottom: "1px solid #ccc",
                textAlign: "right",
              }}
            >
              Pts
            </th>
          </tr>
        </thead>
        <tbody>
          {rubric.map((crit, idx) => (
            <tr key={crit.id || idx} style={{ borderBottom: "1px solid #e8eaec" }}>
              <td
                style={{
                  padding: "10px 12px",
                  verticalAlign: "top",
                  width: "30%",
                  borderRight: "1px solid #e8eaec",
                }}
              >
                <div className='rubric-popover-wrapper'>
                  <strong>{crit.description}</strong>
                  {crit.long_description && (
                    <div
                      className='rubric-popover'
                      dangerouslySetInnerHTML={{
                        __html: crit.long_description,
                      }}
                    />
                  )}
                </div>
                {crit.long_description && (
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#596a75",
                      marginTop: "4px",
                    }}
                    dangerouslySetInnerHTML={{
                      __html: crit.long_description,
                    }}
                  />
                )}
              </td>
              <td style={{ padding: "10px 12px", verticalAlign: "top" }}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {Array.isArray(crit.ratings) &&
                    crit.ratings.map((rating, rIdx) => {
                      const popoverText = rating.long_description || rating.description;
                      return (
                        <div key={rating.id || rIdx} className='rubric-rating-card'>
                          {popoverText && (
                            <div
                              className='rubric-popover'
                              dangerouslySetInnerHTML={{
                                __html: popoverText,
                              }}
                            />
                          )}
                          <div style={{ fontWeight: "bold", color: "#008148" }}>{rating.points} pts</div>
                          <div>{rating.description}</div>
                        </div>
                      );
                    })}
                </div>
              </td>
              <td
                style={{
                  padding: "10px 12px",
                  verticalAlign: "top",
                  textAlign: "right",
                  fontWeight: "bold",
                  width: "10%",
                }}
              >
                {crit.points} pts
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
