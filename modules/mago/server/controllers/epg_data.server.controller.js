'use strict';

/**
 * Module dependencies.
 */
var path = require('path'),
    errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller')),
    fileHandler = require(path.resolve('./modules/mago/server/controllers/common.controller')),
    db = require(path.resolve('./config/lib/sequelize')),
    fastcsv = require('fast-csv'),
    xml2js = require('xml2js'),
    async = require('async'),
    fs = require('fs'),
    iconv = require('iconv-lite'),
    moment = require('moment'),
    dateFormat = require('dateformat'),
    DBChannels = db.models.channels,
    DBModel = db.models.epg_data,
    xmltv = require('xmltv'),
    winston = require(path.resolve('./config/lib/winston'));

var download = require('download-file');

/**
 * Create
 */
exports.create = function(req, res) {

    DBChannels.findOne({
        attributes: ['id'], where: {channel_number: req.body.channel_number, company_id: req.token.company_id}
    }).then(function(result) {

        if(result) {
            req.body.channels_id = result.id;
            req.body.company_id = req.token.company_id; //save record for this company
            DBModel.create(req.body).then(function(result) {
                if (!result) {
                    return res.status(400).send({message: 'fail create data'});
                } else {
                    return res.jsonp(result);
                }
            }).catch(function(err) {
                winston.error("Creating event failed with error: ", err);
                return res.status(400).send({
                    message: errorHandler.getErrorMessage(err)
                });
            });
        }
        else {
            return res.send({
                message: "Channel not found"
            });
        }
        return null;
    }).catch(function(err) {
        winston.error("Finding channel failed with error: ", err);
        return res.status(400).send({
            message: errorHandler.getErrorMessage(err)
        });
    });
};

/**
 * Create
 */
exports.epg_import = function(req, res) {

    var qwhere = {},
        final_where = {},
        query = req.query;

    if(query.q) {
        qwhere.$or = {};
        qwhere.$or.channel_number = {};
        qwhere.$or.channel_number.$like = '%'+query.q+'%';
        qwhere.$or.title = {};
        qwhere.$or.title.$like = '%'+query.q+'%';
        qwhere.$or.short_name = {};
        qwhere.$or.short_name.$like = '%'+query.q+'%';
        qwhere.$or.short_description = {};
        qwhere.$or.short_description.$like = '%'+query.q+'%';
        qwhere.$or.long_description = {};
        qwhere.$or.long_description.$like = '%'+query.q+'%';
    }


    //start building where
    final_where.where = qwhere;
    if(parseInt(query._start)) final_where.offset = parseInt(query._start);
    if(parseInt(query._end)) final_where.limit = parseInt(query._end)-parseInt(query._start);
    if(query._orderBy) final_where.order = query._orderBy + ' ' + query._orderDir;
    final_where.include = [];
    //end build final where

    final_where.where.company_id = req.token.company_id; //return only records for this company

    DBModel.findAndCountAll(
        final_where
    ).then(function(results) {
        if (!results) {
            return res.status(404).send({
                message: 'No data found'
            });
        } else {
            res.setHeader("X-Total-Count", results.count);
            res.json(results.rows);
        }
    }).catch(function(err) {
        winston.error("Getting event list failed with error: ", err);
        res.jsonp(err);
    });
};



/**
 * Show current
 */
exports.read = function(req, res) {
    if(req.epgData.company_id === req.token.company_id) res.json(req.epgData);
    else return res.status(404).send({message: 'No data with that identifier has been found'});
};

/**
 * Update
 */
exports.update = function(req, res) {
    var updateData = req.epgData;

    if(req.epgData.company_id === req.token.company_id){
        updateData.updateAttributes(req.body).then(function(result) {
            res.json(result);
        }).catch(function(err) {
            winston.error("Updating event failed with error: ", err);
            return res.status(400).send({
                message: errorHandler.getErrorMessage(err)
            });
        });
    }
    else{
        res.status(404).send({message: 'User not authorized to access these data'});
    }
};

/**
 * Delete
 */
