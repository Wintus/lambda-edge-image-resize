import test from 'ava'
import { promises as fs } from 'fs'

const imagePath = './__tests__/fixtures/original.jpg'

test('image buffer read', async t => {
  const buffer = await fs.readFile(imagePath)
  t.true(buffer instanceof Buffer)
})
