const expect = require('chai').expect;
const supertest = require('supertest');
const api = supertest('http://localhost');
const config = require('./config');


describe('Login Data', function () {
  let token = "";
  before(function (done) {
    config.generateToken(tk => {
      token = tk;
      done();
    });
  });

  it('should return a 200 response and get login data list', function (done) {
    this.timeout(50000);
    api.get('/api/dash/logins')
      .set('Authorization', token)
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function (err, res) {
        expect(res.body).to.be.an('array');
        done();
      });
  });

  it('should fetch login data by id', function (done) {
    api.get('/api/logindata/1')
      .expect('Content-Type', /json/)
      .set('Authorization', token)
      .expect(200)
      .end(function (err, res) {
        expect(res.body).to.have.property("username");
        expect(res.body.username).to.not.equal(null);
        expect(res.body).to.have.property("mac_address");
        expect(res.body.mac_address).to.not.equal(null);
        expect(res.body).to.have.property("customer_id");
        expect(res.body.customer_id).to.not.equal(null);
        expect(res.body).to.have.property("channel_stream_source_id");
        expect(res.body.channel_stream_source_id).to.not.equal(null);

        expect(res.body).to.have.property("vod_stream_source");
        expect(res.body.vod_stream_source).to.not.equal(null);

        expect(res.body).to.have.property("pin");
        expect(res.body.pin).to.not.equal(null);

        expect(res.body).to.have.property("show_adult");
        expect(res.body.show_adult).to.not.equal(null);

        expect(res.body).to.have.property("auto_timezone");
        expect(res.body.auto_timezone).to.not.equal(null);

        expect(res.body).to.have.property("timezone");
        expect(res.body.timezone).to.not.equal(null);

        expect(res.body).to.have.property("player");
        expect(res.body.player).to.not.equal(null);

        expect(res.body).to.have.property("activity_timeout");
        expect(res.body.activity_timeout).to.not.equal(null);

        expect(res.body).to.have.property("activity_timeout");
        expect(res.body.activity_timeout).to.not.equal(null);

        expect(res.body).to.have.property("customer_datum");
        expect(res.body.customer_datum).to.not.equal(null);
        done();
      });
  });

});