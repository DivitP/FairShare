export function calculateBalances(expenses, roommates) {
  const balances = {}
  for (const person of roommates) {
    balances[person] = { paid: 0, share: 0, net: 0 }
  }

  for (const expense of expenses) {
    const amount = expense.amount || expense.total || 0
    const splitShare = Math.round(amount / roommates.length)

    if (balances[expense.payer]) {
      balances[expense.payer].paid += amount
    }

    for (const person of roommates) {
      balances[person].share += splitShare
    }
  }

  for (const person of roommates) {
    balances[person].net = balances[person].paid - balances[person].share
  }

  return balances
}
