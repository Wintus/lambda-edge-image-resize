import test from 'ava'
import { promises as fs } from 'fs'
import { resize } from './lib/resize'

const imagePath = './__tests__/fixtures/original.jpg'
const resizedImagePath = './__tests__/fixtures/resized.jpg'

test('image buffer read', async t => {
  const buffer = await fs.readFile(imagePath)
  t.true(buffer instanceof Buffer)
})

test('resize image to width=200', async t => {
  const buffer = await fs.readFile(imagePath)
  const resized = await resize({ width: 200 })(buffer)
  t.true(resized instanceof Buffer)
})

test('resized image matches fixture', async t => {
  const buffer = await fs.readFile(imagePath)
  const resized = await resize({ width: 200 })(buffer)

  const fixture = await fs.readFile(resizedImagePath)
  t.deepEqual(resized, fixture)
})
