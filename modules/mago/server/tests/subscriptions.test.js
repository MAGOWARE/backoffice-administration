const should = require('chai').should();
const expect = require('chai').expect;
const supertest = require('supertest');
const api = supertest('http://localhost');
const config = require('./config');


describe('Subscriptions', function () {
    let token = "";
    before(function (done) {
        config.generateToken(tk => {
            token = tk;
            done();
        });
    });

    it('should return a 200 response and get subscriptions list', function (done) {
    this.timeout(50000);
    api.get('/api/subscriptions')
      .set('Authorization', token)
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function (err, res) {
        expect(res.body).to.be.an('array');
        done();
      });
  });


  it('should fetch subscriptions by id', function (done) {
    api.get('/api/subscriptions/5573')
      .expect('Content-Type', /json/)
      .set('Authorization', token)
      .expect(200)
      .end(function (err, res) {
        expect(res.body).to.have.property("company_id");
        expect(res.body.company_id).to.not.equal(null);
        expect(res.body).to.have.property("login_id");
        expect(res.body.login_id).to.not.equal(null);
        expect(res.body).to.have.property("package_id");
        expect(res.body.package_id).to.not.equal(null);
        expect(res.body).to.have.property("customer_username");
        expect(res.body.customer_username).to.not.equal(null);
        expect(res.body).to.have.property("user_username");
        expect(res.body.user_username).to.not.equal(null);
        expect(res.body).to.have.property("start_date");
        expect(res.body.start_date).to.not.equal(null);

        expect(res.body.login_datum).to.have.property("company_id");
        expect(res.body.login_datum.company_id).to.not.equal(null);

        expect(res.body.login_datum).to.have.property("username");
        expect(res.body.login_datum.username).to.not.equal(null);

        expect(res.body.login_datum).to.have.property("mac_address");
        expect(res.body.login_datum.mac_address).to.not.equal(null);

        expect(res.body.login_datum).to.have.property("password");
        expect(res.body.login_datum.password).to.not.equal(null);

        expect(res.body.login_datum).to.have.property("salt");
        expect(res.body.login_datum.salt).to.not.equal(null);

        expect(res.body.login_datum).to.have.property("customer_id");
        expect(res.body.login_datum.customer_id).to.not.equal(null);

        expect(res.body.login_datum).to.have.property("channel_stream_source_id");
        expect(res.body.login_datum.channel_stream_source_id).to.not.equal(null);

        expect(res.body.login_datum).to.have.property("vod_stream_source");
        expect(res.body.login_datum.vod_stream_source).to.not.equal(null);

        expect(res.body.login_datum).to.have.property("pin");
        expect(res.body.login_datum.pin).to.not.equal(null);

        expect(res.body.login_datum).to.have.property("show_adult");
        expect(res.body.login_datum.show_adult).to.not.equal(null);

        expect(res.body.login_datum).to.have.property("auto_timezone");
        expect(res.body.login_datum.auto_timezone).to.not.equal(null);

        expect(res.body.login_datum).to.have.property("player");
        expect(res.body.login_datum.player).to.not.equal(null);

        expect(res.body.login_datum).to.have.property("auto_timezone");
        expect(res.body.login_datum.auto_timezone).to.not.equal(null);

        expect(res.body.login_datum).to.have.property("activity_timeout");
        expect(res.body.login_datum.activity_timeout).to.not.equal(null);

        expect(res.body.login_datum).to.have.property("get_messages");
        expect(res.body.login_datum.get_messages).to.not.equal(null);

        expect(res.body.login_datum).to.have.property("get_ads");
        expect(res.body.login_datum.get_ads).to.not.equal(null);

        expect(res.body.login_datum).to.have.property("vodlastchange");
        expect(res.body.login_datum.vodlastchange).to.not.equal(null);

        expect(res.body.login_datum).to.have.property("livetvlastchange");
        expect(res.body.login_datum.livetvlastchange).to.not.equal(null);

        expect(res.body.login_datum).to.have.property("account_lock");
        expect(res.body.login_datum.account_lock).to.not.equal(null);

        expect(res.body.package).to.have.property("company_id");
        expect(res.body.package.company_id).to.not.equal(null);

        expect(res.body.package).to.have.property("company_id");
        expect(res.body.package.company_id).to.not.equal(null);

        expect(res.body.package).to.have.property("package_type_id");
        expect(res.body.package.package_type_id).to.not.equal(null);

        expect(res.body.package).to.have.property("package_name");
        expect(res.body.package.package_name).to.not.equal(null);
        done();
      });
  });


});