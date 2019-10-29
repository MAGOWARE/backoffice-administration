var path = require('path'),
    crypto = require("crypto"),
    sequelize_t = require(path.resolve('./config/lib/sequelize')),
    db = require(path.resolve('./config/lib/sequelize')).models,
    subscription = db.subscription,
    dateFormat = require('dateformat'),
    moment = require('moment'),
    response = require(path.resolve("./config/responses.js")),
    winston = require(path.resolve('./config/lib/winston'));


function add_subscription(req, res, login_id, combo_id, username){
    db.combo.findAll({
        attributes: ['id', 'duration'],where: {id: combo_id},
        include:[{
            model: db.combo_packages, required: true, attributes: ['package_id'], include: [{
                model: db.package, required: true, attributes: ['id'], include: [{
                    model: db.subscription, required: false, attributes: ['start_date', 'end_date'], where: {login_id: login_id}
                }]
            }]
        }]
    }).then(function(current_subscription){
        if(current_subscription.length < 1){
            var clear_response = new response.APPLICATION_RESPONSE(req.body.language, 200, 1, 'OK_DESCRIPTION', 'OK_DATA');
            clear_response.extra_data = "This product is empty";
            res.send(clear_response);
        }
        else{
            for(var i = 0; i<current_subscription.length; i++){
                if(current_subscription[0].combo_packages[0].package.subscriptions[0]){
                    var startdate = current_subscription[0].combo_packages[0].package.subscriptions[0].start_date;
                    var enddate = moment(current_subscription[0].combo_packages[0].package.subscriptions[0].end_date, 'YYYY-MM-DD hh:mm:ss').add(current_subscription[0].duration, 'day');
                }
                else{
                    var startdate = dateFormat(Date.now(), 'yyyy-mm-dd HH:MM:ss');
                    var enddate = dateFormat(Date.now() + current_subscription[0].duration*86400000, 'yyyy-mm-dd HH:MM:ss');
                }
                db.subscription.upsert({
                    login_id:            login_id,
                    package_id:          current_subscription[0].combo_packages[0].package_id,
                    customer_username:   username,
                    user_username:       '',
                    start_date:          startdate,
                    end_date:            enddate,
                    company_id:          current_subscription.company_id
                }).then(function(result){
                    db.salesreport.create({
                        user_id:            1,
                        combo_id:           combo_id,
                        login_data_id:      login_id,
                        user_username:      username,
                        distributorname:    '',
                        saledate:           dateFormat(Date.now(), 'yyyy-mm-dd HH:MM:ss'),
                        company_id:          current_subscription.company_id
                    }).then(function(result){
                        var clear_response = new response.APPLICATION_RESPONSE(req.body.language, 200, 1, 'OK_DESCRIPTION', 'OK_DATA');
                        res.send(clear_response);
                    }).catch(function(error){
                        winston.error("Error at creating sale report, error: ",error);
                    });
                    return null;
                }).catch(function(error){
                    winston.error("Error at upserting subscription, error: ",error);
                });
                return null;
            }
        }
    }).catch(function(error){
        winston.error("Error finding combo, error: ",error);
    });
}

