import { test } from 'node:test'
import assert from 'node:assert/strict'
import { calculateBalances } from './balance.js'

test('splits an expense equally and calculates net balances', () => {
  const roommates = ['Alice', 'Bob', 'Charlie']
  const expenses = [{ payer: 'Alice', amount: 6000 }] // $60

  const balances = calculateBalances(expenses, roommates)

  // $60 split 3 ways assigns a $20 (2000 cents) share to each roommate
  assert.equal(balances['Alice'].share, 2000)
  assert.equal(balances['Bob'].share, 2000)
  assert.equal(balances['Charlie'].share, 2000)

  // Net balance = paid - share
  assert.equal(balances['Alice'].net, 4000) // Alice is owed $40
  assert.equal(balances['Bob'].net, -2000)  // Bob owes $20
  assert.equal(balances['Charlie'].net, -2000) // Charlie owes $20
})
