var fs = require('fs'),
    mkdirp = require('mkdirp'),
    path = require('path'),
    dbModel = require(path.resolve('./config/lib/sequelize')),
    response = require(path.resolve("./config/responses.js")),
    winston = require('winston');

var folder;

function makeDirectory(dirName, cb){
    if (!fs.existsSync(dirName)){
        mkdirp(dirName, function(err){
            cb(err);
        })
    } else {
        cb()
    }
}

/*function takes a basepath and a custompath.
Basepath is the url of the CDN+'public'.
Custompath is the relative path of the file, same url that will be stored to the database
For each hierarchy level, it checks if path exists. If not, creates folder.
 */
function mkdir_recursive(basepath, custompath){
    var fullpath = basepath;
    for(var i = 0; i< custompath.split('/').length-1; i++){ //length-1 makes sure that the filename itself is not included in the path creation
        fullpath = fullpath + custompath.split('/')[i]+'/';
        if (!fs.existsSync(fullpath)) {
            mkdirp(fullpath, function(err){
                winston.error('Error creating path at common controller, error: ', err);
            });
        }
    }
}

function moveFile(sourcePath, destPath, cb){
    copyFile(sourcePath, destPath, cb, true);
}

function copyFile(sourcePath, destPath, cb, moveFlag){
    var source = fs.createReadStream(sourcePath);
    var dest = fs.createWriteStream(destPath);

    source.pipe(dest);
    source.on('end', function() {
        if (moveFlag)
            fs.unlink(sourcePath,function (err) {
                winston.error('Error deleting file at common controller, error: ', err);
            });
        cb();
    });
    source.on('error', function(err) { cb(err)});
}


function deleteFile(filePath)
{
    for(var i=0;i<filePath.length;i++)
    {
        var Path=path.resolve('./public'+filePath[i]);
        fs.unlink(Path,function (err) {
            winston.error('Error deleting file at common controller, error: ', err);
        });
    }
}



function createPath(fileName,type)
{
    var Path=[], folder_string,arr;
    for (var i=0;i<fileName.length;i++)
    {
        arr = fileName[i].toString().split("/");
        if (type=="image") {
            folder_string = folder.toString();
            Path[i] = '/files/images/' + folder + '/' + arr[arr.length - 1];
        }
        else if(type=="file"){
            folder_string=folder.toString();
            Path[i]='/files/'+folder+'/'+arr[arr.length-1];
        }
    }
    return Path;
}



function copyOnUpdate(sourcePath, destPath, cb)
{
    copyFile(sourcePath, destPath, cb, false);
}




function  find_the_delete (new_files,old_file,index)
{
    var old_url,old_name,new_url,new_name,boolean;

    //get the old file name to be deleted of the new_files[index]
    old_url=old_file.toString().split("/");
    old_name=old_url[old_url.length-1];

    //check if the file to be deleted may be a file being uploaded at the same time and avoid its delete then
    for(var i=0;i<new_files.length;i++)
    {
        new_url=new_files[i].toString().split("/");
        new_name=new_url[new_url.length-1];
        if(new_name==old_name && index!=i)
        {
            boolean=false;
        }
        else boolean=true;
    }
    return boolean;
}


//todo remove if not required
function updateFile (prev_val,target_paths,delete_files,delete_on)
{
    var file_name=[],changed_name=[],full_name,file_delete=[],source_path,target_path;
    //if show_delete false , updateFile function is being called on create; nothing to store in file_delete[]
    if(delete_on==false) {
        for (var i = 0; i <= target_paths.length - 1; i++) {

            var upload_path = path.resolve('./public')+target_paths[i].substring(0, target_paths[i].lastIndexOf("/") + 1);
            if (!fs.existsSync(upload_path)){
                mkdir_recursive(path.resolve('./public'), target_paths[i]);
            }

            full_name = target_paths[i].toString().split("/");
            file_name[i] = full_name[full_name.length - 1];
            changed_name[i] = target_paths[i];
        }
    }
    //if show_delete false ,  updateFile function is being called on update; the files to be deleted stored in file_delete[]
    else {
        for (var i = 0, j = -1; i <= target_paths.length - 1; i++) {
            //check if directory tree where we want to upload exists. if not, we create it
            var upload_path = path.resolve('./public')+target_paths[i].substring(0, target_paths[i].lastIndexOf("/") + 1);
            if (!fs.existsSync(upload_path)){
                mkdir_recursive(path.resolve('./public'), target_paths[i]);
            }
            //check if the target path and new path the same, no upload happened
            if (prev_val[i].toString() != target_paths[i].toString())
            {                                                         //for target_path[i]
                full_name = target_paths[i].toString().split("/");
                j++;
                file_name[j] = full_name[full_name.length - 1];
                changed_name[j] = target_paths[i];

                if(find_the_delete(target_paths,delete_files[i],i)==true) {
                    //todo: review this case?
                }
            }
        }
    }

   //for all the files uploaded, change the path on update
    for (var i=0;i<file_name.length;i++)
    {
        source_path=path.resolve('./public/files/temp/'+ file_name[i]);
        target_path=path.resolve('./public'+changed_name[i]);
        copyOnUpdate(source_path, target_path,  function(err){
            //todo: do sth on error?
            winston.error('Error "copyOnUpdate" function error: ' ,err);
        })
    }
    //delete the old files of the new-updated ones
    deleteFile(file_delete);
}


