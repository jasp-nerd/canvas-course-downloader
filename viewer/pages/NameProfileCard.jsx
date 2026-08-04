/**
 * Canvas-esque name profile card
 * @param {Object} props
 * @param {string} props.name - The name to display
 * @param {string} props.date - The date to display
 * @param {boolean} props.includeProfileCircle - Whether to include the profile circle
 * @param {boolean} props.includeName - Whether to include the name
 * @param {Object} props.nameStyle - The style to apply to the name (and date)
 * @returns {React.Component} The name profile card
 */
function NameProfileCard({ name, date, includeProfileCircle = true, includeName = true, nameStyle }) {
  let initials = name
    .split(" ")
    .map((name) => name[0])
    .join("");
  initials = initials.toUpperCase();
  let dateString = "-";
  if (date) {
    dateString = fixDateFormat(date);
  }
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "1em" }}>
      {includeProfileCircle && (
        <div
          style={{
            border: "2px solid rgb(141, 149, 159)",
            color: "rgb(43, 122, 188)",
            fontWeight: "700",
            borderRadius: "50%",
            minHeight: "50px",
            minWidth: "50px",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            fontSize: "1.25 rem",
          }}
        >
          {initials}
        </div>
      )}
      {includeName && (
        <div style={{ display: "flex", flexDirection: "column", ...nameStyle }}>
          <span style={{ fontWeight: "bold" }}>{name}</span>
          <span style={{ color: "rgb(99, 109, 117)" }}>{dateString}</span>
        </div>
      )}
    </div>
  );
}
