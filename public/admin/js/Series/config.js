import edit_button from '../edit_button.html';
import modalImage from '../../templates/modalTemplate.html'
import modalImageUpload from '../../templates/modalImageUpload.html'

export default function (nga, admin) {
    var Series = admin.getEntity('Series');
    Series.listView()
        .title('<h4>TV Shows <i class="fa fa-angle-right" aria-hidden="true"></i> List</h4>')
        .batchActions([
            '<vod type="update_film" selection="selection"></vod>'
        ])
        .actions(['<move type="move_to_package" selection="selection"></move>','batch', 'export', 'filter','create'])
        .fields([
            nga.field('title', 'string')
                .label('Title'),
            nga.field('expiration_time', 'datetime')
                .label('Expiration Time'),
            nga.field('tv_series_categories')
                .cssClasses('hidden')
                .map(function getpckgid(value, entry) {
                    var return_object = [];
                    for (var i = 0; i < value.length; i++) {
                        return_object[i] = value[i].category_id;
                    }
                    return return_object;
                })
                .label('Tv shows in categories'),
            nga.field('tv_series_categories','reference_many')
                .targetEntity(admin.getEntity('VodCategories'))
                .targetField(nga.field('name'))
                .singleApiCall(function (category_id) {
                    return { 'category_id[]': category_id };
                }).label('Genres'),

            nga.field('tv_series_packages')
                .cssClasses('hidden')
                .map(function getpckgid(value, entry) {
                    var return_object = [];
                    for (var i = 0; i < value.length; i++) return_object[i] = value[i].package_id;
                    return return_object;
                })
                .label('Vod in packages'),
            nga.field('tv_series_packages','reference_many')
                .targetEntity(admin.getEntity('Packages'))
                .perPage(-1)
                .permanentFilters({ package_type_id: [3,4] })
                .targetField(nga.field('package_name'))
                .singleApiCall(function (package_id) {
                    return { 'package_id[]': package_id };
                }).label('Packages'),
            nga.field('icon_url', 'file')
                .template(modalImage)
                .cssClasses('hidden-xs')
                .label('Icon'),
            nga.field('is_available', 'boolean')
                .cssClasses('hidden-xs')
                .label('Available'),
            nga.field('createdAt','date')
                .cssClasses('hidden-xs')
                .label('Created at'),
            nga.field('pin_protected','boolean')
                .cssClasses('hidden-xs')
                .label('Pin Protected')
        ])
        .sortDir("DESC")
        .sortField("createdAt")
        .filters([
            nga.field('not_id', 'reference')
                .targetEntity(admin.getEntity('vodPackages'))
                .permanentFilters({ package_type_id: [3,4] })
                .targetField(nga.field('package_name'))
                .label('Not In Package'),
            nga.field('expiration_time', 'datetime')
                .label('Expiration Time'),
            nga.field('title')
                .label('Title'),
            nga.field('pin_protected','choice')
                .choices([
                    { value: 0, label: 'False' },
                    { value: 1, label: 'True' }
                ])
                .attributes({ placeholder: 'Pin Protected' })
                .label('Pin Protected'),
            nga.field('added_before', 'datetime')
                .label('Added before'),
            nga.field('added_after', 'datetime')
                .label('Added after'),
            nga.field('updated_before', 'date')
                .label('Last updated before'),
            nga.field('updated_after', 'date')
                .label('Last updated after'),
            nga.field('is_available', 'boolean')
                .filterChoices([
                    { value: true, label: 'Available' },
                    { value: false, label: 'Not Available' }
                ])
                .label('Available'),
            nga.field('q')
                .label('')
                .template('<div class="input-group"><input type="text" ng-model="value" placeholder="Search" class="form-control"></input><span class="input-group-addon"><i class="glyphicon glyphicon-search"></i></span></div>')
                .pinned(true)])
        .listActions(['edit'])
        .exportFields([
            Series.listView().fields(),
        ]);

    Series.deletionView()
        .title('<h4>TV Shows <i class="fa fa-angle-right" aria-hidden="true"></i> Remove <span style ="color:red;"> {{ entry.values.title }}')
        .actions(['<ma-back-button entry="entry" entity="entity"></ma-back-button>'])

    Series.creationView()
        .title('<h4>TV Shows <i class="fa fa-angle-right" aria-hidden="true"></i> Create: TV Shows</h4>')
        .onSubmitSuccess(['progression', 'notification', '$state', 'entry', 'entity', function(progression, notification, $state, entry, entity) {
            progression.done();
            $state.go($state.get('edit'), { entity: entity.name(), id: entry._identifierValue });
            return false;
        }])
        .fields([
            nga.field('title', 'string')
                .attributes({ placeholder: 'TV Shows Name' })
                .validation({ required: true })
                .label('Title'),
            nga.field('imdb_id', 'string')
                .attributes({ placeholder: 'TV Shows Imdb Id' })
                .defaultValue(0)
                .template(
                    '<ma-input-field field="field" value="entry.values.imdb_id"></ma-input-field>'+
                    '<small id="emailHelp" class="form-text text-muted">*This Id should either be left empty, or match exactly the Imdb Id</small>'
                )
                .label('Movie Imdb Id'),
            nga.field('tv_series_categories','reference_many')
                .targetEntity(admin.getEntity('VodCategories'))
                .targetField(nga.field('name'))
                .remoteComplete(true, {
                    refreshDelay: 300,
                    // populate choices from the response of GET /posts?q=XXX
                    searchQuery: function (search) {
                        return {q: search};
                    }
                })
                .label('Genres')
                .attributes({ placeholder: 'Select genre' })
                .singleApiCall(function (category_id) {
                    return { 'category_id[]': category_id };
                }),
            nga.field('tv_series_packages', 'reference_many')
                .targetEntity(admin.getEntity('Packages'))
                .remoteComplete(true, {
                    refreshDelay: 300,
                    // populate choices from the response of GET /posts?q=XXX
                    searchQuery: function (search) {
                        return {q: search};
                    }
                })
                .permanentFilters({ package_type_id: [3,4] })
                .targetField(nga.field('package_name'))
                .label('Packages')
                .attributes({ placeholder: 'Select packages' })
                .singleApiCall(function (package_id) {
                    return { 'package_id[]': package_id };
                }),
            nga.field('director', 'string')
                .attributes({ placeholder: 'TV Shows Director' })
                .validation({ required: true })
                .label('Director'),
            nga.field('rate', 'number')
                .attributes({ placeholder: 'TV Shows rated. Must be greater than 0, smaller or equal to 10' })
                .validation({ required: true, validator: function(value){
                    if(value<=0) throw  new Error ('Rate must be greater than 0');
                    if(value>10) throw  new Error ('Rate cannot be greater than 10');
                }})
                .label('Rate'),


            nga.field('clicks', 'number')
                .attributes({ placeholder: 'TV Shows clicks' })
                .validation({ required: true })
                .label('Clicks'),
            nga.field('description', 'text')
                .transform(function lineBreaks(value, entry) {
                    return value.split("\n").join("<br/>");
                })
                .attributes({ placeholder: 'TV Shows Subject' })
                .validation({ required: true, maxlength: 1000})
                .label('Description'),
            nga.field('cast', 'text')
                .transform(function lineBreak(value, entry) {
                    return value.split("\n").join("<br/>");
                })
                .attributes({ placeholder: 'TV Shows actors' })
                .validation({ required: true, maxlength: 1000})
                .label('Starring'),
            nga.field('trailer_url', 'string')
                .defaultValue('')
                .attributes({ placeholder: 'Trailer url' })
                .label('Trailer url'),
            nga.field('icon_url','file')
                .uploadInformation({ 'url': '/file-upload/single-file/vod/icon_url','apifilename': 'result'})
                .template(modalImageUpload)
                .validation({
                    validator: function(value) {
                        if (value == null) {
                            throw new Error('Please, choose icon');
                        }else {
                            var icon_url = document.getElementById('icon_url');
                            if (icon_url.value.length > 0) {
                                if(icon_url.files[0].size > 153600 ){
                                    throw new Error('Your Icon is too Big, not larger than 150 KB');
                                }
                            }
                        }
                    }
                })
                .label('Icon *'),
            nga.field('image_url','file')
                .uploadInformation({ 'url': '/file-upload/single-file/vod/image_url','apifilename': 'result'})
                .template('<div class="row">'+
                    '<div class="col-xs-12 col-sm-1"><img src="{{ entry.values.image_url }}" height="40" width="40" /></div>'+
                    '<div class="col-xs-12 col-sm-8"><ma-file-field field="field" value="entry.values.image_url"></ma-file-field></div>'+
                    '</div>'+
                    '<div class="row"><small id="emailHelp" class="form-text text-muted">1920x1200 px, not larger than 600 KB</small></div>')
                .validation({
                    validator: function(value) {
                        if (value == null) {
                            throw new Error('Please, choose image');
                        }else {
                            var image_url = document.getElementById('image_url');
                            if (image_url.value.length > 0) {
                                if(image_url.files[0].size > 614400 ){
                                    throw new Error('Your Image is too Big, not larger than 600 KB');
                                }
                            }
                        }
                    }
                })
                .label('Image *'),
            nga.field('pin_protected','boolean')
                .attributes({ placeholder: 'Pin Protected' })
                .validation({ required: true })
                .label('Pin Protected'),
            nga.field('adult_content', 'choice')
                .defaultValue(false)
                .choices([
                    { value: true, label: 'Yes' },
                    { value: false, label: 'No' }
                ])
                .attributes({ placeholder: 'Choose from dropdown list' })
                .validation({ required: true})
                .label('Has adult content'),
            nga.field('is_available','boolean')
                .attributes({ placeholder: 'Is Available' })
                .validation({ required: true })
                .label('Is Available'),
            nga.field('expiration_time','datetime')
                .validation({ required: true })
                .defaultValue(new Date())
                .label('Expiration date'),
            nga.field('mandatory_ads', 'choice')
                .defaultValue(false)
                .choices([{value: true, label: 'Enabled'}, {value: false, label: 'Disabled'}])
                .attributes({placeholder: 'Choose from dropdown list'})
                .validation({required: true})
                .label('Mandatory ads'),
            nga.field('revenue', 'number')
                .defaultValue(0)
                .label('Revenues'),
            nga.field('budget', 'number')
                .defaultValue(0)
                .label('Budget'),
            nga.field('template')
                .label('')
                .template(edit_button),
        ]);

    Series.editionView()
        .title('<h4>TV Shows <i class="fa fa-angle-right" aria-hidden="true"></i> Edit: {{ entry.values.title }}</h4>')
        .actions(['list', 'create', '<ma-delete-button label="Remove" entry="entry" entity="entity"></ma-delete-button>'])
        .onSubmitSuccess(['progression', 'notification', '$state', 'entry', 'entity', function(progression, notification, $state, entry, entity) {
            progression.done();
            notification.log('Changes successfully saved', {addnCls: 'humane-flatty-success'});
            $state.go($state.get('list'), { entity: entity.name() });
            return false;
        }])
        .fields([
            nga.field('title', 'string')
                .attributes({ placeholder: 'TV Shows Name' })
                .validation({ required: true })
                .label('Title'),
            nga.field('imdb_id', 'string')
                .attributes({ placeholder: 'TV Shows Imdb Id' })
                .defaultValue(0)
                .template(
                    '<ma-input-field field="field" value="entry.values.imdb_id"></ma-input-field>'+
                    '<small id="emailHelp" class="form-text text-muted">*This Id should either be left empty, or match exactly the Imdb Id</small>'
                )
                .label('Movie Imdb Id'),
            nga.field('tv_series_categories','reference_many')
                .targetEntity(admin.getEntity('VodCategories'))
                .targetField(nga.field('name'))
                .label('Genres')
                .attributes({ placeholder: 'Select genre' })
                .map(function getpckgid(value, entry) {
                    var return_object = [];
                    for (var i = 0; i < value.length; i++) {
                        return_object[i] = value[i].category_id;
                    }
                    return return_object;
                })
                .singleApiCall(function (category_id) {
                    return { 'category_id[]': category_id };
                }),
            nga.field('tv_series_packages','reference_many')
                .targetEntity(admin.getEntity('Packages'))
                .permanentFilters({ package_type_id: [3,4] })
                .targetField(nga.field('package_name'))
                .label('Packages')
                .attributes({ placeholder: 'Select packages' })
                .map(function getpckgid(value, entry) {
                    var return_object = [];
                    for (var i = 0; i < value.length; i++) {
                        return_object[i] = value[i].package_id;
                    }
                    return return_object;
                })
                .singleApiCall(function (package_id) {
                    return { 'package_id[]': package_id };
                }),
            nga.field('director', 'string')
                .attributes({ placeholder: 'TV Shows Director' })
                .validation({ required: true })
                .label('Director'),
            nga.field('rate', 'number')
                .attributes({ placeholder: 'TV Shows rated. Must be greater than 0, smaller or equal to 10' })
                .validation({ required: true, validator: function(value){
                    if(value<=0) throw  new Error ('Rate must be greater than 0');
                    if(value>10) throw  new Error ('Rate cannot be greater than 10');
                }})
                .label('Rate'),
            nga.field('clicks', 'number')
                .attributes({ placeholder: 'TV Shows clicks' })
                .validation({ required: true })
                .label('Clicks'),
            nga.field('description', 'text')
                .transform(function lineBreaks(value, entry) {
                    return value.split("\n").join("<br/>");
                })
                .attributes({ placeholder: 'TV Shows Subject' })
                .validation({ required: true, maxlength: 1000})
                .label('Description'),
            nga.field('cast', 'text')
                .transform(function lineBreak(value, entry) {
                    return value.split("\n").join("<br/>");
                })
                .attributes({ placeholder: 'TV Shows actors' })
                .validation({ required: true, maxlength: 1000})
                .label('Starring'),
            nga.field('trailer_url', 'string')
                .defaultValue('')
                .attributes({ placeholder: 'Trailer url' })
                .label('Trailer url'),
            nga.field('icon_url','file')
                .uploadInformation({ 'url': '/file-upload/single-file/vod/icon_url','apifilename': 'result'})
                .template('<div class="row">'+
                    '<div class="col-xs-12 col-sm-1"><img src="{{ entry.values.icon_url }}" height="40" width="40" /></div>'+
                    '<div class="col-xs-12 col-sm-8"><ma-file-field field="field" value="entry.values.icon_url"></ma-file-field></div>'+
                    '</div>'+
                    '<div class="row"><small id="emailHelp" class="form-text text-muted">360x516 px, not larger than 150 KB</small></div>')
                .validation({
                    validator: function(value) {
                        if (value == null) {
                            throw new Error('Please, choose icon');
                        }else {
                            var icon_url = document.getElementById('icon_url');
                            if (icon_url.value.length > 0) {
                                if(icon_url.files[0].size > 153600 ){
                                    throw new Error('Your Icon is too Big, not larger than 150 KB');
                                }
                            }
                        }
                    }
                })
                .label('Icon *'),
            nga.field('image_url','file')
                .uploadInformation({ 'url': '/file-upload/single-file/vod/image_url','apifilename': 'result'})
                .template('<div class="row">'+
                    '<div class="col-xs-12 col-sm-1"><img src="{{ entry.values.image_url }}" height="40" width="40" /></div>'+
                    '<div class="col-xs-12 col-sm-8"><ma-file-field field="field" value="entry.values.image_url"></ma-file-field></div>'+
                    '</div>'+
                    '<div class="row"><small id="emailHelp" class="form-text text-muted">1920x1200 px, not larger than 600 KB</small></div>')
                .validation({
                    validator: function(value) {
                        if (value == null) {
                            throw new Error('Please, choose image');
                        }else {
                            var image_url = document.getElementById('image_url');
                            if (image_url.value.length > 0) {
                                if(image_url.files[0].size > 614400 ){
                                    throw new Error('Your Image is too Big, not larger than 600 KB');
                                }
                            }
                        }
                    }
                })
                .label('Image *'),
            nga.field('pin_protected','boolean')
                .attributes({ placeholder: 'Pin Protected' })
                .validation({ required: true })
                .label('Pin Protected'),
            nga.field('adult_content', 'choice')
                .defaultValue(false)
                .choices([
                    { value: true, label: 'Yes' },
                    { value: false, label: 'No' }
                ])
                .attributes({ placeholder: 'Choose from dropdown list' })
                .validation({ required: true})
                .label('Has adult content'),
            nga.field('is_available','boolean')
                .attributes({ placeholder: 'Is Available' })
                .validation({ required: true })
                .label('Is Available'),
            nga.field('expiration_time','datetime')
                .validation({ required: true })
                .defaultValue(new Date())
                .label('Expiration date'),
            nga.field('mandatory_ads', 'choice')
                .defaultValue(false)
                .choices([{value: true, label: 'Enabled'}, {value: false, label: 'Disabled'}])
                .attributes({placeholder: 'Choose from dropdown list'})
                .validation({required: true})
                .label('Mandatory ads'),
            nga.field('revenue', 'number')
                .defaultValue(0)
                .label('Revenues'),
            nga.field('budget', 'number')
                .defaultValue(0)
                .label('Budget'),
            nga.field('template')
                .label('')
                .template(edit_button),
        ]);

    return Series;

}

