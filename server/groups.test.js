const { test } = require('node:test')
const assert = require('node:assert/strict')
const { Pool } = require('pg')
const { normalizeGroupName, createGroup } = require('./groups')

test('group names are trimmed and limited to 1–100 characters', () => {
  for (const value of [null, undefined, 42, {}, '', '   ', 'a'.repeat(101)]) {
    assert.equal(normalizeGroupName(value), null)
  }
  assert.equal(normalizeGroupName('  Dorm 777  '), 'Dorm 777')
  assert.equal(normalizeGroupName('a'.repeat(100)), 'a'.repeat(100))
})

// Run with TEST_DATABASE_URL pointing to a disposable PostgreSQL database.
// All test tables live in an isolated schema that is removed afterward.
test('atomic creation, collision retry, exhaustion and membership rollback', {
  skip: !process.env.TEST_DATABASE_URL
}, async () => {
  const admin = new Pool({ connectionString: process.env.TEST_DATABASE_URL })
  const schema = 'group_test_' + require('node:crypto').randomBytes(8).toString('hex')
  let pool
  try {
    await admin.query('CREATE SCHEMA ' + schema)
    pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL, options: '-c search_path=' + schema })
    await pool.query(`CREATE TABLE roommate_groups (
      id SERIAL PRIMARY KEY, name TEXT, invite_code TEXT UNIQUE, created_by INTEGER);
      CREATE TABLE group_members (group_id INTEGER REFERENCES roommate_groups(id),
        user_id INTEGER CHECK (user_id > 0))`)
    const first = await createGroup(pool, 'First', 1, () => 'AAAAAA')
    let calls = 0
    const second = await createGroup(pool, 'Second', 2, () => ++calls === 1 ? 'AAAAAA' : 'BBBBBB')
    assert.equal(calls, 2)
    assert.equal(second.invite_code, 'BBBBBB')
    assert.equal((await pool.query('SELECT user_id FROM group_members WHERE group_id=$1', [first.id])).rows[0].user_id, 1)
    calls = 0
    await assert.rejects(createGroup(pool, 'Exhausted', 1, () => { calls++; return 'AAAAAA' }), { code: 'INVITE_CODE_EXHAUSTED' })
    assert.equal(calls, 5)
    await assert.rejects(createGroup(pool, 'Rollback', -1, () => 'CCCCCC'), { code: '23514' })
    assert.equal((await pool.query('SELECT count(*) FROM roommate_groups')).rows[0].count, '2')
    assert.equal((await pool.query('SELECT count(*) FROM group_members')).rows[0].count, '2')
  } finally {
    if (pool) await pool.end()
    await admin.query('DROP SCHEMA ' + schema + ' CASCADE')
    await admin.end()
  }
})
