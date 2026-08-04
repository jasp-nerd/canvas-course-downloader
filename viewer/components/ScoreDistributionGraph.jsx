/**
 * Modified CanvasLMS source code to create a similar looking score distribution graph (boxplot)
 * @param {Object} assignment - The assignment to create a score distribution graph for. Must contain score_statistics.
 * @returns {JSX.Element} The score distribution graph.
 */
const ScoreDistributionGraph = ({ assignment }) => {
  // Constants based on Canvas LMS SVG coordinate system
  const GRAPH_SCALAR = 150.0;
  const GRAY_COLOR = "#4A5B68";
  const BLUE_COLOR = "#224488";
  const BLUE_FILL_COLOR = "#aabbdd";

  // Safety fallbacks for score scaling
  const pointsPossible = assignment?.points_possible || 10;

  const scaleStatValue = (stat) => {
    if (stat === undefined || stat === null || isNaN(stat)) return 0;
    return (Number(stat) / pointsPossible) * GRAPH_SCALAR;
  };

  // Extract values directly from your JSON format
  const userScore = assignment?.submission?.score;
  const stats = assignment?.score_statistics || {};

  const graph = {
    title: `Score Distribution Graph - ${assignment?.name || ""}`,
    max_pos: GRAPH_SCALAR,
    low_pos: scaleStatValue(stats.min),
    lq_pos: scaleStatValue(stats.lower_q),
    uq_pos: scaleStatValue(stats.upper_q),
    high_pos: scaleStatValue(stats.max),
    median_pos: scaleStatValue(stats.median),
    score_pos: scaleStatValue(userScore),
  };

  // SVG Geometry Dimensions
  const zeroPosition = "0";
  const maxSvgHeight = "27";
  const minSvgHeight = "3";
  const displaySvgHeight = "24";
  const startSvgHeight = "6";
  const strokeWidthDefault = "2";
  const midSvgHeight = "15";

  const myScoreBoxHeight = "14";
  const myScoreBoxStartPos = "8";

  const viewBoxValues = "-1 0 160 30";

  const createSvgLine = (className, x1, y1, x2, y2, strokeWidth = strokeWidthDefault) => ({
    className,
    x1,
    y1,
    x2,
    y2,
    strokeWidth,
  });

  const svgLines = [
    createSvgLine("zero", zeroPosition, minSvgHeight, zeroPosition, maxSvgHeight),
    createSvgLine("possible", `${graph.max_pos}`, minSvgHeight, `${graph.max_pos}`, maxSvgHeight),
    createSvgLine("min", `${graph.low_pos}`, startSvgHeight, `${graph.low_pos}`, displaySvgHeight),
    createSvgLine("bottomQ", `${graph.low_pos}`, midSvgHeight, `${graph.lq_pos}`, midSvgHeight),
    createSvgLine("topQ", `${graph.uq_pos}`, midSvgHeight, `${graph.high_pos}`, midSvgHeight),
    createSvgLine("max", `${graph.high_pos}`, startSvgHeight, `${graph.high_pos}`, displaySvgHeight),
    createSvgLine("median", `${graph.median_pos}`, minSvgHeight, `${graph.median_pos}`, maxSvgHeight),
  ];

  const mid50Rect = {
    className: "mid50",
    x: `${graph.lq_pos}`,
    y: minSvgHeight,
    width: `${Math.max(0, graph.uq_pos - graph.lq_pos)}`,
    height: displaySvgHeight,
    strokeWidth: strokeWidthDefault,
    rx: minSvgHeight,
    fill: "none",
  };

  const myScoreRect = {
    x: `${graph.score_pos - 7}`,
    y: myScoreBoxStartPos,
    width: myScoreBoxHeight,
    height: myScoreBoxHeight,
    strokeWidth: strokeWidthDefault,
    rx: minSvgHeight,
    fill: BLUE_FILL_COLOR,
  };

  return (
    <svg
      viewBox={viewBoxValues}
      xmlns='http://www.w3.org/2000/svg'
      style={{
        cursor: "pointer",
        float: "right",
        height: "30px",
        width: "161px",
        position: "relative",
      }}
      aria-hidden='true'
      data-testid='scoreDistributionGraph'
    >
      <title>{graph.title}</title>

      {/* Boxplot Whiskers & Boundary Lines */}
      {svgLines.map((lineInstructions) => (
        <line key={lineInstructions.className} {...lineInstructions} stroke={GRAY_COLOR} />
      ))}

      {/* Middle 50% Box (IQR) */}
      <rect {...mid50Rect} stroke={GRAY_COLOR} />

      {/* Student Score Square Marker */}
      {userScore !== undefined && userScore !== null && (
        <rect className='myScore' {...myScoreRect} stroke={BLUE_COLOR}>
          <title>{`Your Score: ${userScore} out of ${pointsPossible}`}</title>
        </rect>
      )}
    </svg>
  );
};
