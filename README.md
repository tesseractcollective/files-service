# files-service

Uses s3 as a storage solution, CloudFront as a gateway, and Hasura as a permissions engine to upload, download, and delete files.

Upload Flow:
- Request comes into CloudFront with a header and a binary or multi-part form body
- CloudFront calls a Lambda@Edge function and passes the header only (not the body)
- Our supplied Lambda@Edge function queries Hasura to see if user has correct permissions in JWT to upload. If yes, it let's CloudFront know to forward the upload onto S3
- Our Lambda@Edge function also creates a Hasura File object in the database
- File is uploaded directly to S3 without any other server pass-through
