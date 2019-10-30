'use strict'
var myApp = angular.module('myApp', ['ng-admin','ng-admin.jwt-auth', 'ngVis', 'pascalprecht.translate', 'ngCookies','dndLists', 'vcRecaptcha']);

myApp.controller('envVariablesCtrl', ['$scope', '$http','notification', function ($scope, $http,notification) {
    var config = {method: 'GET', url: '../api/env_settings'};
    if(localStorage.userToken) config.headers = {'Authorization': localStorage.userToken};  //user token should be included as a header in this request
    $http(config).then(function(response) {
        $scope.version_number = "Version: "+response.data.backoffice_version;
        $scope.company_name = response.data.company_name;
        $scope.company_logo = response.data.company_logo;
    });

    $scope.googlelogin = function () {
        location.replace("/api/auth/google");
    };

    $scope.signUpFields = function () {
        angular.element( document.querySelector( '#loginView' ) ).removeClass('customVisible');
        angular.element( document.querySelector( '#loginView' ) ).addClass('customHidden');
        angular.element( document.querySelector( '#signUpView' ) ).removeClass('customHidden');
        angular.element( document.querySelector( '#signUpView' ) ).addClass('customVisible');
    };

    $scope.loginFields = function () {
        angular.element( document.querySelector( '#signUpView' ) ).removeClass('customVisible');
        angular.element( document.querySelector( '#loginView' ) ).removeClass('customHidden');
        angular.element( document.querySelector( '#signUpView' ) ).addClass('customHidden');
        angular.element( document.querySelector( '#loginView' ) ).addClass('customVisible');
    };

    //loginEmail
    $scope.loginEmail = function () {

        if ( !$scope.company_name ) {
            notification.log('Company Name should not be empty', { addnCls: 'humane-flatty-info' })
        }else if(!$scope.phone){
            notification.log('Phone Number should not be empty', { addnCls: 'humane-flatty-info' })
        }else if(!$scope.email_address){
            notification.log('Email Address should not be empty', { addnCls: 'humane-flatty-info' })
        }else{

            var postData = {
                "company_name": $scope.company_name,
                "email":  $scope.email_address,
                "telephone": $scope.phone
            };

            $http.post('../api/company', postData).then(function successCallback(response) {
                if (response.status === 200){
                    notification.log(response.data.message, { addnCls: 'humane-flatty-success' });

                    angular.element( document.querySelector( '#signUpView' ) ).removeClass('customVisible');
                    angular.element( document.querySelector( '#loginView' ) ).removeClass('customHidden');
                    angular.element( document.querySelector( '#signUpView' ) ).addClass('customHidden');
                    angular.element( document.querySelector( '#loginView' ) ).addClass('customVisible');
                }
            }, function errorCallback(response) {
                if (response.status === 400){
                    notification.log(response.data.message, { addnCls: 'humane-flatty-error' });
                } else {
                    notification.log(response.data.message, { addnCls: 'humane-flatty-error' });
                }
            });
        }
    };
    //./loginEmail
}]);

myApp.controller('main', function ($scope, $rootScope, $location, notification) {
    $rootScope.$on('$stateChangeSuccess', function () {
        $scope.displayBanner = $location.$$path === '/dashboard';
    });
});

myApp.controller('modalController', function($scope, $uibModal) {
    $scope.openModalImage = function (imageSrc, imageDescription, imageHeight, imageWidth) {
        $uibModal.open({
            templateUrl: "./templates/modalImage.html",
            windowClass: "image-modal",
            resolve: {
                imageSrcToUse: function () {
                    return imageSrc;
                },
                imageDescriptionToUse: function () {
                    return imageDescription;
                },
                imageHeight: function () {
                    return imageHeight;
                },
                imageWidth: function() {
                    return imageWidth;
                }
            },
            controller: [
                "$scope", "imageSrcToUse", "imageDescriptionToUse", "imageHeight", "imageWidth",
                function ($scope, imageSrcToUse, imageDescriptionToUse, imageHeight, imageWidth) {
                    $scope.ImageSrc = imageSrcToUse;
                    $scope.imageHeight = imageHeight;
                    $scope.imageWidth = imageWidth;
                    return $scope.ImageDescription = imageDescriptionToUse;
                }
            ]
        });
    };
})

