/**
 * Takes a type of ["missing", "late"]
 * returns a span with the appropriate color and text for the context pill.
 * @param {string} type - The type of context pill to display.
 * @returns {React.Component} either styled missing or late
 */
function ContextPill({ type }) {
  const commonStyles = {
    padding: "2px 6px",
    borderRadius: "4px",
    fontSize: "14px",
    fontWeight: "light",
    textTransform: "lowercase",
    borderRadius: "999rem",
  };
  let borderColor = type === "missing" ? "rgb(230, 36, 41)" : type === "late" ? "rgb(43, 122, 188)" : "#e2e3e5";
  let textColor = type === "missing" ? "rgb(230, 36, 41)" : type === "late" ? "rgb(43, 122, 188)" : "#383d41";

  return (
    <span
      style={{
        ...commonStyles,
        border: `1px solid ${borderColor}`,
        color: textColor,
      }}
    >
      {type}
    </span>
  );
}
