const should = require('chai').should();
const expect = require('chai').expect;
const supertest = require('supertest');
const api = supertest('http://localhost');
const config  = require('./config');


describe('Device API: Settings', function () {
  it('should get settings list', function (done) {
    this.timeout(50000);
    api.get('/apiv2/settings/settings')
      .set('auth', config.token)
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function (err, res) {
        expect(res.body.status_code).to.be.equal(200);
        expect(res.body.response_object).to.be.an('array');
        done();
      });
  });

  it('should get settings object', function (done) {
    this.timeout(50000);
    api.get('/apiv2/settings/settings')
      .set('auth', config.token)
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function (err, res) {
        const object = res.body.response_object[0];
        expect(res.body.status_code).to.be.equal(200);

        expect(object).to.have.property("int");
        expect(object.int).to.not.equal(null);

        expect(object).to.have.property("logo_url");
        expect(object.logo_url).to.not.equal(null);

        expect(object).to.have.property("background_url");
        expect(object.background_url).to.not.equal(null);

        expect(object).to.have.property("vod_background_url");
        expect(object.vod_background_url).to.not.equal(null);

        expect(object).to.have.property("portrait_background_url");
        expect(object.portrait_background_url).to.not.equal(null);

        expect(object).to.have.property("livetvrefresh");
        expect(object.livetvrefresh).to.not.equal(null);

        expect(object).to.have.property("vodrefresh");
        expect(object.vodrefresh).to.not.equal(null);

        expect(object).to.have.property("mainmenurefresh");
        expect(object.mainmenurefresh).to.not.equal(null);

        expect(object).to.have.property("seconds_left");
        expect(object.seconds_left).to.not.equal(null);

        expect(object).to.have.property("online_payment_url");
        expect(object.online_payment_url).to.not.equal(null);

        expect(object).to.have.property("days_left_message");
        expect(object.days_left_message).to.not.equal(null);

        expect(object).to.have.property("company_url");
        expect(object.company_url).to.not.equal(null);

        expect(object).to.have.property("log_event_interval");
        expect(object.log_event_interval).to.not.equal(null);

        expect(object).to.have.property("channel_log_time");
        expect(object.channel_log_time).to.not.equal(null);

        expect(object).to.have.property("activity_timeout");
        expect(object.activity_timeout).to.not.equal(null);

        expect(object).to.have.property("player");
        expect(object.player).to.not.equal(null);

        expect(object).to.have.property("pin");
        expect(object.pin).to.not.equal(null);
        done();
      });
  });

  it('should get events list', function (done) {
    this.timeout(50000);
    const date = Date.now();
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



  it('should get program info object', function (done) {
    this.timeout(50000);
    api.post('/apiv2/channels/program_info')
      .set('auth', config.token)
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function (err, res) {
        const obj = res.body.response_object[0];
        expect(res.body.status_code).to.be.equal(200);

        expect(obj).to.have.property("genre");
        expect(obj.genre).to.not.equal(null);

        expect(obj).to.have.property("program_title");
        expect(obj.program_title).to.not.equal(null);

        expect(obj).to.have.property("program_description");
        expect(obj.program_description).to.not.equal(null);

        expect(obj).to.have.property("channel_title");
        expect(obj.channel_title).to.not.equal(null);

        expect(obj).to.have.property("channel_description");
        expect(obj.channel_description).to.not.equal(null);

        expect(obj).to.have.property("status");
        expect(obj.status).to.not.equal(null);

        expect(obj).to.have.property("scheduled");
        expect(obj.scheduled).to.not.equal(null);

        expect(obj).to.have.property("has_catchup");
        expect(obj.has_catchup).to.not.equal(null);
        done();
      });
  });


  it('should get customer app settings object', function (done) {
    this.timeout(50000);
    api.get('/apiv2/customer_app/settings')
      .set('auth', config.token)
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function (err, res) {
        expect(res.body.status_code).to.be.equal(200);
        expect(res.body.response_object).to.be.an('array');


        expect(res.body.response_object[0]).to.have.property("customer_id");
        expect(res.body.response_object[0].customer_id).to.not.equal(null);

        expect(res.body.response_object[0]).to.have.property("pin");
        expect(res.body.response_object[0].pin).to.not.equal(null);

        expect(res.body.response_object[0]).to.have.property("show_adult");
        expect(res.body.response_object[0].show_adult).to.not.equal(null);

        expect(res.body.response_object[0]).to.have.property("auto_timezone");
        expect(res.body.response_object[0].auto_timezone).to.not.equal(null);

        expect(res.body.response_object[0]).to.have.property("timezone");
        expect(res.body.response_object[0].timezone).to.not.equal(null);

        expect(res.body.response_object[0]).to.have.property("player");
        expect(res.body.response_object[0].player).to.not.equal(null);

        expect(res.body.response_object[0]).to.have.property("get_messages");
        expect(res.body.response_object[0].get_messages).to.not.equal(null);
        done();
      });
  });

  it('should get customer app personal info object', function (done) {
    this.timeout(50000);
    api.get(`/apiv2/customer_app/user_data`)
      .set('auth', config.token)
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function (err, res) {
        const user = res.body.response_object[0];
        expect(res.body.status_code).to.be.equal(200);
        expect(res.body.response_object).to.be.an('array');

        expect(user).to.have.property("firstname");
        expect(user.firstname).to.not.equal(null);

        expect(user).to.have.property("lastname");
        expect(user.lastname).to.not.equal(null);

        expect(user).to.have.property("email");
        expect(user.email).to.not.equal(null);

        expect(user).to.have.property("address");
        expect(user.address).to.not.equal(null);

        expect(user).to.have.property("city");
        expect(user.city).to.not.equal(null);

        expect(user).to.have.property("country");
        expect(user.country).to.not.equal(null);

        expect(user).to.have.property("telephone");
        expect(user.telephone).to.not.equal(null);
        done();
      });
  });


  it('should get customer app sales report info list', function (done) {
    this.timeout(50000);
    api.get(`/apiv2/customer_app/salereport`)
      .set('auth', config.token)
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function (err, res) {
        expect(res.body.status_code).to.be.equal(200);
        expect(res.body.response_object).to.be.an('array');
        done();
      });
  });


  it('should get customer app subscriptions', function (done) {
    this.timeout(50000);
    api.get('/apiv2/customer_app/subscription')
      .set('auth', config.token)
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function (err, res) {
        expect(res.body.status_code).to.be.equal(200);
        expect(res.body.response_object).to.be.an('array');
        done();
      });
  });


  it('should get customer app genres', function (done) {
    this.timeout(50000);
    api.get('/apiv2/customer_app/genre')
      .set('auth', config.token)
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function (err, res) {
        expect(res.body.status_code).to.be.equal(200);
        expect(res.body.response_object).to.be.an('array');

        expect(res.body.response_object[0]).to.have.property("name");
        expect(res.body.response_object[0].name).to.not.equal(null);

        expect(res.body.response_object[0]).to.have.property("icon");
        expect(res.body.response_object[0].icon).to.not.equal(null);
        done();
      });
  });

  it('should get customer app channel list', function (done) {
    this.timeout(50000);
    api.get('/apiv2/customer_app/channel_list')
      .set('auth', config.token)
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function (err, res) {
        expect(res.body.status_code).to.be.equal(200);
        expect(res.body.response_object).to.be.an('array');

        // expect(res.body.response_object[0]).to.have.property("name");
        // expect(res.body.response_object[0].name).to.not.equal(null);
        //
        // expect(res.body.response_object[0]).to.have.property("icon");
        // expect(res.body.response_object[0].icon).to.not.equal(null);
        done();
      });
  });

  it('should get customer app products list', function (done) {
    this.timeout(50000);
    api.get('/apiv2/products/product_list')
      .set('auth', config.token)
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function (err, res) {
        expect(res.body.status_code).to.be.equal(200);
        expect(res.body.response_object).to.be.an('array');

        expect(res.body.response_object[0]).to.have.property("name");
        expect(res.body.response_object[0].name).to.not.equal(null);

        expect(res.body.response_object[0]).to.have.property("duration");
        expect(res.body.response_object[0].duration).to.not.equal(null);
        done();
      });
  });
});