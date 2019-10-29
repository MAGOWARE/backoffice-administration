![alt tag](https://www.magoware.tv/wp-content/uploads/2016/06/logo.png)

MAGOWARE is an IPTV/OTT solution for Pay Tv Businesses. The administration portal is build on Sequelize, Express, ng-admin, and Node.js

### Installation

### Before you start, make sure you have these prerequisites installed:

 * PostgreSQL 9.4 or MySQL, MariaDB, SQLite and MSSQL *(Depending on your project but SEAN.JS defaults to PostgreSQL 9.4)*
 * Redis Server
 * Node.js
 * NPM

### Running in Production mode
To run your application with *production* environment configuration, execute grunt as follows:

```bash
$ grunt prod
```

* explore `config/env/production.js` for production environment configuration options

### Running with TLS (SSL)
Application will start by default with secure configuration (SSL mode) turned on and listen on port 8443.
To run your application in a secure manner you'll need to use OpenSSL and generate a set of self-signed certificates. Unix-based users can use the following command:

```bash
$ sh ./scripts/generate-ssl-certs.sh
```

---


```bash
```

[![Documentation Status](https://readthedocs.org/projects/seanjs/badge/?version=latest)](http://seanjs.readthedocs.org/en/latest/?badge=latest)
[![Join the chat at https://gitter.im/seanjs-stack/seanjs](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/seanjs-stack/seanjs?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
[![Build Status](https://travis-ci.org/seanjs-stack/seanjs.svg?branch=master)](https://travis-ci.org/seanjs-stack/seanjs)
[![Dependencies Status](https://david-dm.org/seanjs-stack/seanjs.svg)](https://david-dm.org/seanjs-stack/seanjs)
[![bitHound Overall Score](https://www.bithound.io/github/seanjs-stack/seanjs/badges/score.svg)](https://www.bithound.io/github/seanjs-stack/seanjs)
[![Heroku](https://heroku-badge.herokuapp.com/?app=heroku-badge)](http://seanjs.herokuapp.com)
[![Built with Grunt](https://img.shields.io/badge/built%20with-GRUNT-orange.svg)](http://gruntjs.com/)

[![NPM](https://nodei.co/npm/generator-seanjs.png?downloads=true&downloadRank=true)](https://nodei.co/npm/generator-seanjs/)

**SEAN.JS** is a Full-Stack Javascript for an easy starting point with [**S**equilizeJS](http://sequelize.readthedocs.org/en/latest/), [**E**xpressJS](http://expressjs.com/), [**A**ngularJS](https://angularjs.org/) and [**N**odeJS](https://nodejs.org/en/) based applications.
It is designed to give you a quick and organized way to start developing SEAN based web apps.

## Configured with
* [RedisStore](https://github.com/optimalbits/node_acl): Redis session store backed by node_redis, and is insanely fast!
* [ACL](https://github.com/optimalbits/node_acl): An Access Control List module, based on Redis with Express middleware support
* [Async](https://github.com/caolan/async): Higher-order functions and common patterns for asynchronous code
* [Passport](https://github.com/jaredhanson/passport): Simple, unobtrusive authentication for Node.js (Facebook, Twitter, LinkedIn, Google and PayPal)
* [Socket.io](https://github.com/socketio/socket.io): Node.js realtime framework server
* [reCaptcha](https://www.google.com/recaptcha/intro/index.html): Tough on bots Easy on humans
* [Nodemailer](https://github.com/andris9/Nodemailer): Send e-mails with Node.JS – easy as cake!
* And many more...

Based on **MEAN Stack**

---

### Live Example: [http://seanjs.herokuapp.com](http://seanjs.herokuapp.com)

---
### For quick development and deployment:

**Install:**
* [Docker](https://docs.docker.com/installation/#installation)
* [Docker Compose](https://docs.docker.com/compose/install/)


Using Docker, you don't have to install any prerequisites on your machine.
Just install [Docker](https://docs.docker.com/installation/#installation), run `docker-compose up` and you are up and running!

You will have these containers created for you:

* Nodejs (4.2.3)
* PostgreSQL (Latest)
* Redis (Latest)


Local development and testing with compose:
```bash
$ docker-compose up
```

> Note: You might need to try this command `eval "$(docker-machine env default)"` in the project directory root to activate Docker

---

### Installation

### Before you start, make sure you have these prerequisites installed:

 * PostgreSQL 9.4 or MySQL, MariaDB, SQLite and MSSQL *(Depending on your project but SEAN.JS defaults to PostgreSQL 9.4)*
 * Redis Server
 * Node.js
 * NPM

---


##### Using Command Line:

> **For MySQL, MariaDB, SQLite and MSSQL**

> Please replace:
* [user.server.model.js](https://gist.github.com/Massad/3986f4b12d871de8d353#file-user-server-model-js-L6) with `/modules/users/server/models/user.server.model.js`
* [user.authentication.server.controller.js](https://gist.github.com/Massad/f6f649d60ad3009f7b99#file-user-authentication-server-controller-js-L6) with `/modules/users/server/controllers/users/user.authentication.server.controller.js`


> And update your database in the `config/env/`


---

### Database migration

$ sequelize migration:create  # Generates a new migration file.


To upgrade the database with the latest changes run the following:

```bash
$ sequelize db:migrate
```


* explore `config/env/production.js` for production environment configuration options

### Running with TLS (SSL)
Application will start by default with secure configuration (SSL mode) turned on and listen on port 8443.
To run your application in a secure manner you'll need to use OpenSSL and generate a set of self-signed certificates. Unix-based users can use the following command:

```bash
$ sh ./scripts/generate-ssl-certs.sh
```

Windows users can follow instructions found [here](http://www.websense.com/support/article/kbarticle/How-to-use-OpenSSL-and-Microsoft-Certification-Authority).
After you've generated the key and certificate, place them in the *config/sslcerts* folder.

Finally, execute grunt's prod task `grunt prod`
* enable/disable SSL mode in production environment change the `secure` option in `config/env/production.js`


## Delete GIT History

Step 1: remove all history

rm -rf .git
Step 2: reconstruct the Git repo with only the current content

git init
git add .
git commit -m "Initial commit"
Step 3: push to GitHub.

git remote add origin <github-uri>
git push -u --force origin master


---
## API Documentation
Run the following command to generate APIDOC folder
```
apidoc -i modules/deviceapiv2/server/controllers/ modules/streams/server/controllers/ -o public/apidoc/
```


---

## License
(The MIT License)

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
