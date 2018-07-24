import { APIGatewayEvent, Callback, Context, Handler } from "aws-lambda";

import { Query, resize } from "./lib/resize";

// noinspection JSUnusedGlobalSymbols
export const hello: Handler = (
  event: APIGatewayEvent,
  context: Context,
  cb: Callback,
) => {
  const response = {
    statusCode: 200,
    body: JSON.stringify({
      message:
        "Go Serverless Webpack (Typescript) v1.0! Your function executed successfully!",
      input: event,
    }),
  };

  cb(null, response);
};