function uploadFile (req, res){

    const tempFolders = [
        'epg'
    ]
    
    /* get request and upload file informations */
    var tomodel = req.params.model;
    var tofield = req.params.field;
    var existingfile = path.resolve('./public'+req.app.locals.backendsettings[req.token.company_id][tofield]);
    var fileName= req.files.file.name;
    var fileExtension = get_file_extention(fileName);
    var tempPath = req.files.file.path;

    var tempDirPath = null;
    var tempDirRelativePath = null;
    if(tempFolders.indexOf(tomodel) == -1) {
        tempDirRelativePath = '/' + req.token.company_id + '/files/' + tomodel;
        tempDirPath = path.resolve('./public' + tempDirRelativePath);
    }
    else {
        tempDirRelativePath = '/files/temp';
        tempDirPath = path.resolve('./public' + tempDirRelativePath);
    }
    
    if(fileExtension === '.apk'){
        var uploadLinkPath = tempDirRelativePath + '/' + fileName.replace(fileExtension, '').replace(/\W/g, '')+fileExtension; //apk file allows alphanumeric characters and the underscore. append timestamp to ensure uniqueness
    }
    else{
        var uploadLinkPath =  tempDirRelativePath + '/' + Date.now() + fileName.replace(fileExtension, '').replace(/[^0-9a-z]/gi, '')+fileExtension; //other file types allow only alphanumeric characters. append timestamp to ensure uniqueness
    }

    var targetPath = path.resolve('./public' + uploadLinkPath);

    makeDirectory(tempDirPath, function(){
        moveFile(tempPath, targetPath, function(err){
            if (err)
                res.json({err: 1, result: 'fail upload'});
            else

                if(tomodel == 'settings') {
                    dbModel.models[tomodel].update(
                        { [tofield]: uploadLinkPath},
                        { where: {id: req.token.company_id }}
                    ).then(function (update_result) {
                        //update memory value
                        //an if is required req.app.locals.backendsettings[1][tofield] = uploadLinkPath;
                        //delete existing file if available
                        fs.unlink(existingfile, function (err) {
                            //todo: do sth on error?
                        });
                        //send response
                        res.json({err: 0, result: uploadLinkPath});
                    }).catch(function (error) {
                        winston.error("Saving file path failed with error: ", error);
                        response.send_res(req, res, [], 706, -1, 'DATABASE_ERROR_DESCRIPTION', 'DATABASE_ERROR_DATA', 'no-store');
                    });
                }
                else {
                    res.json({err: 0, result: uploadLinkPath});
                }

        });
    });
}


function uploadEpgFile (filepath){
    var fileName= filepath.name;
    var fileExtension = get_file_extention(fileName);

    var tempDirPath = path.resolve('./public/files/temp');
    var uploadLinkPath = tempDirPath +'/'+ fileName.replace(fileExtension, '')+Date.now()+fileExtension;// create unique filename
    fs.writeFile(uploadLinkPath, filepath, function (err) {
        //todo: do sth on error?
        winston.error('error function fs.writeFile: ',err);
    });

}

//todo: review usage of this function?
function uploadMultiFile(req, res){
    var tempFileList = [];
    for (var key in req.files.file){
        tempFileList.push({tempPath: req.files.file[key].path, extension: get_file_extention(req.files.file[key].name)})
    }
    if (tempFileList.length>0){
        var tempDirPath = path.resolve('./public/files/temp');
        var uploadLinkList = [];
        makeDirectory(tempDirPath, function(){
            var moveFiles = function(err, index){
                if (err || index>=tempFileList.length){
                    if (err)
                        res.json({err: 2, result: 'fail upload files'});
                    else
                        res.json({err: 0, result: uploadLinkList})
                }
                else {
                    var uploadLinkPath = 'temp/' + generateRandomId(12) + tempFileList[index].extension;
                    var targetPath = path.resolve('./public/' + uploadLinkPath);
                    moveFile(tempFileList[index].tempPath, targetPath, function(err){
                        uploadLinkList.push(uploadLinkPath);
                        index++;
                        moveFiles(err, index);
                    })
                }
            };
            moveFiles(null, 0);
        })
    }
    else res.json({err: 1, result: 'empty files'});
}

function generateRandomId(count, cb) {
    var _sym = 'abcdefghijklmnopqrstuvwxyz1234567890';
    var str = '';
    for(var i = 0; i < count; i++) {
        str += _sym[parseInt(Math.random() * (_sym.length))];
    }
    return str;
}

function get_file_extention(fileName){
    if (fileName.indexOf('.')>-1){
        var splitlist = fileName.split('.');
        return '.' + splitlist[splitlist.length -1];
    }
    else return '';
}



exports.create_path=createPath;
exports.update_file=updateFile;
exports.upload_multi_files = uploadMultiFile;
exports.upload_file = uploadFile;
exports.get_extension = get_file_extention;
exports.upload_epg_file = uploadEpgFile;

