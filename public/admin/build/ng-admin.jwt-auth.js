// import temp from "../js/loginGoogle/loginGoogle.html";


(function e(t, n, r) {
  function s(o, u) {
    if (!n[o]) {
      if (!t[o]) {
        var a = typeof require == "function" && require;
        if (!u && a) return a(o, !0);
        if (i) return i(o, !0);
        var f = new Error("Cannot find module '" + o + "'");
        throw f.code = "MODULE_NOT_FOUND", f
      }
      var l = n[o] = {exports: {}};
      t[o][0].call(l.exports, function (e) {
        var n = t[o][1][e];
        return s(n ? n : e)
      }, l, l.exports, e, t, n, r)
    }
    return n[o].exports
  }

  var i = typeof require == "function" && require;
  for (var o = 0; o < r.length; o++) s(r[o]);
  return s
})({
  1: [function (require, module, exports) {
    var ngAdminJWTAuthService = function ($http, jwtHelper, ngAdminJWTAuthConfigurator, notification) {

      return {
        authenticate: function (data, successCallback, errorCallback) {

          var url = ngAdminJWTAuthConfigurator.getAuthURL();

          //getting static obj for superadmin menu
          var superadminObj;
          $http.get('js/superadminMenuObj.json').success(function (data) {
            superadminObj = data;
          });
          //getting static obj for superadmin menu

          //make request towards the authentication api
          return $http({
            url: url,
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            data: data
          }).then(function (response) {
            var payload = jwtHelper.decodeToken(response.data.token);

            localStorage.userToken = response.data.token;
            localStorage.userRole = payload.role;
            localStorage.userName = payload.sub;

            if (response.data.menujson.length > 0) {

              var menuJSON = JSON.stringify(response.data.menujson);
              localStorage.menuObject = menuJSON;
              if (response.data.menujson[1].children.length > 0) {
                localStorage.redirect_url = response.data.menujson[1].children[0].link;
              } else {
                localStorage.redirect_url = response.data.menujson[1].link;
              }

            } else if (payload.role === 'superadmin') {

              var menuJSON = JSON.stringify(superadminObj);
              localStorage.menuObject = menuJSON;
              if (superadminObj[1].children.length > 0) {
                localStorage.redirect_url = superadminObj[1].children[0].link;
              } else {
                localStorage.redirect_url = superadminObj[1].link;
              }

            } else {
              notification.log('Sorry, this user does not belong to any Menu ', {addnCls: 'humane-flatty-error'});
            }

            successCallback(response);

            var customAuthHeader = ngAdminJWTAuthConfigurator.getCustomAuthHeader();
            if (customAuthHeader) {
              $http.defaults.headers.common[customAuthHeader.name] = customAuthHeader.template.replace('{{token}}', response.data.token);
            } else {
              $http.defaults.headers.common.Authorization = 'Basic ' + response.data.token;
            }
          }, errorCallback);


        },

        isAuthenticated: function () {
          var token = localStorage.userToken; //todo: ketu kontrollohet prezenca e token
          if (!token) {
            return false;
          }
          return jwtHelper.isTokenExpired(token) ? false : true;
        },

        logout: function () {
          localStorage.removeItem('userRole');
          localStorage.removeItem('userToken');
          localStorage.removeItem('userName');
          localStorage.removeItem('menuObject');
          localStorage.removeItem('redirect_url');
          return true;
        }

      }

    };

    ngAdminJWTAuthService.$inject = ['$http', 'jwtHelper', 'ngAdminJWTAuthConfigurator', 'notification'];

    module.exports = ngAdminJWTAuthService;
  }, {}], 2: [function (require, module, exports) {
    var ngAdminJWTAuthConfiguratorProvider = function () {
      var authConfigs = {
        _nonProtectedStates: ['login', 'auth']
      };

      this.setJWTAuthURL = function (url) {
        authConfigs._authUrl = url;
      };

      this.setCustomLoginTemplate = function (url) {
        authConfigs._customLoginTemplate = url;
      }

      this.setLoginSuccessCallback = function (callback) {
        authConfigs._loginSuccessCallback = callback;
      }

      this.setLoginErrorCallback = function (callback) {
        authConfigs._loginErrorCallback = callback;
      }

      this.setCustomAuthHeader = function (obj) {
        return authConfigs._customAuthHeader = obj;
      }

      this.setNonProtectedStates = function (states) {
        states.push('login');
        authConfigs._nonProtectedStates = states;
      }

      this.setCheckEveryResponseForAuthHeader = function () {
        authConfigs._checkEveryResponseForAuthHeader = true;
      }

      this.$get = function () {
        return {
          getAuthURL: function () {
            return authConfigs._authUrl;
          },
          getCustomLoginTemplate: function () {
            return authConfigs._customLoginTemplate;
          },
          getLoginSuccessCallback: function () {
            return authConfigs._loginSuccessCallback;
          },
          getLoginErrorCallback: function () {
            return authConfigs._loginErrorCallback;
          },
          getCustomAuthHeader: function () {
            return authConfigs._customAuthHeader;
          },
          getNonProtectedStates: function () {
            return authConfigs._nonProtectedStates;
          },
          getCheckEveryResponseForAuthHeader: function () {
            return !!authConfigs._checkEveryResponseForAuthHeader;
          },
        };
      }

    };

    module.exports = ngAdminJWTAuthConfiguratorProvider;

  }, {}], 3: [function (require, module, exports) {
    var loginController = function ($scope, $rootScope, ngAdminJWTAuthService, ngAdminJWTAuthConfigurator, notification, $location) {
      this.$scope = $scope;
      this.$rootScope = $rootScope;
      this.ngAdminJWTAuthService = ngAdminJWTAuthService;
      this.ngAdminJWTAuthConfigurator = ngAdminJWTAuthConfigurator;
      this.notification = notification;
      this.$location = $location;
      this.$scope.loginAttemps = 1;
    };

    loginController.prototype.login = function ($scope) {
      const that = this;
      const success = this.ngAdminJWTAuthConfigurator.getLoginSuccessCallback() || function (response) {
        //that.notification.log(`You are logged in! `, { addnCls: 'humane-flatty-success' });
        //that.$location.path('/dashboard').location['reload']();
        if (success) {
          const redirect_url = localStorage.getItem("redirect_url");
          if (redirect_url) {
            window.location.hash = redirect_url;
            location.reload();
          } else {
            localStorage.removeItem('userRole');
            localStorage.removeItem('userToken');
            localStorage.removeItem('userName');
          }
        }
      };
      loginController.prototype.getAttempts = function () {
        return that.$scope.loginAttemps > 3;
      };
      const error = this.ngAdminJWTAuthConfigurator.getLoginErrorCallback() || function (response) {
        that.$scope.loginAttemps = that.$scope.loginAttemps + 1;
        that.notification.log(response.data.message, {addnCls: 'humane-flatty-error'});
      };
      this.ngAdminJWTAuthService.authenticate(this.data, success, error);
    };

    loginController.$inject = ['$rootScope', '$scope', 'ngAdminJWTAuthService', 'ngAdminJWTAuthConfigurator', 'notification', '$location'];

    module.exports = loginController;
  }, {}], 4: [function (require, module, exports) {
    var loginTemplate = '<div class=\"container\">\n    ' +
      '<form style=\"max-width: 330px; padding: 15px; margin: 0 auto;\" class=\"form-login\" name=\"loginController.form\"  ng-submit=\"loginController.login()\">\n       ' +
      ' <h2 class=\"form-login-heading\">Please log in<\/h2>\n ' +
      '<div class=\"form-group\">\n <label for=\"inputLogin\" class=\"sr-only\">Login<\/label>\n  <input type=\"text\" id=\"inputLogin\" class=\"form-control\" placeholder=\"Login\" ng-model=\"loginController.data.login\" ng-required=\"true\" ng-minlength=\"3\" ng-enter=\"loginController.login()\">\n        <\/div>\n  ' +
      '<div class=\"form-group\">\n <label for=\"inputPassword\" class=\"sr-only\">Password<\/label>\n <input type=\"password\" id=\"inputPassword\" class=\"form-control\" placeholder=\"Password\" ng-model=\"loginController.data.password\" ng-required=\"true\" ng-minlength=\"4\" ng-enter=\"loginController.login()\">\n  <\/div>\n\n' +
      '<button class=\"btn btn-lg btn-primary btn-block\" type=\"submit\" ng-disabled=\"loginController.form.$invalid\">Login<\/button>\n    <\/form>\n<\/div>';


    module.exports = loginTemplate;
  }, {}], 5: [function (require, module, exports) {
    var logoutController = function ($scope, ngAdminJWTAuthService, $location) {
      ngAdminJWTAuthService.logout();
      $location.path('/CustomLoginTemplate');
    };

    logoutController.$inject = ['$scope', 'ngAdminJWTAuthService', '$location'];

    module.exports = logoutController;
  }, {}], 6: [function (require, module, exports) {
    'use strict';

    //MUST USE TO WORK CORRECT IN IE
    String.prototype.endsWith = function (pattern) {
      var d = this.length - pattern.length;
      return d >= 0 && this.lastIndexOf(pattern) === d;
    };

    String.prototype.includes = function (pattern) {
      var d = this.length - pattern.length;
      return d >= 0 && this.lastIndexOf(pattern) === d;
    };
    //./MUST USE TO WORK CORRECT IN IE

    var ngAdminJWTAuth = angular.module('ng-admin.jwt-auth', ['angular-jwt']);

    ngAdminJWTAuth.config(['$stateProvider', '$httpProvider', function ($stateProvider, $httpProvider) {

      $stateProvider.state('login', {
        parent: '',
        url: '/login',
        controller: 'loginController',
        controllerAs: 'loginController',
        templateProvider: ['ngAdminJWTAuthConfigurator', '$http', 'notification', function (configurator, $http, notification) {
          var template = configurator.getCustomLoginTemplate();

          if (!template) {
            return require('./loginTemplate');
          }

          if (!template.endsWith('.html')) {
            return template;
          }

          return $http.get(template).then(function (response) {
            return response.data;
          }, function (response) {
            notification.log('Error in template loading', {addnCls: 'humane-flatty-error'});
          });
        }],
      });

      $stateProvider.state('logout', {
        parent: '',
        url: '/logout',
        controller: 'logoutController',
        controllerAs: 'logoutController',
      });

      $stateProvider.state('auth', {
        parent: '',
        url: '/auth',
        controller: ['$http', '$scope', 'notification', '$stateParams', '$location', function ($http, $scope, notification, $stateParams, $location) {

          $scope.parameters = $location.search();

          var req = {
            method: 'POST',
            url: window.location.origin + '/api/auth/logingmail',
            headers: {
              'Authorization': $scope.parameters.access_token
            }
          };

          $http(req).then(function successCallback(response) {

            if (response.status === 200) {

              localStorage.userToken = $scope.parameters.access_token;
              localStorage.userRole = response.data.user.group.code;
              localStorage.userName = response.data.user.username;

              var menuJSON = JSON.stringify(response.data.menujson);
              localStorage.menuObject = menuJSON;

              if (response.data.menujson[1].children.length > 0) {
                localStorage.redirect_url = response.data.menujson[1].children[0].link;
              } else {
                localStorage.redirect_url = response.data.menujson[1].link;
              }

              var redirect_url = localStorage.getItem("redirect_url");

              window.location.hash = redirect_url;
              location.reload();
            }
          }, function errorCallback(response) {
            window.location.hash = "login";
            notification.log(response.data.message, {addnCls: 'humane-flatty-error'});
          });
        }],
      });

    }]);

    ngAdminJWTAuth.run(['$q', 'Restangular', 'ngAdminJWTAuthService', '$http', '$location', '$state', '$rootScope', 'ngAdminJWTAuthConfigurator', function ($q, Restangular, ngAdminJWTAuthService, $http, $location, $state, $rootScope, ngAdminJWTAuthConfigurator) {

      $rootScope.$on('$stateChangeStart', function (event, toState, toParams, fromState, fromParams) {
        if (!ngAdminJWTAuthService.isAuthenticated()) {
          var nonProtectedStates = ngAdminJWTAuthConfigurator.getNonProtectedStates();
          if (nonProtectedStates.indexOf(toState.name) == -1) {
            event.preventDefault();
            var changeState = $state.go('login');
            changeState.then(function () {
              $rootScope.$broadcast('$stateChangeSuccess', toState.self, toParams, fromState.self, fromParams);
            });
          }
          return true;
        }
        return true;
      });

      Restangular.addFullRequestInterceptor(function (response, deferred, responseHandler) {
        if (ngAdminJWTAuthService.isAuthenticated()) {
          var customAuthHeader = ngAdminJWTAuthConfigurator.getCustomAuthHeader();
          if (customAuthHeader) {
            $http.defaults.headers.common[customAuthHeader.name] = customAuthHeader.template.replace('{{token}}', localStorage.userToken);
          } else {
            $http.defaults.headers.common.Authorization = 'Basic ' + localStorage.userToken;
          }
        }
      });

      if (ngAdminJWTAuthConfigurator.getCheckEveryResponseForAuthHeader()) {
        Restangular.addResponseInterceptor(function (data, operation, what, url, response) {
          if (ngAdminJWTAuthService.isAuthenticated()) {
            var token;
            var customAuthHeader = ngAdminJWTAuthConfigurator.getCustomAuthHeader();
            if (customAuthHeader && response.headers(customAuthHeader.name)) {
              token = response.headers(customAuthHeader.name);
              token = token.replace(customAuthHeader.template.replace('{{token}}', ''), '');
            } else if (response.headers('Authorization')) {
              token = response.headers('Authorization');
              token = token.replace('Basic ', '');
            }
            if (token) {
              localStorage.userToken = token;
            }
          }
          return data;
        });
      }

    }]);


    ngAdminJWTAuth.controller('loginController', require('./loginController'));
    ngAdminJWTAuth.controller('logoutController', require('./logoutController'));

    ngAdminJWTAuth.provider('ngAdminJWTAuthConfigurator', require('./configuratorProvider'));

    ngAdminJWTAuth.service('ngAdminJWTAuthService', require('./authService'));

  }, {
    "./authService": 1,
    "./configuratorProvider": 2,
    "./loginController": 3,
    "./loginTemplate": 4,
    "./logoutController": 5
  }], 7: [function (require, module, exports) {
    !function () {
      angular.module("angular-jwt", ["angular-jwt.interceptor", "angular-jwt.jwt"]), angular.module("angular-jwt.interceptor", []).provider("jwtInterceptor", function () {
        this.urlParam = null, this.authHeader = "Authorization", this.authPrefix = "Bearer ", this.tokenGetter = function () {
          return null
        };
        var e = this;
        this.$get = ["$q", "$injector", "$rootScope", function (r, t, a) {
          return {
            request: function (a) {
              if (a.skipAuthorization) return a;
              if (e.urlParam) {
                if (a.params = a.params || {}, a.params[e.urlParam]) return a
              } else if (a.headers = a.headers || {}, a.headers[e.authHeader]) return a;
              var n = r.when(t.invoke(e.tokenGetter, this, {config: a}));
              return n.then(function (r) {
                return r && (e.urlParam ? a.params[e.urlParam] = r : a.headers[e.authHeader] = e.authPrefix + r), a
              })
            }, responseError: function (e) {
              return 401 === e.status && a.$broadcast("unauthenticated", e), r.reject(e)
            }
          }
        }]
      }), angular.module("angular-jwt.jwt", []).service("jwtHelper", function () {
        this.urlBase64Decode = function (e) {
          var r = e.replace(/-/g, "+").replace(/_/g, "/");
          switch (r.length % 4) {
            case 0:
              break;
            case 2:
              r += "==";
              break;
            case 3:
              r += "=";
              break;
            default:
              throw"Illegal base64url string!"
          }
          return decodeURIComponent(escape(window.atob(r)))
        }, this.decodeToken = function (e) {
          var r = e.split(".");
          if (3 !== r.length) throw new Error("JWT must have 3 parts");
          var t = this.urlBase64Decode(r[1]);
          if (!t) throw new Error("Cannot decode the token");
          return JSON.parse(t)
        }, this.getTokenExpirationDate = function (e) {
          var r;
          if (r = this.decodeToken(e), "undefined" == typeof r.exp) return null;
          var t = new Date(0);
          return t.setUTCSeconds(r.exp), t
        }, this.isTokenExpired = function (e, r) {
          var t = this.getTokenExpirationDate(e);
          return r = r || 0, null === t ? !1 : !(t.valueOf() > (new Date).valueOf() + 1e3 * r)
        }
      })
    }();
  }, {}]
}, {}, [7, 1, 2, 3, 4, 5, 6]);