myApp.controller('checkboxController', function($scope) {
    $scope.checkboxModel = {
        checkbox_value : $scope.entry.values.allow_guest_login //get value from read API, assign it to the checkbox
    };
    $scope.setValueForGuest = function(thevalue){
        $scope.entry.values.allow_guest_login = thevalue; //get checkbox value, assign it to the update API
    }
});

//subscription export
//Takes user details
myApp.controller('InvoiceCtrl', ['$scope', '$http','$stateParams', function ($scope, $http,$stateParams) {
    //takes id from url
    var currentID = $stateParams.id;
    $http.get('../api/invoice/?login_data_id='+currentID).then(function(response) {
        $scope.users = response.data;
    });
}]);
//Footer Button
myApp.controller('buttons', ['$scope', function ($scope) {
    $scope.printInfo = function() {
        window.print();
    };

    $scope.goBack = function() {
        window.history.back();
    };
}]);

myApp.config(function ($stateProvider) {
    $stateProvider.state('invoice', {
        url: '/invoice/:id',
        templateUrl: 'subscription_export.html'
    });
});
myApp.directive('showInvoice', ['$location', function ($location) {
    return {
        restrict: 'E',
        scope: { post: '&' },
        link: function (scope) {
            scope.send = function () {
                $location.path('/invoice/' + scope.post().values.id);
            };
        },
        template: '<a class="btn btn-default" ng-click="send()"><i class="fa fa-print fa-lg"></i>&nbsp;GENERATE INVOICE</a>'
    };
}]);
//./subscription export

//EPG LOGS
myApp.directive('seeLogs', ['$location','$http', function ($location,$http) {
    return {
        restrict: 'E',
        scope: {
            fromDirectiveFn: '=method',
            post: '&'
        },
        link: function(scope, elm, attrs) {

            scope.see = function () {
                var currentlog = scope.post().values.epg_file;
                scope.filenames = currentlog;
                scope.fromDirectiveFn(scope.filenames);
            };
        },
        template: '<ma-submit-button class="pull-right" ng-click="see()" label="Submit"></ma-submit-button>'
    };
}]);


myApp.controller("logsCtrl", ['$scope','$http', function($scope,$http) {
    $scope.ctrlFn = function(arg) {
        var Indata = {'epg_file': arg};
        $http.post("../api/epgimport", Indata).then(function (response,data, status, headers, config,file) {
            // alert("success");
            $scope.records = response.data;
            $scope.records1 = [
                "File Name",
                "Saved Records",
                "Non Saved Records",
                "Error Log"
            ];
        },function (data, status, headers, config) {
            winston.error("error");
        });
    };
}]);
//./EPG LOGS

//downloadInvoice

myApp.directive('downloadInvoice', ['$location','$http', function ($location,$http) {
    return {
        restrict: 'E',
        scope: { post: '&' },
        link: function (scope) {
            scope.sendsale = function () {
                var currentIDD = scope.post().values.id;
                $http.get('../api/invoice/download/'+ currentIDD, {responseType: 'blob'}).then(function(response) {
                    var data = response.data,
                        blob = new Blob([data], { type: 'application/pdf' });
                    var filename=response.headers('x-filename');
                    FileSaver.saveAs(blob, filename);
                });

            };
        },
        template: '<a class="btn btn-default btn-xs" ng-click="sendsale()"><i class="fa fa-print fa-lg"></i>&nbsp;Download</a>'
    };
}]);
//./downloadInvoice

//Drag_and_drop_package

