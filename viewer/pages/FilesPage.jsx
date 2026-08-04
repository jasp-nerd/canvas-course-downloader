/**
 * Displays the list of files. This page has to handle parent folders, and files inside those parent folders.
 * @returns {React.Component} The files page
 */

function FilesPage() {
  const { courseData, reconnectFolder } = useCourseContext();
  const { navigateToPage } = useNavigation();
  const [selectedFile, setSelectedFile] = useState(null);

  if (!courseData) {
    return <div>Loading...</div>;
  }
  if (!courseData?.Files || (courseData?.Files?.files?.length === 0 && courseData?.Files?.folders?.length === 0)) {
    return <div>No files available.</div>;
  }
  // Find the ID of the main folder
  const rootFolder = courseData.Files.folders.find((folder) => folder.parent_folder_id === null);

  const [activeFolder, setActiveFolder] = useState(rootFolder ? rootFolder.id : null);

  // Build unified list of files and folders, sorted by display name
  const filesArray = Array.isArray(courseData.Files.files) ? courseData.Files.files : Object.values(courseData.Files.files);
  const foldersArray = Array.isArray(courseData.Files.folders) ? courseData.Files.folders : Object.values(courseData.Files.folders);
  const combinedList = [...filesArray, ...foldersArray]
    .map((item) => {
      if (item.display_name) {
        return { ...item, _type: "file" };
      } else if (item.name) {
        return { ...item, _type: "folder", display_name: item.name };
      }
      return { ...item, _type: "unknown" };
    })
    .sort((a, b) => (a.display_name || "").localeCompare(b.display_name || ""));

  // Filter the combined list by activeFolder
  const filteredList = combinedList.filter((item) => item.parent_folder_id === activeFolder || item.folder_id === activeFolder);

  if (selectedFile) {
    return <FilesPageDetailView file={selectedFile} onBack={() => setSelectedFile(null)} />;
  }

  return (
    <div style={{ width: "100%", marginBottom: "8em" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h1 style={{ color: "#666666", fontSize: 28.8 }}>Files &amp; Folders</h1>
        {activeFolder !== rootFolder?.id && (
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
              setActiveFolder(foldersArray.find((folder) => folder.id === activeFolder)?.parent_folder_id || rootFolder || null);
            }}
          >
            Back
          </span>
        )}
      </div>
      <div className='pages-container' style={{ width: "100%" }}>
        <table className='pages-table' style={{ width: "100%" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid rgb(39, 53, 64)" }}>
              <th style={{ minWidth: "fit-content", whiteSpace: "nowrap" }}>Title</th>
              <th style={{ minWidth: "fit-content", whiteSpace: "nowrap" }}>Type</th>
              <th style={{ minWidth: "fit-content", whiteSpace: "nowrap" }}>Creation Date</th>
              <th style={{ minWidth: "fit-content", whiteSpace: "nowrap" }}>Updated at</th>
            </tr>
          </thead>
          <tbody>
            {filteredList.map((item, index) => (
              <tr key={item.id || index} style={{ backgroundColor: index % 2 === 0 ? "#f2f4f4" : "white" }}>
                <td>
                  {item._type === "folder" ? (
                    <a
                      className='assignment-link'
                      style={{ fontWeight: "bold", color: "black" }}
                      onClick={(e) => {
                        e.preventDefault();
                        reconnectFolder();
                        setActiveFolder(item.id);
                        setSelectedFile(null);
                      }}
                    >
                      {item.display_name}
                    </a>
                  ) : (
                    <a
                      className='assignment-link'
                      onClick={(e) => {
                        e.preventDefault();
                        reconnectFolder();
                        setSelectedFile(item);
                      }}
                    >
                      {item.display_name}
                    </a>
                  )}
                </td>
                <td>{item._type === "folder" ? "folder" : item["content-type"]}</td>
                <td style={{ minWidth: "fit-content", whiteSpace: "nowrap" }}>
                  {item.created_at
                    ? new Date(item.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
                    : "-"}
                </td>
                <td style={{ minWidth: "fit-content", whiteSpace: "nowrap" }}>
                  {item.updated_at
                    ? new Date(item.updated_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
                    : "-"}
                </td>
              </tr>
            ))}
            {filteredList.length === 0 && (
              <tr>
                <td colSpan={4}>
                  No files in this folder,{" "}
                  <a
                    className='assignment-link'
                    onClick={() =>
                      setActiveFolder(foldersArray.find((folder) => folder.id === activeFolder)?.parent_folder_id || rootFolder || null)
                    }
                  >
                    Back
                  </a>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