//add subscription to user
exports.add_subscription_transaction = function(req,res,sale_or_refund,transaction_id,start_date,end_date) {

    // if product_id exists in param list search combo by product_id, else search by combo id
    var combo_where = {company_id: req.token.company_id, isavailable: true}; //query parameter
    if(req.body.product_id) {
        combo_where.product_id = req.body.product_id; //if product id is coming
    }
    else if(req.body.combo_id) {
        combo_where.id = req.body.combo_id //if combo id is coming
    }
    else if(req.body.product_name){
        combo_where.name = req.body.product_name //if product name is coming
    }
    else {
        return {status: false, message: 'Product identification parameters missing'};
    }

    var transactions_array = [];

    if(!sale_or_refund) sale_or_refund = 1;
    if(!transaction_id) transaction_id = "mago-" + Date.now();
    if(typeof start_date == 'undefined') start_date = Date.now(); //
    if(typeof end_date == 'undefined') end_date = false; //

    // Loading Combo with All its packages
    return db.combo.findOne({
        where: combo_where, include: [{model:db.combo_packages,include:[db.package]}]
    }).then(function(combo) {
        if (!combo)return {status: false, message: 'Product not found'}; //no combo found on database
        else {
            // Load Customer by LoginID
            return db.login_data.findOne({
                where: {
                        $or: {
                            username: req.body.username,
                            id: req.body.login_data_id
                        }
                }, include: [{model: db.customer_data}, {model: db.subscription}]
            }).then(function (loginData) {
                if (!loginData) return {status: false, message: 'Login data not found during subscription transaction'}; //no username found

                return sequelize_t.sequelize.transaction(function (t) {
                        combo.combo_packages.forEach(function (item, i, arr) {
                            var runningSub = hasPackage(item.package_id, loginData.subscriptions);
                            var startDate = new Date(start_date);

                            var sub = {
                                login_id: loginData.id,
                                package_id: item.package_id,
                                company_id: req.token.company_id,
                                customer_username: loginData.username,
                                user_username: req.token.username //live
                            };

                            if (typeof runningSub == 'undefined') {
                                sub.start_date = startDate;
                                if(end_date) {
                                    sub.end_date = end_date;
                                }
                                else {
                                    sub.end_date = addDays(sub.start_date, combo.duration * sale_or_refund);
                                }
                                transactions_array.push(
                                    db.subscription.create(sub, {transaction: t}) //add insert to transaction array
                                )
                            } else {

                                if(end_date) {  //if explicit end date
                                    runningSub.end_date = end_date;
                                }
                                else {
                                    if (runningSub.end_date > startDate) {
                                        runningSub.end_date = addDays(runningSub.end_date, combo.duration * sale_or_refund);
                                    } else {
                                        runningSub.start_date = startDate;
                                        runningSub.end_date = addDays(startDate, combo.duration * sale_or_refund);
                                    }
                                }

                                transactions_array.push(    //add update to transaction array
                                    db.subscription.update(runningSub.dataValues, {
                                        where: {id: runningSub.id},
                                        transaction: t
                                    })
                                );
                            }
                        });//end package loop

                        var salesreportdata = {
                            transaction_id: transaction_id,
                            user_id : req.token.id,
                            on_behalf_id: req.body.on_behalf_id,
                            distributorname: req.token.username,
                            //combo_id: req.body.product_id,
                            combo_id: combo.id,
                            login_data_id: loginData.id,
                            user_username: loginData.id,
                            saledate: Date.now(),
                            active:sale_or_refund,
                            company_id: req.token.company_id,
                            value: combo.value,
                            duration:combo.duration
                        };

                        if(sale_or_refund == 1) {
                             transactions_array.push(
                                 db.salesreport.create(salesreportdata, {transaction: t}) //add insert to transaction array
                             );
                         }
                        else {
                            salesreportdata.active = 0;
                            salesreportdata.cancelation_date = Date.now();
                            salesreportdata.cancelation_user = req.token.id;
                            salesreportdata.cancelation_reason = "api request";

                            transactions_array.push(
                                 db.salesreport.update(salesreportdata,
                                     {where: {transaction_id: transaction_id}
                                    , transaction: t}) //add insert to transaction array
                            );
                         }

                        return Promise.all(transactions_array, {transaction:t}); //execute transaction

                 }).then(function (result) {
                    return {status: true, transaction_id: transaction_id, message:'subscription transaction executed correctly'};
                 }).catch(function (err) {
                    winston.error('error executing subscription transaction: ',err);
                    return {status: false, message:'error executing subscription transaction'};
                 })
            });
        } //end if combo found
    });//end combo search

    function hasPackage(package_id,subscription){
        for(var i=0;i<subscription.length;i++)
            if(subscription[i].package_id == package_id)
                return subscription[i];
    }

    function addDays(startdate, duration) {
            var start_date_ts = moment(startdate, "YYYY-MM-DD hh:mm:ss").valueOf()/1000; //convert start date to timestamp in seconds
            var end_date_ts = start_date_ts + duration * 86400; //add duration in number of seconds
            var end_date =  moment.unix(end_date_ts).format("YYYY-MM-DD hh:mm:ss"); // convert enddate from timestamp to datetime
            return end_date;
    }
}

//saves movie in list of movies bought by this client
exports.buy_movie = function(req, res, username, vod_id, transaction_id) {

    let movie_purchase_data = []; //the records saved will be stored here
    const company_id = req.body.company_id;

    // search for the combo for transactional vod. if available, proceed
    return db.combo.findOne({
        attributes: ['id', 'duration'],
        where: {product_id: 'transactional_vod', isavailable: true, company_id: company_id}
    }).then(function(t_vod_combo) {
        if(typeof req.app.locals.backendsettings[company_id].t_vod_duration !== "number"){
            return {status: false, message:'buying movie failed. transactional vod not available', sale_data: []}; //the feature of transactional vod is not active
        }
        else{
            // find the id of the client. if successful, proceed saving the sale records
            return db.login_data.findOne({
                attributes: ['id'],
                where: {username: username, company_id: company_id}
            }).then(function (client) {
                if (!client) return {status: false, message: 'unable to find this client', sale_data: []}; //client not found

                return sequelize_t.sequelize.transaction(function (t) {
                    var t_vod_sales_data = {
                        vod_id: vod_id,
                        login_data_id: client.id,
                        start_time: Date.now(),
                        end_time: moment().add(t_vod_combo.duration, 'day'),
                        transaction_id: transaction_id,
                        company_id: company_id
                    };
                    var salesreport_data = {
                        transaction_id: transaction_id,
                        user_id: 1,
                        combo_id: t_vod_combo.id,
                        login_data_id: client.id,
                        user_username: username,
                        distributorname: '',
                        saledate: Date.now(),
                        company_id: company_id
                    };
                    movie_purchase_data.push(db.t_vod_sales.create(t_vod_sales_data, {transaction: t})); //insert subscription data in the final response
                    movie_purchase_data.push(db.salesreport.create(salesreport_data, {transaction: t})); //insert sale data in the final response

                    return Promise.all(movie_purchase_data, {transaction:t}); //execute transaction, return promise
                }).then(function (result) {
                    return {status: true, message:'subscription transaction executed correctly', sale_data: movie_purchase_data, };
                }).catch(function (error) {
                    winston.error("Buying this movie failed with error ", error);
                    return {status: false, message:'error executing transactional vod operation', sale_data: [] };
                });
            });
        }
    });
};

exports.add_subscription = add_subscription;
