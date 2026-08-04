/**
 * Creates the discussions page, which lists all the discussions in a course.
 * @returns {React.Component} the discussions page
 */

function DiscussionsPage() {
  const { courseData, reconnectFolder } = useCourseContext();
  const { navigateToDiscussion } = useNavigation();
  if (!courseData) {
    return <div>Loading...</div>;
  }
  if (!courseData.Discussions || Object.keys(courseData?.Discussions || {}).length === 0) {
    return <div>No discussions available.</div>;
  }
  // Convert dictionary object or array into a flat array of assignments
  const discussionList = Array.isArray(courseData.Discussions) ? courseData.Discussions : Object.values(courseData.Discussions);
  // sort discussions by reverse due date order
  discussionList.sort((a, b) => {
    return new Date(b.due_at) - new Date(a.due_at);
  });

  function DiscussionTableItemDetails({ discussion }) {
    const indent = 0;
    return (
      <div
        className='assignment-details'
        style={{
          display: "flex",
          alignItems: "center",
          paddingLeft: `${indent * 1}em`,
          justifyContent: "space-between",
          width: "100%",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
          }}
        >
          <CanvasItemIcon icon_type={"discussion"} />
          <div>
            <h3
              className='assignment-info-title'
              style={{ fontSize: "16px", margin: "0", color: "#273450", cursor: "pointer" }}
              onClick={() => {
                reconnectFolder();
                if (discussion?.id) {
                  navigateToDiscussion(discussion.id);
                }
              }}
            >
              {discussion.title}
            </h3>
            <span className='assignment-info-item' style={{ color: "#666666", fontSize: 14, marginLeft: "0em" }}>
              <strong>Last post at {discussion?.last_reply_at ? fixDateFormat(discussion?.last_reply_at) : "-"}</strong>
            </span>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            flexDirection: "column",
            marginLeft: "2em",
            textAlign: "right",
            justifyContent: "right",
          }}
        >
          {discussion?.view && (
            <h3 className='' style={{ fontSize: "16px", fontWeight: "normal", margin: "0", color: "#273450", cursor: "default" }}>
              {discussion?.view?.view?.length || "0"} Replies
            </h3>
          )}
          {discussion?.assignment && (
            <h3 className='' style={{ fontSize: "16px", fontWeight: "normal", margin: "0", color: "#273450", cursor: "default" }}>
              Due {fixDateFormat(discussion?.assignment?.due_at)}
            </h3>
          )}
        </div>
      </div>
    );
  }

  if (courseData.Discussions) {
    return (
      <div className='page-div' style={{ marginBottom: "4em" }}>
        <h1 style={{ color: "#666666", fontSize: 28.8 }}>Discussions</h1>
        <CollapseTable title='Discussions'>
          {discussionList.map((discussion, index) => (
            <DiscussionTableItemDetails discussion={discussion} key={discussion.id} />
          ))}
        </CollapseTable>
      </div>
    );
  }
}
