/**
 * 
 * @returns The main viewer
 */
function ModulesPage() {
  const { courseData } = useCourseContext();
  const { useState, useMemo } = React;
  if (!courseData) {
    return <div>Loading...</div>;
  }
  if (!courseData.Modules) {
    return <div>No modules available.</div>;
  }
  // Convert dictionary object or array into a flat array of modules
  const moduleList = Array.isArray(courseData.Modules) ? courseData.Modules : Object.values(courseData.Modules);

  const [openStates, setOpenStates] = useState(() => {
    const initial = {};
    moduleList.forEach((m) => {
      initial[m.id] = true;
    });
    return initial;
  });
  // Derived state: If AT LEAST ONE module is open, button action is "Collapse All".
  // If ALL modules are collapsed (none are open), button action is "Expand All".
  const isAnyOpen = useMemo(() => {
    return Object.values(openStates).some((isOpen) => isOpen === true);
  }, [openStates]);

  // Toggle individual module header click
  const handleToggleModule = (id) => {
    setOpenStates((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Master button toggle handler
  const handleMasterToggle = () => {
    const nextState = !isAnyOpen; // If any open -> hide all (false); if all closed -> expand all (true)
    const updated = {};
    moduleList.forEach((m) => {
      updated[m.id] = nextState;
    });
    setOpenStates(updated);
  };
  const handleItemType = (item) => {
    if (!item || !item.type) return "assignment"; // Default to assignment if type is missing
    if (item?.quiz_lti && item?.quiz_lti == true) {
      return "quiz";
    }
    return item.type.toLowerCase(); // Return the type in lowercase for consistency
  };

  return (
    <div
      className='page-div'
      style={{
        marginBottom: "4em",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h1 style={{ color: "#666666", fontSize: 28.8 }}>Modules</h1>
        <button
          onClick={handleMasterToggle}
          style={{
            backgroundColor: "#f2f4f4",
            border: "1px solid #e8eaec",
            padding: "8px 14px 8px 14px",
            borderRadius: "3px",
            cursor: "pointer",
            fontSize: "16px",
            color: "#273540",
          }}
        >
          {isAnyOpen ? "Collapse All" : "Expand All"}
        </button>
      </div>
      {moduleList.map((module, index) => (
        <CollapseTable
          title={module.name}
          style={{ marginBottom: "4em" }}
          key={module.id}
          isModuleItem={true}
          isOpen={openStates[module.id] ?? true}
          onToggle={() => handleToggleModule(module.id)}
        >
          {module.items.map((item, itemIndex) => (
            <CollapseListItemDetails
              key={item.id}
              closed={item?.availability_status?.status || "Unknown"} // Uses 'availability_status.status' from Canvas JSON
              title={item?.title || "No Title"} // Uses 'title' from Canvas JSON
              dueDate={item?.due_at ? fixDateFormat(item?.due_at) : "No Due Date"}
              grade={item?.submission?.score || "-"}
              maxGrade={item?.points_possible} // Uses 'points_possible' from Canvas JSON
              type={handleItemType(item)} // Uses 'type' from Canvas JSON, converted to lowercase
              assignment={item.type == "Assignment" ? item : undefined}
              pageUrl={item.type == "Page" ? item.page_url || item.url : undefined}
              isModuleItem={true}
              indent={item?.indent ?? 0} // Uses 'indent' from Canvas JSON to determine the indentation level of the module item
            />
          ))}
        </CollapseTable>
      ))}
    </div>
  );
}
