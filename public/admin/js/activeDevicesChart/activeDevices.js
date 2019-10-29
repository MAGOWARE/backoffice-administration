import Template from './activeDevicesChart.html'

export default function($stateProvider) {
    $stateProvider.state('reports/active_devices', {
        parent: 'main',
        url: '/activeDevicesChart',
        params: {},

        controller: function(Restangular, $scope, VisDataSet, notification) {

            $scope.options = {
                style: 'bar',
                barChart: { width: 50, align: 'center' }, // align: left, center, right
                drawPoints: false,
                dataAxis: {
                    icons: true
                },
                orientation: 'top',
                start:  new Date().setDate(
                    new Date('1/1/2019').getDate() - 240
                ),
            };

            Restangular.all('reports/active_devices')
                .getList()
                .then(function(response) {
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
                        // start: new Date('1/1/2019').getDate() + 180,
                        start:  new Date().setDate(
                            new Date('1/1/2019').getDate() - 240
                        ),
                        end: new Date().setDate(
                            new Date(res[res.length - 1].date).getDate() + 185
                        ),
                        zoomable: false
                    };
                    const mapData = (items, id) => {
                        return items.map(item => {
                            if(item.appid === id) {
                                return {
                                    x: new Date(item.date).setDate(1),
                                    y: item.total
                                }
                            }
                            else return {x: 0, y: 0}
                        })
                    };
                    $scope.active_devices_chart_1 = {
                        items: mapData(res, 1)
                    };
                    $scope.active_devices_chart_2 = {
                        items: mapData(res, 2)
                    };
                    $scope.active_devices_chart_3 = {
                        items: mapData(res, 3)
                    };
                    $scope.active_devices_chart_4 = {
                        items: mapData(res, 4)
                    };
                })
                .catch(err => {
                    winston.error("Failed to fetch data from endpoint /reports/active_devices, error: ", err);
                    notification.log(err, { addnCls: 'humane-flatty-error' });
                })
        },

        template: Template
    })
}