exports.delete = function(req, res) {
    var deleteData = req.epgData;

    DBModel.findById(deleteData.id).then(function(result) {
        if (result) {
            if (result && (result.company_id === req.token.company_id)) {
                result.destroy().then(function() {
                    return res.json(result);
                }).catch(function(err) {
                    winston.error("Deleting event failed with error: ", err);
                    return res.status(400).send({
                        message: errorHandler.getErrorMessage(err)
                    });
                });
                return null;
            }
            else{
                return res.status(400).send({message: 'Unable to find the Data'});
            }
        } else {
            return res.status(400).send({
                message: 'Unable to find the Data'
            });
        }
        return null;
    }).catch(function(err) {
        winston.error("Finding event failed with error: ", err);
        return res.status(400).send({
            message: errorHandler.getErrorMessage(err)
        });
    });

};

/**
 * List
 */
exports.list = function(req, res) {

    var qwhere = {},
        final_where = {},
        query = req.query;

    if(query.q) {
        qwhere.$or = {};
        qwhere.$or.channel_number = {};
        qwhere.$or.channel_number.$like = '%'+query.q+'%';
        qwhere.$or.title = {};
        qwhere.$or.title.$like = '%'+query.q+'%';
        qwhere.$or.short_name = {};
        qwhere.$or.short_name.$like = '%'+query.q+'%';
        qwhere.$or.short_description = {};
        qwhere.$or.short_description.$like = '%'+query.q+'%';
        qwhere.$or.long_description = {};
        qwhere.$or.long_description.$like = '%'+query.q+'%';
    }

    if(query.title) qwhere.title = query.title;
    if(query.channel_number) qwhere.channel_number = query.channel_number;

    if(query.program_start && query.program_end) {
        // we have interval
        qwhere.program_start = {};
        qwhere.program_start.$gte = new Date(query.program_start);
        qwhere.program_end = {};
        qwhere.program_end.$lte = new Date(query.program_end);
    }
    else if(query.program_start) {
        qwhere.program_start = {};
        qwhere.program_start.$gte = new Date(query.program_start);
    }
    else if(query.program_end) {
        qwhere.program_end = {}
        qwhere.program_end.$lte = new Date(query.program_end);
    }

    //start building where
    final_where.where = qwhere;
    if(parseInt(query._start)) final_where.offset = parseInt(query._start);
    if(parseInt(query._end)) final_where.limit = parseInt(query._end)-parseInt(query._start);
    if(query._orderBy) final_where.order = query._orderBy + ' ' + query._orderDir;
    final_where.include = [];
    //end build final where

    final_where.where.company_id = req.token.company_id; //return only records for this company

    DBModel.findAndCountAll(
        final_where
    ).then(function(results) {
        if (!results) {
            return res.status(404).send({
                message: 'No data found'
            });
        } else {
            res.setHeader("X-Total-Count", results.count);
            res.json(results.rows);
        }
    }).catch(function(err) {
        winston.error("Getting event list failed with error: ", err);
        res.jsonp(err);
    });
};

exports.list_chart_epg = function(req, res) {

    //get EPG data from last 7 days
    var past = new Date();
    var future = new Date();
    past.setDate(past.getDate()-4);
    future.setDate(future.getDate()+7);

    DBChannels.findAll({
        attributes: ['id', ['channel_number', 'group'],
            //['title','content']
            [db.sequelize.fn("concat",db.sequelize.col('channel_number')," . ",db.sequelize.col('title')), 'content']
        ],
        where: {company_id: req.token.company_id, isavailable: true},
        order: [['channel_number', 'DESC']]
    }).then(function(channels){
        DBModel.findAll({
                attributes: ['id', ['channels_id', 'group'],['program_start','start'],['program_end','end'],['title','content']],
                //limit: 100,
                where: {program_start: {gte: past}, program_end :{lte: future}, company_id: req.token.company_id}
            }
        ).then(function(results) {
            if (!results) {
                return res.status(404).send({
                    message: 'No data found'
                });
            } else {
                res.json({groups:channels, items:results});
            }
        }).catch(function(err) {
            winston.error("Getting events for the chart failed with error: ", err);
            res.jsonp(err);
        });
    });
};

/**
 * middleware
 */
exports.dataByID = function(req, res, next, id) {

    if ((id % 1 === 0) === false) { //check if it's integer
        return res.status(404).send({
            message: 'Data is invalid'
        });
    }

    DBModel.find({
        where: {
            id: id
        },
        include: []
    }).then(function(result) {
        if (!result) {
            return res.send({
                message: 'No data with that identifier has been found'
            });
        } else {
            req.epgData = result;
            next();
            return null;
        }
    }).catch(function(err) {
        winston.error("Finding event failed with error: ", err);
        return next(err);
    });

};

