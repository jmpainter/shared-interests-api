const chai = require('chai');
const chaiHttp = require('chai-http');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const { app, runServer, closeServer } = require('../server');
const User = require('../models/user');
const { JWT_SECRET, TEST_DATABASE_URL } = require('../config');
const { handleError } = require('./seeds');

const expect = chai.expect;

chai.use(chaiHttp);

describe('Auth endpoints', () => {
  let id = null;
  const screenName = 'eUser';
  const firstName = 'Example';
  const lastName = 'User';
  const location = 'San Francisco';
  const username = 'exampleUser';
  const password = 'examplePass';

  before(() => {
    return runServer(TEST_DATABASE_URL);
  });

  after(() => {
    return closeServer();
  });

  beforeEach(function() {
    return User.hashPassword(password)
      .then(password => { 
        return User.create({
          username,
          password,
          screenName,
          firstName,
          lastName,
          location
        });
      })
      .then(user => {
        id = user.id;
      });
  })

  afterEach(() => {
    return mongoose.connection.dropDatabase();
  });

  describe('/auth/login', () => {

    it('Should reject requests with no credentials', () => {
      return chai
        .request(app)
        .post('/auth/login')
        .then(res => {
          expect(res).to.have.status(400);
        })
        .catch(err => handleError(err));
    });

    it('Should reject requests with incorrect usernames', () => {
      return chai
        .request(app)
        .post('/auth/login')
        .send({ username: 'wrongUsername', password })        
        .then(res => {
          expect(res).to.have.status(401);
        })
        .catch(err => handleError(err));
    });

    it('Should reject requests with incorrect passwords', () => {
      return chai
        .request(app)
        .post('/auth/login')
        .send({ username, password: 'wrongPassword' })
        .then(res => {
          expect(res).to.have.status(401);
        })
        .catch(err => handleError(err));
    });

    it('Should return a valid auth token', () => {
      return chai
        .request(app)
        .post('/auth/login')
        .send({ username, password })
        .then(res => {
          expect(res).to.have.status(200);
          expect(res.body).to.be.an('object');
          const token = res.body.authToken;
          expect(token).to.be.a('string');
          const payload = jwt.verify(token, JWT_SECRET, {
            algorithm: ['HS256']
          });
          expect(payload.user).to.deep.equal({
            id,
            username,
            screenName,
            firstName,
            lastName,
            location
          });
        })
        .catch(err => handleError(err));
    });
  });

  describe('/auth/refresh', () => {

    it('Should reject requests with no credentials', () => {
      return chai
        .request(app)
        .post('/auth/refresh')
        .then(res => {
          expect(res).to.have.status(401);
        })
        .catch(err => handleError(err));
    });

    it('Should reject requests with an invalid token', () => {
      const token = jwt.sign(
        {
          username,
          firstName,
          lastName
        },
        'wrongSecret',
        {
          algorithm: 'HS256',
          expiresIn: '7d'
        }
      );

      return chai
        .request(app)
        .post('/auth/refresh')
        .set('Authorization', `Bearer ${token}`)
        .then(res => {
          expect(res).to.have.status(401);
        })
        .catch(err => handleError(err));
    });

    it('Should reject requests with an expired token', () => {
      const token = jwt.sign(
        {
          user: {
            username,
            firstName,
            lastName
          },
          exp: Math.floor(Date.now() / 1000) - 10 // Expired ten seconds ago
        },
        JWT_SECRET,
        {
          algorithm: 'HS256',
          subject: username
        }
      );

      return chai
        .request(app)
        .post('/auth/refresh')
        .set('authorization', `Bearer ${token}`)
        .then(res => {
          expect(res).to.have.status(401);
        })
        .catch(err => handleError(err));
    });

    it('Should return a valid auth token with a newer expiry date', () => {
      const token = jwt.sign(
        {
          user: {
            username,
            firstName,
            lastName
          }
        },
        JWT_SECRET,
        {
          algorithm: 'HS256',
          subject: username,
          expiresIn: '7d'
        }
      );
      const decoded = jwt.decode(token);

      return chai
        .request(app)
        .post('/auth/refresh')
        .set('authorization', `Bearer ${token}`)
        .then(res => {
          expect(res).to.have.status(200);
          expect(res.body).to.be.an('object');
          const token = res.body.authToken;
          expect(token).to.be.a('string');
          const payload = jwt.verify(token, JWT_SECRET, {
            algorithm: ['HS256']
          });
          expect(payload.user).to.deep.equal({
            username,
            firstName,
            lastName
          });
          expect(payload.exp).to.be.at.least(decoded.exp);
        })
        .catch(err => handleError(err));
    });
  });
});