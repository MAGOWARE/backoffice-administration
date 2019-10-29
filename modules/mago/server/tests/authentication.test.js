const should = require('chai').should();
const expect = require('chai').expect;
const supertest = require('supertest');
const api = supertest('http://localhost');
const config  = require('./config')


describe('Portal Authentication', function () {
  it('should return a 200 response', function (done) {
    api.post('/api/auth/login')
      .set('Content-Type', "application/json")
      .send({
        username: config.username,
        password: config.password
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function (err, res) {
        done();
      });
  });
  it('should not login with wrong credentials', function (done) {
    api.post('/api/auth/login')
      .set('Content-Type', "application/json")
      .send({
        username: "adminnn",
        password: "admind"
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function (err, res) {
        expect(res.body.message).to.equal("UserName or Password does not match");
        done();
      });
  });

  it('should return a token', function (done) {
    api.post('/api/auth/login')
      .set('Content-Type', "application/json")
      .send({
        username: config.username,
        password: config.password
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function (err, res) {
        expect(res.body).to.have.property("token");
        expect(res.body.token).to.not.equal(null);
        done();
      });
  });

  it('should return a menu json array', function (done) {
    api.post('/api/auth/login')
      .set('Content-Type', "application/json")
      .send({
        username: config.username,
        password: config.password
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function (err, res) {
        expect(res.body).to.have.property("menujson");
        expect(res.body.menujson).to.not.equal(null);
        done();
      });
  });

});