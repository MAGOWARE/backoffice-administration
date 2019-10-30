const should = require('chai').should();
const expect = require('chai').expect;
const supertest = require('supertest');
const api = supertest('http://localhost');
const config  = require('./config');


describe('Device API: Channels', function () {
  it('should  get genres list', function (done) {
    this.timeout(50000);
    api.get('/apiv2/channels/genre')
      .set('auth', config.token)
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function (err, res) {
        expect(res.body.status_code).to.be.equal(200);
        expect(res.body.response_object).to.be.an('array');
        done();
      });
  });

  it('should get EPG list', function (done) {
    this.timeout(50000);
    api.get('/apiv2/channels/epg?number=20')
      .set('auth', config.token)
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function (err, res) {
        expect(res.body.status_code).to.be.equal(200);
        expect(res.body.response_object).to.be.an('array');
        done();
      });
  });

  it('should get events list', function (done) {
    this.timeout(50000);
    api.get('/apiv2/channels/event')
      .set('auth', config.token)
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function (err, res) {
        expect(res.body.status_code).to.be.equal(200);
        expect(res.body.response_object).to.be.an('array');
        done();
      });
  });

  it('should get events object', function (done) {
    this.timeout(50000);
    api.get('/apiv2/channels/event')
      .set('auth', config.token)
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function (err, res) {
        const object = res.body.response_object[0];
        expect(res.body.status_code).to.be.equal(200);

        expect(object).to.have.property("channelName");
        expect(object.channelName).to.not.equal(null);

        expect(object).to.have.property("title");
        expect(object.title).to.not.equal(null);

        expect(object).to.have.property("scheduled");
        expect(object.scheduled).to.not.equal(null);

        expect(object).to.have.property("description");
        expect(object.description).to.not.equal(null);

        expect(object).to.have.property("shortname");
        expect(object.shortname).to.not.equal(null);

        expect(object).to.have.property("programstart");
        expect(object.programstart).to.not.equal(null);

        expect(object).to.have.property("programend");
        expect(object.programend).to.not.equal(null);

        expect(object).to.have.property("duration");
        expect(object.duration).to.not.equal(null);

        expect(object).to.have.property("progress");
        expect(object.progress).to.not.equal(null);
        done();
      });
  });

  it('should get events list', function (done) {
    this.timeout(50000);
    api.get(`/apiv2/channels/event`)
      .set('auth', config.token)
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function (err, res) {
        expect(res.body.status_code).to.be.equal(200);
        expect(res.body.response_object).to.be.an('array');
        done();
      });
  });



  it('should get program info object', function (done) {
    this.timeout(50000);
    api.post('/apiv2/channels/program_info')
      .set('auth', config.token)
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function (err, res) {
        const object = res.body.response_object[0];
        expect(res.body.status_code).to.be.equal(200);

        expect(object).to.have.property("genre");
        expect(object.genre).to.not.equal(null);

        expect(object).to.have.property("program_title");
        expect(object.program_title).to.not.equal(null);

        expect(object).to.have.property("program_description");
        expect(object.program_description).to.not.equal(null);

        expect(object).to.have.property("channel_title");
        expect(object.channel_title).to.not.equal(null);

        expect(object).to.have.property("channel_description");
        expect(object.channel_description).to.not.equal(null);

        expect(object).to.have.property("status");
        expect(object.status).to.not.equal(null);

        expect(object).to.have.property("scheduled");
        expect(object.scheduled).to.not.equal(null);

        expect(object).to.have.property("has_catchup");
        expect(object.has_catchup).to.not.equal(null);
        done();
      });
  });
});