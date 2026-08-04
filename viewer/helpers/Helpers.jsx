/**
 * Reformats Canvas date strings to a more readable format
 * @param {string} dateString - The date string to reformat
 * @returns {string} The reformatted date string
 */
function fixDateFormat(dateString) {
  //Reformats Canvas date strings to a more readable format
  // Example input: 2022-08-29T22:30:00Z
  // Example output: Jun 7 at 11:59pm
  if (!dateString) return "";
  const date = new Date(dateString);
  const datePart = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  const timePart = date
    .toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
    .toLowerCase()
    .replace(/\s+/g, ""); // Converts "10:30 PM" -> "10:30pm"

  return `${datePart} at ${timePart}`;
}

/**
 * Detects the current execution environment of the application.
 * @returns {string} The current execution environment.
 */
function getAppContext() {
  const protocol = window.location.protocol;
  const hostname = window.location.hostname;

  // 1. Local HTML file opened directly from the hard drive
  if (protocol === "file:") {
    return "local_file";
  }

  // 2. Running inside a browser extension (Chrome, Edge, Brave, Opera, Firefox)
  if (protocol === "chrome-extension:" || protocol === "moz-extension:") {
    return "extension";
  }

  // 3. Hosted on a web server
  if (protocol === "http:" || protocol === "https:") {
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return "localhost";
    }
    return "website";
  }

  return "unknown";
}

/** Replaces characters that are invalid or problematic in file paths.
 * Taken from the helpers.js file.
 * @param {string} name The name of the file to sanitize
 * @returns {string} The sanitized filename
 */
function sanitizeFilename(name) {
  if (!name) return "untitled";
  const cleaned = name
    .replace(/[\u0000-\u001F\u007F]/g, "") // control chars
    .replace(/[\u200B-\u200D\uFEFF]/g, "") // zero-width chars
    .replace(/\u00A0/g, " ") // non-breaking space
    .replace(/[/\\?%*:|"<>]/g, "-") // OS-reserved chars
    .replace(/^\.+/, "") // leading dots
    .replace(/[. ]+$/, "") // trailing dots/spaces
    .replace(/^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(\.|$)/i, "_$1$2") // Windows reserved names
    .trim();
  return cleaned || "untitled";
}

/**
 * Detects the mime class of a file object.
 * @param {*} fileObj - The file object to detect the mime class of.
 * @returns {string} The mime class of the file object.
 */
function getMimeClass(fileObj) {
  if (!fileObj) return "unknown";
  if (fileObj.mime_class) return fileObj.mime_class;
  const contentType = (fileObj["content-type"] || fileObj.contentType || "").toLowerCase();
  const filename = (fileObj.display_name || fileObj.filename || "").toLowerCase();

  if (contentType.startsWith("image/") || /\.(jpg|jpeg|png|gif|svg|webp|bmp|ico)$/.test(filename)) return "image";
  if (contentType.startsWith("video/") || /\.(mp4|webm|ogg|mov|avi|mkv)$/.test(filename)) return "video";
  if (contentType === "application/pdf" || filename.endsWith(".pdf")) return "pdf";
  if (contentType.startsWith("text/") || /\.(txt|md|csv|json|js|py|c|cpp|css|xml)$/.test(filename)) return "text";
  if (contentType.includes("html") || /\.(html|htm)$/.test(filename)) return "html";
  if (contentType.includes("word") || contentType.includes("officedocument.wordprocessingml") || /\.(doc|docx)$/.test(filename))
    return "doc";
  if (contentType.includes("powerpoint") || contentType.includes("officedocument.presentationml") || /\.(ppt|pptx)$/.test(filename))
    return "ppt";
  if (contentType.includes("excel") || contentType.includes("officedocument.spreadsheetml") || /\.(xls|xlsx)$/.test(filename)) return "xls";
  return "unknown";
}

/**
 * Calculates the grade for a specific assignment group.
 * @param {*} group - The assignment group to calculate the grade for.
 * @param {*} assignments - The list of assignments.
 * @returns {Object} An object containing the total points possible, total points earned, and the percentage for the assignment group.
 */
function calculateGradeForGroup(group, assignments) {
  const groupAssignments = assignments.filter(
    (assignment) =>
      assignment.assignment_group_id === group.id && assignment.submission?.grade != null && !assignment.omit_from_final_grade,
  );

  const totalPointsPossible = groupAssignments.reduce((sum, assignment) => sum + (assignment.points_possible || 0), 0);

  const totalPointsEarned = groupAssignments.reduce((sum, assignment) => sum + (assignment.submission?.score || 0), 0);

  return {
    totalPointsPossible,
    totalPointsEarned,
    percentage: totalPointsPossible > 0 ? (totalPointsEarned / totalPointsPossible) * 100 : null,
  };
}
/**
 * Calculates the total weighted grade for all assignments in a course.
 * @param {*} assignments - The list of assignments.
 * @param {*} assignmentGroups - The list of assignment groups.
 * @returns {Object} An object containing the total weighted grade for the course.
 */
function calculateTotalWeightedGrade(assignments, assignmentGroups) {
  if (!assignmentGroups || assignmentGroups.length === 0) {
    // calculate the total grade without weighting if no assignment groups are provided
    const gradedAssignments = assignments.filter((assignment) => assignment.submission?.grade != null && !assignment.omit_from_final_grade);
    const totalPointsPossible = gradedAssignments.reduce((sum, assignment) => sum + (assignment.points_possible || 0), 0);
    const totalPointsEarned = gradedAssignments.reduce((sum, assignment) => sum + (assignment.submission?.score || 0), 0);
    return totalPointsPossible > 0 ? (totalPointsEarned / totalPointsPossible) * 100 : null;
  }

  let totalWeightedScore = 0;
  let totalWeight = 0;

  assignmentGroups.forEach((group) => {
    const groupGrade = calculateGradeForGroup(group, assignments);

    if (groupGrade.percentage !== null) {
      totalWeightedScore += groupGrade.percentage * (group.group_weight / 100);
      totalWeight += group.group_weight;
    }
  });

  return totalWeight > 0 ? (totalWeightedScore / totalWeight) * 100 : null;
}
/**
 * Calculates the total points earned and possible across all assignments regardless of weighting.
 * @param {Array} assignments - The list of assignments.
 * @returns {Object} An object containing totalPointsEarned and totalPointsPossible.
 */
function calculateTotalPoints(assignments) {
  const gradedAssignments = assignments.filter((assignment) => assignment.submission?.grade != null && !assignment.omit_from_final_grade);
  const totalPointsPossible = gradedAssignments.reduce((sum, assignment) => sum + (assignment.points_possible || 0), 0);
  const totalPointsEarned = gradedAssignments.reduce((sum, assignment) => sum + (assignment.submission?.score || 0), 0);

  return {
    totalPointsPossible,
    totalPointsEarned,
  };
}
