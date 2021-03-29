import {
  CloudFrontRequest,
  CloudFrontRequestEvent,
  CloudFrontResultResponse,
} from 'aws-lambda';

import { fileAuth } from "../index";

const token = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IklzdUxnTlFWblUtOGJRSXBaUndmeiJ9.eyJodHRwczovL2hhc3VyYS5pby9qd3QvY2xhaW1zIjp7IngtaGFzdXJhLWRlZmF1bHQtcm9sZSI6ImFkbWluIiwieC1oYXN1cmEtYWxsb3dlZC1yb2xlcyI6WyJhZG1pbiIsInVzZXIiXSwieC1oYXN1cmEtdXNlci1pZCI6IjVkNDgzNmNhLWY4NjgtNGYzNi1hZjNhLWFkZTk3Y2NjMzIxMCJ9LCJuaWNrbmFtZSI6Impvc2h1YWR1dHRvbiIsIm5hbWUiOiJqb3NodWFkdXR0b25AZ21haWwuY29tIiwicGljdHVyZSI6Imh0dHBzOi8vcy5ncmF2YXRhci5jb20vYXZhdGFyL2QzY2YwMjE3YTEwMGUwNTE5NzRlZmM2ZmIyOTFiMDJlP3M9NDgwJnI9cGcmZD1odHRwcyUzQSUyRiUyRmNkbi5hdXRoMC5jb20lMkZhdmF0YXJzJTJGam8ucG5nIiwidXBkYXRlZF9hdCI6IjIwMjEtMDMtMjhUMjE6MzQ6NTMuMTIyWiIsImVtYWlsIjoiam9zaHVhZHV0dG9uQGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjpmYWxzZSwiaXNzIjoiaHR0cHM6Ly9hdXRoLnRoZWxpdGFzLmNvLyIsInN1YiI6ImF1dGgwfDYwMmRhNmIwN2I0MjhjMDA2YTc1NGYwNiIsImF1ZCI6IkJ5dDVPZk13dnZuMk1TSDk2VWtXS01rMTljQjBFMUs3IiwiaWF0IjoxNjE2OTY5NzA0LCJleHAiOjE2MTcwMDU3MDR9.xVfv14GKJldGW_SX86HKFc9V7E2OvBjE4190CeT0Tl3qMlr_YL-ObB2JkAh9NDCkZfZ9pNrTUaaNxv9Fxn6_0E33pw1kcun4a63YSQY7dPFOxh--gcTLBf_ZU1sm1ADQ70V-eIMNlsYgSm-7o7Wfa2ba95xM0pXH6T7C0M1CwTT--mE45IRWohnWJ1bBP06F6ZET2d7wFswKJijRvziiCu05AbY0tQFijTcAg3orMF_7LVMlbuGJELJZtXKbqw3Y0fOXlZZMVsZ5wrxnC6fc41i3dA3_3wEmGJIRL6AqNW1HjhJxP6xwZR5b6E08mYp79S6Cd_tmGBm_0onBqxyvGg";

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
