import assert from 'node:assert/strict'
import test from 'node:test'
import { dashboardPreview, formatUSD } from './dashboardPreviewData.js'

test('formats cents as USD, including zero, negatives, and separators', () => {
  assert.equal(formatUSD(0), '$0.00')
  assert.equal(formatUSD(1), '$0.01')
  assert.equal(formatUSD(99), '$0.99')
  assert.equal(formatUSD(100), '$1.00')
  assert.equal(formatUSD(2667), '$26.67')
  assert.equal(formatUSD(-5300), '-$53.00')
  assert.equal(formatUSD(123456), '$1,234.56')
})

test('preview expenses have unique IDs and integer-cent amounts', () => {
  const { expenses } = dashboardPreview
  assert.equal(new Set(expenses.map(expense => expense.id)).size, expenses.length)
  for (const expense of expenses) {
    assert.ok(Number.isSafeInteger(expense.total) && expense.total >= 0)
    assert.ok(Number.isSafeInteger(expense.userAmount) && expense.userAmount >= 0)
  }
})
