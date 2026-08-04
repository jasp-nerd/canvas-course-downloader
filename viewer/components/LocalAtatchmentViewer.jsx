/** Sub-component to handle asynchronous file loading and memory cleanup
 * @param {Object} attachment - The attachment object
 * @param {Object} assignment - The assignment object
 * @param {Object} file - The file object
 * @returns {React.Component} The local attachment viewer
 */
function LocalAttachmentViewer({ attachment, assignment, file }) {
  const { dirHandle, courseData } = useCourseContext();
  const [fileUrl, setFileUrl] = useState(null);
  const [fileObject, setFileObject] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const targetFile = file || attachment;
  const rawFileName = targetFile ? targetFile.display_name || targetFile.filename || "" : "";
  const sanitizedAssignmentName = assignment ? sanitizeFilename(assignment.name) : "";
  const sanitizedFileName = sanitizeFilename(rawFileName);

  // Fetch the file from the File System API and create a readable URL
  useEffect(() => {
    if (!targetFile) {
      setError("No file specified.");
      setIsLoading(false);
      return;
    }

    if (!dirHandle) {
      setError("No directory access.");
      setIsLoading(false);
      return;
    }

    let objectUrl = null;

    async function loadLocalFile() {
      try {
        setIsLoading(true);
        setError(null);

        if (!dirHandle) {
          throw new Error("No directory access handle available.");
        }

        let matchedFileHandle = null;

        if (assignment) {
          // 1. Access the "Submissions" directory
          const submissionsHandle = await dirHandle.getDirectoryHandle("Submissions");

          // Targets for assignment folder
          const targetFolderSanitized = sanitizeFilename(assignment.name).toLowerCase().trim();
          const targetFolderRaw = (assignment.name || "").toLowerCase().trim();

          let assignmentHandle = null;

          // 2. FIND ASSIGNMENT FOLDER
          try {
            assignmentHandle = await submissionsHandle.getDirectoryHandle(targetFolderSanitized);
          } catch (err) {
            for await (const entry of submissionsHandle.values()) {
              if (entry.kind === "directory") {
                const folderName = entry.name.toLowerCase().trim();
                const folderSanitized = sanitizeFilename(entry.name).toLowerCase().trim();

                if (
                  folderName === targetFolderRaw ||
                  folderName === targetFolderSanitized ||
                  folderSanitized === targetFolderSanitized ||
                  folderName.includes(targetFolderSanitized) ||
                  targetFolderSanitized.includes(folderName)
                ) {
                  assignmentHandle = entry;
                  break;
                }
              }
            }
          }

          if (!assignmentHandle) {
            throw new Error(`Assignment folder not found for: "${assignment.name}"`);
          }

          // Prepare target file strings
          const rawTarget = (targetFile.display_name || targetFile.filename || "").toLowerCase().trim();
          const sanitizedTarget = sanitizeFilename(rawTarget).toLowerCase().trim();
          const currentAttemptNumber = assignment?.submission?.attempt;

          const expectedAttemptPrefix = currentAttemptNumber ? `attempt ${currentAttemptNumber} - ` : null;
          const attemptPrefixRegex = /^attempt\s+\d+\s*-\s*/i;

          // 3. SEARCH FOR ATTACHMENT FILE IN ASSIGNMENT FOLDER
          for await (const entry of assignmentHandle.values()) {
            if (entry.kind === "file") {
              const diskNameRaw = entry.name.toLowerCase().trim();
              const diskNameSanitized = sanitizeFilename(entry.name).toLowerCase().trim();

              const diskNameUnprefixedRaw = diskNameRaw.replace(attemptPrefixRegex, "").trim();
              const diskNameUnprefixedSanitized = sanitizeFilename(diskNameUnprefixedRaw).toLowerCase().trim();

              const matchesExactAttemptPrefix = expectedAttemptPrefix && diskNameRaw.startsWith(expectedAttemptPrefix);

              const isMatch =
                (matchesExactAttemptPrefix && diskNameUnprefixedSanitized === sanitizedTarget) ||
                diskNameRaw === rawTarget ||
                diskNameRaw === sanitizedTarget ||
                diskNameSanitized === sanitizedTarget ||
                diskNameUnprefixedRaw === rawTarget ||
                diskNameUnprefixedRaw === sanitizedTarget ||
                diskNameUnprefixedSanitized === sanitizedTarget ||
                diskNameUnprefixedRaw.replace(/\+/g, " ") === rawTarget ||
                (diskNameRaw.includes(sanitizedTarget) && diskNameRaw.endsWith(sanitizedTarget.slice(-5)));

              if (isMatch) {
                matchedFileHandle = entry;
                break;
              }
            }
          }

          if (!matchedFileHandle) {
            throw new Error(`File "${rawTarget}" not found in folder "${assignmentHandle.name}"`);
          }
        } else {
          // --- COURSE FILE (Files/...) LOOKUP ---
          const filesHandle = await dirHandle.getDirectoryHandle("Files");

          // Determine subfolder path from folder_id in courseData.Files.folders
          let folderPathParts = [];
          if (targetFile.folder_id && courseData?.Files?.folders) {
            const foldersArray = Array.isArray(courseData.Files.folders)
              ? courseData.Files.folders
              : Object.values(courseData.Files.folders);
            const folderMap = new Map(foldersArray.map((f) => [String(f.id), f]));
            const fileFolder = folderMap.get(String(targetFile.folder_id));

            if (fileFolder && fileFolder.full_name) {
              let fn = fileFolder.full_name;
              if (fn.toLowerCase().startsWith("course files")) {
                fn = fn.slice("course files".length);
              }
              folderPathParts = fn
                .split("/")
                .map((s) => s.trim())
                .filter(Boolean);
            } else if (fileFolder) {
              const parts = [];
              let curr = fileFolder;
              while (curr && curr.parent_folder_id !== null && curr.name !== "course files") {
                parts.unshift(curr.name);
                curr = folderMap.get(String(curr.parent_folder_id));
              }
              folderPathParts = parts;
            }
          }

          // Traverse into target folder if specified
          let targetDirHandle = filesHandle;
          for (const part of folderPathParts) {
            let nextHandle = null;
            const partRaw = part.toLowerCase().trim();
            const partSanitized = sanitizeFilename(part).toLowerCase().trim();

            try {
              nextHandle = await targetDirHandle.getDirectoryHandle(part);
            } catch (e) {
              try {
                nextHandle = await targetDirHandle.getDirectoryHandle(sanitizeFilename(part));
              } catch (e2) {
                for await (const entry of targetDirHandle.values()) {
                  if (entry.kind === "directory") {
                    const entryRaw = entry.name.toLowerCase().trim();
                    const entrySanitized = sanitizeFilename(entry.name).toLowerCase().trim();
                    if (entryRaw === partRaw || entrySanitized === partSanitized || entrySanitized === sanitizeFilename(partRaw)) {
                      nextHandle = entry;
                      break;
                    }
                  }
                }
              }
            }

            if (nextHandle) {
              targetDirHandle = nextHandle;
            } else {
              break;
            }
          }

          const rawTarget = (targetFile.display_name || targetFile.filename || "").toLowerCase().trim();
          const sanitizedTarget = sanitizeFilename(rawTarget).toLowerCase().trim();

          // Search inside targetDirHandle
          for await (const entry of targetDirHandle.values()) {
            if (entry.kind === "file") {
              const diskNameRaw = entry.name.toLowerCase().trim();
              const diskNameSanitized = sanitizeFilename(entry.name).toLowerCase().trim();
              if (
                diskNameRaw === rawTarget ||
                diskNameRaw === sanitizedTarget ||
                diskNameSanitized === sanitizedTarget ||
                diskNameRaw.replace(/\+/g, " ") === rawTarget ||
                diskNameSanitized.replace(/\+/g, " ") === sanitizedTarget
              ) {
                matchedFileHandle = entry;
                break;
              }
            }
          }

          // Fallback 1: Search top-level Files directory if targetDirHandle was a subfolder
          if (!matchedFileHandle && targetDirHandle !== filesHandle) {
            for await (const entry of filesHandle.values()) {
              if (entry.kind === "file") {
                const diskNameRaw = entry.name.toLowerCase().trim();
                const diskNameSanitized = sanitizeFilename(entry.name).toLowerCase().trim();
                if (
                  diskNameRaw === rawTarget ||
                  diskNameRaw === sanitizedTarget ||
                  diskNameSanitized === sanitizedTarget ||
                  diskNameRaw.replace(/\+/g, " ") === rawTarget
                ) {
                  matchedFileHandle = entry;
                  break;
                }
              }
            }
          }

          // Fallback 2: Recursive search under filesHandle if still not found
          if (!matchedFileHandle) {
            async function findRecursive(dir) {
              for await (const entry of dir.values()) {
                if (entry.kind === "file") {
                  const diskNameRaw = entry.name.toLowerCase().trim();
                  const diskNameSanitized = sanitizeFilename(entry.name).toLowerCase().trim();
                  if (
                    diskNameRaw === rawTarget ||
                    diskNameRaw === sanitizedTarget ||
                    diskNameSanitized === sanitizedTarget ||
                    diskNameRaw.replace(/\+/g, " ") === rawTarget
                  ) {
                    return entry;
                  }
                } else if (entry.kind === "directory") {
                  const found = await findRecursive(entry);
                  if (found) return found;
                }
              }
              return null;
            }
            matchedFileHandle = await findRecursive(filesHandle);
          }

          if (!matchedFileHandle) {
            throw new Error(`File "${rawTarget}" not found in Files directory.`);
          }
        }

        // 4. Retrieve File Object
        const loadedFile = await matchedFileHandle.getFile();
        setFileObject(loadedFile);

        // 5. Create Object URL
        objectUrl = URL.createObjectURL(loadedFile);
        setFileUrl(objectUrl);
      } catch (err) {
        console.warn(`Could not load local file: "${rawFileName}"`, err);
        setError(err.message || "File or directory not found locally.");
      } finally {
        setIsLoading(false);
      }
    }

    loadLocalFile();

    // CRITICAL: Prevent memory leaks by revoking the URL when the component unmounts
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [dirHandle, courseData, sanitizedAssignmentName, sanitizedFileName, targetFile?.id, targetFile?.folder_id]);

  const mimeClass = getMimeClass(targetFile);
  const formattedSize = targetFile?.size ? (targetFile.size / 1024).toFixed(1) + " KB" : "-";

  if (isLoading) {
    return (
      <div
        style={{
          padding: "1rem",
          backgroundColor: "#f3f4f6",
          border: "1px solid #e5e7eb",
          borderRadius: "0.25rem",
          marginBottom: "1rem",
        }}
      >
        Loading {rawFileName}...
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          padding: "1rem",
          backgroundColor: "#fef2f2",
          border: "1px solid #fecaca",
          color: "#991b1b",
          borderRadius: "0.25rem",
          marginBottom: "1rem",
        }}
      >
        {error} ({sanitizedFileName})
      </div>
    );
  }

  let content;
  switch (mimeClass) {
    case "image":
      content = (
        <img
          src={fileUrl}
          alt={rawFileName}
          style={{ maxWidth: "100%", height: "auto", border: "1px solid #e5e7eb", borderRadius: "0.25rem" }}
        />
      );
      break;

    case "video":
      content = (
        <video controls style={{ width: "100%", maxWidth: "42rem", border: "1px solid #e5e7eb", borderRadius: "0.25rem" }}>
          <source src={fileUrl} />
          Your browser does not support the video tag.
        </video>
      );
      break;

    case "pdf":
    case "text":
    case "html":
      content = (
        <iframe
          src={fileUrl}
          title={rawFileName}
          style={{ width: "100%", height: "24rem", border: "1px solid #e5e7eb", borderRadius: "0.25rem", backgroundColor: "#fff" }}
        />
      );
      break;

    case "doc":
      // Render .docx directly to HTML in memory!
      content = <DocxMemoryViewer fileObject={fileObject} fileUrl={fileUrl} />;
      break;
    case "ppt":
      content = <PptxMemoryViewer fileObject={fileObject} fileUrl={fileUrl} />;
      break;
    case "xls":
      content = (
        <div
          style={{
            padding: "2rem",
            backgroundColor: "#f9fafb",
            border: "1px solid #e5e7eb",
            borderRadius: "0.25rem",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <svg
            style={{ width: "3rem", height: "3rem", color: "#3b82f6", marginBottom: "0.75rem" }}
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth='2'
              d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
            ></path>
          </svg>
          <p style={{ color: "#374151", fontWeight: "500", margin: "0 0 0.25rem 0" }}>Local Document File</p>
          <p style={{ fontSize: "0.875rem", color: "#6b7280", margin: "0 0 1rem 0" }}>
            Browsers cannot preview {mimeClass} files directly.
          </p>
          <a
            href={fileUrl}
            download={sanitizedFileName} // Prompts browser to "save as" so user can open natively
            style={{
              backgroundColor: "#dbeafe",
              color: "#1d4ed8",
              padding: "0.5rem 1rem",
              borderRadius: "0.25rem",
              fontWeight: "500",
              textDecoration: "none",
            }}
          >
            Extract to view
          </a>
        </div>
      );
      break;

    default:
      content = (
        <div
          style={{
            padding: "1rem",
            backgroundColor: "#f3f4f6",
            border: "1px solid #e5e7eb",
            borderRadius: "0.25rem",
            textAlign: "center",
          }}
        >
          <p style={{ color: "#4b5563", margin: 0 }}>Preview not available for this file type.</p>
        </div>
      );
  }

  return (
    <div
      style={{
        marginBottom: "1.5rem",
        backgroundColor: "#fff",
        padding: "1rem",
        borderRadius: "0.5rem",
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        border: "1px solid #e5e7eb",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
        <h4
          title={rawFileName}
          style={{
            fontWeight: "600",
            color: "#1f2937",
            margin: 0,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            maxWidth: "60%",
          }}
        >
          {rawFileName}
        </h4>

        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <span style={{ fontSize: "0.75rem", color: "#6b7280" }}>{formattedSize}</span>
          <a
            href={fileUrl}
            download={sanitizedFileName}
            style={{
              backgroundColor: "#2563eb",
              color: "#fff",
              fontSize: "0.875rem",
              padding: "0.25rem 0.75rem",
              borderRadius: "0.25rem",
              textDecoration: "none",
            }}
          >
            Extract
          </a>
        </div>
      </div>
      <div
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "center",
          backgroundColor: "#f9fafb",
          borderRadius: "0.25rem",
          padding: "0.5rem",
          boxSizing: "border-box",
        }}
      >
        {content}
      </div>
    </div>
  );
}