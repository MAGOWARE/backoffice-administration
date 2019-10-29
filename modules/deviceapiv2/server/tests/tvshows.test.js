const should = require('chai').should();
const expect = require('chai').expect;
const supertest = require('supertest');
const api = supertest('http://localhost');
const config  = require('./config');


describe('Device API: Tv Shows', function () {
  it('should get tv shows list', function (done) {
    this.timeout(50000);
    api.get('/apiv3/tv_show/tv_show_list')
      .set('auth', config.token)
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function (err, res) {
        expect(res.body.status_code).to.be.equal(200);
        expect(res.body.response_object.results).to.be.an('array');
        done();
      });
  });

  // it('should get tv shows detail list', function (done) {
  //   this.timeout(50000);
  //   api.get('/apiv3/tv_show/tv_show_details/446546')
  //     .set('auth', config.token)
  //     .expect('Content-Type', /json/)
  //     .expect(200)
  //     .end(function (err, res) {
  //       expect(res.body.status_code).to.be.equal(200);
  //       expect(res.body.response_object.results).to.be.an('array');
  //       const tvShow = res.body.response_object.results;
  //
  //       expect(tvShow).to.have.property("title");
  //       expect(tvShow.title).to.not.equal(null);
  //       done();
  //     });
  // });
});