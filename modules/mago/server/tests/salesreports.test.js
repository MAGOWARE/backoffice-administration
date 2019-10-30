const should = require('chai').should();
const expect = require('chai').expect;
const supertest = require('supertest');
const api = supertest('http://localhost');
const config = require('./config');


describe('Sale Reports', function () {
  let token = "";
  before(function (done) {
    config.generateToken(tk => {
      token = tk;
      done();
    });
  });

  it('should return a 200 response and get sales reports list', function (done) {
    this.timeout(50000);
    api.get('/api/salesreports')
      .set('Authorization', token)
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function (err, res) {
        expect(res.body).to.be.an('array');
        done();
      });
  });


  it('should fetch sales reports by id', function (done) {
    api.get('/api/salesreports/305')
      .expect('Content-Type', /json/)
      .set('Authorization', token)
      .expect(200)
      .end(function (err, res) {
        expect(res.body).to.have.property("company_id");
        expect(res.body.company_id).to.not.equal(null);
        expect(res.body).to.have.property("user_id");
        expect(res.body.user_id).to.not.equal(null);
        expect(res.body).to.have.property("combo_id");
        expect(res.body.combo_id).to.not.equal(null);
        expect(res.body).to.have.property("login_data_id");
        expect(res.body.login_data_id).to.not.equal(null);
        expect(res.body).to.have.property("user_username");
        expect(res.body.user_username).to.not.equal(null);
        expect(res.body).to.have.property("distributorname");
        expect(res.body.distributorname).to.not.equal(null);
        expect(res.body).to.have.property("saledate");
        expect(res.body.saledate).to.not.equal(null);
        expect(res.body).to.have.property("active");
        expect(res.body.active).to.not.equal(null);

        expect(res.body).to.have.property("cancelation_date");
        expect(res.body).to.have.property("cancelation_user");
        expect(res.body).to.have.property("cancelation_reason");

        done();
      });
  });


});