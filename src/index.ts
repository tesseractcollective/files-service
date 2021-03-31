import {
  CloudFrontRequest,
  CloudFrontRequestEvent,
  CloudFrontRequestResult,
  CloudFrontResultResponse,
  CloudFrontResponseEvent,
  CloudFrontResponseResult,
  CloudFrontEvent,
} from 'aws-lambda';

import {createLog, executeQueryFromHttpMethod} from './HasuraFileApi';

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

async function handleFileRequest(request: CloudFrontRequest, config: CloudFrontEvent["config"]) {
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
      cloudFrontData: { requestId: config.requestId }
    };
  }
  const authToken = getToken(request, token);
  return executeQueryFromHttpMethod(request.method, variables, authToken);
}

export async function fileAuth(
  event: CloudFrontRequestEvent,
): Promise<CloudFrontRequestResult> {
  try {
    const record = event.Records[0].cf;
    const config = record.config;
    const request = record.request;
    await createLog(config.requestId, {
      action: `${config.eventType} ${request.method} ${request.uri}`,
      cfRecord: record
    });

    const file = await handleFileRequest(request, config);
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
  const record = event.Records[0].cf;
  const config = record.config;
  const {request, response} = record;
  await createLog(config.requestId, {
    action: `${config.eventType} ${request.method} ${request.uri}`,
    cfRecord: record
  });
  
  if (request.method === 'GET') {
    return response;
  }

  try {
    delete response.headers['content-length'];
    response.headers['content-type'] = [{key: 'Content-Type', value: 'application/json'}];
    const [_, id] = request.uri.split('/files/');

    return {
      ...response,
      status: '200',
      statusDescription: 'OK',
      body: JSON.stringify({id}),
    };
  } catch (error) {
    const newResponse = {
      ...response,
      status: '500',
      statusDescription: 'server error',
      body: JSON.stringify(error),
    };
    await createLog(config.requestId, newResponse);
    return newResponse;
  }
}
