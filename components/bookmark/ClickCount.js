import React from "react"

// 클릭 수 포맷 함수
function formatClickCount(count) {
  if (count >= 1000000) return (count / 1000000).toFixed(1).replace(/\.0$/, '') + 'M'
  if (count >= 1000) return (count / 1000).toFixed(1).replace(/\.0$/, '') + 'K'
  return String(count)
}

function ClickCount({ count = 0 }) {
  return (
    <div
      className="click-count"
      aria-label={`Clicks: ${count}`}
      tabIndex={-1}
    >
      {formatClickCount(count)}
    </div>
  )
}

export default ClickCount
