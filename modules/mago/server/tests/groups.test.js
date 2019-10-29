const should = require('chai').should();
const expect = require('chai').expect;
const supertest = require('supertest');
const api = supertest('http://localhost');
const config = require('./config');

describe('Groups', function () {
  let token = "";
  before(function (done) {
    config.generateToken(tk => {
      token = tk;
      done();
    });
  });

  it('should return a 200 response and get groups list', function (done) {
    api.get('/api/groups')
      .set('Authorization', token)
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function (err, res) {
        expect(res.body).to.be.an('array');
        done();
      });
  });


  it('should fetch group', function (done) {
    api.get('/api/groups/19')
      .expect('Content-Type', /json/)
      .set('Authorization', token)
      .expect(200)
      .end(function (err, res) {
        expect(res.body).to.have.property("name");
        expect(res.body.name).to.not.equal(null);
        expect(res.body).to.have.property("code");
        expect(res.body.code).to.not.equal(null);
        expect(res.body).to.have.property("code");
        expect(res.body.isavailable).to.not.equal(null);
        expect(res.body).to.have.property("isavailable");
        done();
      });
  });

  it('should return a 200 response and get Customer Groups list', function (done) {
    api.get('/api/customergroups')
      .set('Authorization', token)
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function (err, res) {
        expect(res.body).to.be.an('array');
        done();
      });
  });


  it('should fetch customer group', function (done) {
    api.get('/api/customergroups/10')
      .expect('Content-Type', /json/)
      .set('Authorization', token)
      .expect(200)
      .end(function (err, res) {
        expect(res.body).to.have.property("company_id");
        expect(res.body.company_id).to.not.equal(null);
        expect(res.body).to.have.property("description");
        expect(res.body.description).to.not.equal(null);

        done();
      });
  });

  it('should return a 200 response and get app Groups list', function (done) {
    api.get('/api/appgroup')
      .set('Authorization', token)
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function (err, res) {
        expect(res.body).to.be.an('array');
        done();
      });
  });


  it('should fetch app group by id', function (done) {
    api.get('/api/appgroup/1')
      .expect('Content-Type', /json/)
      .set('Authorization', token)
      .expect(200)
      .end(function (err, res) {
        expect(res.body).to.have.property("app_group_id");
        expect(res.body.app_group_id).to.not.equal(null);
        expect(res.body).to.have.property("app_group_name");
        expect(res.body.app_group_name).to.not.equal(null);
        expect(res.body).to.have.property("app_id");
        expect(res.body.app_id).to.not.equal(null);

        done();
      });
  });


  it('should return a 200 response and get group rights list', function (done) {
    api.get('/api/grouprights')
      .set('Authorization', token)
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function (err, res) {
        expect(res.body).to.be.an('array');
        done();
      });
  });

  it('should return a 200 response and get app management list', function (done) {
    api.get('/api/appmanagement')
      .set('Authorization', token)
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function (err, res) {
        expect(res.body).to.be.an('array');
        done();
      });
  });


  it('should fetch app management by id', function (done) {
    api.get('/api/appmanagement/1')
      .expect('Content-Type', /json/)
      .set('Authorization', token)
      .expect(200)
      .end(function (err, res) {
        expect(res.body).to.have.property("company_id");
        expect(res.body.company_id).to.not.equal(null);

        expect(res.body).to.have.property("appid");
        expect(res.body.appid).to.not.equal(null);

        expect(res.body).to.have.property("app_version");
        expect(res.body.app_version).to.not.equal(null);

        expect(res.body).to.have.property("title");
        expect(res.body.title).to.not.equal(null);

        expect(res.body).to.have.property("description");
        expect(res.body.description).to.not.equal(null);

        expect(res.body).to.have.property("url");
        expect(res.body.url).to.not.equal(null);

        expect(res.body).to.have.property("upgrade_min_app_version");
        expect(res.body.upgrade_min_app_version).to.not.equal(null);

        expect(res.body).to.have.property("beta_version");
        expect(res.body.beta_version).to.not.equal(null);

        expect(res.body).to.have.property("isavailable");
        expect(res.body.isavailable).to.not.equal(null);
        done();
      });
  });
});