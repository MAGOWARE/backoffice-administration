const should = require('chai').should();
const expect = require('chai').expect;
const supertest = require('supertest');
const api = supertest('http://localhost');
const config = require('./config');

describe('Vod', function () {
  let token = "";
  before(function (done) {
    config.generateToken(tk => {
      token = tk;
      done();
    });
  });

  it('should return a 200 response and get vod list', function (done) {
    api.get('/api/users')
      .set('Authorization', token)
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function (err, res) {
        expect(res.body).to.be.an('array');
        done();
      });
  });


  it('should fetch vod', function (done) {
    api.get('/api/vods/44310')
      .expect('Content-Type', /json/)
      .set('Authorization', token)
      .expect(200)
      .end(function (err, res) {
        expect(res.body).to.have.property("title");
        expect(res.body.title).to.not.equal(null);
        expect(res.body).to.have.property("release_date");
        expect(res.body.release_date).to.not.equal(null);
        expect(res.body).to.have.property("package_vods");
        expect(res.body.package_vods).to.not.equal(null);
        expect(res.body).to.have.property("company_id");
        expect(res.body.company_id).to.not.equal(null);
        expect(res.body).to.have.property("clicks");
        expect(res.body.clicks).to.not.equal(null);
        expect(res.body).to.have.property("rate");
        expect(res.body.rate).to.not.equal(null);
        done();
      });
  });

  it('should fetch vod episode list', function (done) {
    api.get('/api/VodEpisode')
      .expect('Content-Type', /json/)
      .set('Authorization', token)
      .expect(200)
      .end(function (err, res) {
        expect(res.body).to.be.an('array');
        done();
      });
  });

  it('should fetch vod episode by id', function (done) {
    api.get('/api/VodEpisode/4')
      .expect('Content-Type', /json/)
      .set('Authorization', token)
      .expect(200)
      .end(function (err, res) {
        expect(res.body).to.have.property("title");
        expect(res.body.title).to.not.equal(null);
        expect(res.body).to.have.property("release_date");
        expect(res.body.release_date).to.not.equal(null);
        expect(res.body).to.have.property("episode_number");
        expect(res.body.episode_number).to.not.equal(null);
        expect(res.body).to.have.property("company_id");
        expect(res.body.company_id).to.not.equal(null);
        expect(res.body).to.have.property("duration");
        expect(res.body.duration).to.not.equal(null);
        expect(res.body).to.have.property("popularity");
        expect(res.body.popularity).to.not.equal(null);
        expect(res.body).to.have.property("tv_season_id");
        expect(res.body.tv_season_id).to.not.equal(null);
        expect(res.body).to.have.property("status");
        expect(res.body.status).to.not.equal(null);
        done();
      });
  });

  it('should fetch vod series list', function (done) {
    api.get('/api/Series')
      .expect('Content-Type', /json/)
      .set('Authorization', token)
      .expect(200)
      .end(function (err, res) {
        expect(res.body).to.be.an('array');
        done();
      });
  });

  it('should fetch vod series by id', function (done) {
    api.get('/api/Series/4')
      .expect('Content-Type', /json/)
      .set('Authorization', token)
      .expect(200)
      .end(function (err, res) {
        expect(res.body).to.have.property("title");
        expect(res.body.title).to.not.equal(null);
        expect(res.body).to.have.property("release_date");
        expect(res.body.release_date).to.not.equal(null);
        expect(res.body).to.have.property("episode_runtime");
        expect(res.body.episode_runtime).to.not.equal(null);
        expect(res.body).to.have.property("company_id");
        expect(res.body.company_id).to.not.equal(null);
        expect(res.body).to.have.property("popularity");
        expect(res.body.popularity).to.not.equal(null);
        expect(res.body).to.have.property("rate");
        expect(res.body.rate).to.not.equal(null);
        expect(res.body).to.have.property("status");
        expect(res.body.status).to.not.equal(null);
        done();
      });
  });

  it('should fetch vod season list', function (done) {
    api.get('/api/Season')
      .expect('Content-Type', /json/)
      .set('Authorization', token)
      .expect(200)
      .end(function (err, res) {
        expect(res.body).to.be.an('array');
        done();
      });
  });

  it('should fetch vod season by id', function (done) {
    api.get('/api/Season/1')
      .expect('Content-Type', /json/)
      .set('Authorization', token)
      .expect(200)
      .end(function (err, res) {
        expect(res.body).to.have.property("title");
        expect(res.body.title).to.not.equal(null);
        expect(res.body).to.have.property("clicks");
        expect(res.body.clicks).to.not.equal(null);
        expect(res.body).to.have.property("tv_show_id");
        expect(res.body.tv_show_id).to.not.equal(null);
        expect(res.body).to.have.property("company_id");
        expect(res.body.company_id).to.not.equal(null);
        expect(res.body).to.have.property("price");
        expect(res.body.price).to.not.equal(null);
        expect(res.body).to.have.property("popularity");
        expect(res.body.popularity).to.not.equal(null);
        expect(res.body).to.have.property("rate");
        expect(res.body.rate).to.not.equal(null);
        expect(res.body).to.have.property("status");
        expect(res.body.status).to.not.equal(null);
        done();
      });
  });

  it('should fetch vod stream by id', function (done) {
    api.get('/api/vodstreams/11523')
      .expect('Content-Type', /json/)
      .set('Authorization', token)
      .expect(200)
      .end(function (err, res) {
        expect(res.body).to.have.property("company_id");
        expect(res.body.company_id).to.not.equal(null);
        expect(res.body).to.have.property("vod_id");
        expect(res.body.vod_id).to.not.equal(null);
        expect(res.body).to.have.property("stream_source_id");
        expect(res.body.stream_source_id).to.not.equal(null);
        expect(res.body).to.have.property("url");
        expect(res.body.url).to.not.equal(null);
        expect(res.body).to.have.property("stream_resolution");
        expect(res.body.stream_resolution).to.not.equal(null);
        expect(res.body).to.have.property("stream_format");
        expect(res.body.stream_format).to.not.equal(null);
        expect(res.body).to.have.property("stream_format");
        expect(res.body.stream_type).to.not.equal(null);
        expect(res.body).to.have.property("stream_type");
        expect(res.body.rate).to.not.equal(null);
        expect(res.body).to.have.property("vod");
        expect(res.body.vod).to.not.equal(null);
        done();
      });
  });



  it('should fetch vod menu carousel list', function (done) {
    api.get('/api/vodmenucarousel')
      .expect('Content-Type', /json/)
      .set('Authorization', token)
      .expect(200)
      .end(function (err, res) {
        expect(res.body).to.be.an('array');
        done();
      });
  });

  it('should fetch vod menu carousel by id', function (done) {
    api.get('/api/vodmenucarousel/3')
      .expect('Content-Type', /json/)
      .set('Authorization', token)
      .expect(200)
      .end(function (err, res) {
        expect(res.body).to.have.property("company_id");
        expect(res.body.company_id).to.not.equal(null);
        expect(res.body).to.have.property("vod_menu_id");
        expect(res.body.vod_menu_id).to.not.equal(null);
        expect(res.body).to.have.property("name");
        expect(res.body.name).to.not.equal(null);
        expect(res.body).to.have.property("description");
        expect(res.body.description).to.not.equal(null);
        expect(res.body).to.have.property("order");
        expect(res.body.order).to.not.equal(null);
        expect(res.body).to.have.property("url");
        expect(res.body.url).to.not.equal(null);
        expect(res.body).to.have.property("isavailable");
        expect(res.body.isavailable).to.not.equal(null);
        done();
      });
  });

  it('should fetch vod stream sources list', function (done) {
    api.get('/api/vodstreamsources')
      .expect('Content-Type', /json/)
      .set('Authorization', token)
      .expect(200)
      .end(function (err, res) {
        expect(res.body).to.be.an('array');
        done();
      });
  });

  it('should fetch vod stream sources by id', function (done) {
    api.get('/api/vodmenucarousel/3')
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

  it('should fetch vod categories list', function (done) {
    api.get('/api/vodcategories')
      .expect('Content-Type', /json/)
      .set('Authorization', token)
      .expect(200)
      .end(function (err, res) {
        expect(res.body).to.be.an('array');
        done();
      });
  });

  it('should fetch vod categories sources by id', function (done) {
    api.get('/api/vodcategories/1')
      .expect('Content-Type', /json/)
      .set('Authorization', token)
      .expect(200)
      .end(function (err, res) {
        expect(res.body).to.have.property("company_id");
        expect(res.body.company_id).to.not.equal(null);

        expect(res.body).to.have.property("description");
        expect(res.body.description).to.not.equal(null);

        expect(res.body).to.have.property("name");
        expect(res.body.name).to.not.equal(null);

        expect(res.body).to.have.property("pay");
        expect(res.body.pay).to.not.equal(null);

        expect(res.body).to.have.property("icon_url");
        expect(res.body.icon_url).to.not.equal(null);

        expect(res.body).to.have.property("small_icon_url");
        expect(res.body.small_icon_url).to.not.equal(null);

        expect(res.body).to.have.property("isavailable");
        expect(res.body.isavailable).to.not.equal(null);

        expect(res.body).to.have.property("sorting");
        expect(res.body.sorting).to.not.equal(null);

        expect(res.body).to.have.property("password");
        expect(res.body.password).to.not.equal(null);
        done();
      });
  });

});