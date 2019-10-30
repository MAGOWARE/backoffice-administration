const expect = require('chai').expect;
const supertest = require('supertest');
const api = supertest('http://localhost');
const config = require('./config');
const faker = require('faker');

describe('Channels', function () {
  let token = "";
  let channelObject = {
    genre_id: 1,
    package_id: null,
    company_id: 1,
    channel_number: faker.random.number(),
    epg_map_id: null,
    title: "Top Channel",
    description: "Top channel yeah",
    icon_url: "/1/files/channels/1568638183087PeakyBlindersseries2CillianMurphyasThomasShelbyhatsuitpocketchainwatch350x444.jpg",
    pin_protected: false,
    isavailable: true
  };

  let channel = {};

  let channelStreamSource = {
    channel_id: 1,
    company_id: 1,
    drm_platform: "pallycon",
    encryption: false,
    encryption_url: faker.internet.url(),
    is_octoshape: false,
    recording_engine: "wowza",
    stream_format: 0,
    stream_mode: "live",
    stream_resolution: "1,2,3,4,5,6",
    stream_source_id: 1,
    stream_url: faker.internet.url(),
    token: true,
    token_url: faker.internet.url()
  };

  let channelStream = {};
  before(function (done) {
    config.generateToken(tk => {
      token = tk;
      done();
    });
  });

  it('should create new channel', function (done) {
    api.post('/api/Channels')
      .set('Authorization', token)
      .set('Content-Type', "application/json")
      .expect('Content-Type', /json/)
      .send(channelObject)
      .expect(200)
      .end(function (err, res) {
        expect(res.body).to.have.property("genre_id");
        expect(res.body.genre_id).to.equal(channelObject.genre_id);

        expect(res.body).to.have.property("package_id");
        expect(res.body.package_id).to.equal(channelObject.package_id);

        expect(res.body).to.have.property("channel_number");
        expect(res.body.channel_number).to.equal(channelObject.channel_number);

        expect(res.body).to.have.property("epg_map_id");
        expect(res.body.epg_map_id).to.equal(channelObject.epg_map_id);

        expect(res.body).to.have.property("title");
        expect(res.body.title).to.equal(channelObject.title);

        expect(res.body).to.have.property("description");
        expect(res.body.description).to.equal(channelObject.description);

        expect(res.body).to.have.property("icon_url");
        expect(res.body.icon_url).to.equal(channelObject.icon_url);

        expect(res.body).to.have.property("pin_protected");
        expect(res.body.pin_protected).to.equal(channelObject.pin_protected);

        expect(res.body).to.have.property("isavailable");
        expect(res.body.isavailable).to.equal(channelObject.isavailable);
        channel = res.body;
        done();
      });
  });

  it.skip('should create new channel stream', function (done) {
    api.post('/api/channelstreams')
      .set('Authorization', token)
      .set('Content-Type', "application/json")
      .expect('Content-Type', /json/)
      .send(channelStream)
      .expect(200)
      .end(function (err, res) {
        expect(res.body).to.have.property("company_id");
        expect(res.body.company_id).to.equal(channelStreamSource.company_id);

        expect(res.body).to.have.property("stream_source_id");
        expect(res.body.stream_source_id).to.equal(channelStreamSource.stream_source_id);

        expect(res.body).to.have.property("stream_url");
        expect(res.body.stream_url).to.equal(channelStreamSource.stream_url);

        expect(res.body).to.have.property("stream_mode");
        expect(res.body.stream_mode).to.equal(channelStreamSource.stream_mode);

        expect(res.body).to.have.property("recording_engine");
        expect(res.body.recording_engine).to.equal(channelStreamSource.recording_engine);

        expect(res.body).to.have.property("stream_resolution");
        expect(res.body.stream_resolution).to.equal(channelStreamSource.stream_resolution);

        expect(res.body).to.have.property("stream_format");
        expect(res.body.stream_format).to.equal(channelStreamSource.stream_format);

        expect(res.body).to.have.property("token");
        expect(res.body.token).to.equal(channelStreamSource.token);

        expect(res.body).to.have.property("token_url");
        expect(res.body.token_url).to.equal(channelStreamSource.token_url);

        expect(res.body).to.have.property("drm_platform");
        expect(res.body.drm_platform).to.equal(channelStreamSource.drm_platform);
        channelStream = res.body;
        done();
      });
  });

  it('should return a 200 response and get channels list', function (done) {
    api.get('/api/channels')
      .set('Authorization', token)
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function (err, res) {
        expect(res.body).to.be.an('array');
        done();
      });
  });


  it('should fetch channels', function (done) {
    api.get('/api/channels/' + channel.id)
      .expect('Content-Type', /json/)
      .set('Authorization', token)
      .expect(200)
      .end(function (err, res) {
        expect(res.body).to.have.property("genre_id");
        expect(res.body.genre_id).to.equal(channel.genre_id);

        expect(res.body).to.have.property("package_id");
        expect(res.body.package_id).to.equal(channel.package_id);

        expect(res.body).to.have.property("channel_number");
        expect(res.body.channel_number).to.equal(channel.channel_number);

        expect(res.body).to.have.property("epg_map_id");
        expect(res.body.epg_map_id).to.equal(channel.epg_map_id);

        expect(res.body).to.have.property("title");
        expect(res.body.title).to.equal(channel.title);

        expect(res.body).to.have.property("description");
        expect(res.body.description).to.equal(channel.description);

        expect(res.body).to.have.property("icon_url");
        expect(res.body.icon_url).to.equal(channel.icon_url);

        expect(res.body).to.have.property("pin_protected");
        expect(res.body.pin_protected).to.equal(channel.pin_protected);

        expect(res.body).to.have.property("isavailable");
        expect(res.body.isavailable).to.equal(channel.isavailable);
        done();
      });
  });


  it('should return a 200 response and get channels streams list', function (done) {
    api.get('/api/channelstreams')
      .set('Authorization', token)
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function (err, res) {
        expect(res.body).to.be.an('array');
        done();
      });
  });


  it('should fetch channels streams by id', function (done) {
    api.get('/api/channelstreams/1225')
      .expect('Content-Type', /json/)
      .set('Authorization', token)
      .expect(200)
      .end(function (err, res) {
        expect(res.body).to.have.property("stream_format");
        // expect(res.body.stream_format).to.equal(channelStream.stream_format);

        expect(res.body).to.have.property("stream_source_id");
        // expect(res.body.stream_source_id).to.equal(channel.stream_source_id);

        expect(res.body).to.have.property("stream_mode");
        // expect(res.body.stream_mode).to.equal(channel.stream_mode);

        expect(res.body).to.have.property("company_id");
        // expect(res.body.company_id).to.equal(channel.company_id);

        expect(res.body).to.have.property("stream_resolution");
        // expect(res.body.stream_resolution).to.equal(channel.stream_resolution);

        expect(res.body).to.have.property("channel");
        // expect(res.body.channel).to.equal(channel.channel);
        done();
      });
  });


  it('should return a 200 response and get mychannels streams list', function (done) {
    api.get('/api/mychannels')
      .set('Authorization', token)
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function (err, res) {
        expect(res.body).to.be.an('array');
        done();
      });
  });


  it('should fetch mychannels by id', function (done) {
    api.get('/api/mychannels/337')
      .expect('Content-Type', /json/)
      .set('Authorization', token)
      .expect(200)
      .end(function (err, res) {
        expect(res.body).to.have.property("company_id");
        expect(res.body.company_id).to.not.equal(null);
        expect(res.body).to.have.property("login_id");
        expect(res.body.login_id).to.not.equal(null);
        expect(res.body).to.have.property("channel_number");
        expect(res.body.channel_number).to.not.equal(null);
        expect(res.body).to.have.property("genre_id");
        expect(res.body.genre_id).to.not.equal(null);
        expect(res.body).to.have.property("title");
        expect(res.body.title).to.not.equal(null);
        expect(res.body).to.have.property("description");
        expect(res.body.description).to.not.equal(null);
        expect(res.body).to.have.property("stream_url");
        expect(res.body.stream_url).to.not.equal(null);
        expect(res.body).to.have.property("isavailable");
        expect(res.body.isavailable).to.not.equal(null);
        done();
      });
  });

});