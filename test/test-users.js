const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');

const expect = chai.expect;

chai.use(chaiHttp);
chai.use(require('chai-datetime'));

mongoose.Promise = global.Promise;

const User = require('../models/user');

const { app, runServer, closeServer } = require('../server');
const { TEST_DATABASE_URL } = require('../config');

const {
  seedData,
  tearDownDb,
  generateTestUserToken,
  handleError
} = require('./seeds');

//save off two users for authenticated tests
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
      let user;
      return chai
        .request(app)
        .post('/users')
        .send({
          username,
          password,
          firstName,
          lastName,
          screenName,
          location
        })
        .then(res => {
          expect(res).to.have.status(201);
          expect(res.body).to.be.an('object');
          expect(res.body.username).to.equal(username);
          expect(res.body.firstName).to.equal(firstName);
          expect(res.body.lastName).to.equal(lastName);
          expect(res.body.screenName).to.equal(screenName);
          expect(res.body.location).to.equal(location);
          user = res.body;
          return User.findById(user.id)
        })
        .then(_user => {
          expect(_user).to.not.be.null;
          expect(_user.id).to.equal(user.id);
          expect(_user.firstName).to.equal(user.firstName);
          expect(_user.lastName).to.equal(user.lastName);
          expect(_user.username).to.equal(user.username);
          expect(_user.screenName).to.equal(user.screenName);
          expect(_user.location).to.equal(user.location);
          return _user.validatePassword(password);
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
          expect(res.body.username).to.equal(testUser.username);
          expect(res.body.firstName).to.equal(testUser.firstName);
          expect(res.body.lastName).to.equal(testUser.lastName);
          expect(res.body.screenName).to.equal(testUser.screenName);
        })
        .catch(err => handleError(err));
    });
  })
})