exports.save_epg_records = function(req, res){
    var current_time = dateFormat(Date.now(), "yyyy-mm-dd HH:MM:ss");
    req.body.timezone = (req.body.timezone && (-12 < req.body.timezone < 12) ) ? req.body.timezone : 0; //valid timezone input or default timezone 0
    if(!req.body.encoding || ((['ascii', 'utf-8', 'ISO-8859-1'].indexOf(''+req.body.encoding+'') >= 0) === false) ) req.body.encoding = 'utf-8'; //valid encoding input or default encoding utf-8

    if(req.body.epg_url){
        //download epg to public/files/temp
        var origin_url = req.body.epg_url;
        var destination_path = "./public/files/temp/";
        var epg_filename = "epg"+Date.now() + origin_url.substring(origin_url.lastIndexOf("."), origin_url.length); //get name of new file

        var options = {
            directory: destination_path,
            filename: epg_filename
        }

        download(origin_url, options, function(err){
            if (err){
                winston.error("error donwloading? "+err);
            }
            else{
                if (req.body.epg_file) {
                    req.body.epg_file = req.body.epg_file+',/files/temp/'+epg_filename; //append filename to req.body.epg_file
                }
                else {
                    req.body.epg_file = '/files/temp/'+epg_filename; //append filename to req.body.epg_file
                }

                start_epg_import();
            }
        });
    }
    else{
        start_epg_import();
    }

    function start_epg_import(){
        if(req.body.delete_existing === true){
            DBModel.destroy({
                where: {company_id: req.token.company_id}
            }).then(function (result) {
                read_and_write_epg(current_time);
                return null;
            }).catch(function(error) {
                if(error.message.split(': ')[0] === 'ER_ROW_IS_REFERENCED_2') return res.status(400).send({message: 'Delete failed: At least one of these programs is scheduled'}); //referenced record cannot be deleted
                else{
                    winston.error("Deleting existing events failed with error: ", error);
                    return res.status(400).send({message: 'Unable to proceed with the action'}); //other error occurred
                }
            });
        }
        else{
            return read_and_write_epg(current_time);
        }
    }

    function read_and_write_epg(current_time){

        var import_log = []; // file_name saved_records non_saved_records error_log

        if (!req.body.epg_file) {
            //cannot import because no data avalable
            res.status(200).send({message: "Cannot import anything because no file specified"})
            return
        }

        var epg_files = req.body.epg_file.split(',');
        // console.log("Files " + epg_files.length)
        // console.log(req.body.epg_file);
        async.forEach(epg_files, function(epg_file, callback){
                if(fileHandler.get_extension(epg_file)=== '.csv'){
                    import_csv(req, res, current_time, epg_file, import_log, callback);
                }
                else if(fileHandler.get_extension(epg_file)=== '.xml'){
                    //import_xml_standard(req, res, current_time, epg_file, import_log, callback);
                    //import_xmltv(res,res,123456);
                    import_xmltv(req, res, current_time, epg_file, import_log, callback);
                }
                else {
                    winston.error('Incorrect file type for file ', epg_file)
                    callback(null);
                }
        },function(error, result){
            return res.status(200).send({message: import_log});
        });
    }

}

