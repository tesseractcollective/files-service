import {
  CloudFrontRequest,
  CloudFrontRequestEvent,
  CloudFrontRequestResult,
  CloudFrontResultResponse,
  CloudFrontResponseEvent,
  CloudFrontResponseResult,
} from 'aws-lambda';

import {executeQueryFromHttpMethod} from './HasuraFileApi';

function createResponse(
  status: number,
  body: string,
  contentType: string,
): CloudFrontResultResponse {
  return {
    status: `${status}`,
    body,
    headers: {
      'content-type': [{key: 'Content-Type', value: contentType}],
    },
  };
}

function getQueryParams(query?: string): {[key: string]: any} {
  const keyValues = query?.split('&') || [];
  return keyValues.reduce<{[key: string]: string}>((previous, keyValue) => {
    const [key, value] = keyValue.split('=');
    previous[key] = value;
    return previous;
  }, {});
}

function getHeaderValue(
  request: CloudFrontRequest,
  key: string,
): string | undefined {
  const header = request.headers[key];
  return header ? header[0].value : undefined;
}

function getToken(
  request: CloudFrontRequest,
  token?: string,
): string | undefined {
  const authorizationValue = getHeaderValue(request, 'authorization');
  return authorizationValue?.replace('Bearer ', '') || token;
}

async function handleFileRequest(event: CloudFrontRequestEvent) {
  const request = event.Records[0].cf.request;
  const {token, id, groupId, postId} = getQueryParams(
    request.querystring,
  );

  const variables: any = {id};
  const mimeType = getHeaderValue(request, 'content-type') || 'text/plain';
  if (request.method === 'PUT') {
    variables.file = {
      groupId: groupId === 'null' ? null : groupId,
      postId: postId === 'null' ? null : postId,
      name: request.uri.replace('/', ''),
      domain: getHeaderValue(request, 'host') || '',
      fileType: mimeType.split('/')[0].toUpperCase() || 'APPLICATION',
      mimeType: mimeType,
      contentLength: parseInt(getHeaderValue(request, 'content-length') || '0'),
      cloudFrontData: event,
    };
  }
  const authToken = getToken(request, token);
  return executeQueryFromHttpMethod(request.method, variables, authToken);
}

export async function fileAuth(
  event: CloudFrontRequestEvent,
): Promise<CloudFrontRequestResult> {
  try {
    const request = event.Records[0].cf.request;
    const file = await handleFileRequest(event);
    request.uri = `/users/${file.userId}/files/${file.id}`;
    delete request.headers.authorization;
    request.querystring = '';
    return request;
  } catch (error) {
    return createResponse(error.code, error.message, 'text/plain');
  }
}

export async function fileResponse(
  event: CloudFrontResponseEvent,
): Promise<CloudFrontResponseResult> {
  const {request, response} = event.Records[0].cf;
  if (request.method === 'GET') {
    return response;
  }
  try {
    const [_, id] = request.uri.split('/files/');
    return {
      ...response,
      body: JSON.stringify({id}),
    };
  } catch (error) {
    return {
      ...response,
      body: JSON.stringify({error: error.message, request: request}),
    };
  }
}

//     "Principal": {
//         "AWS": "arn:aws:iam::cloudfront:user/CloudFront Origin Access Identity E1OH2FACYKDBBP"
//     },
