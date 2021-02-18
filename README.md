# Book Tid API Server

## Requirements to run API server

### System
    Node version > 10.14, required by dependencies
    
    In production a microservice running on http://localhost:8080 is required for sending automated text reminders.
    See integrations/sms.js for more information. 

### Environment variables

#### Storage
    MONGO_URI_CONNECTION_STRING, required to access a mongoDB database
    TEST_MONGO_URI_CONNECTION_STRING, required to access a mongoDB database when running automated testing sequences

    DO_BUCKET_SECRET_KEY, secret key to a Digital Ocean Bucket - used for storing photos
    DO_BUCKET_ACCESS_KEY, access key to a Digital Ocean Bucket - used for storing photos
    DO_BUCKET_NAME, name of the Digital Ocean Bucket

    

#### Integrations
    SENDGRID_API_KEY, SendGrid API Key - used to run automated emails

    STRIPE_SECRET_KEY, payment integration
    TEST_STRIPE_SECRET_KEY, payment integration
    STRIPE_WEBHOOK_SECRET, payment integration
    TEST_STRIPE_WEBHOOK_SECRET, payment integration

    HOLIDAY_API_KEY

#### Other
    JWT_SECRET, a secret key used to generate JSON Web Tokens
    PORT, A port for the server to run on


    