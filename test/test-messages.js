const chai = require('chai');
const chaiHttp = require('chai-http');
const chaiDateTime = require('chai-datetime');
const mongoose = require('mongoose');

const expect = chai.expect;

chai.use(chaiHttp);
chai.use(chaiDateTime);

mongoose.Promise = global.Promise;

const Conversation = require('../models/conversation');
const Message = require('../models/message');
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

// save a conversation for tests
let testConversation = {};

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
      // create a test conversation
      return Conversation.create({
        users: [testUser.id, testUser2.id]
      });
    })
    .then(conversation => {
      testConversation = conversation;
    })
    .catch(err => console.error(err));
}

describe('messages API resource', () => {
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

  describe('POST /conversations/:id/messages', () => {

    it('Should reject unauthenticated requests', () => {
      return chai.request(app)
        .post(`/conversations/${testConversation.id}/messages`)
        .then(res => {
          expect(res).to.have.status(401);
        })
        .catch(err => handleError(err));
    });

    it('Should reject a request that does not contain text', () => {
      return chai.request(app)
        .post(`/conversations/${testConversation.id}/messages`)
        .set('authorization', `Bearer ${testUserToken}`)
        .then(res => {
          expect(res).to.have.status(422);
          expect(res.body.reason).to.equal('ValidationError');
          expect(res.body.message).to.equal('"text" is required');
          expect(res.body.location).to.equal('text');
        })
        .catch(err => handleError(err));
    });

    it('Should reject a request for a non-existent conversation', () => {
      const fakeId = new Array(24).fill('0').join('');
      return chai.request(app)
        .post(`/conversations/${fakeId}/messages`)
        .set('authorization', `Bearer ${testUserToken}`)
        .send({ text: 'test'})
        .then(res => {
          expect(res).to.have.status(404);
          expect(res.body.reason).to.equal('RequestError');
          expect(res.body.message).to.equal('Not Found');
        })
        .catch(err => handleError(err));
    });

    it('Should create a message and add the reference to the conversation', () => {
      let message;
      return chai.request(app)
        .post(`/conversations/${testConversation.id}/messages`)
        .set('authorization', `Bearer ${testUserToken}`)
        .send({ text: 'test'})
        .then(res => {
          expect(res).to.have.status(201);
          expect(res.body.senderId).to.equal(testUser.id);
          expect(res.body.conversationId).to.equal(testConversation.id);
          expect(res.body.text).to.equal('test');
          return Message.findById(res.body.id);
        })
        .then(_message => {
          message = _message;
          expect(message.senderId.toString()).to.equal(testUser.id);
          expect(message.conversationId.toString()).to.equal(testConversation.id);
          expect(message.text).to.equal('test');
          return Conversation.findById(testConversation.id);   
        })
        .then(conversation => {
          expect(conversation.messages).to.contain(message.id);
        })
        .catch(err => handleError(err));
    });

  });
});