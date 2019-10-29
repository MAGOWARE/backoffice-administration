const should = require('chai').should();
const expect = require('chai').expect;
const supertest = require('supertest');
const api = supertest('http://localhost');
const config = require('./config');


describe('HTML Content', function () {
  let token = "";
  before(function (done) {
    config.generateToken(tk => {
      token = tk;
      done();
    });
  });

  it('should return a 200 response and html content list', function (done) {
    this.timeout(50000);
    api.get('/api/htmlContent')
      .set('Authorization', token)
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function (err, res) {
        expect(res.body).to.be.an('array');
        done();
      });
  });


  it('should fetch html content by id', function (done) {
    api.get('/api/htmlContent/1')
      .expect('Content-Type', /json/)
      .set('Authorization', token)
      .expect(200)
      .end(function (err, res) {
        expect(res.body).to.have.property("company_id");
        expect(res.body.company_id).to.not.equal(null);
        expect(res.body).to.have.property("name");
        expect(res.body.name).to.not.equal(null);
        expect(res.body).to.have.property("description");
        expect(res.body.description).to.not.equal(null);
        expect(res.body).to.have.property("content");
        expect(res.body.content).to.not.equal(null);
        expect(res.body).to.have.property("url");
        expect(res.body.url).to.not.equal(null);
        done();
      });
  });


});