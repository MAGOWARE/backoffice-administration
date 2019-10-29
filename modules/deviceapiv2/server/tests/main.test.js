const should = require('chai').should();
const expect = require('chai').expect;
const supertest = require('supertest');
const api = supertest('http://localhost');
const config  = require('./config');


describe('Device API: Main', function () {
  it('should get device menu list', function (done) {
    this.timeout(50000);
    api.get('/apiv2/main/device_menu')
      .set('auth', config.token)
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function (err, res) {
        expect(res.body.status_code).to.be.equal(200);
        expect(res.body.response_object).to.be.an('array');
        done();
      });
  });

  it('should get device menu object', function (done) {
    this.timeout(50000);
    api.get('/apiv2/main/device_menu')
      .set('auth', config.token)
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function (err, res) {
        const object = res.body.response_object[0];
        expect(res.body.status_code).to.be.equal(200);

        expect(object).to.have.property("title");
        expect(object.title).to.not.equal(null);

        expect(object).to.have.property("url");
        expect(object.url).to.not.equal(null);

        expect(object).to.have.property("icon_url");
        expect(object.icon_url).to.not.equal(null);

        expect(object).to.have.property("icon");
        expect(object.icon).to.not.equal(null);

        expect(object).to.have.property("menu_code");
        expect(object.menu_code).to.not.equal(null);

        expect(object).to.have.property("position");
        expect(object.position).to.not.equal(null);

        expect(object).to.have.property("menucode");
        expect(object.menucode).to.not.equal(null);
        done();
      });
  });



  it('should get device menu level one list', function (done) {
    this.timeout(50000);
    api.get('/apiv2/main/device_menu_levelone')
      .set('auth', config.token)
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function (err, res) {
        expect(res.body.status_code).to.be.equal(200);
        expect(res.body.response_object).to.be.an('array');
        done();
      });
  });

  it('should get device menu level one object', function (done) {
    this.timeout(50000);
    api.get('/apiv2/main/device_menu_levelone')
      .set('auth', config.token)
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function (err, res) {
        const object = res.body.response_object[0];
        expect(res.body.status_code).to.be.equal(200);

        expect(object).to.have.property("title");
        expect(object.title).to.not.equal(null);

        expect(object).to.have.property("url");
        expect(object.url).to.not.equal(null);

        expect(object).to.have.property("icon_url");
        expect(object.icon_url).to.not.equal(null);

        expect(object).to.have.property("icon");
        expect(object.icon).to.not.equal(null);

        expect(object).to.have.property("menu_code");
        expect(object.menu_code).to.not.equal(null);

        expect(object).to.have.property("position");
        expect(object.position).to.not.equal(null);

        expect(object).to.have.property("menucode");
        expect(object.menucode).to.not.equal(null);
        done();
      });
  });



  it('should get device menu level two list', function (done) {
    this.timeout(50000);
    api.get('/apiv2/main/device_menu_leveltwo')
      .set('auth', config.token)
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function (err, res) {
        expect(res.body.status_code).to.be.equal(200);
        expect(res.body.response_object).to.be.an('array');
        done();
      });
  });

  it('should get device menu level two object', function (done) {
    this.timeout(50000);
    api.get('/apiv2/main/device_menu_leveltwo')
      .set('auth', config.token)
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function (err, res) {
        const object = res.body.response_object[0];
        expect(res.body.status_code).to.be.equal(200);

        expect(object).to.have.property("title");
        expect(object.title).to.not.equal(null);

        expect(object).to.have.property("url");
        expect(object.url).to.not.equal(null);

        expect(object).to.have.property("icon_url");
        expect(object.icon_url).to.not.equal(null);

        expect(object).to.have.property("icon");
        expect(object.icon).to.not.equal(null);

        expect(object).to.have.property("menu_code");
        expect(object.menu_code).to.not.equal(null);

        expect(object).to.have.property("position");
        expect(object.position).to.not.equal(null);

        expect(object).to.have.property("menucode");
        expect(object.menucode).to.not.equal(null);
        done();
      });
  });
});