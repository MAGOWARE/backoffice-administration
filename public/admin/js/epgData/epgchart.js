import Template from './epgchart.html'

export default function($stateProvider) {
  $stateProvider.state('epgdata_chart', {
    parent: 'main',
    url: '/epggraph',
    params: {},

    //controller: ['Restangular', '$scope', 'notification', (Restangular, $scope, notification) => {

    controller: function(Restangular, $scope, VisDataSet) {
      $scope.events = {
        //rangechange: $scope.onRangeChange,
        //rangechanged: $scope.onRangeChanged,
        //onload: $scope.onLoaded,
        select: $scope.onSelect,
        click: $scope.onClick
        //doubleClick: $scope.onDoubleClick,
        //contextmenu: $scope.rightClick
      }

      $scope.onSelect = function(items) {
        // debugger;
        winston.info('onselect: ', items)
      }

      $scope.onClick = function(items) {
        //debugger;
        winston.info('click: ', items)
      }

      $scope.dragEnd = function(items) {
        //debugger;
        winston.info('drag end: ', items)
      }

      $scope.onRangeChange = function(items) {
        //debugger;
        winston.info('enter onrangechange: ', items)
      }

      $scope.options = {
        stack: false,
        start: new Date(),
        end: new Date(1000 * 60 * 60 * 24 + new Date().valueOf()),
        editable: true,
        orientation: 'top',

        // right order
        groupOrder: function(a, b) {
          return a.value - b.value
        }
      }

      $scope.events = {
        //rangechange: $scope.onRangeChange,
        //rangechanged: $scope.onRangeChanged,
        //onload: $scope.onLoaded,
        select: $scope.onSelect,
        click: $scope.onClick,
        dragEnd: $scope.dragEnd
        //doubleClick: $scope.onDoubleClick,
        //contextmenu: $scope.rightClick
      }

      Restangular.one('epgdata_chart')
        .get()
        .then(
          function successCallback(response) {
            $scope.data_timeline = {
              items: response.data ? response.data.items : response.items,
              groups: response.data ? response.data.groups : response.groups
            }
          },
          function errorCallback(response) {}
        )
    },

    template: Template
  })
}
