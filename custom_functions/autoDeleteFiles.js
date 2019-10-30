const fs = require('fs');
const path = require('path');
const rimraf = require('rimraf');
const winston = require('winston');

const types = ['xml', 'csv'];

const fileLifeInDays = 10;
const refreshRateInHours = 3; //every x hours we check for files that we want to delete
const folder = path.resolve('public/files/temp');

function addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

setInterval(() => {
    fs.readdir(folder, function (err, files) {
        files.forEach(function (file) {
            types.map(type => {
                const ext = file.substr(file.lastIndexOf('.') + 1);
                if (ext === type) {
                    fs.stat(path.join(folder, file), function (err, stat) {
                        let endTime, now;
                        if (err) {
                            return winston.error("Failed deleting files at auto delete script with error: ", err);
                        }
                        now = new Date().getTime();
                        endTime = addDays(new Date(stat.ctime).getTime(), fileLifeInDays);

                        if (now > endTime) {
                            return rimraf(path.join(folder, file), function (err) {
                                if (err) {
                                    return winston.error("Couldn't delete file at auto delete script, failed with error: ", err);
                                }
                                winston.info('Successfully deleted file: ', path.join(folder, file));
                            });
                        }
                    });
                }
            });
        })
    });
},  refreshRateInHours * 60 * 60 * 1000);
