const faker = require('faker');
const chai = require('chai');
const mongoose = require('mongoose');
const { JWT_SECRET } = require('../config');
const jwt = require('jsonwebtoken');

const User = require('../models/user');
const Interest = require('../models/interest');
const InterestUser = require('../models/interestUser');

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
          // create three interests for each user and add references
          for(let i = 0; i < 3; i++) {
            interestPromises.push(addInterestToUser(user._id));
          }
          return Promise.all(interestPromises);
        })
       .catch(err => handleError(err))
    )
  })
  return Promise.all(promises);
}

function addInterestToUser(userId) {
  let interest;
  return Interest.create(generateInterestData())
    .then(_interest => {
      interest = _interest;
      return InterestUser.create({
        user: userId,
        interest: interest.id
      });
    })
    .then(() => {
      return User.findById(userId);
    })
    .then(user => {
      user.interests.push(interest.id);
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

function generateInterestData() {
  return {
    wikiPageId: faker.random.number(),
    name: faker.lorem.words()
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