myApp.directive('seeDrag', ['$location','$http', function ($location,$http) {
    return {
        restrict: 'E',
        scope: {
            fromDirectiveFn: '=method',
            post: '&'
        },
        link: function(scope, elm, attrs) {

            scope.see = function () {
                var package_name = scope.post().values.id;
                var package_type_id = scope.post().values.package_type_id;
                scope.fromDirectiveFn([package_name,package_type_id]);
            };
        },
        template: '<a type="buton" class="btn btn-default" ng-click="see()"><i class="fa fa-plus fa-lg"></i>&nbsp;&nbsp;ADD CHANNELS</a>'
    };
}]);


myApp.controller('dragdropctrl', ['$scope','$http','$stateParams','notification', function ($scope,$http,$stateParams,notification) {
    $scope.models = [
        {listName: "Available", items: [], dragging: false},
        {listName: "Selected", items: [], dragging: false}
    ];

    $scope.getSelectedItemsIncluding = function(list, item) {
        item.selected = true;
        return list.items.filter(function(item) { return item.selected; });
    };

    $scope.onDrop = function(list, items, index) {
        angular.forEach(items, function(item) { item.selected = false; });
        list.items = list.items.slice(0, index)
            .concat(items)
            .concat(list.items.slice(index));
        return true;
    };

    $scope.onMoved = function(list) {
        list.items = list.items.filter(function(item) { return !item.selected; });
    };

    $http.get('../api/channels').then(function(response) {

        $scope.array = response.data;
        var id_pakete = $stateParams.id;

        for(var j=0;j<$scope.array.length;j++){
            const index = $scope.array[j].packages_channels.findIndex(function (todo,index){
                return todo.package_id == id_pakete;
            })

            if(index > -1){
                var lista = $scope.models[1];
                lista.items.push({label:$scope.array[j].title,id:$scope.array[j].id,nr:$scope.array[j].channel_number});
            }else if(index <= -1){
                var lista1 = $scope.models[0];
                lista1.items.push({label:$scope.array[j].title,id:$scope.array[j].id,nr:$scope.array[j].channel_number});
            }

        }
    });

    $scope.ctrlFn = function(arg) {
        var name= arg[0];
        var id = arg[1];
        var selected = $scope.models[1].items;
        var channels_list = [];

        for (var k = 0; k < selected.length; k++) {
            channels_list.push(selected[k].id);
        }

        var data = {'package_id': name,'channel_id': channels_list};
        $http.post("../api/packagechannels", data).then(function (response,data, status, headers, config,file) {

            notification.log('Channels successfully added', { addnCls: 'humane-flatty-success' });

        },function (data, status, headers, config) {
            notification.log('Something Wrong', { addnCls: 'humane-flatty-error' });
        });
    };

}]);

//./Drag_and_drop_package

// Pagination & Sort
var apiFlavor = require('./api_flavor');
var FileSaver = require('./filesaver');
myApp.config(['RestangularProvider', apiFlavor.requestInterceptor]);

myApp.controller('username', ['$scope', '$window', function($scope, $window) {
    $scope.username =  $window.localStorage.userName.toUpperCase();
}]);


var preferred_language = 'en';

myApp.controller('main', function ($scope, $rootScope, $location, notification) {
    $rootScope.$on('$stateChangeSuccess', function () {
        $scope.displayBanner = $location.$$path === '/dashboard';
    });
});

