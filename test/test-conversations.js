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

describe('conversations API resource', () => {
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

  describe('GET /conversations', () => {

    it('Should reject unauthenticated requests', () => {
      return chai.request(app)
        .get('/conversations')
        .then(res => {
          expect(res).to.have.status(401);
        })
        .catch(err => handleError(err));
      });
    
    it('Should get conversations for an authenticated user', () => {
      // first create a conversation, then retrieve conversations
      return chai.request(app)
        .post('/conversations')
        .set('authorization', `Bearer ${testUserToken}`)
        .send({ recipient: testUser2.id })
        .then(() => {
          return chai.request(app)
            .get('/conversations')
            .set('authorization', `Bearer ${testUserToken}`)
        })
        .then(res => {
          expect(res).to.have.status(200);
          expect(res.body.conversations[0].users.map(user => JSON.stringify(user))).to.contain(JSON.stringify({ _id: testUser.id, screenName: testUser.screenName, location: testUser.location }));
          expect(res.body.conversations[0].users.map(user => JSON.stringify(user))).to.contain(JSON.stringify({ _id: testUser2.id, screenName: testUser2.screenName, location: testUser2.location }));
        })
        .catch(err => handleError(err));
    });

  });

  describe('POST /conversations', () => {

    it('Should reject unauthenticated requests', () => {
      return chai.request(app)
        .post('/conversations')
        .then(res => {
          expect(res).to.have.status(401);
        })
        .catch(err => handleError(err));
      });
      
    it('Should reject requests that don\'t include a recipient', () => {
        return chai.request(app)
          .post('/conversations')
          .set('authorization', `Bearer ${testUserToken}`)
          .then(res => {
            expect(res).to.have.status(422);
            expect(res.body.reason).to.equal('ValidationError');
            expect(res.body.message).to.equal('"recipient" is required');
            expect(res.body.location).to.equal('recipient');
          })
          .catch(err => handleError(err));
    });

    it('Should create a conversation', () => {
      // create conversation, check both http response and database
      return chai.request(app)
        .post('/conversations')
        .set('authorization', `Bearer ${testUserToken}`)
        .send({ recipient: testUser2.id })
        .then(res => {
          expect(res).to.have.status(201);
          expect(res.body.users).to.contain(testUser.id);
          expect(res.body.users).to.contain(testUser2.id);
          return Conversation.findById(res.body.id);
        })
        .then(conversation => {
          expect(conversation.users).to.contain(testUser.id);
          expect(conversation.users).to.contain(testUser2.id);
        })
        .catch(err => handleError(err));
    });

  });
});