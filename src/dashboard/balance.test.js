import { test } from 'node:test'
import assert from 'node:assert/strict'
import { calculateBalances } from './balance.js'

test('splits an expense equally and calculates net balances', () => {
  const roommates = ['test1', 'test2', 'test3']
  const expenses = [{ payer: 'test1', amount: 6000 }] // $60

  const balances = calculateBalances(expenses, roommates)

  // $60 split 3 ways assigns a $20 (2000 cents) share to each roommate
  assert.equal(balances['test1'].share, 2000)
  assert.equal(balances['test2'].share, 2000)
  assert.equal(balances['test3'].share, 2000)

  // Net balance = paid - share
  assert.equal(balances['test1'].net, 4000) // test1 is owed $40
  assert.equal(balances['test2'].net, -2000)  // test2 owes $20
  assert.equal(balances['test3'].net, -2000) // test3 owes $20
})
