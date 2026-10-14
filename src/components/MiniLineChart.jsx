function formatTick(value) {
  const n = Number(value) || 0;
  if (n >= 1000) return `${Math.round(n / 100) / 10}k`;
  return String(Math.round(n));
}

function pointsFor(values, width, height, pad, max) {
  const innerW = width - pad.l - pad.r;
  const innerH = height - pad.t - pad.b;
  const span = max || 1;
  return values.map((value, i) => {
    const x = values.length === 1
      ? pad.l + innerW / 2
      : pad.l + (i / (values.length - 1)) * innerW;
    const y = pad.t + innerH - (Math.max(0, Number(value) || 0) / span) * innerH;
    return { x, y };
  });
}

export default function MiniLineChart({
  ariaLabel,
  categories = [],
  lines = [],
  yMax,
  formatY = formatTick,
}) {
  const width = 640;
  const height = 96;
  const pad = { l: 44, r: 8, t: 6, b: 18 };
  const all = lines.flatMap((line) => line.values || []);
  const peak = all.reduce((max, value) => Math.max(max, Number(value) || 0), 0);
  const max = yMax != null ? yMax : Math.max(1, Math.ceil(peak * 1.15));
  const yTicks = [max, Math.round(max / 2), 0];
  const innerH = height - pad.t - pad.b;
  const labelIndexes = categories.length <= 6
    ? categories.map((_, i) => i)
    : [0, Math.floor((categories.length - 1) / 2), categories.length - 1];

  return (
    <figure className="m-0">
      <svg
        role="img"
        aria-label={ariaLabel}
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto"
      >
        {yTicks.map((tick) => {
          const y = pad.t + innerH - (tick / (max || 1)) * innerH;
          return (
            <g key={tick}>
              <line
                x1={pad.l}
                x2={width - pad.r}
                y1={y}
                y2={y}
                stroke="currentColor"
                strokeOpacity="0.12"
              />
              <text
                x={pad.l - 6}
                y={y + 3}
                textAnchor="end"
                fontSize="10"
                fill="currentColor"
                opacity="0.55"
              >
                {formatY(tick)}
              </text>
            </g>
          );
        })}
        {lines.map((line) => {
          const pts = pointsFor(line.values || [], width, height, pad, max);
          const d = pts.map((pt) => `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`).join(' ');
          return (
            <g key={line.name}>
              {pts.length > 1 && (
                <polyline
                  fill="none"
                  stroke={line.color}
                  strokeWidth="2"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  points={d}
                />
              )}
              {pts.map((pt, i) => (
                <circle key={`${line.name}-${categories[i] || i}`} cx={pt.x} cy={pt.y} r="2.5" fill={line.color} />
              ))}
            </g>
          );
        })}
        {labelIndexes.map((i) => {
          const pts = pointsFor(lines[0]?.values || categories.map(() => 0), width, height, pad, max);
          const pt = pts[i];
          if (!pt) return null;
          return (
            <text
              key={categories[i] || i}
              x={pt.x}
              y={height - 8}
              textAnchor="middle"
              fontSize="10"
              fill="currentColor"
              opacity="0.55"
            >
              {categories[i]}
            </text>
          );
        })}
      </svg>
      <figcaption className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
        {lines.map((line) => (
          <span key={line.name} className="inline-flex items-center gap-1.5 text-xs text-text/60">
            <span className="inline-block w-3 h-0.5 rounded" style={{ background: line.color }} />
            {line.name}
          </span>
        ))}
      </figcaption>
    </figure>
  );
}
