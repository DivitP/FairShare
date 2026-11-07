// Temporary display fixtures for Dorm 777's three roommates.
// Amounts are USD cents; replace this data with real records later.
export const dashboardPreview = {
  firstName: '[name]',
  balance: 5300,
  owed: 5300,
  owing: 0,
  totalShare: 10580,
  expenses: [
    { id: 'demo-1', description: 'Sunday grocery run', payer: 'You', total: 8640, category: 'Groceries', icon: 'groceries', dateLabel: 'Oct 29', direction: 'lent', userAmount: 5760 },
    { id: 'demo-2', description: 'Internet · October', payer: 'Maya', total: 8000, category: 'Utilities', icon: 'utilities', dateLabel: 'Oct 28', direction: 'borrowed', userAmount: 2667 },
    { id: 'demo-3', description: 'Tacos & good company', payer: 'You', total: 7240, category: 'Dining', icon: 'dining', dateLabel: 'Oct 27', direction: 'lent', userAmount: 4826 },
    { id: 'demo-4', description: 'A few things for the house', payer: 'Jordan', total: 4596, category: 'Home', icon: 'household', dateLabel: 'Oct 26', direction: 'borrowed', userAmount: 1532 },
    { id: 'demo-5', description: 'Farmers market', payer: 'Jordan', total: 3260, category: 'Groceries', icon: 'groceries', dateLabel: 'Oct 24', direction: 'borrowed', userAmount: 1087 },
  ],
}

const usdFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
export function formatUSD(cents) {
  return usdFormatter.format(cents / 100)
}