function import_csv(req, res, current_time, epg_file, import_log, callback){
    var channel_number_list = [];
    var data;
    var import_file_log = {
        file_name: epg_file,
        saved_records: 0,
        non_saved_records: 0,
        error_log: []
    };

    async.auto({
        //reads entire csv file. saves into channel_number_list only the number of those channels that are in the file and are not filtered out by the channel_number input
        get_channels: function(callback) {
            try{
                var channel_number_stream = fs.createReadStream(path.resolve('./public')+epg_file).pipe(iconv.decodeStream(req.body.encoding)); //link main url
            }
            catch(error){
                import_file_log.error_log.push("Could not read file "+epg_file);
                callback(true);
            }
            fastcsv.fromStream(channel_number_stream, {headers : true}, {ignoreEmpty: true}).validate(function(data){
                if(req.body.channel_number){
                    return data.channel_number == req.body.channel_number; //if a channel_number is specified, filter out other channels
                }
                else{
                    return data;
                }
            }).on("data", function(data){
                if(channel_number_list.indexOf(data.channel_number) === -1) {
                    channel_number_list.push(data.channel_number); //prepare array with numbers of channels whose programs will be imported
                }
            }).on("end", function(){
                callback(null); //reading file ended. pass control to next function
            });
        },
        //deletes future epg for channels whose epg will be imported
        delete_epg: ['get_channels', function(results, callback) {
            if(channel_number_list.length < 1){
                import_file_log.error_log.push('Error reading csv file '+epg_file);
                callback(true); // no channels to import epg. pass control to the end
            }
            else{
                DBModel.destroy({
                    where: {program_start: {gte: current_time}, channel_number: {in: channel_number_list}, company_id: req.token.company_id}
                }).then(function (result) {
                    callback(null); // future epg was deleted for channels on our list. pass control to next function
                }).catch(function(error) {
                    winston.error("Deleting previous events failed with error: ", error);
                    if(error.message.split(': ')[0] === 'ER_ROW_IS_REFERENCED_2') import_file_log.error_log.push('Error deleting future events. At least one of these events is scheduled');
                    else import_file_log.error_log.push('Error deleting future events.');
                    callback(null); // error occured while deleting future epg. pass control to the end
                });
            }
        }],
        save_epg: ['delete_epg', function(epg_data, callback) {
            var stream = fs.createReadStream(path.resolve('./public')+epg_file).pipe(iconv.decodeStream(req.body.encoding)); // read csv file
            fastcsv.fromStream(stream, {headers : true}, {ignoreEmpty: true}).validate(function(data){
                if(req.body.channel_number){
                    return data.channel_number == req.body.channel_number; //if a channel_number is specified, filter out epg for other channels
                }
                else return data; //no channel_number was specified, return all records
            }).on("data", function(data){
                //only insert future programs (where program_start > current). take into account timezone used to generate the epg file
                if(data && (moment(data.program_start, 'MM/DD/YYYY HH:mm:ss').subtract(req.body.timezone, 'hour').format('YYYY-MM-DD HH:mm:ss') > moment(current_time).format('YYYY-MM-DD HH:mm:ss')) ){
                    DBModel.create({
                        channels_id: data.channel_id,
                        channel_number: data.channel_number,
                        title: (data.title) ? data.title : "Program title",
                        short_name: (data.short_name) ? data.short_name : "Program name",
                        short_description: (data.short_description) ? data.short_description : "Program description",
                        program_start: moment(data.program_start, 'MM/DD/YYYY HH:mm:ss').subtract(req.body.timezone, 'hour'),
                        program_end: moment(data.program_end, 'MM/DD/YYYY HH:mm:ss').subtract(req.body.timezone, 'hour'),
                        long_description: (data.long_description) ? data.long_description : "Program summary",
                        duration_seconds: data.duration,
                        company_id: req.token.company_id
                    }).then(function (result) {
                        import_file_log.saved_records++;
                    }).catch(function(error) {
                        winston.error("Saving events failed with error: ", error);
                        import_file_log.non_saved_records++;
                        import_file_log.error_log.push("Failed to save record '"+data.short_name+"' with error: "+ error.name+": "+error.parent.sqlMessage);
                    });
                }
                else{
                    import_file_log.error_log.push("Failed to create epg record. Event '"+data.short_name+"' has expired");
                }
            }).on("error", function(){
                callback(null);
            }).on("end", function(){
                callback(null);
            });
        }]
    }, function(error, results) {
        import_log.push(import_file_log);
        callback(null);
    });

}

