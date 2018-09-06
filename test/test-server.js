const chai = require('chai');
const chaiHttp = require('chai-http');
const expect = chai.expect;
const { app } = require('../server');
chai.use(chaiHttp);

describe('API', () => {
  it('should respond with 200 on GET requests', () => {
    return chai
      .request(app)
      .get('/foooo')
      .then(res => {
        expect(res).to.have.status(200);
        expect(res).to.be.json;
      });
  });
});