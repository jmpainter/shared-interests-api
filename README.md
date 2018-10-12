# Shared Interests API

API for Shared Interests  
[https://github.com/jmpainter/shared-interests-client]  (https://github.com/jmpainter/shared-interests-client)

## Live App:

[http://www.oursharedinterests.org](http://www.oursharedinterests.org)

## Technologies Used:
 
The Shared Interests API was created with Node.js and the Express.js framework. Morgan is used for logging, joi for request validation, and haversine for distance calculations based on latitude and longitude. Passport.js is used for local and json web token authentication. The database used is Mongodb and mongoose is used as an object data manager. The Github source repository is integrated with TravisCI for integration testing and builds. TravisCI is integrated with Heroku for deployment. The MongoDB database is hosted at mLab. The app contains integration tests created with the Mocha test framework and the Chai assertion library.

## API Documentation

POST /auth/login - for user authentication

POST /auth/refresh - for Json Web Token renewal

POST /users - for user account creation

GET /users - for retrieval of an authenticated user’s non-sensitive account information

GET /users?interests=true - for retrieval of other users by matching interests

GET /users?nearby=true - for retrieval of other users by nearby location

GET /users?other=true - for retrieval of other users with non-matching interests

GET /users/:id - for retrieval of another user’s username and interests

PUT /users/:id - for updating user information

GET /interests - public retrieval of latest interests in the system

POST /interest - add and interest to list of user’s interests

DELETE /interest/:id - delete a user’s interest

GET /conversations - get conversations for an authenticated user

POST /conversations - create a conversation between users

POST /conversations/:id/messages - create a message for a converation

## Author:

[Josh Painter](http://joshuapainter.com/)


