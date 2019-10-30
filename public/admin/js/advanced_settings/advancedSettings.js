import Template from './advancedSettings.html';

function advancedsettings($stateProvider) {
  $stateProvider.state('advancedSettings', {
    parent: 'main',
    url: '/AdvancedSettings',
    headers: {
      "Content-Type": "application/json;charset=UTF-8"
    },
    controller: ['$http', '$scope', 'notification', function ($http, $scope, notification) {
      const token = localStorage.userToken || "";
      const getConfig = {
        method: 'GET',
        url: '../api/AdvancedSettings',
        headers: {'Authorization': token}
      };


      $http(getConfig).then(function successCallback(response) {
        if (response.status === 200) {
          $scope.advanced_settings = {
            akamai: response.data.data.akamai,
            auth: response.data.data.auth,
            flussonic: response.data.data.flussonic,
            nimble_drm: response.data.data.nimble_drm,
            nimble_token: response.data.data.nimble_token,
            stripe: response.data.data.stripe,
            verizon: response.data.data.verizon,
            vod: response.data.data.vod,
            paypal: response.data.data.paypal,
            wowza: response.data.data.wowza,
            woocomerce: response.data.data.woocomerce,
          };

          console.log($scope.advanced_settings)

        }
      }, function errorCallback(response) {
        if (response.status === 400) {
          notification.log(response.data.message, {addnCls: 'humane-flatty-error'});
        } else {
          notification.log(response.data.message, {addnCls: 'humane-flatty-error'});
        }
      });

      $scope.updateAdvancedSettings = function () {
        const config = {
          method: 'PUT',
          url: '../api/AdvancedSettings',
          headers: {'Authorization': token},
          data: $scope.advanced_settings
        };
        $http(config).then(function successCallback(response) {
          if (response.status === 200) {
            notification.log('Update Successfully', {addnCls: 'humane-flatty-success'});
          }
        }, function errorCallback(response) {
          if (response.status === 400) {
            notification.log(response.data.message, {addnCls: 'humane-flatty-error'});
          } else {
            notification.log(response.data.message, {addnCls: 'humane-flatty-error'});
          }
        });
      }
    }],
    template: Template
  });
}

advancedsettings.$inject = ['$stateProvider'];

export default advancedsettings;