myApp.controller('expireGraphCtr', function ($scope, Restangular) {
    $scope.options = {
        drawPoints: {
            style: 'circle' // square, circle
        },
        shaded: {
            orientation: 'bottom' // top, bottom
        },
        dataAxis: {
            icons: true
        },
        orientation: 'top',
        start: new Date().toISOString(),
    };

    $scope.options2 = {
        drawPoints: {
            style: 'circle' // square, circle
        },
        shaded: {
            orientation: 'bottom' // top, bottom
        },
        dataAxis: {
            icons: true
        },
        orientation: 'top',
        start: new Date().toISOString(),
        zoomable: true
    };

    Restangular.one('reports/expiresubscription')
        .get()
        .then(function successCallback(response) {
            const res = response.data ? response.data : response;

            $scope.options = {
                drawPoints: {
                    style: 'circle' // square, circle
                },
                shaded: {
                    orientation: 'bottom' // top, bottom
                },
                dataAxis: {
                    icons: true
                },
                orientation: 'top',
                start: new Date().toISOString(),
                end: new Date().setDate(
                  new Date().getDate() + 31
                ),
                zoomable: false
            };
            const mapData = items => {
                return items.map(item => {
                    return {
                        x: new Date(item.to_date),
                        y: item.total
                    }
                })
            };
            $scope.data = {
                items: mapData(res)
            };
        });

    Restangular.one('reports/expiresubscriptionbyday')
        .get()
        .then(function successCallback(response) {
            const res = response.data ? response.data : response;

            $scope.options2 = {
                drawPoints: {
                    style: 'circle' // square, circle
                },
                shaded: {
                    orientation: 'bottom' // top, bottom
                },
                dataAxis: {
                    icons: true
                },
                orientation: 'top',
                start: res.length !== 0 ? res[0].date : new Date().toISOString(),
                end: res.length !== 0 ? res[res.length - 1].date : new Date().setDate(
                  new Date().getDate() + 31
                ),
                zoomable: true
            };

            const mapData = items => {
                return items.map(item => {
                    return {
                        x: item.to_date,
                        y: item.total,
                    }
                })
            };
            $scope.data2 = {
                items: mapData(res),
            }
        });

    Restangular.one('reports/lasttwoyearssales')
        .get()
        .then(function successCallback(response) {
            const res = response.data ? response.data : response;

            $scope.options3 = {
                drawPoints: {
                    style: 'circle' // square, circle
                },
                shaded: {
                    orientation: 'bottom' // top, bottom
                },
                dataAxis: {
                    icons: true
                },
                orientation: 'top',
                start: res.length !== 0 ? res[0].date : new Date().toISOString(),
                end: res.length !== 0 ? res[res.length - 1].date : new Date().setDate(
                  new Date().getDate() + 31
                ),
                zoomable: false
            };

            const mapData = items => {
                return items.map(item => {
                    return {
                        x: new Date(item.date),
                        y: item.total,
                        group: 2
                    }
                })
            };
            $scope.data3 = {
                items: mapData(res),
            }
        })
});

myApp.controller('languageCtrl', ['$translate', '$scope','$cookies', function ($translate, $scope,$cookies) {
    $scope.serve_language = function (langKey) {
        $translate.use(langKey);
        preferred_language = langKey;
    };
    $translate('HEADLINE').then(function (headline) {
        $scope.headline = headline;
    }, function (translationId) {
        $scope.headline = translationId;
    });

    //show the selected language from dropdown list
    $scope.button = $cookies.get('cookie');
    $scope.change = function(name){
        // Find tomorrow's date.
        var expireDate = new Date();
        expireDate.setDate(expireDate.getDate() + 364);
        $cookies.put('cookie',name,{'expires': expireDate});
        $scope.button = name;
    }
}]);

myApp.config(['$translateProvider', function ($translateProvider) {
    $translateProvider.useStaticFilesLoader({
        files: [
            {
                prefix: '../admin/languages/',
                suffix: '.json'
            }, {
                prefix: '../admin/languages/',
                suffix: '.json'
            }
        ]
    });
    $translateProvider.preferredLanguage(preferred_language);
    $translateProvider.useCookieStorage(); //remember chosen language
}]);



// Forgot Password Controller

