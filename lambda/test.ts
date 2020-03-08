import test from 'ava'
import { promises as fs } from 'fs'
import { resize } from './lib/resize'

const originalFile = fs.readFile('./__tests__/fixtures/original.jpg')
const resizedFile = fs.readFile('./__tests__/fixtures/resized.jpg')

test('image buffer read', async t => {
  const buffer = await originalFile
  t.true(buffer instanceof Buffer)
})

test('resize image to width=200', async t => {
  const buffer = await originalFile
  const resized = await resize({ width: 200 })(buffer)
  t.true(resized instanceof Buffer)
})

test('resized image matches fixture', async t => {
  const buffer = await originalFile
  const resized = await resize({ width: 200 })(buffer)
  t.deepEqual(resized, await resizedFile)
})
