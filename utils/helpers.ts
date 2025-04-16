export function throttle(func: Function, limit: number) {
  let lastFunc: NodeJS.Timeout
  let lastRan: number
  return function (...args: any[]) {
    if (!lastRan) {
      func(...args)
      lastRan = Date.now()
    } else {
      clearTimeout(lastFunc)
      lastFunc = setTimeout(() => {
        if (Date.now() - lastRan >= limit) {
          func(...args)
          lastRan = Date.now()
        }
      }, limit - (Date.now() - lastRan))
    }
  }
}

export function generateRandomColor(id: string) {
  if (typeof id !== "string" || !id.length) id = "default"
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash)
  }
  const color = `#${((hash >> 24) & 0xff).toString(16).padStart(2, "0")}${((hash >> 16) & 0xff)
    .toString(16)
    .padStart(2, "0")}${((hash >> 8) & 0xff).toString(16).padStart(2, "0")}`
  return color
}
