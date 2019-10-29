const expect = require('chai').expect;
const supertest = require('supertest');
const api = supertest('http://localhost');
const config = require('./config');
const faker = require('faker');


describe('Users', function () {
  let token = "";
  let userObject = {
    username: faker.internet.userName(),
    group_id: "2",
    hashedpassword: "klendi",
    email: faker.internet.email(),
    telephone: faker.phone.phoneNumber(),
    isavaible: true,
    third_party_api_token: "",
    address: faker.address.streetAddress(),
    city: faker.address.city(),
    country: faker.address.country()
  };

  let usr = {};

  before(function (done) {
    config.generateToken(tk => {
      token = tk;
      done();
    });
  });

  it('should create new user', function (done) {
    api.post('/api/users')
      .set('Authorization', token)
      .set('Content-Type', "application/json")
      .expect('Content-Type', /json/)
      .send(userObject)
      .expect(200)
      .end(function (err, res) {
        expect(res.body).to.have.property("company_id");
        expect(res.body.company_id).to.not.equal(null);

        expect(res.body).to.have.property("address");
        expect(res.body.address).to.equal(userObject.address);

        expect(res.body).to.have.property("country");
        expect(res.body.country).to.equal(userObject.country);

        expect(res.body).to.have.property("city");
        expect(res.body.city).to.equal(userObject.city);

        expect(res.body).to.have.property("jwtoken");
        expect(res.body.jwtoken).to.not.equal(null);

        expect(res.body).to.have.property("username");
        expect(res.body.username).to.equal(userObject.username);

        expect(res.body).to.have.property("hashedpassword");
        expect(res.body.hashedpassword).to.not.equal(null);

        expect(res.body).to.have.property("email");
        expect(res.body.email).to.equal(userObject.email);

        expect(res.body).to.have.property("telephone");
        expect(res.body.telephone).to.equal(userObject.telephone);

        expect(res.body).to.have.property("salt");
        expect(res.body.salt).to.not.equal(null);

        expect(res.body).to.have.property("third_party_api_token");
        expect(res.body.third_party_api_token).to.not.equal(null);
        usr = res.body;
        done();
      });
  });

  it('should return a 200 response and get users list', function (done) {
    api.get('/api/users')
      .set('Authorization', token)
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function (err, res) {
        expect(res.body).to.be.an('array');
        done();
      });
  });


  it('should fetch user', function (done) {
    api.get('/api/users/' + usr.id)
      .expect('Content-Type', /json/)
      .set('Authorization', token)
      .expect(200)
      .end(function (err, res) {
        expect(res.body).to.have.property("username");
        expect(res.body.name).to.equal(usr.name);

        expect(res.body).to.have.property("email");
        expect(res.body.email).to.equal(usr.email);

        expect(res.body).to.have.property("telephone");
        expect(res.body.telephone).to.equal(usr.telephone);

        expect(res.body).to.have.property("group");
        expect(res.body.role).to.not.equal(null);

        expect(res.body).to.have.property("company_id");
        expect(res.body.company_id).to.not.equal(null);

        expect(res.body).to.have.property("hashedpassword");
        expect(res.body.hashedpassword).to.not.equal(null);

        expect(res.body).to.have.property("salt");
        expect(res.body.salt).to.not.equal(null);

        expect(res.body).to.have.property("country");
        expect(res.body.country).to.equal(usr.country);

        expect(res.body).to.have.property("city");
        expect(res.body.city).to.equal(usr.city);

        done();
      });
  });


});