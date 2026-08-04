/**
 * Displays all of the announcements in a course. The CSS to get the individual annoucementItems was difficult.
 * @returns {React.Component} AnnouncementsPage component.
 */
function AnnouncementsPage() {
  const { courseData, reconnectFolder } = useCourseContext();
  const { navigateToAnnouncement } = useNavigation();

  if (!courseData) {
    return <div>Loading...</div>;
  }
  if (!courseData.Announcements) {
    return <div>No announcements available.</div>;
  }

  function removeHTML(htmlString) {
    return htmlString.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ");
  }

  function announcementItem(announcement, index) {
    return (
      <div
        key={announcement.id}
        style={{
          borderBottom: "1px solid rgb(39, 53, 64)",
          borderTop: index === 0 ? "1px solid rgb(39, 53, 64)" : "none",
          width: "100%",
          boxSizing: "border-box",
          padding: ".75em",
          gap: "1em",

          // THE FIX: Switch from Flexbox to CSS Grid
          display: "grid",
          gridTemplateColumns: "auto 1fr auto",
          alignItems: "center",
        }}
      >
        {/* LEFT COLUMN (auto size based on profile picture) */}
        <div>
          <NameProfileCard
            name={announcement?.user_name || announcement?.author?.display_name || "Anonymous"}
            date={announcement?.posted_at}
            includeName={false}
          />
        </div>

        {/* MIDDLE COLUMN (1fr - strictly takes remaining space) */}
        {/* minWidth: 0 is still required for the grid item so the text can truncate */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            minWidth: 0,
          }}
        >
          <h4
            style={{
              marginBottom: "0",
              marginTop: "0",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              color: "rgb(39, 53, 64)",
            }}
            className='assignment-link'
            onClick={() => {
              console.log("announcement.id", announcement.id);
              reconnectFolder();
              navigateToAnnouncement(announcement.id);
            }}
          >
            {announcement?.title}
          </h4>
          <div
            className='announcement-message'
            style={{
              fontSize: "14px",
              color: "#636d75",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {removeHTML(announcement?.message || "")}
          </div>
        </div>

        {/* RIGHT COLUMN (auto size based on author/date text) */}
        <div>
          <NameProfileCard
            name={announcement?.user_name || announcement?.author?.display_name || "Anonymous"}
            date={announcement?.posted_at}
            includeProfileCircle={false}
            nameStyle={{ textAlign: "right" }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className='page-div' style={{ marginBottom: "4em" }}>
      <h1 style={{ color: "#666666", fontSize: 28.8 }}>Announcements</h1>
      <div style={{ width: "100%" }}>{courseData.Announcements.map((announcement, index) => announcementItem(announcement, index))}</div>
    </div>
  );
}
