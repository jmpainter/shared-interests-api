const chai = require('chai');
const chaiHttp = require('chai-http');
const chaiDateTime = require('chai-datetime');
const mongoose = require('mongoose');

const expect = chai.expect;

chai.use(chaiHttp);
chai.use(chaiDateTime);

mongoose.Promise = global.Promise;

const Interest = require('../models/interest');
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
      return chai.request(app)
        .post('/interests')
        .then(res => {
          expect(res).to.have.status(401);
        })
        .catch(err => handleError(err));
    });

    it('Should not add an interest if the wikipedia id is missing', () => {
      return chai.request(app)
        .post('/interests')
        .set('authorization', `Bearer ${testUserToken}`)
        .send({
          name
        })
        .then(res => {
          expect(res).to.have.status(422);
          expect(res.body.reason).to.equal('ValidationError');
          expect(res.body.message).to.equal('"wikiPageId" is required');
          expect(res.body.location).to.equal('wikiPageId');
        })
        .catch(err => handleError(err));
    });

    it('Should not add an interest if the name is missing', () => {
      return chai.request(app)
        .post('/interests')
        .set('authorization', `Bearer ${testUserToken}`)
        .send({
          wikiPageId
        })
        .then(res => {
          expect(res).to.have.status(422);
          expect(res.body.reason).to.equal('ValidationError');
          expect(res.body.message).to.equal('"name" is required');
          expect(res.body.location).to.equal('name');
        })
        .catch(err => handleError(err));
    });

    it('Should not add an interest if the name is over 50 characters', () => {
      return chai.request(app)
        .post('/interests')
        .set('authorization', `Bearer ${testUserToken}`)
        .send({
          wikiPageId,
          name: new Array(51).fill('a').join('')
        })
        .then(res => {
          expect(res).to.have.status(422);
          expect(res.body.reason).to.equal('ValidationError');
          expect(res.body.message).to.equal('"name" length must be less than or equal to 50 characters long');
          expect(res.body.location).to.equal('name');
        })
        .catch(err => handleError(err));
    });    

    it('Should not add an interest if the wikiPageId is over 30 characters', () => {
      return chai.request(app)
        .post('/interests')
        .set('authorization', `Bearer ${testUserToken}`)
        .send({
          wikiPageId: new Array(31).fill('a').join(''),
          name
        })
        .then(res => {
          expect(res).to.have.status(422);
          expect(res.body.reason).to.equal('ValidationError');
          expect(res.body.message).to.equal('"wikiPageId" length must be less than or equal to 30 characters long');
          expect(res.body.location).to.equal('wikiPageId');
        })
        .catch(err => handleError(err));
    });        

    it('Should interest to the collection and to the references in the user and interest if it is not present in the collection', () => {
      let interest
      return chai.request(app)
        .post('/interests')
        .set('authorization', `Bearer ${testUserToken}`)
        .send({
          wikiPageId,
          name
        })
        .then(res => {
          expect(res).to.have.status(201);
          expect(res.body.wikiPageId).to.equal(wikiPageId);
          expect(res.body.name).to.equal(name);
          return Interest.findById(res.body.id);
        })
        .then(_interest => {
          interest = _interest;
          expect(interest.name).to.equal(name);
          expect(interest.wikiPageId).to.equal(wikiPageId);
          expect(interest.users[0].toString()).to.equal(testUser.id);
          return User.findById(testUser.id);
        })
        .then(user => {
          console.log(user.interests);
          
          expect(user.interests.indexOf(interest.id)).to.not.equal(-1);
        })
        .catch(err => handleError(err));
    });

    it('Should not add the interest to the collection but add the interest to the user\'s interests and the interest\'s users if it is already present in the collection', () => {

      return chai.request(app)
        .post('/interests')
        .set('authorization', `Bearer ${testUserToken}`)
        .send({
          wikiPageId,
          name
        })
        .then(res => {
          expect(res).to.have.status(201);
          return chai.request(app)
            .post('/interests')
            .set('authorization', `Bearer ${testUser2Token}`)
            .send({
              wikiPageId,
              name
            });
        })
        .then(res => {
          expect(res).to.have.status(201);
          expect(res.body.wikiPageId).to.equal(wikiPageId);
          expect(res.body.name).to.equal(name);
          return Interest.find({ wikiPageId: wikiPageId});
        })
        .then(interests => {
          // make sure a duplicate entry in the collection was not made for the interest
          expect(interests).to.have.length(1);
        })
        .catch(err => handleError(err));
    });

  });

  describe('DELETE /interests/:id', () => { 

    it('Should reject unauthenticated requests', () => {
      return chai.request(app)
        .delete(`/interests/${testUser.interests[0]}`)
        .then(res => {
          expect(res).to.have.status(401);
        })
        .catch(err => handleError(err));
    });

    it('Should remove the references in the user and interest but not remove the interest on deletion', () => {
      const deleteInterestId = testUser.interests[0];
      return chai.request(app)
        .delete(`/interests/${deleteInterestId}`)
        .set('authorization', `Bearer ${testUserToken}`)
        .then(res => {
          expect(res).to.have.status(204);
          return User.findById(testUser.id);
        })
        .then(user => {
          expect(user.interests.indexOf(deleteInterestId)).to.equal(-1);
          return Interest.findById(deleteInterestId);
        })
        .then(interest => {
          expect(interest.users.indexOf(testUser.id)).to.equal(-1);
        })
        .catch(err => handleError(err));
    });

  });
});