myApp.controller('main', ['Restangular', '$scope', '$uibModal','notification', function(Restangular, $scope, $uibModal,notification) {

        $scope.modal = function () {
            var modalInstance = $uibModal.open({
                template: '<div class="modal-header">'+
                           '<h5 class="modal-title">Forgot Password</h5>'+
                            '</div>'+
                                '<div class="container modal-body">'+
                                    '<form>'+
                                        '<div class="form-group col-xs-9">'+
                                            '<label for="exampleInputEmail1">Username</label>'+
                                            '<hr>'+
                                            '<input type="input" class="form-control" ng-model="forgot.username" value="forgot.username" id="exampleInputEmail1" aria-describedby="emailHelp" placeholder="Enter username">'+
                                            '<hr><br>'+
                                            '<label for="exampleInputEmail1">or Email</label>'+
                                            '<hr>'+
                                            '<input type="input" class="form-control" ng-model="forgot.email" value="forgot.email" id="exampleInputEmail1" aria-describedby="emailHelp" placeholder="Enter email">'+
                                        '</div>'+
                                    '</form>'+
                                '</div>'+
                            '<div class="modal-footer">'+
                                '<button class="btn btn-primary" type="button" ng-click="ok()">Submit</button>'+
                                '<button class="btn btn-warning" type="button" ng-click="cancel()">Cancel</button>'+
                            '</div>',
                controller: ('main', ['$scope', '$uibModalInstance', 'confirmClick', 'confirmMessge',
                    function ($scope, $uibModalInstance, confirmClick, confirmMessge) {
                        $scope.confirmMessage = confirmMessge;
                        function closeModal() {
                            $uibModalInstance.dismiss('cancel');
                        }
                        $scope.ok = function () {
                            closeModal();
                            Restangular.one('auth/forgot').customPOST($scope.forgot).then(function successCallback(response) {
                                var reset_message = (response.message) ? response.message : response.data.message;
                                notification.log(reset_message, { addnCls: 'humane-flatty-success' });
                            }, function errorCallback(response) {
                                notification.log(response.message, { addnCls: 'humane-flatty-error' });
                            });
                        }
                        $scope.cancel = function () {
                            closeModal();
                        }

                    }]),
                size: 'lg',
                windowClass: 'confirm-window',
                resolve: {
                    confirmClick: function () {
                        return $scope.ngConfirm;
                    },
                    confirmMessge: function () {
                        return $scope.ngConfirmMessage;
                    }
                }
            });
        }
}])

// Login Controller

myApp.config(['NgAdminConfigurationProvider', 'RestangularProvider', 'ngAdminJWTAuthConfiguratorProvider', function (NgAdminConfigurationProvider, RestangularProvider, ngAdminJWTAuthConfigurator) {

    var nga = NgAdminConfigurationProvider;

    if (location.protocol == 'http:') {

    	ngAdminJWTAuthConfigurator.setJWTAuthURL('http://' + location.host + '/api/auth/login');

    } else {

    	ngAdminJWTAuthConfigurator.setJWTAuthURL('https://' + location.host + '/api/auth/login');

    }

    ngAdminJWTAuthConfigurator.setCustomLoginTemplate('customLoginTemplate.html');

    ngAdminJWTAuthConfigurator.setCustomAuthHeader({
        name: 'Authorization',
        template: '{{token}}'
    });

}]);

myApp.run(['Restangular', '$location', 'notification', function(Restangular, $location, notification) {
    Restangular.setErrorInterceptor(function(response, deferred, responseHandler) {
        if(response.status > 200 && response.status !== 402) {

                deferred.reject("Server not responding to [some address]. It could be down, or this could be the wrong url.");
                notification.log('Error: ' + ' ( ' + response.data.message + ' )', { addnCls: 'humane-flatty-error' })

            return false;

        }else if(response.status === 402){
            //if payment is required , show message then do logout (included logout trick by js)
            notification.log(response.statusText ,{ addnCls: 'humane-flatty-error' } );
            setInterval(function() {
                localStorage.clear();
                location.reload();
            }, 5000);
        }

    });
}]);


