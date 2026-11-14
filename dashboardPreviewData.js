export function formatUSD(cents = 0) {
  return `$${((cents || 0) / 100).toFixed(2)}`
}
