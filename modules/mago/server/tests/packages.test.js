const should = require('chai').should();
const expect = require('chai').expect;
const supertest = require('supertest');
const api = supertest('http://localhost');
const config = require('./config');


describe('Packages', function () {
  let token = "";
  before(function (done) {
    config.generateToken(tk => {
      token = tk;
      done();
    });
  });

  it('should return a 200 response and get packags list', function (done) {
    api.get('/api/packages')
      .set('Authorization', token)
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function (err, res) {
        expect(res.body).to.be.an('array');
        done();
      });
  });


  it('should fetch package', function (done) {
    api.get('/api/packages/97')
      .expect('Content-Type', /json/)
      .set('Authorization', token)
      .expect(200)
      .end(function (err, res) {
        expect(res.body).to.have.property("package_type_id");
        expect(res.body.package_type_id).to.not.equal(null);
        expect(res.body).to.have.property("package_name");
        expect(res.body.package_name).to.not.equal(null);
        expect(res.body).to.have.property("package_type");
        expect(res.body.package_type).to.not.equal(null);
        expect(res.body.package_type).to.have.property("activity_id");
        expect(res.body.package_type.activity_id).to.not.equal(null);
        expect(res.body.package_type).to.have.property("app_group_id");
        expect(res.body.package_type.app_group_id).to.not.equal(null);
        done();
      });
  });

  it('should return a 200 response and get package types list', function (done) {
    api.get('/api/packagetypes')
      .set('Authorization', token)
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function (err, res) {
        expect(res.body).to.be.an('array');
        done();
      });
  });


  it('should fetch package types by id', function (done) {
    api.get('/api/packagetypes/1')
      .expect('Content-Type', /json/)
      .set('Authorization', token)
      .expect(200)
      .end(function (err, res) {
        expect(res.body).to.have.property("description");
        expect(res.body.description).to.not.equal(null);
        expect(res.body).to.have.property("activity_id");
        expect(res.body.activity_id).to.not.equal(null);
        expect(res.body).to.have.property("app_group_id");
        expect(res.body.app_group_id).to.not.equal(null);
        done();
      });
  });

  it('should return a 200 response and get vod packages list', function (done) {
    api.get('/api/vodpackages')
      .set('Authorization', token)
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function (err, res) {
        expect(res.body).to.be.an('array');
        done();
      });
  });


  it('should fetch vod package by id', function (done) {
    api.get('/api/vodpackages/97')
      .expect('Content-Type', /json/)
      .set('Authorization', token)
      .expect(200)
      .end(function (err, res) {
        expect(res.body).to.have.property("package_type_id");
        expect(res.body.package_type_id).to.not.equal(null);
        expect(res.body).to.have.property("package_name");
        expect(res.body.package_name).to.not.equal(null);
        expect(res.body).to.have.property("package_type");
        expect(res.body.package_type).to.not.equal(null);
        expect(res.body.package_type).to.have.property("activity_id");
        expect(res.body.package_type.activity_id).to.not.equal(null);
        expect(res.body.package_type).to.have.property("app_group_id");
        expect(res.body.package_type.app_group_id).to.not.equal(null);
        done();
      });
  });


  it('should return a 200 response and get livepackages list', function (done) {
    api.get('/api/livepackages')
      .set('Authorization', token)
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function (err, res) {
        expect(res.body).to.be.an('array');
        done();
      });
  });


  it('should fetch live packages', function (done) {
    api.get('/api/livepackages/97')
      .expect('Content-Type', /json/)
      .set('Authorization', token)
      .expect(200)
      .end(function (err, res) {
        expect(res.body).to.have.property("package_type_id");
        expect(res.body.package_type_id).to.not.equal(null);
        expect(res.body).to.have.property("package_name");
        expect(res.body.package_name).to.not.equal(null);
        expect(res.body).to.have.property("package_type");
        expect(res.body.package_type).to.not.equal(null);
        expect(res.body.package_type).to.have.property("activity_id");
        expect(res.body.package_type.activity_id).to.not.equal(null);
        expect(res.body.package_type).to.have.property("app_group_id");
        expect(res.body.package_type.app_group_id).to.not.equal(null);
        done();
      });
  });

  it('should fetch combo packages', function (done) {
    api.get('/api/combopackages/1')
      .expect('Content-Type', /json/)
      .set('Authorization', token)
      .expect(200)
      .end(function (err, res) {
        expect(res.body).to.have.property("package_id");
        expect(res.body.package_id).to.not.equal(null);
        expect(res.body).to.have.property("combo_id");
        expect(res.body.combo_id).to.not.equal(null);
        expect(res.body).to.have.property("combo");
        expect(res.body.combo).to.not.equal(null);
        expect(res.body.combo).to.have.property("product_id");
        expect(res.body.combo.product_id).to.not.equal(null);
        expect(res.body.combo).to.have.property("name");
        expect(res.body.combo.name).to.not.equal(null);
        expect(res.body.combo).to.have.property("company_id");
        expect(res.body.combo.company_id).to.not.equal(null);
        expect(res.body.combo).to.have.property("duration");
        expect(res.body.combo.duration).to.not.equal(null);
        expect(res.body.combo).to.have.property("value");
        expect(res.body.combo.value).to.not.equal(null);
        expect(res.body.combo).to.have.property("isavailable");
        expect(res.body.combo.isavailable).to.not.equal(null);
        expect(res.body).to.have.property("package");
        expect(res.body.package).to.not.equal(null);
        expect(res.body.package).to.have.property("company_id");
        expect(res.body.package.company_id).to.not.equal(null);
        expect(res.body.package).to.have.property("package_type_id");
        expect(res.body.package.package_type_id).to.not.equal(null);
        expect(res.body.package).to.have.property("package_name");
        expect(res.body.package.package_name).to.not.equal(null);
        done();
      });
  });

});