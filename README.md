# !ALL UPDATES FOR THE BOOKTID.NET PROJECT WILL BE LOCATED AT https://github.com/mathiashsteffensen/book-tid

# Book Tid API Server
Standalone JSON API web server for the booktid.net online bookingsystem, written in JavaScript and currently being rewritten in TypeScript.

It is an Express web server using Mongoose to interface with a MongoDB database.

It includes integrations with the AWS SDK for storing photos using Amazon S3, SendGrid for automated e-mails, and Stripe subscriptions for monetization.
It also includes an integration with my own simple microservice written in python, and running on AWS Lambda.

If you want to run the software locally please read the system requirements in this README.md and ensure all required environment variables are present before proceeding.

#### To run the software in development mode:
```bash
npx degit mathiashsteffensen/book-tid-api#main ./book-tid-api
cd book-tid-api
yarn
yarn dev
```

#### To build it for production and start the server:
```bash
# In the same folder
yarn build
yarn start
```

Runs in production at https://api.booktid.net

## Requirements to run API server

### System
    Node version >=10.19.0 is required by dependencies, the production server currently runs on Node v14.15.1

### Environment variables

#### Storage
    MONGO_URI_CONNECTION_STRING, required to access a mongoDB database
    TEST_MONGO_URI_CONNECTION_STRING, required to access a mongoDB database when running automated testing sequences - this should be a disposable database that can be dropped with no worries

    DO_BUCKET_SECRET_KEY, secret key to a Digital Ocean Bucket - used for storing photos
    DO_BUCKET_ACCESS_KEY, access key to a Digital Ocean Bucket - used for storing photos
    DO_BUCKET_NAME, name of the Digital Ocean Bucket

    

#### Integrations
    SENDGRID_API_KEY, SendGrid API Key - used to run automated emails

    SMS_API_URL, the url for the sms sending service - see integrations/sms.js
    SMS_API_KEY, an apikey for the sms service, if the service requires that

    STRIPE_SECRET_KEY, payment integration
    TEST_STRIPE_SECRET_KEY, payment integration
    STRIPE_WEBHOOK_SECRET, payment integration
    TEST_STRIPE_WEBHOOK_SECRET, payment integration

    HOLIDAY_API_KEY

#### Other
    JWT_SECRET, a secret key used to generate JSON Web Tokens
    PORT, A port for the server to run on


    
