/**
 * Renders the page selected by the user using _dangerouslySetInnerHTML
 * @param {Object} page - The page object from the course data
 * @returns {React.Component} The page detail view
 */
function PageDetailView({ page }) {
  const { dirHandle } = useCourseContext();
  const [bodyHtml, setBodyHtml] = useState(page?.body || null);
  const [isLoading, setIsLoading] = useState(!page?.body);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function loadPageBody() {
      if (page?.body) {
        setBodyHtml(page.body);
        setIsLoading(false);
        return;
      }

      if (!dirHandle) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        let pagesHandle = null;
        try {
          pagesHandle = await dirHandle.getDirectoryHandle("Pages");
        } catch (err) {
          console.warn("Pages directory handle not found:", err);
        }

        if (!pagesHandle) {
          if (isMounted) {
            setError("Pages folder not found locally.");
            setIsLoading(false);
          }
          return;
        }

        const targetUrlRaw = (page.url || page.title || "").toLowerCase().trim();
        const targetUrlSanitized = sanitizeFilename(page.url || page.title || "")
          .toLowerCase()
          .trim();
        let matchedFileHandle = null;

        for await (const entry of pagesHandle.values()) {
          if (entry.kind === "file" && (entry.name.endsWith(".html") || entry.name.endsWith(".htm"))) {
            const nameWithoutExt = entry.name
              .replace(/\.html?$/i, "")
              .toLowerCase()
              .trim();
            const nameSanitized = sanitizeFilename(nameWithoutExt).toLowerCase().trim();

            if (
              nameWithoutExt === targetUrlRaw ||
              nameSanitized === targetUrlSanitized ||
              nameWithoutExt.includes(targetUrlSanitized) ||
              targetUrlSanitized.includes(nameSanitized)
            ) {
              matchedFileHandle = entry;
              break;
            }
          }
        }

        if (matchedFileHandle) {
          const file = await matchedFileHandle.getFile();
          const text = await file.text();
          if (isMounted) {
            setBodyHtml(text);
          }
        } else {
          if (isMounted) {
            setError("Page content file not found locally.");
          }
        }
      } catch (err) {
        console.error("Error reading local page file:", err);
        if (isMounted) {
          setError("Failed to load page content.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadPageBody();
    return () => {
      isMounted = false;
    };
  }, [page, dirHandle]);

  if (!page) {
    return <h1>No Page Selected</h1>;
  }

  function customDateFormat(dateStr) {
    if (!dateStr) return null;
    const dateObj = new Date(dateStr);
    return dateObj.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "numeric",
    });
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        marginBottom: "8em",
      }}
    >
      <div className='assignment-student-header' style={{ borderBottom: "2px solid #39454e", paddingBottom: "0.75em" }}>
        <span style={{ display: "flex", flexDirection: "column" }}>
          <span className='assignment-student-header-title'>{page.title}</span>
          <span style={{ fontSize: "14px", color: "#555", marginTop: "4px" }}>
            {page.updated_at
              ? `Last updated: ${customDateFormat(page.updated_at)}`
              : page.created_at
                ? `Created: ${customDateFormat(page.created_at)}`
                : ""}
          </span>
        </span>
        {page.front_page && (
          <span
            style={{
              backgroundColor: "#00842c",
              color: "#fff",
              padding: "4px 10px",
              borderRadius: "12px",
              fontSize: "12px",
              fontWeight: "bold",
              alignSelf: "center",
            }}
          >
            Front Page
          </span>
        )}
      </div>

      <div style={{ marginTop: "1.5em" }}>
        {isLoading && <div style={{ color: "#666", padding: "1em" }}>Loading page content...</div>}
        {error && <div style={{ color: "#c00", padding: "1em", backgroundColor: "#fee", borderRadius: "4px" }}>{error}</div>}
        {!isLoading && !error && bodyHtml && <div className='assignment-details' dangerouslySetInnerHTML={{ __html: bodyHtml }} />}
        {!isLoading && !error && !bodyHtml && <div style={{ color: "#666", padding: "1em" }}>No content available for this page.</div>}
      </div>
    </div>
  );
}
