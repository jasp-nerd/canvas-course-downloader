/**
 * Displays a threadded view of the currently selected discussion
 * @param {number} discussionId - The ID of the discussion to display.
 * @returns A React component that displays a threadded view of the currently selected discussion.
 */
function DiscussionDetailView({ discussionId }) {
  const { courseData } = useCourseContext();
  if (!courseData) {
    return <div>Loading...</div>;
  }
  if (!courseData.Discussions) {
    return <div>No discussions available.</div>;
  }
  const discussion = courseData.Discussions[discussionId];

  function renderDiscussionBody() {
    const view = discussion?.view?.view; // List of all replies
    const participants = discussion?.view?.participants; // List of all participants
    if (!view) {
      return <div>No discussion body available.</div>;
    }
    if (!participants) {
      return <div>No participants available.</div>;
    }
    return view.map((reply) => {
      const [repliesHidden, setHidden] = useState(true);
      if (reply?.deleted) {
        return "";
      }
      return (
        <div
          key={reply.id}
          style={{
            border: "1px solid rgb(235, 236, 237)",
            borderRadius: "4px",
            padding: "1em",
            marginTop: "1em",
            flexDirection: "column",
          }}
        >
          <NameProfileCard
            name={participants.find((participant) => participant.id === reply?.user_id)?.display_name || "Unknown"}
            date={reply.created_at}
          />
          <div
            className='discussion-description'
            style={{ marginBottom: "0em", maxWidth: "100%" }}
            dangerouslySetInnerHTML={{ __html: reply?.message }}
          ></div>
          {reply?.replies && reply?.replies?.length > 0 && (
            <a
              onClick={() => {
                setHidden(!repliesHidden);
              }}
              className='assignment-link'
              style={{ display: "flex", alignItems: "center", gap: "5px" }}
            >
              {repliesHidden ? "Show Replies " : "Hide Replies"}
              <svg
                style={{
                  height: "15px",
                  width: "15px",
                  fill: "rgb(14, 104, 179)",
                  transform: repliesHidden ? "rotate(0deg)" : "rotate(90deg)",
                }}
                viewBox='0 0 1920 1920'
                xmlns='http://www.w3.org/2000/svg'
              >
                <path d='M526.299 0 434 92.168l867.636 867.767L434 1827.57l92.299 92.43 959.935-960.065z' fill='currentColor' />
              </svg>
            </a>
          )}
          {!repliesHidden &&
            reply?.replies?.map((reply) => {
              if (reply?.deleted) {
                return "";
              }
              return (
                <div
                  key={reply.id}
                  style={{
                    border: "1px solid rgb(235, 236, 237)",
                    borderRadius: "4px",
                    padding: "1em",
                    marginTop: "1em",
                    flexDirection: "column",
                  }}
                >
                  <NameProfileCard
                    name={participants.find((participant) => participant.id === reply?.user_id)?.display_name || "Unknown"}
                    date={reply.created_at}
                  />
                  <div
                    className='discussion-description'
                    style={{ marginBottom: "0em", maxWidth: "100%" }}
                    dangerouslySetInnerHTML={{ __html: reply?.message }}
                  ></div>
                </div>
              );
            })}
        </div>
      );
    });
  }
  console.log("Rendering Discussion ID: ", discussionId);
  return (
    <div className='page-div' style={{ marginBottom: "4em" }}>
      <div
        className='discussion-header'
        style={{
          display: "flex",
          alignItems: "left",
          marginBottom: "1rem",
          border: "1px solid rgb(235, 236, 237)",
          borderRadius: "4px",
          padding: "1em",
          marginTop: "2em",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            color: "rgb(39, 53, 64)",
            marginBottom: "1em",
          }}
        >
          <span>Due {fixDateFormat(discussion?.assignment?.due_at) || "Never"}</span>
          <span style={{ fontSize: "14px" }}>{discussion?.assignment?.points_possible || "0"} Points Possible</span>
        </div>
        <NameProfileCard
          name={discussion?.author?.display_name || "Anonnymous"}
          date={discussion?.delayed_post_at || discussion?.created_at || discussion?.last_reply_at || discussion?.posted_at}
        />
        <h2 style={{ color: "rgb(39, 53, 64)", fontSize: "28.8px", marginBottom: "0em" }}>{discussion?.title}</h2>
        <div
          className='discussion-description'
          dangerouslySetInnerHTML={{ __html: discussion?.message || "No discription provided." }}
        ></div>
      </div>
      <div
        className='discussion-body'
        style={{
          display: "flex",
          alignItems: "left",
          marginBottom: "1rem",
          padding: "1em",
          marginTop: "2em",
          flexDirection: "column",
        }}
      >
        {renderDiscussionBody()}
      </div>
    </div>
  );
}