//import xml file, digitalb format
function import_xml_dga(req, res, current_time, epg_file, import_log, callback){

    var import_file_log = {
        file_name: epg_file,
        saved_records: 0,
        non_saved_records: 0,
        error_log: []
    };
    async.auto({
        read_file: function(callback) {
            try{
                fs.readFile(path.resolve('./public'+epg_file), function(err, data) {
                    if(err) {
                        import_file_log.error_log.push('Error reading xml file '+epg_file);
                        callback(true); //file could not be read. add error into logs and stop import for this file
                    }
                    else {
                        var file_encoding = iconv.decode(data, req.body.encoding).split('encoding="')[1].split('"')[0]; //read encoding from epg file
                        var epg_data = iconv.decode(data, file_encoding); //file was read successfully. Decode file to appropriate encoding
                        callback(null, epg_data); //pass execution flow and file content to next function
                    }
                });
            }
            catch(error){
                import_file_log.error_log.push('Error reading xml file '+epg_file);
                callback(true); //file could not be read. add error into logs and stop import for this file
            }
        },
        parse_file: ['read_file', function(results, callback) {
            var parser = new xml2js.Parser();
            parser.parseString(results.read_file, function (err, epg_data) {
                if(err) {
                    import_file_log.error_log.push('Error parsing this xml file');
                    callback(true); //file was not parsed. add error into logs and stop import for this file
                }
                else callback(null, epg_data);//pass execution flow and file content to next function
            });
        }],
        save_epg: ['parse_file', function(results, callback) {
            var all_programs = results.parse_file.WIDECAST_DVB.channel; //stores the whole list of channel objects from the xml file
            // iterate over each channel

            async.forEach(all_programs, function(channels, callback){
                var channel_name = channels.$.name;
                var filtered_channel_number = (req.body.channel_number) ? req.body.channel_number : {gte: -1}; //channel from epg file that is being processed, if allowed by channel_number input
                //find channel id and number for this channel
                DBChannels.findOne({
                    attributes: ['channel_number', 'id'],
                    where: {epg_map_id: channel_name, channel_number: filtered_channel_number, company_id: req.token.company_id}
                }).then(function (channel_data) {
                    if(channel_data){
                        //destroys future epg for filtered channels
                        db.models.epg_data.destroy({
                            where: {channel_number: channel_data.channel_number, program_start: {gte: current_time}, company_id: req.token.company_id}
                        }).then(function (result) {
                            //iterate over all events of this channel
                            async.forEach(channels.event, function(events, callback){
                                try{var short_event_name = events.short_event_descriptor[0].$.name;} catch(error){var short_event_name = "Program title";}
                                try{var short_event_descriptor = events.short_event_descriptor[0]._;} catch(error){var short_event_descriptor = "Program name";}
                                try{var long_event_descriptor = events.extended_event_descriptor[0].text[0];}catch(error){var long_event_descriptor = "Program summary";}
                                if(events && (moment(events.$.start_time).subtract(req.body.timezone, 'hour').format('YYYY-MM-DD HH:mm:ss') > moment(current_time).format('YYYY-MM-DD HH:mm:ss')) ){
                                    //only insert future programs (where program_start > current)
                                    db.models.epg_data.create({
                                        channels_id: channel_data.id,
                                        channel_number: channel_data.channel_number,
                                        title: (short_event_name) ? short_event_name : "Program title",
                                        short_name: (short_event_name) ? short_event_name : "Program name",
                                        short_description: (short_event_descriptor) ? short_event_descriptor : "Program description",
                                        program_start: moment(events.$.start_time).subtract(req.body.timezone, 'hour'),
                                        program_end: moment.unix(parseInt(moment(events.$.start_time).format('X')) + parseInt(events.$.duration) - req.body.timezone*3600  ).format('YYYY-MM-DD HH:mm:ss'),
                                        long_description: (long_event_descriptor) ? long_event_descriptor : "Program summary",
                                        duration_seconds: events.$.duration, //is in seconds
                                        company_id: req.token.company_id
                                    }).then(function(saved_events) {
                                        import_file_log.saved_records++;
                                        callback(null);
                                    }).catch(function(error) {
                                        winston.error("Saving events failed with error: ", error);
                                        import_file_log.non_saved_records++;
                                        import_file_log.error_log.push("Failed to save record '"+short_event_name+"' with error: "+ error.name+"- "+error.parent.sqlMessage);
                                        callback(null);
                                    });
                                }
                                else{
                                    import_file_log.non_saved_records++; //event was not saved
                                    import_file_log.error_log.push("Failed to create epg record. Event '"+short_event_name+"' has expired");
                                    callback(null);
                                }
                            },function(error){
                                callback(null);
                            });
                            return null;
                        }).catch(function(error) {
                            winston.error("Deleting previous events failed with error: ", error);
                            import_file_log.error_log.push("Failed to delete events for channel "+channel_name+": "+error.parent.sqlMessage);
                            callback(null); //event deletion failed. pass control to next epg record iteration
                        });
                    }
                    else{
                        import_file_log.error_log.push("Channel not found: Channel "+channel_name+" either does not exist, or was filtered by your input channel number.");
                        callback(null);
                    }
                    return null;
                }).catch(function(error) {
                    winston.error("Finding channel failed with error: ", error);
                    import_file_log.error_log.push("Error searching for channel "+error);
                    callback(null);
                });
            },function(error){
                callback(null); //passes control to next step, sending status
            });
        }]
    }, function(error, results) {
        import_log.push(import_file_log);
        callback(null);
    });
}

