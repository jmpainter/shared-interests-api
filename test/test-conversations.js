const chai = require('chai');
const chaiHttp = require('chai-http');
const chaiDateTime = require('chai-datetime');
const mongoose = require('mongoose');

const expect = chai.expect;

chai.use(chaiHttp);
chai.use(chaiDateTime);

mongoose.Promise = global.Promise;

const Conversation = require('../models/conversation');
const User = require('../models/user');

const { app, runServer, closeServer } = require('../server');
const { TEST_DATABASE_URL } = require('../config');

const {
  seedData,
  tearDownDb,
  generateTestUserToken,
  handleError
} = require('./seeds');

// save off two users for authenticated tests
let testUser = {};
let testUser2 = {};
let testUserToken;
let testUser2Token;

function seedDataAndGenerateTestUsers() {
  return seedData()
    .then(() => User.findOne())
    .then(user => {
      testUser = user;
      testUserToken = generateTestUserToken(user);
      return User.findOne({_id: {$ne: user.id}});
    })
    .then(user2 => {
      testUser2 = user2;
      testUser2Token = generateTestUserToken(user2);
    })
    .catch(err => console.error(err));
}

describe('interests API resource', () => {
  const wikiPageId = 'fake';
  const name = 'Gardening';
  const wikiPageId2 = 'fake2';
  const name2 = 'Rowing';

  before(() => {
    return runServer(TEST_DATABASE_URL);
  });
  
  beforeEach(() => {
    return seedDataAndGenerateTestUsers();
  });

  afterEach(() => {
    return tearDownDb();
  });

  after(() => {
    return closeServer();
  });

  describe('POST /interests', () => {

    it('Should reject unauthenticated requests', () => {
    });

  });
});