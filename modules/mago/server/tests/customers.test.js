const expect = require('chai').expect;
const supertest = require('supertest');
const api = supertest('http://localhost');
const config = require('./config');


describe('Customers', function () {
  let token = "";
  before(function (done) {
    config.generateToken(tk => {
      token = tk;
      done();
    });
  });

  it('should return a 200 response and get customers list', function (done) {
    this.timeout(50000);
    api.get('/api/CustomerAccount')
      .set('Authorization', token)
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function (err, res) {
        expect(res.body).to.be.an('array');
        done();
      });
  });


  it('should fetch customer account', function (done) {
    api.get('/api/CustomerAccount/1')
      .expect('Content-Type', /json/)
      .set('Authorization', token)
      .expect(200)
      .end(function (err, res) {
        expect(res.body).to.have.property("username");
        expect(res.body.username).to.not.equal(null);
        expect(res.body.customer_datum).to.have.property("email");
        expect(res.body.customer_datum.email).to.not.equal(null);
        expect(res.body.customer_datum).to.have.property("telephone");
        expect(res.body.customer_datum.telephone).to.not.equal(null);
        expect(res.body).to.have.property("customer_id");
        expect(res.body.customer_id).to.not.equal(null);
        expect(res.body).to.have.property("company_id");
        expect(res.body.company_id).to.not.equal(null);
        expect(res.body).to.have.property("password");
        expect(res.body.password).to.not.equal(null);
        expect(res.body).to.have.property("customer_datum");
        expect(res.body.customer_datum).to.not.equal(null);
        done();
      });
  });


});