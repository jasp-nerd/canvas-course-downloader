/**
 * Renders the submission for an assignment.
 * @param {Object} assignment - The assignment to render the submission for.
 * @returns {JSX.Element|null} The submission component.
 */
function CanvasSubmission({ assignment }) {
  const { dirHandle } = useCourseContext();

  if (!assignment || !assignment.submission) {
    return <div style={{ padding: "1rem", color: "#6b7280" }}>No submission data available.</div>;
  }

  // If we are looking at an assignment but haven't re-authenticated the folder handle yet
  if (!dirHandle) {
    return (
      <div
        style={{
          padding: "1.5rem",
          backgroundColor: "#fff3cd",
          color: "#856404",
          border: "1px solid #ffeeba",
          borderRadius: "0.25rem",
          marginTop: "1rem",
        }}
      >
        <strong>Permission Required:</strong> We need permission to read your local files to show submissions. Please select your folder
        from the Dashboard again.
      </div>
    );
  }

  const { submission } = assignment;

  const renderSubmissionBody = () => {
    switch (submission.submission_type) {
      case "online_upload":
        if (!submission.attachments || submission.attachments.length === 0) {
          return <p style={{ color: "#6b7280" }}>No files were attached to this submission.</p>;
        }
        return (
          <div>
            {submission.attachments.map((attachment) => (
              <LocalAttachmentViewer key={attachment.id} attachment={attachment} assignment={assignment} />
            ))}
          </div>
        );

      case "online_text_entry":
        return (
          <div
            style={{
              padding: "1rem",
              backgroundColor: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: "0.25rem",
              boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
              overflowX: "auto",
            }}
            dangerouslySetInnerHTML={{ __html: submission.body }}
          />
        );

      case "online_url":
        return (
          <div
            style={{
              padding: "1rem",
              backgroundColor: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: "0.25rem",
              boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
            }}
          >
            <p style={{ margin: "0 0 0.5rem 0", color: "#4b5563" }}>Submitted URL:</p>
            <a
              href={submission.url}
              target='_blank'
              rel='noopener noreferrer'
              style={{ color: "#2563eb", textDecoration: "none", wordBreak: "break-all" }}
            >
              {submission.url}
            </a>
          </div>
        );

      default:
        return (
          <div
            style={{
              padding: "1rem",
              backgroundColor: "#fefce8",
              border: "1px solid #fef08a",
              borderRadius: "0.25rem",
              color: "#854d0e",
            }}
          >
            Unsupported submission type: {submission.submission_type}
          </div>
        );
    }
  };

  return (
    <div
      style={{
        maxWidth: "56rem",
        margin: "1em 0",
        padding: "1.5rem",
        backgroundColor: "#f9fafb",
        borderRadius: "8px",
        border: "1px solid #e8eaec",
      }}
    >
      <header style={{ marginBottom: "1.5rem", borderBottom: "1px solid #e5e7eb", paddingBottom: "1rem" }}>
        <h3 style={{ fontSize: "1.25rem", fontWeight: "bold", color: "#111827", margin: "0 0 0.5rem 0" }}>Submission</h3>
        <div style={{ display: "flex", gap: "1rem", fontSize: "0.875rem", color: "#4b5563", flexWrap: "wrap" }}>
          <p style={{ margin: 0 }}>
            Status: <span style={{ fontWeight: "600", textTransform: "capitalize" }}>{submission.workflow_state}</span>
          </p>
          <p style={{ margin: 0 }}>Submitted: {new Date(submission.submitted_at).toLocaleString()}</p>
        </div>
      </header>

      <section>{renderSubmissionBody()}</section>
    </div>
  );
}
