const should = require('chai').should();
const expect = require('chai').expect;
const supertest = require('supertest');
const api = supertest('http://localhost');
const config = require('./config');


describe('Settings', function () {
  let token = "";
  before(function (done) {
    config.generateToken(tk => {
      token = tk;
      done();
    });
  });

  it('should return a 200 response and get settings list', function (done) {
    api.get('/api/settings')
      .set('Authorization', token)
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function (err, res) {
        expect(res.body).to.be.an('array');
        done();
      });
  });


  it('should fetch settings by id', function (done) {
    api.get('/api/settings/1')
      .expect('Content-Type', /json/)
      .set('Authorization', token)
      .expect(200)
      .end(function (err, res) {
        expect(res.body).to.have.property("company_name");
        expect(res.body.company_name).to.not.equal(null);
        expect(res.body).to.have.property("email_address");
        expect(res.body.email_address).to.not.equal(null);
        expect(res.body).to.have.property("assets_url");
        expect(res.body.assets_url).to.not.equal(null);
        expect(res.body).to.have.property("log_event_interval");
        expect(res.body.log_event_interval).to.not.equal(null);
        expect(res.body).to.have.property("locale");
        expect(res.body.locale).to.not.equal(null);
        expect(res.body).to.have.property("asset_limitations");
        expect(res.body.asset_limitations.client_limit).to.not.equal(null);
        expect(res.body.asset_limitations).to.have.property("channel_limit");
        expect(res.body.asset_limitations.channel_limit).to.not.equal(null);
        expect(res.body.asset_limitations).to.have.property("vod_limit");
        expect(res.body.asset_limitations.vod_limit).to.not.equal(null);
        done();
      });
  });


});