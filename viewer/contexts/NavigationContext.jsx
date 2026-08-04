/**
 * Creating a context so that we can enable navigation throughout the app
 */
const NavigationContext = React.createContext();
function NavigationProvider({ children }) {
  const [activeKey, setActiveKey] = useState("frontpage");
  const [selectedAssignmentId, setSelectedAssignmentId] = useState(null);
  const [selectedPageUrl, setSelectedPageUrl] = useState(null);
  const [selectedDiscussionId, setSelectedDiscussionId] = useState(null);
  const [selectedAnnouncementId, setSelectedAnnouncementId] = useState();

  // Navigate to a main section (resets sub-view detail)
  const navigateToSection = (key) => {
    setActiveKey(key);
    setSelectedAssignmentId(null);
    setSelectedPageUrl(null);
    setSelectedDiscussionId(null);
  };
  // Navigate directly to a specific assignment detail view
  const navigateToAssignment = (assignmentId) => {
    setActiveKey("assignments"); // Keeps "Assignments" active on the left sidebar!
    setSelectedAssignmentId(assignmentId);
    setSelectedPageUrl(null);
  };
  // Navigate directly to a specific page detail view
  const navigateToPage = (pageUrl) => {
    setActiveKey("pages"); // Keeps "Pages" active on the left sidebar!
    setSelectedPageUrl(pageUrl);
    setSelectedAssignmentId(null);
  };
  const navigateToDiscussion = (discussionId) => {
    setActiveKey("discussions"); // Keeps "Pages" active on the left sidebar!
    setSelectedDiscussionId(discussionId);
    setSelectedAssignmentId(null);
  };
  const navigateToAnnouncement = (announcementId) => {
    setActiveKey("announcements"); // Keeps "Pages" active on the left sidebar!
    setSelectedAnnouncementId(announcementId);
    setSelectedAssignmentId(null);
  };
  return (
    <NavigationContext.Provider
      value={{
        activeKey,
        selectedAssignmentId,
        selectedPageUrl,
        selectedDiscussionId,
        selectedAnnouncementId,
        navigateToSection,
        navigateToAssignment,
        navigateToPage,
        navigateToDiscussion,
        navigateToAnnouncement,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
}
const useNavigation = () => React.useContext(NavigationContext);
