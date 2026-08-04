/**
 * Simple component to render the selected annoucement.
 * @returns {React.Component} The AnnouncementDetailComponent
 */
function AnnouncementDetailPage() {
  const { courseData } = useCourseContext();
  const { selectedAnnouncementId, navigateToAnnouncement } = useNavigation();

  if (!courseData) {
    return <div>Loading...</div>;
  }

  const announcement = courseData.Announcements.find((announcement) => announcement.id === selectedAnnouncementId);

  if (!announcement) {
    return <div>Announcement not found.</div>;
  }

  return (
    <div className='page-div' style={{ marginBottom: "4em" }}>
      {/* Header */}
      <div
        style={{
          borderBottom: "1px solid rgb(39, 53, 64)",
          paddingBottom: "1rem",
          marginBottom: "1rem",
        }}
      >
        <h1 style={{ color: "rgb(39, 53, 64)", fontSize: "28.8px" }}>{announcement.title}</h1>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem", color: "#636d75" }}>
          <NameProfileCard
            name={announcement.user_name || announcement.author?.display_name || "Anonymous"}
            date={announcement.posted_at}
            includeProfileCircle={true}
            nameStyle={{ fontWeight: "bold" }}
          />
          <span
            className='assignment-link'
            style={{
              fontWeight: "bold",
              color: "black",
              marginRight: "2em",
              border: "1px solid rgb(232, 234, 236)",
              padding: "0.25em",
              borderRadius: "4px",
              backgroundColor: "rgb(242, 244, 244)",
            }}
            onClick={() => {
              navigateToAnnouncement(null);
            }}
          >
            Back
          </span>
        </div>
      </div>

      {/* Body */}
      <div
        className='announcement-message'
        style={{ fontSize: "16px", lineHeight: "1.6" }}
        dangerouslySetInnerHTML={{ __html: announcement.message }}
      />
    </div>
  );
}
