/**
 * The detail view for a file. It displays the file's information and the file itself. Utilizes the LocalAtatchment Viewer which was created for submission viewing.
 * @param {*} file - The file to display.
 * @param {*} onBack - The function to call when the back button is clicked.
 * @returns {React.Component} The files page detail view
 */
function FilesPageDetailView({ file, onBack }) {
  if (!file) {
    return <h1>No File Selected</h1>;
  }

  const formattedCreated = file.created_at
    ? new Date(file.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
    : "-";
  const formattedUpdated = file.updated_at
    ? new Date(file.updated_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
    : "-";
  const formattedSize = file.size ? (file.size / 1024).toFixed(1) + " KB" : "-";

  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%", marginBottom: "8em", marginTop: "1em" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <h2 style={{ color: "#666666", fontSize: 24, margin: 0 }}>{file.display_name || file.filename}</h2>
        <button
          onClick={onBack}
          style={{ background: "#00842c", color: "#fff", border: "none", borderRadius: "4px", padding: "6px 12px", cursor: "pointer" }}
        >
          Back
        </button>
      </div>
      <div
        style={{
          marginBottom: "1.5rem",
          backgroundColor: "#f9fafb",
          padding: "1rem",
          borderRadius: "0.5rem",
          border: "1px solid #e5e7eb",
        }}
      >
        <p style={{ margin: "0.25rem 0" }}>
          <strong>Type:</strong> {file["content-type"] || file.mime_class || "unknown"}
        </p>
        <p style={{ margin: "0.25rem 0" }}>
          <strong>Size:</strong> {formattedSize}
        </p>
        <p style={{ margin: "0.25rem 0" }}>
          <strong>Created:</strong> {formattedCreated}
        </p>
        <p style={{ margin: "0.25rem 0" }}>
          <strong>Updated:</strong> {formattedUpdated}
        </p>
      </div>
      <LocalAttachmentViewer file={file} />
    </div>
  );
}
