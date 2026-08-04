/**
 * Collapsible Table Component
 * @param {Object} props
 * @param {string} props.title - The title of the collapsible table.
 * @param {React.ReactNode} props.children - The content to be displayed inside.
 * @param {React.CSSProperties} props.style - The style to be applied to the collapsible table.
 * @param {boolean} props.isModuleItem - Whether the table is a module item.
 * @param {boolean} props.isOpen - Whether the table is open.
 * @param {Function} props.onToggle - The function to call when the table is toggled.
 */
function CollapseTable({ title, children, style, isModuleItem, isOpen: controlledIsOpen, onToggle }) {
  // Fallback internal state for standalone usage outside of ModulesPage
  const [internalIsOpen, setInternalIsOpen] = useState(true);

  const isControlled = typeof controlledIsOpen !== "undefined";
  const isOpen = isControlled ? controlledIsOpen : internalIsOpen;

  const toggleOpen = () => {
    if (isControlled && onToggle) {
      onToggle();
    } else {
      setInternalIsOpen((prev) => !prev);
    }
  };

  // Safe normalization: Converts single elements, strings, or arrays into a clean array
  const childList = React.Children.toArray(children);

  return (
    <div className='collapse-table' style={style}>
      <div className='collapse-table-header' onClick={toggleOpen}>
        <span
          style={{
            fontSize: "10px",
            marginLeft: "12px",
            display: "inline-block",
            transform: "scaleY(.75)",
            transformOrigin: "middle",
          }}
        >
          {!isOpen ? "▲" : "▼"}
        </span>
        <span>{title}</span>
      </div>

      {isOpen && (
        <div className='collapse-table-content'>
          {childList.length > 0 ? (
            <ul className='collapse-table-list'>
              {childList.map((child, index) => (
                <li
                  key={child.key || index}
                  className='collapse-table-item'
                  style={{
                    borderLeft: isModuleItem ? "4px solid #03893d" : "1px solid #e8eaec",
                  }}
                >
                  {child}
                </li>
              ))}
            </ul>
          ) : (
            <div className='collapse-table-empty'>No items to display.</div>
          )}
        </div>
      )}
    </div>
  );
}
/**
 * Renders the details of a list item in a collapsible table. Not sure why there are so many props... was one of the first components.
 * @param {string} props.title - The title of the list item.
 * @param {boolean} props.closed - Whether the list item is closed.
 * @param {string} props.dueDate - The due date of the list item.
 * @param {string} props.grade - The grade of the list item.
 * @param {string} props.maxGrade - The maximum grade of the list item.
 * @param {Object} props.assignment - The assignment of the list item.
 * @param {string} props.pageUrl - The page URL of the list item.
 * @param {boolean} props.isModuleItem - Whether the list item is a module item.
 * @param {string} props.type - The type of the list item.
 * @param {number} props.indent - The indent of the list item.
 */
function CollapseListItemDetails({ title, closed, dueDate, grade, maxGrade, assignment, pageUrl, isModuleItem, type, indent }) {
      const { navigateToAssignment, navigateToPage } = useNavigation();
      const { reconnectFolder } = useCourseContext();
      return (
        <div
          className='assignment-details'
          style={{
            display: "flex",
            alignItems: "center",
            paddingLeft: `${indent * 1}em`,
          }}
        >
          <CanvasItemIcon icon_type={type?.toLowerCase()} isModuleItem={isModuleItem} />
          <div
            className='assignment-info'
            style={{
              display: "flex",
              flexDirection: "column",
              marginLeft: "0em",
            }}
          >
            <h3
              className='assignment-info-title'
              style={{ fontSize: "16px", margin: "0", color: "#273450", cursor: assignment || pageUrl ? "pointer" : "default" }}
              onClick={() => {
                reconnectFolder();
                if (assignment?.id) {
                  navigateToAssignment(assignment.id);
                } else if (pageUrl) {
                  navigateToPage(pageUrl);
                }
              }}
            >
              {title}
            </h3>
            <div style={{ display: assignment != undefined ? "inherit" : "none" }}>
              <span className='assignment-info-item'>
                <strong>{closed ? "Closed" : "Open"}</strong>
              </span>
              <span className='assignment-info-item'>
                <strong>Due</strong> {dueDate}
              </span>
              {!assignment?.submission_types?.includes("none") && assignment?.grading_type == "points" && grade && maxGrade && (
                <span className='assignment-info-item'>
                  <strong>{grade}</strong>/{maxGrade} pts
                </span>
              )}
            </div>
          </div>
        </div>
      );
    }
