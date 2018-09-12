const faker = require('faker');
const chai = require('chai');
const mongoose = require('mongoose');
const { JWT_SECRET } = require('../config');
const jwt = require('jsonwebtoken');

const User = require('../models/user');
const Interest = require('../models/interest');

mongoose.Promise = global.Promise;

function seedData() {
  console.log('seeding data');
  const userSeedData = [];
  // create seed data for three new users
  for(let i = 0; i < 3; i++) {
    userSeedData.push(generateUserData());
  }
  const promises = [];
  userSeedData.forEach((seed, index) => {
    promises.push(
      User.hashPassword(seed.password)
        .then(password => {
          seed["password"] = password;
          return User.create(seed);
        })
        .then(user => {
          const interestPromises = [];
          //create three interests for each user
          for(let i = 0; i < 3; i++) {
            interestPromises.push(Interest.create(generateInterestData(user._id)));
          }
          return Promise.all(interestPromises);
        })
        .then(results => {
          //add the interest to the user's list of interests
          const addInterestToUserPromises = [];
          results.forEach((interest, index) => {
            addInterestToUserPromises.push(addInterestToUser(interest.users[0], interest._id));
          })
          return Promise.all(addInterestToUserPromises);
        })
       .catch(err => handleError(err))
    )
  })
  return Promise.all(promises);
}

function addInterestToUser(userId, interestId) {
  return User.findById(userId)
    .then(user => {
      user.interests.push(interestId);
      return user.save();
    })
    .catch(err => handleError(err));
}

function generateUserData() {
  return {
    firstName: faker.name.firstName(),
    lastName: faker.name.lastName(),
    screenName: faker.internet.userName(),
    location: faker.address.city(),
    username: faker.internet.email(),
    password: 'password'
  }
}

function generateInterestData(userId) {
  return {
    wikiPageId: faker.random.number(),
    name: faker.lorem.words(),
    users: [userId]
  }
}

function generateTestUserToken(user) {
  return jwt.sign(
    {
      user: {
        id: user.id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName
      }
    },
    JWT_SECRET,
    {
      algorithm: 'HS256',
      subject: user.username,
      expiresIn: '7d'
    }
  );
}

function handleError(err) {
  if(err instanceof chai.AssertionError) {
    throw err;
  } else {
    console.error(err);
  }
}

function tearDownDb() {
  console.warn('Deleting database');
  return mongoose.connection.dropDatabase();
}

module.exports = {
  seedData,
  generateUserData,
  generateTestUserToken,  
  tearDownDb,
  handleError
}