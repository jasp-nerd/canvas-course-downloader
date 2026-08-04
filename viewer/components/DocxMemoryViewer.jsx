/**
 * Uses mammoth to convert doc and docx to local attatchments
 * @param {*} fileObject - The file object to convert.
 * @param {*} fileUrl - The URL of the file to convert.
 * @returns The docx viewer component for the assignment.
 */
function DocxMemoryViewer({ fileObject, fileUrl }) {
  const [htmlContent, setHtmlContent] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function convertDocx() {
      try {
        let arrayBuffer = null;
        if (fileObject) {
          arrayBuffer = await fileObject.arrayBuffer();
        } else if (fileUrl) {
          const res = await fetch(fileUrl);
          arrayBuffer = await res.arrayBuffer();
        }
        if (!arrayBuffer) return;
        // Converts binary .docx directly to raw HTML string
        const result = await window.mammoth.convertToHtml({ arrayBuffer });
        setHtmlContent(result.value);
      } catch (err) {
        console.error("Failed to parse docx", err);
      } finally {
        setLoading(false);
      }
    }
    if (fileObject || fileUrl) convertDocx();
  }, [fileObject, fileUrl]);

  if (loading) return <div>Parsing document...</div>;

  return (
    <div
      style={{
        padding: "1.5rem",
        backgroundColor: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: "0.25rem",
        maxHeight: "30rem",
        overflowY: "auto",
        width: "100%",
      }}
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
}