exports.create_sample = function(req, res) {

    import_xmltv(res,res,123456);
}

function import_xmltv(req, res, current_time, epg_file, import_log, callback){

    var import_file_log = {
        file_name: epg_file,
        saved_records: 0,
        non_saved_records: 0,
        error_log: []
    };

    var channellist = {};
    var xmlfile = path.resolve('./public'+epg_file);
    var input = fs.createReadStream(xmlfile).pipe(iconv.decodeStream(req.body.encoding));
    var parser = new xmltv.Parser();
    var stotal = 0;
    var serrors = 0;
    var ssuccess = 0;
    var epgdata = [];

    //read channels and map channel epg name with names on the epg file
    DBChannels.findAll({
        where: {isavailable: true, company_id: req.token.company_id}
    }).then(function(result) {
        for(var i=0; i < result.length; i++) {
            if(result[i].epg_map_id != '') {
                channellist[result[i].epg_map_id] = {};
                channellist[result[i].epg_map_id].channel_number = result[i].channel_number;
                channellist[result[i].epg_map_id].channels_id = result[i].id;
            }
        }
        input.pipe(parser);
        return null;
    }).catch(function(err) {
        winston.error("Finding available channels failed with error: ", err);
    });

    parser.on('programme', function (programme) {
        // Do whatever you want with the programme
        var date1 = new Date(programme.start);
        var date2 = new Date(programme.end);
        var timeDiff = Math.abs(date2.getTime() - date1.getTime());
        var formdata = {};

        //if channel id availabe on our database
        if(channellist[programme.channel] !== undefined) {
            formdata.channel_number = channellist[programme.channel].channel_number;
            formdata.title = programme.title[0];
            formdata.timezone = 1;
            formdata.short_name = programme.title[0] || '';
            formdata.short_description = programme.channel || '';
            formdata.program_start = programme.start;
            formdata.program_end = programme.end;
            formdata.long_description = programme.desc[0] || '';
            formdata.duration_seconds = timeDiff / 1000;
            formdata.channels_id = channellist[programme.channel].channels_id;
            formdata.company_id = req.token.company_id;
            epgdata.push(formdata);
        }
    });

    parser.on('end', function (programme) {
        DBModel.bulkCreate(epgdata,{ignoreDuplicates: true})
            .then(function(data) {
                import_file_log.saved_records = data.length;
                import_log.push(import_file_log);
                callback(null);
            })
            .catch(function(err) {
                winston.error("Importing events failed with error: ", err);
                import_file_log.error_log = err;
                import_log.push(import_file_log);
                callback(null);
            });
    });
    //input.pipe(parser);
}

