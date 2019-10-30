const supertest = require('supertest');
const api = supertest('http://localhost');
const winston = require('winston');

module.exports = {
  generateToken: function (done) {
    api.post('/api/auth/login')
      .set('Content-Type', "application/json")
      .send({
        username: module.exports.username,
        password: module.exports.password
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function (err, res) {
        if(err)  {
          winston.error(err);
        }
        done(res.body.token);
      });
  },
  username: "admin",
  password: "ma60vvar3"
};