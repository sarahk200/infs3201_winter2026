# INFS3201 Assignment 4

## Test User Credentials

| Username | Password |
|----------|----------|
| admin    | admin123 |
| user1    | pass1234 |

## Setup

1. Run `npm install`
2. Run `node transform_db.js` to migrate the database (only needs to be done once)
3. Create the users collection in MongoDB with the hashed passwords (SHA256)
4. Run `node web.js` to start the server
5. Go to `http://localhost:8000`

## Notes
- Sessions expire after 5 minutes of inactivity
- Each visit by a logged in user extends the session by another 5 minutes
- All access is logged in the security_log collection in MongoDB
