import * as phin from 'phin';
import config from './config';

export type JsonPrimitive = number | string | boolean | null;
export type JsonAny = JsonPrimitive | JsonObject | JsonArray;

const cloudFrontFileWorkerApiKey = '97b3e11d-dfb9-4cdb-aba4-72c4f5db3aba';

export interface JsonObject {
  [key: string]: any;
}
export type JsonArray = Array<JsonPrimitive | JsonObject>;

async function executeQuery(
  query: string,
  variables: any,
  token?: string,
  apiKey?: string,
): Promise<phin.IJSONResponse<JsonObject>> {
  let headers: any = {
    Authorization: `Bearer ${token}`,
    'X-Hasura-Role': 'user',
  };
  if (apiKey) {
    headers = {
      'X-Hasura-Api-Key': apiKey,
      'X-Hasura-Role': 'api',
    };
  }
  return phin({
    url: config.hasuraUrl,
    method: 'POST',
    headers: headers,
    data: JSON.stringify({query, variables}),
    parse: 'json',
  });
}

function dataKeyOrThrow(key: string, request: any, variables: any): JsonObject {
  const body = request.body;
  const fileObject = body.data ? body.data[key] : undefined;
  if (fileObject) {
    return fileObject;
  }
  const error: any = new Error('file not found');
  error.code = 404;
  if (body.errors) {
    const errorObject = body.errors[0];
    switch (errorObject.extensions.code) {
      case 'invalid-headers':
      case 'invalid-jwt':
        error.code = 401;
        error.message = 'unauthorized';
        break;
      default:
        error.code = 400;
        error.message = errorObject.message;
    }
  }
  throw error;
}

export async function executeQueryFromHttpMethod(
  method: string,
  variables: JsonObject,
  token?: string,
): Promise<JsonObject> {
  switch (method) {
    case 'GET':
      return executeQuery(config.getQuery, variables, token).then((response) =>
        dataKeyOrThrow(config.getOperation, response, variables),
      );
    case 'PUT':
      if (variables.id) {
        return executeQuery(
          config.updateMutation,
          variables,
          token,
        ).then((response) =>
          dataKeyOrThrow(config.updateOperation, response, variables),
        );
      }
      return executeQuery(
        config.insertMutation,
        variables,
        token,
      ).then((response) =>
        dataKeyOrThrow(config.insertOperation, response, variables),
      );
    case 'DELETE':
      return executeQuery(
        config.deleteMutation,
        variables,
        token,
      ).then((response) =>
        dataKeyOrThrow(config.deleteOperation, response, variables),
      );
    default:
      const error: any = new Error(`unsuported method ${method}`);
      error.code = 405;
      return Promise.reject(error);
  }
}

export async function createLog(
  trace: string,
  details: JsonObject,
  timestamp?: Date,
) {
  console.log('logging');
  let mutation = `mutation createLog($trace:String!, $details:jsonb!, $timestamp:timestamptz!) {
    insert_log(objects: { trace:$trace, details:$details, timestamp:$timestamp}) {
      affected_rows
    }
  }`;
  if (!timestamp) {
    mutation = `mutation createLog($trace:String!, $details:jsonb!) {
      insert_log(objects: { trace:$trace, details:$details }) {
        affected_rows
      }
    }`;
  }
  const variables = {
    trace,
    details,
    timestamp: timestamp ? timestamp.toISOString() : undefined,
  };
  return executeQuery(mutation, variables, undefined, cloudFrontFileWorkerApiKey).then(response => {
    return dataKeyOrThrow('insert_log', response, variables);
  }).catch(error => {
    console.error('error while logging', error);
  });
}
