
/**
 * Module dependencies.
 */
var path = require('path'),
    db = require(path.resolve('./config/lib/sequelize')).models,
    policy = require('../policies/mago.server.policy'),
    commonCtrl = require(path.resolve('./modules/mago/server/controllers/common.controller')),
    dashboardController = require(path.resolve('./modules/mago/server/controllers/dashboard.server.controller')),
    reportsController = require(path.resolve('./modules/mago/server/controllers/reports.controller')),
    subImportController = require('../controllers/subtitles_import.server.controller');

var multiparty = require('connect-multiparty'),
    multipartyMiddleware = multiparty();


module.exports = function(app) {
    /* ====== for file upload ===== */
    app.route('/file-upload/single-file/:model/:field')
        .all(policy.Authenticate)
        .all(policy.isAllowed)
        .post(multipartyMiddleware, commonCtrl.upload_file);

    app.route('/file-upload/multi-file')
        .all(policy.Authenticate)
        .post(policy.isAllowed, multipartyMiddleware, commonCtrl.upload_multi_files);

    app.route('/api/subtitlesImport')
        .all(policy.Authenticate)
        .get(subImportController.list)
        .post(subImportController.create);

    app.route('/api/subtitlesImport/:id')
        .all(policy.Authenticate)
        .get(subImportController.read);

    /*========== chart ============ */
    app.route('/api/dash/chart/salesreports')
        .all(policy.Authenticate)
      .all(policy.isAllowed)
      .get(dashboardController.chartSalesReport);

    app.route('/api/dash/chart/subsactive')
        .all(policy.Authenticate)
      .all(policy.isAllowed)
      .get(dashboardController.chartsSubsActive);

    app.route('/api/dash/chart/subexpire')
        .all(policy.Authenticate)
      .all(policy.isAllowed)
      .get(dashboardController.chartsSubsExpires);




    /* ===== Reports ===== */
    app.route('/api/reports/subscribers')
        .all(policy.Authenticate)
      .all(policy.isAllowed).get(reportsController.listOfSubscribers);
    app.route('/api/reports/sales')
        .all(policy.Authenticate)
      .all(policy.isAllowed).get(reportsController.listOfSales);
    app.route('/api/reports/expiring')
        .all(policy.Authenticate)
      .all(policy.isAllowed).get(reportsController.expiringNextWeek);
    app.route('/api/reports/product')
        .all(policy.Authenticate)
      .all(policy.isAllowed).get(reportsController.listSalesByProduct);
    app.route('/api/reports/previous_day_reports')
        .all(policy.Authenticate)
        .all(policy.isAllowed).get(reportsController.listPreviousDaySalesByProduct);
    app.route('/api/reports/month_sales')
        .all(policy.Authenticate)
        .all(policy.isAllowed).get(reportsController.listMonthSalesByProduct)
    app.route('/api/reports/lastmonth_sales')
        .all(policy.Authenticate)
        .all(policy.isAllowed).get(reportsController.listLastMonthSalesByProduct)
    app.route('/api/reports/eachmonth_sales')
        .all(policy.Authenticate)
        .all(policy.isAllowed).get(reportsController.listEachMonthSalesByMonth)
    app.route('/api/reports/last_year_sales')
        .all(policy.Authenticate)
        .all(policy.isAllowed).get(reportsController.listLastYearSales)
    app.route('/api/reports/each_day_sales')
        .all(policy.Authenticate)
        .all(policy.isAllowed).get(reportsController.listEachDaySales)
    app.route('/api/reports/active_devices')
        .all(policy.Authenticate)
        .all(policy.isAllowed).get(reportsController.activeDevices)
    app.route('/api/reports/each_day_sales')
        .all(policy.Authenticate)
        .all(policy.isAllowed).get(reportsController.listEachDaySales)
    app.route('/api/reports/expiresubscription')
        .all(policy.Authenticate)
        .all(policy.isAllowed).get(reportsController.listExpireSubcription)
    app.route('/api/reports/expiresubscriptionbyday')
        .all(policy.Authenticate)
        .all(policy.isAllowed).get(reportsController.listExpireSubcriptionByDay)
    app.route('/api/reports/lasttwoyearssales')
        .all(policy.Authenticate)
        .all(policy.isAllowed).get(reportsController.listLastTwoYearsSales)
};
