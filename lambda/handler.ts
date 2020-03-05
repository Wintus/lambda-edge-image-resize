import { CloudFrontResponseHandler, CloudFrontResultResponse } from 'aws-lambda'
import { S3 } from 'aws-sdk'
import qs from 'querystring'
import { Query, resize } from './lib/resize'

const value = (str?: string | string[]): string =>
  Array.isArray(str) ? str[0] : str

const guard = (n?: number): number | null => (isFinite(n) && n > 0 ? n : null)

const parseNum: (str: string | string[]) => number = str =>
  guard(parseInt(value(str)))

const parseQuery = (queryString: string): Query => {
  const { w, h, webp } = qs.parse(queryString)
  return {
    width: parseNum(w),
    height: parseNum(h),
    webp: Boolean(webp),
  }
}

type S3Object = S3.GetObjectOutput
const s3 = new S3()

// destructive
const resizeS3Image = async <T extends CloudFrontResultResponse>({
  s3Object,
  query,
  result,
}: {
  s3Object: Promise<S3Object>
  query: Query
  result: T
}): Promise<T> => {
  try {
    const buffer = await s3Object
      .then(data => data.Body)
      .then(Buffer.from)
      .then(resize(query))
    // response resized image
    const encoding = 'base64'
    result.body = buffer.toString(encoding)
    result.bodyEncoding = encoding
    if (query.webp) {
      result.headers['content-type'] = [
        { key: 'Content-Type', value: 'image/webp' },
      ]
    }
    return result
  } catch (e) {
    console.error(e)
    // response any error
    result.status = '403'
    result.headers['content-type'] = [
      { key: 'Content-Type', value: 'text/plain' },
    ]
    result.body = e.toString()
    return result
  }
}

// noinspection JSUnusedGlobalSymbols
export const originResponse: CloudFrontResponseHandler = async ({
  Records: [
    {
      cf: {
        request: { headers, uri, querystring },
        response,
      },
    },
  ],
}) => {
  const result = response as CloudFrontResultResponse

  const isJpeg = response.headers['content-type']
    .map(({ value }) => value)
    .includes('image/jpeg')
  if (!isJpeg) {
    // response original
    return response
  }

  // guard: check resize
  if (querystring !== '') {
    // response original
    return response
  }

  // guard: origin status
  switch (response.status) {
    case '404':
      // response not found
      result.status = '404'
      result.headers['content-type'] = [
        { key: 'Content-Type', value: 'text/plain' },
      ]
      result.body = `${uri} is not found.`
      return result
    case '304':
    default:
      // response original
      return response
    case '200':
      // keep going
      break
  }

  const query = parseQuery(querystring)
  console.debug({ query })

  const {
    host: [{ value: hostname }],
  } = headers
  // guard s3 domain
  const domainRegex = /\.s3\.amazonaws\.com$/
  if (!domainRegex.test(hostname)) {
    throw new Error(`invalid S3 hostname: ${hostname}`)
  }
  const bucket = hostname.replace(domainRegex, '')
  const key = uri.slice(1) // remove first `/`
  console.log('S3 URI:', `s3://${bucket}${uri}`)

  const s3Object = s3
    .getObject({
      Bucket: bucket,
      Key: key,
    })
    .promise()
  return resizeS3Image({ s3Object, query, result })
}
