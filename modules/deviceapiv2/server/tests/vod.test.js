const should = require('chai').should();
const expect = require('chai').expect;
const supertest = require('supertest');
const api = supertest('http://localhost');
const config  = require('./config');


describe('Device API: Vod', function () {
  it('should  get vod list', function (done) {
    this.timeout(50000);
    api.get('/apiv3/vod/vod_list')
      .set('auth', config.token)
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function (err, res) {
        expect(res.body.status_code).to.be.equal(200);
        expect(res.body.response_object.results).to.be.an('array');
        done();
      });
  });

  // it('should get vod object', function (done) {
  //   this.timeout(50000);
  //   api.get('/apiv3/vod/vod_details/6530')
  //     .set('auth', config.token)
  //     .expect('Content-Type', /json/)
  //     .expect(200)
  //     .end(function (err, res) {
  //       const object = res.body.response_object[0];
  //       expect(res.body.status_code).to.be.equal(200);
  //
  //       expect(object).to.have.property("vote_count");
  //       expect(object.vote_count).to.not.equal(null);
  //
  //       expect(object).to.have.property("vote_average");
  //       expect(object.vote_average).to.not.equal(null);
  //
  //       expect(object).to.have.property("title");
  //       expect(object.title).to.not.equal(null);
  //
  //       expect(object).to.have.property("popularity");
  //       expect(object.popularity).to.not.equal(null);
  //
  //       expect(object).to.have.property("vod_type");
  //       expect(object.vod_type).to.not.equal(null);
  //
  //       expect(object).to.have.property("price");
  //       expect(object.price).to.not.equal(null);
  //
  //       expect(object).to.have.property("expiration_time");
  //       expect(object.expiration_time).to.not.equal(null);
  //
  //       expect(object).to.have.property("backdrop_path");
  //       expect(object.backdrop_path).to.not.equal(null);
  //
  //       expect(object).to.have.property("poster_path");
  //       expect(object.poster_path).to.not.equal(null);
  //
  //       expect(object).to.have.property("original_language");
  //       expect(object.original_language).to.not.equal(null);
  //
  //       expect(object).to.have.property("original_title");
  //       expect(object.original_title).to.not.equal(null);
  //
  //       expect(object).to.have.property("adult");
  //       expect(object.adult).to.not.equal(null);
  //
  //       expect(object).to.have.property("vod_type");
  //       expect(object.vod_type).to.not.equal(null);
  //
  //       expect(object).to.have.property("vote_average");
  //       expect(object.vote_average).to.not.equal(null);
  //
  //       expect(object).to.have.property("actions");
  //       expect(object.actions).to.not.equal(null);
  //
  //       expect(object).to.have.property("genres");
  //       expect(object.genres).to.not.equal(null);
  //
  //       expect(object).to.have.property("vod_stream");
  //       expect(object.vod_stream).to.not.equal(null);
  //
  //       expect(object).to.have.property("payment_url");
  //       expect(object.payment_url).to.not.equal(null);
  //
  //       expect(object).to.have.property("watch_mandatory_ad");
  //       expect(object.watch_mandatory_ad).to.not.equal(null);
  //
  //       done();
  //     });
  // });

  // it('should get vod related list', function (done) {
  //   this.timeout(50000);
  //   api.get(`/apiv3/vod/vod_related`)
  //     .set('auth', config.token)
  //     .expect('Content-Type', /json/)
  //     .expect(200)
  //     .end(function (err, res) {
  //       expect(res.body.status_code).to.be.equal(200);
  //       expect(res.body.response_object).to.be.an('array');
  //       done();
  //     });
  // });

  it('should get vod menu carousel list', function (done) {
    this.timeout(50000);
    api.get('/apiv3/vod/vod_menu')
      .set('auth', config.token)
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function (err, res) {
        expect(res.body.status_code).to.be.equal(200);
        expect(res.body.response_object).to.be.an('array');
        done();
      });
  });


  it('should get vod most watched list', function (done) {
    this.timeout(50000);
    api.get('/apiv3/vod/mostwatched')
      .set('auth', config.token)
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function (err, res) {
        expect(res.body.status_code).to.be.equal(200);
        expect(res.body.response_object.results).to.be.an('array');
        done();
      });
  });

  it('should get vod purchased list', function (done) {
    this.timeout(50000);
    api.get('/apiv3/vod/purchase_list')
      .set('auth', config.token)
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function (err, res) {
        expect(res.body.status_code).to.be.equal(200);
        expect(res.body.response_object).to.be.an('array');
        done();
      });
  });

  it('should get t vod movies list', function (done) {
    this.timeout(50000);
    api.get('/apiv3/vod/tvod_movies')
      .set('auth', config.token)
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function (err, res) {
        expect(res.body.status_code).to.be.equal(200);
        expect(res.body.response_object).to.be.an('array');
        done();
      });
  });
});