// Dashboard Directives
myApp.directive('dashboardSummary', require('./dashboard/dashboardSummary'));
myApp.directive('resellersdashboardSummary', require('./dashboard/dashboard_for_resellers/resellers_dashboardSummary'));
myApp.directive('graph', require('./dashboard/graphs'));
myApp.directive('activeDevicesChart', require('./activeDevicesChart/activeDevices'));
myApp.directive('sendpush', require('./smsbatch/sendpush'));
myApp.directive('sale', require('./smsbatch/sale'));
myApp.directive('vod', require('./smsbatch/vod'));
myApp.directive('move', require('./smsbatch/move'));
myApp.directive('generate', require('./smsbatch/generate'));
myApp.directive('roles', require('./smsbatch/user_roles_button'));
myApp.directive('allowMenu', require('./groups/allowMenu'));
myApp.directive('invite', require('./smsbatch/invite'));
myApp.directive('approveInvitation', require('./smsbatch/approveInvitation'));
myApp.directive('importchannelLogs', require('./import_channels_csv_m3u/see_logs_import_channel'));
myApp.directive('importvodLogs', require('./import_vod_csv/see_logs_import_vod'));
myApp.directive('expiration_graphs', require('./sales_by_expiration/expiration_graph.html'));

//myApp.directive('roles', require('./grouprights/radioRoles'));


// personal config
myApp.config(['$stateProvider', require('./personal-details/user-details')]);
myApp.config(['$stateProvider', require('./geoip/geoip')]);
myApp.config(['$stateProvider', require('./support/support')]);
myApp.config(['$stateProvider', require('./serverStatus/serverStatus')]);
myApp.config(['$stateProvider', require('./change-pass/change-password')]);
myApp.config(['$stateProvider', require('./epgData/epgchart')]);
myApp.config(['$stateProvider', require('./activeDevicesChart/activeDevices')]);
myApp.config(['$stateProvider', require('./sales_by_expiration/salesByExpiration')]);
myApp.config(['$stateProvider', require('./advanced_settings/advancedSettings')]);

