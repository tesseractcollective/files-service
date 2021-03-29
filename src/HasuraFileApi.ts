import * as phin from 'phin';
import config from './config';

export type JsonPrimitive = number | string | boolean | null;
export type JsonAny = JsonPrimitive | JsonObject | JsonArray;

export interface JsonObject {
  [key: string]: any;
}
export type JsonArray = Array<JsonPrimitive | JsonObject>;

async function executeQuery(
  query: string,
  variables: any,
  token?: string,
): Promise<phin.IJSONResponse<JsonObject>> {
  return phin({
    url: config.hasuraUrl,
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'X-Hasura-Role': 'user',
    },
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
        error.message = JSON.stringify({body, variables});
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
