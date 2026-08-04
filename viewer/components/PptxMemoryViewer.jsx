/**
 * This function renders a PPTX file to an HTML page using the pptxviewjs library.
 * @param {*} fileObject - The file object to render.
 * @param {*} fileName - The name of the file to render.
 * @returns The pptx viewer component for the assignment.
 */
function PptxMemoryViewer({ fileObject, fileName = "presentation.pptx" }) {
  const canvasRef = React.useRef(null);
  const viewerRef = React.useRef(null);

  const [loading, setLoading] = useState(true);
  const [renderFailed, setRenderFailed] = useState(false);
  const [fallbackUrl, setFallbackUrl] = useState(null);

  // Generate fallback URL for extraction if render fails
  useEffect(() => {
    if (!fileObject) return;
    const url = URL.createObjectURL(fileObject);
    setFallbackUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [fileObject]);

  useEffect(() => {
    let isMounted = true;

    async function renderSlides() {
      if (!fileObject || !canvasRef.current) return;

      try {
        setLoading(true);

        const ViewerClass =
          window.PPTXViewer ||
          (window.PptxViewJS && window.PptxViewJS.PPTXViewer) ||
          (window.pptxviewjs && window.pptxviewjs.PPTXViewer) ||
          window.PptxViewJS;

        if (!ViewerClass) {
          throw new Error("PptxViewJS script tag not loaded or global unavailable.");
        }

        const viewer = new ViewerClass({ canvas: canvasRef.current });
        viewerRef.current = viewer;

        const arrayBuffer = await fileObject.arrayBuffer();

        await viewer.loadFile(arrayBuffer);
        await viewer.render();
      } catch (err) {
        console.warn("PptxViewJS render failed, switching to extraction fallback:", err);
        if (isMounted) {
          setRenderFailed(true);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    renderSlides();

    return () => {
      isMounted = false;
    };
  }, [fileObject]);

  const handleNextSlide = async () => {
    try {
      if (viewerRef.current?.nextSlide) {
        await viewerRef.current.nextSlide();
      }
    } catch (e) {
      console.log("End of presentation reached.");
    }
  };

  const handlePrevSlide = async () => {
    try {
      if (viewerRef.current?.previousSlide) {
        await viewerRef.current.previousSlide();
      }
    } catch (e) {
      console.log("Beginning of presentation reached.");
    }
  };

  if (renderFailed) {
    return (
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
          style={{ width: "3rem", height: "3rem", color: "#f97316", marginBottom: "0.75rem" }}
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth='2'
            d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
          ></path>
        </svg>
        <p style={{ color: "#374151", fontWeight: "500", margin: "0 0 0.25rem 0" }}>Complex PowerPoint File</p>
        <p style={{ fontSize: "0.875rem", color: "#6b7280", margin: "0 0 1rem 0" }}>Unable to preview slides inline.</p>
        {fallbackUrl && (
          <a
            href={fallbackUrl}
            download={fileName}
            style={{
              backgroundColor: "#dbeafe",
              color: "#1d4ed8",
              padding: "0.5rem 1rem",
              borderRadius: "0.25rem",
              fontWeight: "500",
              textDecoration: "none",
            }}
          >
            Extract to view in PowerPoint
          </a>
        )}
      </div>
    );
  }

  return (
    <div
      style={{
        width: "100%",
        minHeight: "450px",
        padding: "1.5rem",
        backgroundColor: "#2a2d32",
        border: "1px solid #e5e7eb",
        borderRadius: "0.375rem",
        boxSizing: "border-box",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {loading && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#2a2d32",
            color: "#fff",
            zIndex: 10,
            borderRadius: "0.375rem",
          }}
        >
          Loading Presentation...
        </div>
      )}

      {/* 
        This style block forces the browser to ignore the library's inline pixel 
        widths and stretch the canvas to fill the max-width container below.
      */}
      <style>
        {`
          .forced-full-width {
            width: 100% !important;
            height: auto !important;
          }
        `}
      </style>

      <div
        style={{
          width: "100%",
          maxWidth: "960px", // The slides will safely scale up to this width
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          opacity: loading ? 0 : 1,
          transition: "opacity 0.3s ease",
        }}
      >
        <canvas
          ref={canvasRef}
          className='forced-full-width'
          style={{
            display: "block",
            backgroundColor: "#fff",
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.6), 0 8px 10px -6px rgba(0, 0, 0, 0.4)",
            borderRadius: "4px",
          }}
        />
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "1rem",
          marginTop: "1.25rem",
          opacity: loading ? 0 : 1,
          pointerEvents: loading ? "none" : "auto",
        }}
      >
        <button
          onClick={handlePrevSlide}
          style={{
            padding: "0.5rem 1.25rem",
            cursor: "pointer",
            borderRadius: "4px",
            border: "1px solid #4b5563",
            backgroundColor: "#374151",
            color: "white",
            fontWeight: "500",
          }}
        >
          &larr; Previous Slide
        </button>
        <button
          onClick={handleNextSlide}
          style={{
            padding: "0.5rem 1.25rem",
            cursor: "pointer",
            borderRadius: "4px",
            border: "1px solid #4b5563",
            backgroundColor: "#374151",
            color: "white",
            fontWeight: "500",
          }}
        >
          Next Slide &rarr;
        </button>
      </div>
    </div>
  );
}
