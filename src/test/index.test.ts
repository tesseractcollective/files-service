import {
  CloudFrontRequest,
  CloudFrontRequestEvent,
  CloudFrontResultResponse,
} from 'aws-lambda';

import { fileAuth } from "../index";

const token = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IklzdUxnTlFWblUtOGJRSXBaUndmeiJ9.eyJodHRwczovL2hhc3VyYS5pby9qd3QvY2xhaW1zIjp7IngtaGFzdXJhLWRlZmF1bHQtcm9sZSI6ImFkbWluIiwieC1oYXN1cmEtYWxsb3dlZC1yb2xlcyI6WyJhZG1pbiIsInVzZXIiXSwieC1oYXN1cmEtdXNlci1pZCI6IjVkNDgzNmNhLWY4NjgtNGYzNi1hZjNhLWFkZTk3Y2NjMzIxMCJ9LCJuaWNrbmFtZSI6Impvc2h1YWR1dHRvbiIsIm5hbWUiOiJqb3NodWFkdXR0b25AZ21haWwuY29tIiwicGljdHVyZSI6Imh0dHBzOi8vcy5ncmF2YXRhci5jb20vYXZhdGFyL2QzY2YwMjE3YTEwMGUwNTE5NzRlZmM2ZmIyOTFiMDJlP3M9NDgwJnI9cGcmZD1odHRwcyUzQSUyRiUyRmNkbi5hdXRoMC5jb20lMkZhdmF0YXJzJTJGam8ucG5nIiwidXBkYXRlZF9hdCI6IjIwMjEtMDMtMzFUMTg6MTQ6NDkuNjE3WiIsImVtYWlsIjoiam9zaHVhZHV0dG9uQGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjpmYWxzZSwiaXNzIjoiaHR0cHM6Ly9hdXRoLnRoZWxpdGFzLmNvLyIsInN1YiI6ImF1dGgwfDYwMmRhNmIwN2I0MjhjMDA2YTc1NGYwNiIsImF1ZCI6IkJ5dDVPZk13dnZuMk1TSDk2VWtXS01rMTljQjBFMUs3IiwiaWF0IjoxNjE3MjE0NDkxLCJleHAiOjE2MTcyNTA0OTF9.JUg0oBn0yxbTdt5F8DAJkKs7mUxMKzoM-2baj5gbTsWzOFk1kD6IgYAM83zJGlYol86aQaHWrP0Nw9RLSr5GMcBcNVIa4SMc28Ns7NRCVjhid9MKY02jOaLsXqoLk6d-Sme1t0JiDONGYuC_ioP0MAhlW2ISLR5mWpi3INbEBxFkDUtxQK6oncenA6sTg2kaHzMrHXMuc852NsIcQ6VltzVCQ3bZTQOogYqk2Th8gA7CJdP0wQoI56mpnHec3iuQ6of0WQ_QT0aNpCGUd8nqDXqeR4T01YwFFoVbyxu6bSLDrCG-uNcj8mDIh-94MSSOLK5yTbaYOoveNWOcgwh5hg";

function createEvent(authorization?: string, method?: string, querystring?: string): CloudFrontRequestEvent {
  const event: CloudFrontRequestEvent = {
    "Records": [{
      "cf": {
        "config": {
          "distributionDomainName": "test.example.com",
          "distributionId": "1234",
          "eventType": "viewer-request",
          "requestId": "1234-pdq"
        },
        "request": {
          "clientIp": "136.36.207.54",
          "headers": {
            "host": [{ "key": "Host", "value": "test.example.com" }],
            "user-agent": [{ "key": "User-Agent", "value": "Jest test" }],
          },
          "method": method || "GET",
          "querystring": querystring || "",
          "uri": "/"
        }
      }
    }
  ]};
  if (authorization) {
    event.Records[0].cf.request.headers.authorization = [{ "key": "Authorization", "value": authorization }];
  }
  return event;
}

describe('fileAuth', () => {
  it('authorizes a valid token', async () => {
    const event = createEvent(token, "GET", "id=5e174a3f-2232-4213-8ece-1974e59269be");
    const request = await fileAuth(event) as CloudFrontRequest;
    console.log(JSON.stringify(request, null, 2));
    expect(request?.uri).toEqual("/");
    expect(request?.headers?.authorization).toEqual(undefined);
  });

  // it('authorizes a valid token', async () => {
  //   const event = createEvent('test');
  //   const request = await fileAuth(event) as CloudFrontRequest;
  //   expect(request?.uri).toEqual("/");
  //   expect(request?.headers?.authorization).toEqual(undefined);
  // });

  // it('returns unauthorized if invalid token', async () => {
  //   const event = createEvent('invalid');
  //   const response = await fileAuth(event) as CloudFrontResultResponse;
  //   expect(response.status).toEqual('401');
  // });

  // it('returns unauthorized if no authorization header', async () => {
  //   const event = createEvent();
  //   const response = await fileAuth(event) as CloudFrontResultResponse;
  //   expect(response.status).toEqual('401');
  // });
});
