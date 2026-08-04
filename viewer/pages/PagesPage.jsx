/**
 * Creates the list of pages for the course.
 * @returns {JSX.Element} list of pages for the entire course
 */
function PagesPage() {
  const { courseData } = useCourseContext();
  const { navigateToPage } = useNavigation();

  if (!courseData) {
    return <div>Loading...</div>;
  }
  if (!courseData.Pages || courseData.Pages.length === 0) {
    return <div>No pages available.</div>;
  }

  const pagesList = Array.isArray(courseData.Pages) ? courseData.Pages : Object.values(courseData.Pages);

  return (
    <div style={{ width: "100%", marginBottom: "8em" }}>
      <h1 style={{ color: "#666666", fontSize: 28.8 }}>Pages</h1>
      <div className='pages-container' style={{ width: "100%" }}>
        <table className='pages-table' style={{ width: "100%" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid rgb(39, 53, 64)" }}>
              <th style={{ minWidth: "fit-content", whiteSpace: "nowrap" }}>Title</th>
              <th style={{ minWidth: "fit-content", whiteSpace: "nowrap" }}>Creation Date</th>
              <th style={{ minWidth: "fit-content", whiteSpace: "nowrap" }}>Updated at</th>
            </tr>
          </thead>
          <tbody>
            {pagesList.map((page, index) => (
              <tr key={page.page_id || page.url || page.id || index} style={{ backgroundColor: index % 2 === 0 ? "#f2f4f4" : "white" }}>
                <td>
                  <a
                    className='assignment-link'
                    onClick={(e) => {
                      e.preventDefault();
                      navigateToPage(page.url || page.page_id || page.id);
                    }}
                  >
                    {page.title}
                  </a>
                  {page.front_page && (
                    <span
                      style={{
                        marginLeft: "8px",
                        fontSize: "11px",
                        backgroundColor: "#00842c",
                        color: "#fff",
                        padding: "2px 6px",
                        borderRadius: "10px",
                        fontWeight: "bold",
                      }}
                    >
                      Front Page
                    </span>
                  )}
                </td>
                <td style={{ minWidth: "fit-content", whiteSpace: "nowrap" }}>
                  {page.created_at
                    ? new Date(page.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
                    : "-"}
                </td>
                <td style={{ minWidth: "fit-content", whiteSpace: "nowrap" }}>
                  {page.updated_at
                    ? new Date(page.updated_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
                    : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
