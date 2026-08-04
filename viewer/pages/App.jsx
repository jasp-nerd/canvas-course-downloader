// Inner component that safely consumes the Context
function AppContent() {
  const { courseData, clearCourseData } = useCourseContext();

  return (
    <>
      <nav id='sidebar_nav'>
        <div
          className='side_navigation_item'
          style={{ height: "85px" }}
          onClick={() => window.open("https://github.com/jasp-nerd/canvas-course-downloader", "_blank")}
        >
          <img
            src='data:image/png;base64,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'
            alt=''
            width='48'
            height='48'
          />
        </div>
        <div className='side_navigation_item' onClick={() => alert("This might do somthing one day...")}>
          <svg
            xmlns='http://www.w3.org/2000/svg'
            className='ic-nav'
            version='1.1'
            x='0'
            y='0'
            viewBox='0 0 280 200'
            enableBackground='new 0 0 280 200'
          >
            <path d='M273.09,180.75H197.47V164.47h62.62A122.16,122.16,0,1,0,17.85,142a124,124,0,0,0,2,22.51H90.18v16.29H6.89l-1.5-6.22A138.51,138.51,0,0,1,1.57,142C1.57,65.64,63.67,3.53,140,3.53S278.43,65.64,278.43,142a137.67,137.67,0,0,1-3.84,32.57ZM66.49,87.63,50.24,71.38,61.75,59.86,78,76.12Zm147,0L202,76.12l16.25-16.25,11.51,11.51ZM131.85,53.82v-23h16.29v23Zm15.63,142.3a31.71,31.71,0,0,1-28-16.81c-6.4-12.08-15.73-72.29-17.54-84.25a8.15,8.15,0,0,1,13.58-7.2c8.88,8.21,53.48,49.72,59.88,61.81a31.61,31.61,0,0,1-27.9,46.45ZM121.81,116.2c4.17,24.56,9.23,50.21,12,55.49A15.35,15.35,0,1,0,161,157.3C158.18,152,139.79,133.44,121.81,116.2Z'></path>
          </svg>
          Dashboard
        </div>
        <div className='side_navigation_item' onClick={() => alert("This might do somthing one day...")}>
          <svg
            xmlns='http://www.w3.org/2000/svg'
            className='ic-nav'
            version='1.1'
            x='0'
            y='0'
            viewBox='0 0 280 200'
            enableBackground='new 0 0 280 200'
          >
            <path d='M73.31,198c-11.93,0-22.22,8-24,18.73a26.67,26.67,0,0,0-.3,3.63v.3a22,22,0,0,0,5.44,14.65,22.47,22.47,0,0,0,17.22,8H200V228.19h-134V213.08H200V198Zm21-105.74h90.64V62H94.3ZM79.19,107.34V46.92H200v60.42Zm7.55,30.21V122.45H192.49v15.11ZM71.65,16.71A22.72,22.72,0,0,0,49,39.36V190.88a41.12,41.12,0,0,1,24.32-8h157V16.71ZM33.88,39.36A37.78,37.78,0,0,1,71.65,1.6H245.36V198H215.15v45.32h22.66V258.4H71.65a37.85,37.85,0,0,1-37.76-37.76Z'></path>
          </svg>
          Courses
        </div>
        <div
          className='side_navigation_item'
          id='CV_SETTINGS_LINK'
          onClick={() => {
            if (getAppContext() == "extension") {
              chrome?.runtime?.sendMessage({ type: "OPEN_OPTIONS" });
            }
          }}
        >
          <svg fill='white' height='24px' viewBox='0 0 1920 1920' xmlns='http://www.w3.org/2000/svg' style={{ marginBottom: "4px" }}>
            <path
              d='m1739.34 1293.414-105.827 180.818-240.225-80.188-24.509 22.25c-69.91 63.586-150.211 109.666-238.644 136.771l-32.076 9.94-49.468 244.065H835.584l-49.468-244.179-32.076-9.939c-88.432-27.105-168.734-73.185-238.644-136.771l-24.508-22.25-240.226 80.189-105.826-180.82 189.74-164.442-7.453-32.978c-10.39-45.742-15.586-91.483-15.586-135.869 0-44.386 5.195-90.127 15.586-135.868l7.454-32.979-189.741-164.442 105.826-180.819 240.226 80.075 24.508-22.25c69.91-63.585 150.212-109.665 238.644-136.884l32.076-9.826 49.468-244.066h213.007l49.468 244.18 32.076 9.825c88.433 27.219 168.734 73.186 238.644 136.885l24.509 22.25 240.225-80.189 105.826 180.819-189.74 164.442 7.453 32.98c10.39 45.74 15.586 91.481 15.586 135.867 0 44.386-5.195 90.127-15.586 135.869l-7.454 32.978 189.741 164.556Zm-53.76-333.403c0-41.788-3.84-84.48-11.634-127.284l210.184-182.062-199.454-340.856-265.186 88.433c-66.974-55.567-143.322-99.388-223.85-128.414L1140.977.01H743.198l-54.663 269.704c-81.431 29.139-156.424 72.282-223.963 128.414L199.5 309.809.045 650.665l210.07 182.062c-7.68 42.804-11.52 85.496-11.52 127.284 0 41.789 3.84 84.48 11.52 127.172L.046 1269.357 199.5 1610.214l265.186-88.546c66.974 55.68 143.323 99.388 223.85 128.527l54.663 269.816h397.779l54.663-269.703c81.318-29.252 156.424-72.283 223.85-128.527l265.186 88.546 199.454-340.857-210.184-182.174c7.793-42.805 11.633-85.496 11.633-127.285ZM942.075 564.706C724.1 564.706 546.782 742.024 546.782 960c0 217.976 177.318 395.294 395.294 395.294 217.977 0 395.294-177.318 395.294-395.294 0-217.976-177.317-395.294-395.294-395.294m0 677.647c-155.633 0-282.353-126.72-282.353-282.353s126.72-282.353 282.353-282.353S1224.43 804.367 1224.43 960s-126.72 282.353-282.353 282.353'
              fillRule='evenodd'
            />
          </svg>
          Settings
        </div>
        <div className='side_navigation_item' onClick={() => clearCourseData()}>
          <svg fill='white' height='24px' viewBox='0 0 1920 1920' xmlns='http://www.w3.org/2000/svg' style={{ marginBottom: "4px" }}>
            <path
              d='M960 0v112.941c467.125 0 847.059 379.934 847.059 847.059 0 467.125-379.934 847.059-847.059 847.059-467.125 0-847.059-379.934-847.059-847.059 0-267.106 126.607-515.915 338.824-675.727v393.374h112.94V112.941H0v112.941h342.89C127.058 407.38 0 674.711 0 960c0 529.355 430.645 960 960 960s960-430.645 960-960S1489.355 0 960 0'
              fillRule='evenodd'
            />
          </svg>
          Reset
        </div>
      </nav>
      <div className='nav_spacer' style={{ minWidth: "85px" }}></div>
      <div id='main-content' style={{ alignItems: !courseData ? "center" : "inherit" }}>
        {courseData !== null ? <MainContent /> : <CoursePicker />}
      </div>
    </>
  );
}

// Outer provider wrapper
function OfflineApp() {
  return (
    <CourseContextProvider>
      <NavigationProvider>
        <AppContent />
      </NavigationProvider>
    </CourseContextProvider>
  );
}

const container = document.getElementById("root");
const root = ReactDOM.createRoot(container);
root.render(<OfflineApp />);
