const chai = require('chai');
const chaiHttp = require('chai-http');
const chaiDateTime = require('chai-datetime');
const mongoose = require('mongoose');

const expect = chai.expect;

chai.use(chaiHttp);
chai.use(chaiDateTime);

mongoose.Promise = global.Promise;

const User = require('../models/user');
const InterestUser = require('../models/interestUser');

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

describe('users API resource', () => {
  const firstName = 'Example';
  const lastName = 'User';
  const screenName = 'Name';
  const location = 'San Francisco';
  const latitude = 52.7;
  const longitude = -7.43;
  const username = 'exampleUser';
  const password = 'examplePass';

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

  describe('POST /users', () => {

    it('Should reject users with a missing username', () => {
      return chai
        .request(app)
        .post('/users')
        .send({
          firstName,
          lastName,
          screenName,
          location,
          password
        })
        .then(res => {
          expect(res).to.have.status(422);
          expect(res.body.reason).to.equal('ValidationError');
          expect(res.body.message).to.equal('"username" is required');
          expect(res.body.location).to.equal('username');
        })
        .catch(err => handleError(err));
    });

    it('Should reject users with a missing password', () => {
      return chai
        .request(app)
        .post('/users')
        .send({
          firstName,
          lastName,
          screenName,
          username
        })
        .then(res => {
          expect(res).to.have.status(422);
          expect(res.body.reason).to.equal('ValidationError');
          expect(res.body.message).to.equal('"password" is required');
          expect(res.body.location).to.equal('password');
        })
        .catch(err => handleError(err));
    });

    it('Should reject users with a non-string username', () => {
      return chai
        .request(app)
        .post('/users')
        .send({
          firstName,
          lastName,
          screenName,
          username: {value: 'value'},
          password
        })
        .then(res => {
          expect(res).to.have.status(422);
          expect(res.body.reason).to.equal('ValidationError');
          expect(res.body.message).to.equal('"username" must be a string');
          expect(res.body.location).to.equal('username');
        })
        .catch(err => handleError(err));
    });

    it('Should reject users with a non-string password', () => {
      return chai
        .request(app)
        .post('/users')
        .send({
          firstName,
          lastName,
          screenName,
          username,
          password: 123
        })
        .then(res => {
          expect(res).to.have.status(422);
          expect(res.body.reason).to.equal('ValidationError');
          expect(res.body.message).to.equal('"password" must be a string');
          expect(res.body.location).to.equal('password');
        })
        .catch(err => handleError(err));
    });

    it('Should reject users with a non-string first name', () => {
      return chai
        .request(app)
        .post('/users')
        .send({
          firstName: {value: 'value'},
          lastName,
          screenName,
          username,
          password
        })
        .then(res => {
          expect(res).to.have.status(422);
          expect(res.body.reason).to.equal('ValidationError');
          expect(res.body.message).to.equal('"firstName" must be a string');
          expect(res.body.location).to.equal('firstName');
        })
        .catch(err => handleError(err));
    });

    it('Should reject users with a non-string last name', () => {
      return chai
        .request(app)
        .post('/users')
        .send({
          firstName,
          lastName: 1234,
          screenName,
          username,
          password
        })
        .then(res => {
          expect(res).to.have.status(422);
          expect(res.body.reason).to.equal('ValidationError');
          expect(res.body.message).to.equal('"lastName" must be a string');
          expect(res.body.location).to.equal('lastName');
        });
    });

    it('Should reject users with a non-string screen name', () => {
      return chai
        .request(app)
        .post('/users')
        .send({
          firstName,
          lastName,
          screenName: {value: 'value'},
          username,
          password
        })
        .then(res => {
          expect(res).to.have.status(422);
          expect(res.body.reason).to.equal('ValidationError')
          expect(res.body.message).to.equal('"screenName" must be a string');
          expect(res.body.location).to.equal('screenName');
        })
        .catch(err => handleError(err));
    });

    it('Should reject users with a non-trimmed user name', () => {
      return chai
        .request(app)
        .post('/users')
        .send({
          firstName,
          lastName,
          screenName,
          username: '  john@gmail.com ',
          password
        })
        .then(res => {
          expect(res).to.have.status(422);
          expect(res.body.reason).to.equal('ValidationError');
          expect(res.body.message).to.equal('"username" must not have leading or trailing whitespace');
          expect(res.body.location).to.equal('username');
        })
        .catch(err => handleError(err));
    });

    it('Should reject usesrs with a non-trimmed password', () => {
      return chai
        .request(app)
        .post('/users')
        .send({
          firstName,
          lastName,
          screenName,
          username,
          password: 'password  '
        })
        .then(res => {
          expect(res).to.have.status(422);
          expect(res.body.reason).to.equal('ValidationError');
          expect(res.body.message).to.equal('"password" must not have leading or trailing whitespace');
          expect(res.body.location).to.equal('password');
        })
        .catch(err => handleError(err));
    });

    it('Should reject users with an empty username', () => {
      return chai
        .request(app)
        .post('/users')
        .send({
          firstName,
          lastName,
          screenName,
          username: '',
          password,
        })
        .then(res => {
          expect(res).to.have.status(422);
          expect(res.body.reason).to.equal('ValidationError');
          expect(res.body.message).to.equal('"username" is not allowed to be empty');
          expect(res.body.location).to.equal('username');
        })
        .catch(err => handleError(err));
    });

    it('Should reject users with a password less than 7 characters', () => {
      return chai
        .request(app)
        .post('/users')
        .send({
          firstName,
          lastName,
          screenName,
          username,
          password: '123456'
        })
        .then(res => {
          expect(res).to.have.status(422);
          expect(res.body.reason).to.equal('ValidationError');
          expect(res.body.message).to.equal('"password" length must be at least 7 characters long');
          expect(res.body.location).to.equal('password');
        })
        .catch(err => handleError(err));
    });

    it('Should reject users with a password greater than 72 characters', () => {
      return chai
        .request(app)
        .post('/users')
        .send({
          firstName,
          lastName,
          screenName,
          username,
          password: new Array(73).fill('a').join('')
        })
        .then(res => {
          expect(res).to.have.status(422);
          expect(res.body.reason).to.equal('ValidationError');
          expect(res.body.message).to.equal('"password" length must be less than or equal to 72 characters long');
          expect(res.body.location).to.equal('password');
        })
        .catch(err => handleError(err));
    });

    it('Should reject a request with a duplicate username', () => {
      return chai
        .request(app)
        .post('/users')
        .send({
          username,
          password,
          firstName,
          lastName,
          screenName
        })
        .then(() => {
          return chai
          .request(app)
          .post('/users')
          .send({
            username,
            password,
            firstName,
            lastName,
            screenName
          })
        })
        .then(res => {
          expect(res).to.have.status(422);
          expect(res.body.reason).to.equal('ValidationError');
          expect(res.body.message).to.equal('sorry, that username is already taken');
        })
        .catch(err => handleError(err));
    });

    it('Should create a new user', () => {
      return chai
        .request(app)
        .post('/users')
        .send({
          username,
          password,
          firstName,
          lastName,
          screenName,
          location,
          longitude,
          latitude
        })
        .then(res => {
          expect(res).to.have.status(201);
          expect(res.body).to.be.an('object');
          expect(res.body.username).to.equal(username);
          expect(res.body.firstName).to.equal(firstName);
          expect(res.body.lastName).to.equal(lastName);
          expect(res.body.screenName).to.equal(screenName);
          expect(res.body.location).to.equal(location);
          return User.findById(res.body.id)
        })
        .then(user => {
          expect(user).to.not.be.null;
          expect(user.id).to.equal(user.id);
          expect(user.firstName).to.equal(firstName);
          expect(user.lastName).to.equal(lastName);
          expect(user.username).to.equal(username);
          expect(user.screenName).to.equal(screenName);
          expect(user.location).to.equal(location);
          expect(user.longitude).to.equal(longitude);
          expect(user.latitude).to.equal(latitude);
          return user.validatePassword(password);
        })
        .then(passwordIsCorrect => {
          expect(passwordIsCorrect).to.be.true;
        })
        .catch(err => handleError(err));
    });
  });

  describe('GET /users', () => {  

    it('Should not let an unautheticated visitor to get user information', () => {
      return chai.request(app)
        .get('/users')
        .then(res => {
          expect(res).to.have.status(401);
        })
        .catch(err => handleError(err));
    });

    it('Should allow a registered user to get their information', () => {
      return chai.request(app)
        .get('/users')
        .set('authorization', `Bearer ${testUserToken}`)
        .then(res => {
          expect(res).to.have.status(200);
          expect(res.body).to.be.an('object');
          expect(res.body.id).to.equal(testUser.id);
          expect(res.body.firstName).to.equal(testUser.firstName);
          expect(res.body.lastName).to.equal(testUser.lastName);
          expect(res.body.screenName).to.equal(testUser.screenName);
          expect(res.body.location).to.equal(testUser.location);
          expect(res.body.interests).to.be.a('array');
          res.body.interests.forEach(interest => {
            expect(testUser.interests.map(interestId => interestId.toString()).includes(interest._id)).to.be.true;
          })
          expect(res.body.blockedUsers).to.be.a('array');
          res.body.blockedUsers.forEach(user => {
            expect(testUser.blockedUsers.map(userId => userId.toString).includes(user._id)).to.be.true;
          })
        })
        .catch(err => handleError(err));
    });

    it('Should return a list of users with matching interests', () => {
      return InterestUser.create({
          user: testUser2.id,
          interest: testUser.interests[0]
        })
        .then(() => {
          return chai.request(app)
            .get('/users?interests=true')
            .set('authorization', `Bearer ${testUserToken}`)
        })
        .then(res => {
          expect(res).to.have.status(200);
          expect(res.body[0].interest._id).to.equal(testUser.interests[0].toString());
          expect(res.body[0].user._id).to.equal(testUser2.id);
        })
        .catch(err => handleError(err));
    });

    it('Should return a list of users with nearby location', () => {
      return chai.request(app)
        .get('/users?nearby=true')
        .set('authorization', `Bearer ${testUserToken}`)
        .then(res => {
          expect(res).to.have.status(200)
          expect(res.body).to.be.a('array');
          expect(res.body).to.have.lengthOf(2);
          expect(res.body[0].distance).to.equal(0);
          expect(res.body[1].distance).to.equal(0);
        })
        .catch(err => handleError(err));
    });

    it('Should return a list of users with other interests', () => {
      return InterestUser.create({
          user: testUser2.id,
          interest: testUser2.interests[0]
        })
        .then(() => {
          return chai.request(app)
            .get('/users?other=true')
            .set('authorization', `Bearer ${testUserToken}`)
        })
        .then(res => {
          expect(res).to.have.status(200);
          const returnedInterests = res.body.map(item => item.interest._id);
          testUser.interests.forEach(interest => {
            expect(returnedInterests).to.not.include(interest.toString());
          })
        })
        .catch(err => handleError(err));
    });    

  });

  describe('GET /users/:id', () => {

    it('Should not allow an unauthenticated user to get another user\'s info', () => {
      return chai.request(app)
        .get(`/users/${testUser2.id}`)
        .then(res => {
          expect(res).to.have.status(401);
        })
        .catch(err => handleError(err));      
    });

    it('Should allow an authenticated user to get another user\'s basic info', () => {
      return chai.request(app)
        .get(`/users/${testUser2.id}`)
        .set('authorization', `Bearer ${testUserToken}`)
        .then(res => {
          expect(res).to.have.status(200);
          expect(res.body.id).to.equal(testUser2.id);
          expect(res.body.screenName).to.equal(testUser2.screenName);
          expect(res.body.location).to.equal(testUser2.location);
          expect(res.body.interests.map(interest => interest._id)).to.deep.equal(testUser2.interests.map(id => id.toString()));
        })
        .catch(err => handleError(err));         
    })

  });

  describe('PUT /users', () => {

    it('Should reject an unauthenticated user', () => {
      return chai.request(app)
        .put(`/users/${testUser.id}`)
        .then(res => {
          expect(res).to.have.status(401);
        })
        .catch(err => handleError(err));
    });

    it('Should reject a request where request params and body id dont match', () => {
      return chai.request(app)
        .put(`/users/${testUser.id}`)
        .set('authorization', `Bearer ${testUserToken}`)
        .send({ id: `${ new Array(24).fill('0').join('')}`})
        .then(res => {
          expect(res).to.have.status(400);
          expect(res.body.message).to.equal('Request path id and request body id values must match');
        })
        .catch(err => handleError(err));
    });

    it('Should reject a request where one of the fields dont meet validation criteria', () => {
      const fakeLocation = new Array(50).fill('a').join('');
      return chai.request(app)
        .put(`/users/${testUser.id}`)
        .set('authorization', `Bearer ${testUserToken}`)
        .send({
          id: testUser.id,
          location: fakeLocation
        })
        .then(res => {
          expect(res).to.have.status(422);
          expect(res.body.message).to.equal('"location" length must be less than or equal to 30 characters long');
        })
        .catch(err => handleError(err));
    });

    it('Should update user information', () => {
      const fakeId = new Array(24).fill('0').join('');
      const newUserInfo = {
        id: testUser.id,
        firstName: 'Stan',
        lastName: 'Henry',
        screenName: 'shenry',
        location: 'Concord',
        longitude: 45.3,
        latitude: -4.43,
        username: 'stan@the.net',
        password: 'newpass',
        interests: [fakeId, fakeId, fakeId],
        blockedUsers: [fakeId, fakeId]
      };

      return chai.request(app)
        .put(`/users/${testUser.id}`)
        .set('authorization', `Bearer ${testUserToken}`)
        .send(newUserInfo)
        .then(res => {
          expect(res).to.have.status(200);
          expect(res.body.id).to.equal(testUser.id)
          expect(res.body.firstName).to.equal(newUserInfo.firstName);
          expect(res.body.lastName).to.equal(newUserInfo.lastName);
          expect(res.body.screenName).to.equal(newUserInfo.screenName);
          expect(res.body.location).to.equal(newUserInfo.location);
          expect(res.body.interests).to.eql(newUserInfo.interests);
          expect(res.body.blockedUsers).to.eql(newUserInfo.blockedUsers);
          return User.findById(testUser.id);
        })
        .then(user => {
          expect(user.firstName).to.equal(newUserInfo.firstName);
          expect(user.lastName).to.equal(newUserInfo.lastName);
          expect(user.screenName).to.equal(newUserInfo.screenName);
          expect(user.location).to.equal(newUserInfo.location);
          expect(user.latitude).to.equal(newUserInfo.latitude);
          expect(user.longitude).to.equal(newUserInfo.longitude);
          expect(user.interests.map(interestId => interestId.toString())).to.eql(newUserInfo.interests);
          expect(user.blockedUsers.map(userId => userId.toString())).to.eql(newUserInfo.blockedUsers);
        })
        .catch(err => handleError(err));
    });

  });
});