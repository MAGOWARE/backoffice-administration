import Template from './expiration_graph.html'

export default function($stateProvider) {
  $stateProvider.state('reports/expiresubscription', {
    parent: 'main',
    url: '/expiresubscription',
    params: {},

    controller: function(Restangular, $scope, VisDataSet) {
      $scope.options = {
        style: 'bar',
        barChart: { width: 50, align: 'center' }, // align: left, center, right
        drawPoints: false,
        dataAxis: {
          icons: true
        },
        orientation: 'top',
        start: new Date()
      }

      Restangular.one('reports/expiresubscription')
          .get()
          .then(function successCallback(response) {
            if(response.data)
              var res = response.data;
            else
              var res = response;
            $scope.options = {
              style: 'bar',
              barChart: { width: 50, align: 'center' }, // align: left, center, right
              drawPoints: false,
              dataAxis: {
                icons: true
              },
              orientation: 'top',
              start: new Date(),
              end: new Date().setDate(
                  new Date(res[res.length - 1].to_date).getDate() + 185
              ),
              zoomable: false
            };
            const mapData = items => {
              return items.map(item => {
                return {
                  x: new Date(item.to_date).setDate(1),
                  y: item.total
                }
              })
            };
            $scope.sales_expiration_chart = {
              items: mapData(res)
            }
          })
    },

    template: Template
  })
}
