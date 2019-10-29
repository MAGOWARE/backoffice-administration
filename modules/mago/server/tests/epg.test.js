const should = require('chai').should();
const expect = require('chai').expect;
const supertest = require('supertest');
const api = supertest('http://localhost');
const config = require('./config');


describe('EPG', function () {
  let token = "";
  before(function (done) {
    config.generateToken(tk => {
      token = tk;
      done();
    });
  });


  it('should return a 200 response and get epg list', function (done) {
    this.timeout(50000);
    api.get('/api/epgdata')
      .set('Authorization', token)
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function (err, res) {
        expect(res.body).to.be.an('array');
        done();
      });
  });


  it('should fetch epg by id', function (done) {
    api.get('/api/epgdata/315379')
      .expect('Content-Type', /json/)
      .set('Authorization', token)
      .expect(200)
      .end(function (err, res) {
        expect(res.body).to.have.property("title");
        expect(res.body.title).to.not.equal(null);
        expect(res.body).to.have.property("company_id");
        expect(res.body.company_id).to.not.equal(null);
        expect(res.body).to.have.property("channel_number");
        expect(res.body.channel_number).to.not.equal(null);
        expect(res.body).to.have.property("channels_id");
        expect(res.body.channels_id).to.not.equal(null);
        expect(res.body).to.have.property("episode_title");
        expect(res.body.episode_title).to.not.equal(null);

        expect(res.body).to.have.property("episode_title");
        expect(res.body.episode_title).to.not.equal(null);

        expect(res.body).to.have.property("short_name");
        expect(res.body.short_name).to.not.equal(null);

        expect(res.body).to.have.property("short_description");
        expect(res.body.short_description).to.not.equal(null);

        expect(res.body).to.have.property("event_category");
        expect(res.body.event_category).to.not.equal(null);

        expect(res.body).to.have.property("event_language");
        expect(res.body.event_language).to.not.equal(null);

        expect(res.body).to.have.property("program_start");
        expect(res.body.program_start).to.not.equal(null);

        expect(res.body).to.have.property("program_end");
        expect(res.body.program_end).to.not.equal(null);

        expect(res.body).to.have.property("long_description");
        expect(res.body.long_description).to.not.equal(null);

        expect(res.body).to.have.property("duration_seconds");
        expect(res.body.duration_seconds).to.not.equal(null);
        done();
      });
  });


});