import {
  Callback,
  CloudFrontResponseEvent,
  CloudFrontResultResponse,
  Context,
  Handler,
} from "aws-lambda";
import { S3 } from "aws-sdk";
import querystring from "querystring";
import { isArray } from "util";
import { Query, resize } from "./lib/resize";

const value = (str?: string | string[]): string =>
  isArray(str) ? str[0] : str;

const guard = (n?: number): number | null => (isFinite(n) && n > 0 ? n : null);

const parseNum: (str: string | string[]) => number = str =>
  guard(parseInt(value(str)));

const parseQuery = (queryString: string): Query => {
  const { w, h, webp } = querystring.parse(queryString);
  return {
    width: parseNum(w),
    height: parseNum(h),
    webp: Boolean(webp),
  };
};

type S3Object = S3.GetObjectOutput;
const s3 = new S3();

const resizeS3Image = <T extends CloudFrontResultResponse>({
  s3Object,
  query,
  result,
}: {
  s3Object: Promise<S3Object>;
  query: Query;
  result: T;
}): Promise<T> => {
  return s3Object
    .then(data => data.Body)
    .then(Buffer.from)
    .then(resize(query))
    .then(buffer => {
      // response resized image
      const encoding = "base64";
      result.body = buffer.toString(encoding);
      result.bodyEncoding = encoding;
      if (query.webp) {
        result.headers["content-type"] = [
          { key: "Content-Type", value: "image/webp" },
        ];
      }
      return result;
    })
    .catch(e => {
      // response any error
      result.status = "403";
      result.headers["content-type"] = [
        { key: "Content-Type", value: "text/plain" },
      ];
      result.body = e.toString();
      console.error(e);
      return result;
    });
};

// noinspection JSUnusedGlobalSymbols
export const originResponse: Handler = async (
  event: CloudFrontResponseEvent,
  context: Context,
  cb: Callback,
) => {
  const { request, response } = event.Records[0].cf;
  const result = response as CloudFrontResultResponse;
  const uri = request.uri;

  // guard: check extension
  const ext = uri.split(".").pop();
  if (!ext.match(/jpe?g/)) {
    // response original
    cb(null, response);
    return;
  }
  // guard: check resize
  const queryString = request.querystring;
  if (!queryString) {
    // response original
    cb(null, response);
    return;
  }
  // guard: origin status
  switch (response.status) {
    case "200":
      // keep going
      break;
    case "404":
      // response not found
      result.status = "404";
      result.headers["content-type"] = [
        { key: "Content-Type", value: "text/plain" },
      ];
      result.body = `${uri} is not found.`;
      cb(null, result);
      return;
    case "304":
    default:
      // response original
      cb(null, response);
      return;
  }

  const query = parseQuery(queryString);
  console.log(query);

  /**
   * @see https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/RequestAndResponseBehaviorCustomOrigin.html#request-custom-headers-behavior
   * @see https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/lambda-event-structure.html#lambda-event-structure-request
   */
  const hostname = request.headers.host[0].value;
  // guard s3 domain
  const domainRegex = /\.s3\.amazonaws\.com$/;
  if (!hostname.match(domainRegex)) {
    throw new Error(`invalid S3 hostname: ${hostname}`);
  }
  const bucket = hostname.replace(domainRegex, "");
  const key = uri.slice(1); // remove first `/`
  console.log({ s3uri: `s3://${bucket}${uri}` });

  const s3Object = s3
    .getObject({
      Bucket: bucket,
      Key: key,
    })
    .promise();
  const resizeResult = await resizeS3Image({ s3Object, query, result });
  cb(null, resizeResult);
};
