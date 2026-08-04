/**
 * CourseContext creates and stores the Course data for loading and displaying. Once the data is retrieved using
 * the File System API, the folder refererer is saved to indexeddb so it can be accessed later.
 */

const { createContext, useContext, useState, useEffect } = React;

const CourseContext = createContext(); // Create a context for course data

// Get the IndexdDB tools
const { get, set, del } = idbKeyval;

/**
 * Creating a context for course data so it can be accessed by all components.
 */

// Helper function to check and request permissions for a handle
async function verifyPermission(directoryHandle, mode = "read") {
  const options = { mode };

  // Check if we already have permission
  if ((await directoryHandle.queryPermission(options)) === "granted") {
    return true;
  }

  // If not, request permission (this must be triggered by a user gesture, like a button click)
  if ((await directoryHandle.requestPermission(options)) === "granted") {
    return true;
  }

  return false;
}

function CourseContextProvider({ children }) {
  const [courseData, setCourseData] = useState(null);
  const [dirHandle, setDirHandle] = useState(null);
  const [isProcessing, setIsProcessing] = useState(true); // Start loading saved data

  // On mount, load previously saved JSON data and the directory handle from IndexedDB
  useEffect(() => {
    async function loadCachedData() {
      try {
        const [cachedData, cachedHandle] = await Promise.all([get("cachedCourseData"), get("courseDirectoryHandle")]);

        if (cachedData) setCourseData(cachedData);
        if (cachedHandle) setDirHandle(cachedHandle);
        console.log("Fetched Course Data!")
      } catch (err) {
        console.error("Failed to load cached data from storage:", err);
      } finally {
        setIsProcessing(false);
      }
    }

    loadCachedData();
  }, []);

  // Initial folder selection (User picks the folder)
  const handleFolderSelect = async () => {
    setIsProcessing(true);
    try {
      // Prompt user for folder access (using File System Access API)
      const handle = await window.showDirectoryPicker();
      let jsonFilesObject = await scrapeJsonFiles(handle);

      if (jsonFilesObject?.manifest?.manifestVersion >= 2) {
        // Save to React State
        setCourseData(jsonFilesObject);
        setDirHandle(handle);

        // Save to IndexedDB
        await set("cachedCourseData", jsonFilesObject);
        await set("courseDirectoryHandle", handle); // <-- Saving the handle
      } else {
        alert("Invalid manifest version. Please select a valid course folder.");
      }
    } catch (err) {
      console.error("Access denied or error digesting folder", err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Re-authenticate an existing handle (User grants permission to previously saved folder)
  const reconnectFolder = async () => {
    if (!dirHandle) return;

    setIsProcessing(true);
    try {
      // This will prompt the browser permission dialog if needed
      const hasPermission = await verifyPermission(dirHandle, "read");

      if (hasPermission) {
        // You now have active access to the folder again!
        // Optional: Re-scrape the folder here to get fresh data instead of using cache
        // let freshData = await scrapeJsonFiles(dirHandle);
        console.log("Permission granted! Directory handle is active.");
      } else {
        alert("Permission to access the folder was denied.");
      }
    } catch (err) {
      console.error("Error reconnecting to folder:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Clear stored data
  const clearCourseData = async () => {
    await Promise.all([del("cachedCourseData"), del("courseDirectoryHandle")]);
    setCourseData(null);
    setDirHandle(null);
  };

  return (
    <CourseContext.Provider
      value={{
        courseData,
        dirHandle,
        isProcessing,
        handleFolderSelect,
        reconnectFolder, // Export the new function
        clearCourseData,
      }}
    >
      {children}
    </CourseContext.Provider>
  );
}

function useCourseContext() {
  return useContext(CourseContext);
}
// Function to take digest the folder data into every available JSON file
async function scrapeJsonFiles(dirHandle) {
  const jsonFilesObject = {};

  async function walkDirectory(handle) {
    for await (const entry of handle.values()) {
      if (entry.kind === "file" && entry.name.endsWith(".json")) {
        try {
          // Get the standard File object
          const file = await entry.getFile();

          // Read and parse the JSON string
          const text = await file.text();
          const parsedData = JSON.parse(text);
          console.log(`Parsed JSON for file: ${entry.name}`, parsedData);

          // Use the file name as the key, stripping the .json extension
          jsonFilesObject[entry.name.slice(0, -5)] = parsedData;
        } catch (err) {
          console.warn(`Failed to parse JSON for file: ${entry.name}`, err);
        }
      } else if (entry.kind === "directory") {
        // Recurse into nested subfolders
        await walkDirectory(entry);
      }
    }
  }

  await walkDirectory(dirHandle);
  return jsonFilesObject;
}