function import_xml_standard(req, res, current_time){
    var message = '';
    var channel_list = new Array(); //associative array to contain title, with id as identifier for the channels
    try{
        var parser = new xml2js.Parser();
        fs.readFile(path.resolve('./public')+req.body.epg_file, req.body.encoding, function(err, data) {
            parser.parseString(data, function (err, result) {
                try{
                    var channels = result.tv.channel; //stores all channel records
                    var programs = result.tv.programme; //stores all programs of all channels
                    if(result.tv.channel != undefined && result.tv.programme != undefined){
                        //channel and event data were not null / undefined
                        async.auto({
                            delete_existing_epg: function(callback) {
                                async.forEach(channels, function (channel, callback) {
                                    var filtered_channel_number = (req.body.channel_number) ? req.body.channel_number : {gte: -1};
                                    var channel_name = (channel["display-name"][0]._) ? channel["display-name"][0]._ : channel["display-name"]
                                    DBChannels.findOne({
                                        attributes: ['channel_number'], where: {title: channel_name, channel_number: filtered_channel_number, company_id: req.token.company_id}
                                    }).then(function (ch_result) {
                                        if(ch_result){
                                            db.models.epg_data.destroy({
                                                where: {channel_number: filtered_channel_number, program_start: {gte: current_time}, company_id: req.token.company_id}
                                            }).then(function (result) {
                                                channel_list[''+channel.$.id+''] = ({title: channel_name});
                                                callback(null, channel_list); //move control to next foreach iteration
                                            }).catch(function(error) {
                                                winston.error("Deleting previous events for specific channels failed with error: ", error);
                                                callback(true);//todo: provide some info to error
                                            });
                                        }
                                        else callback(null, channel_list); //move control to next foreach iteration
                                        return null;
                                    }).catch(function(error) {
                                        winston.error("Finding channel failed with error: ", error);
                                        callback(true); //todo: provide some info to error
                                    });
                                }, function (error) {
                                    if(error){ callback(true, 'Error step xxx');} //todo: proper message
                                    if(!error) {
                                        callback(null, channel_list)//move control to next function
                                    }
                                });
                                return null;
                            },
                            save_epg: ['delete_existing_epg', function(channels, callback) {
                                programs.forEach(function(program){
                                    //the program object cannot be empty, the channel for this program should be in the file and should have passed the user filter
                                    if(program.$ != undefined && channel_list[''+program.$.channel+'']){
                                        try{
                                            DBChannels.findOne({
                                                attributes: ['id', 'channel_number', 'title'],
                                                where: {title: channel_list[''+program.$.channel+''].title, company_id: req.token.company_id}
                                            }).then(function (result) {
                                                //if channel info found, let's save the epg record
                                                if( result && ((req.body.channel_number === null) || (req.body.channel_number == result.channel_number)) ){
                                                    //only insert future programs (where program_start > current)
                                                    if( moment(stringtodate(program.$.start)).subtract(req.body.timezone, 'hour').format('YYYY-MM-DD HH:mm:ss') > moment(current_time).format('YYYY-MM-DD HH:mm:ss')){
                                                        var program_title = (program.title[0]._) ? program.title[0]._ : program.title[0];
                                                        var program_desc = (program.desc[0]._) ? program.desc[0]._ : program.desc[0];
                                                        db.models.epg_data.create({
                                                            channels_id: result.id,
                                                            channel_number: result.channel_number,
                                                            title: (program_title) ? program_title : "Program title",
                                                            short_name: (program_title) ? program_title : "Program name",
                                                            short_description: (program_desc) ? program_desc : "Program description",
                                                            program_start: moment(stringtodate(program.$.start)).subtract(req.body.timezone, 'hour'),
                                                            program_end: moment(stringtodate(program.$.stop)).subtract(req.body.timezone, 'hour'),
                                                            long_description: (program_desc) ? program_desc : "Program summary",
                                                            duration_seconds: datetimediff_seconds(stringtodate(program.$.start), stringtodate(program.$.stop)), //is in seconds
                                                            company_id: req.token.company_id
                                                        }).then(function (result) {
                                                            //on each write, do nothing. we wait for the saving process to finish
                                                        }).catch(function(error) {
                                                            winston.error("Saving event failed with error: ", error);
                                                            //error while saving records
                                                        });
                                                    }

                                                }
                                                return null;
                                            }).catch(function(error) {
                                                winston.error("Finding channel failed with error: ", error); //error while saving records
                                            });
                                        }
                                        catch(error){
                                            //todo: display info that some data were not saved?
                                        }
                                    }
                                });
                            }]
                        }, function(error, results) {
                            if(error) {
                                return res.status(400).send({message: message}); //serverside filetype validation
                            }
                            else return res.status(200).send({message: 'Epg records were saved'}); //serverside filetype validation
                        });

                    } //file records successfully read, and attempted to save them
                }
                catch(error){
                    //error while trying to read the file. Probably it is empty or is missing the tv tags
                    message = 'Malformed file';
                }
            });
        });
        message = 'Epg records were saved';
        return res.status(200).send({message: message});
    }
    catch(error){
        message = 'Unable to save the epg records';
        return res.status(400).send({message: message});
    }
}

function stringtodate(date){
    return date.substring(0,4)+'-'+date.substring(4,6)+'-'+date.substring(6,8)+' '+date.substring(8,10)+':'+date.substring(10,12)+':'+date.substring(12, 14);
}
function datetimediff_seconds(start, end){
    return parseInt(moment(end).format('X')) - parseInt(moment(start).format('X')); //format('X') makes sure timestamps are in seconds
}