myApp.config(['NgAdminConfigurationProvider', function (nga) {

	if (location.protocol == 'http:') {
		var admin = nga.application('MAGOWARE').baseApiUrl('http://' + location.host + '/api/');
	} else {
		var admin = nga.application('MAGOWARE').baseApiUrl('https://' + location.host + '/api/');
	}

    // Table Configuration

    admin.addEntity(nga.entity('Channels'));
    admin.addEntity(nga.entity('ChannelStreams'));
    admin.addEntity(nga.entity('ChannelStreamSources'));
    admin.addEntity(nga.entity('Combos'));
    admin.addEntity(nga.entity('comboPackages'));
    admin.addEntity(nga.entity('CustomerData'));
    admin.addEntity(nga.entity('CustomerGroups'));
    admin.addEntity(nga.entity('DeviceMenus'));
    admin.addEntity(nga.entity('SystemMenu'));
    admin.addEntity(nga.entity('Devices'));
    admin.addEntity(nga.entity('EpgData'));
    admin.addEntity(nga.entity('epgimport'));
    admin.addEntity(nga.entity('mychannels'));
    admin.addEntity(nga.entity('Genres'));
    admin.addEntity(nga.entity('LoginData'));
    admin.addEntity(nga.entity('CustomerAccount'));
    admin.addEntity(nga.entity('Packages'));
    admin.addEntity(nga.entity('livepackages'));
    admin.addEntity(nga.entity('packagechannels'));
    admin.addEntity(nga.entity('vodPackages'));
    admin.addEntity(nga.entity('package_vod'));
    admin.addEntity(nga.entity('packagetypes'));
    admin.addEntity(nga.entity('Salesreports'));
    admin.addEntity(nga.entity('sales_by_product'));
    admin.addEntity(nga.entity('sales_by_date'));
    admin.addEntity(nga.entity('sales_by_month'));
    admin.addEntity(nga.entity('sales_monthly_expiration'));
    admin.addEntity(nga.entity('sales_by_expiration'));
    admin.addEntity(nga.entity('company_settings'));
    admin.addEntity(nga.entity('company_settings_list_company_data'));
    admin.addEntity(nga.entity('Settings'));
    admin.addEntity(nga.entity('EmailSettings'));
    admin.addEntity(nga.entity('URL'));
    admin.addEntity(nga.entity('ApiKeys'));
    admin.addEntity(nga.entity('ImagesSettings'));
    admin.addEntity(nga.entity('PlayerSettings'));
    admin.addEntity(nga.entity('Subscriptions'));
    admin.addEntity(nga.entity('Users'));
    admin.addEntity(nga.entity('Groups'));
    admin.addEntity(nga.entity('Grouprights'));
    admin.addEntity(nga.entity('Vods'));
    admin.addEntity(nga.entity('appmanagement'));
    admin.addEntity(nga.entity('messages'));
    admin.addEntity(nga.entity('commands'));
    admin.addEntity(nga.entity('ads'));
    admin.addEntity(nga.entity('logs'));
    admin.addEntity(nga.entity('activity'));
    admin.addEntity(nga.entity('appgroup'));
    admin.addEntity(nga.entity('VodCategories'));
    admin.addEntity(nga.entity('vodstreams'));
    admin.addEntity(nga.entity('VodStreamSources'));
    admin.addEntity(nga.entity('vodsubtitles'));
    admin.addEntity(nga.entity('PaymentTransactions'));
    admin.addEntity(nga.entity('EmailTemplate'));
    admin.addEntity(nga.entity('NewCustomer'));
    admin.addEntity(nga.entity('MySubscription'));
    admin.addEntity(nga.entity('MySales'));
    admin.addEntity(nga.entity('search_customer'));
    // admin.addEntity(nga.entity('AdvancedSettings'));
    admin.addEntity(nga.entity('Submenu'));
    admin.addEntity(nga.entity('VodEpisode'));
    admin.addEntity(nga.entity('tv_episode_subtitles'));
    admin.addEntity(nga.entity('tv_episode_stream'));
    admin.addEntity(nga.entity('ResellersLoginData'));
    admin.addEntity(nga.entity('ResellersUsers'));
    admin.addEntity(nga.entity('Series'));
    admin.addEntity(nga.entity('Season'));
    admin.addEntity(nga.entity('vodMenu'));
    admin.addEntity(nga.entity('vodMenuCarousel'));
    admin.addEntity(nga.entity('htmlContent'));
    admin.addEntity(nga.entity('tmdbvods'));
    admin.addEntity(nga.entity('tmdbseries'));
    admin.addEntity(nga.entity('import_channel'));
    admin.addEntity(nga.entity('import_vod'));
    admin.addEntity(nga.entity('subtitlesImport'));
    admin.addEntity(nga.entity('reports/expiresubscription'));

    admin.addEntity(nga.entity('assetsMaster'));
    admin.addEntity(nga.entity('assetsCategory'));
    admin.addEntity(nga.entity('assetsDetails'));


    //Config
    require('./hospitality/assetsDetails/config')(nga, admin);
    require('./hospitality/assetsCategory/config')(nga, admin);
    require('./hospitality/assetsMaster/config')(nga, admin);
    require('./import_channels_csv_m3u/config')(nga, admin);
    require('./import_vod_csv/config')(nga, admin);
    require('./tmdb_import/config')(nga, admin);
    require('./tmdb_import_tvseries/config')(nga, admin);
    require('./htmlContent/config')(nga, admin);
    require('./vodMenuCarousel/config')(nga, admin);
    require('./vodmenu/config')(nga, admin);
    require('./Season/config')(nga, admin);
    require('./Series/config')(nga, admin);
    require('./resellers_user/config')(nga, admin);
    require('./Resellers_loginData/config')(nga, admin);
    require('./VodEpisode/config')(nga, admin);
    require('./tv_episode_subtitles/config')(nga, admin);
    require('./tv_episode_stream/config')(nga, admin);
    require('./Submenu/config')(nga, admin);
    // require('./AdvancedSettings/config')(nga, admin);
    require('./company_settings/config')(nga, admin);
    require('./company_settings_data/config')(nga, admin);
    require('./settings/PlayerSettings/config')(nga, admin);
    require('./settings/ImagesSettings/config')(nga, admin);
    require('./settings/ApiKeys/config')(nga, admin);
    require('./settings/URL/config')(nga, admin);
    require('./settings/EmailSettings/config')(nga, admin);
    require('./search_customers_resellers/config')(nga, admin);
    require('./mysubscription_resellers/config')(nga, admin);
    require('./emailTemplate/config')(nga, admin);
    require('./new_customer_resellers/config')(nga, admin);
    require('./mysales_resellers/config')(nga, admin);
    require('./channels/config')(nga, admin);
    require('./channelStream/config')(nga, admin);
    require('./channelStreamSource/config')(nga, admin);
    require('./combo/config')(nga, admin);
    require('./comboPackages/config')(nga, admin);
    require('./customerData/config')(nga, admin);
    require('./customerGroup/config')(nga, admin);
    require('./deviceMenu/config')(nga, admin);
    require('./systemmenu/config')(nga, admin);
    require('./devices/config')(nga, admin);
    require('./epgData/config')(nga, admin);
    require('./epgimport/config')(nga, admin);
    require('./genre/config')(nga, admin);
    require('./loginData/config')(nga, admin);
    require('./CustomerAccount/config')(nga, admin);
    require('./livepackages/config')(nga, admin);
    require('./package/config')(nga, admin);
    require('./vod_package/config')(nga, admin);
    require('./my_channel/config')(nga, admin);
    require('./packagesChannels/config')(nga, admin);
    require('./packageType/config')(nga, admin);
    require('./salesreport/config')(nga, admin);
    require('./sales_by_product/config')(nga, admin);
    require('./sales_by_date/config')(nga, admin);
    require('./sales_by_month/config')(nga, admin);
    require('./sales_monthly_expiration/config')(nga, admin);
    require('./sales_by_expiration/config')(nga, admin);
    require('./settings/config')(nga, admin);
    require('./subscription/config')(nga, admin);
    require('./user/config')(nga, admin);
    require('./groups/config')(nga, admin);
    require('./grouprights/config')(nga, admin);
    require('./app_management/config')(nga, admin);
    require('./message/config')(nga, admin);
    require('./commands/config')(nga, admin);
    require('./ads/config')(nga, admin);
    require('./logs/config')(nga, admin);
    require('./activit/config')(nga, admin);
    require('./appgroup/config')(nga, admin);
    require('./vod/config')(nga, admin);
    require('./vodCategory/config')(nga, admin);
    require('./vodStream/config')(nga, admin);
    require('./vodStreamSource/config')(nga, admin);
    require('./vodSubtitles/config')(nga, admin);
    require('./subtitlesImport/config')(nga, admin);
    require('./paymentTransactions/config')(nga, admin);


    // Menu / Header / Dashboard / Layout

    if(localStorage.userRole==='resellers'){
        admin.dashboard(require('./dashboard/dashboard_for_resellers/config')(nga, admin));
    }else{
        admin.dashboard(require('./dashboard/config')(nga, admin));
    }

    admin.header(require('./header.html'));

    var menu  = localStorage.getItem("menuObject");

    if ( !menu ){
        var menujson = require('./menuobject.js');
    } else {
        var obj = JSON.parse(menu);
        menujson = obj
    }

    // var menujson = require('./menuobject.js');
    admin.menu(require('./dynamicmenu')(nga, admin,menujson));

    nga.configure(admin);
}]);