import edit_button from '../edit_button.html';
import filter_genre_btn from '../filter_genre_btn.html';

export default function (nga, admin) {
    var tmdbseries = admin.getEntity('tmdbseries');

    var language_list = [
        {value: {"iso_639_1":"en","name":"English"}, label: 'English'},
        {value: {"iso_639_1":"sp","name":"Spanish"}, label: 'Spanish'},
        {value: {"iso_639_1":"gr","name":"German"}, label: 'German'},
        {value: {"iso_639_1":"fr","name":"French"}, label: 'French'},
        {value: {"iso_639_1":"pt","name":"Portuguese"}, label: 'Portuguese'}
    ];

    tmdbseries.listView()
        .title('<h4>TMDB TV Shows <i class="fa fa-angle-right" aria-hidden="true"></i> List</h4>')
        .actions([])
        .batchActions([])
        .fields([
            nga.field('id')
                .label('ID'),
            nga.field('name')
                .label('Name'),
            nga.field('vote_count')
                .label('Vote Count'),
            nga.field('first_air_date')
                .label('First Air Date')
        ])
        .filters([
            nga.field('q')
                .label('')
                .template('<div class="input-group"><input type="text" ng-model="value" placeholder="Search" class="form-control"><span class="input-group-addon"><i class="glyphicon glyphicon-search"></i></span></div>')
                .pinned(true)
        ])
        .listActions(['<ma-edit-button entry="entry" entity="entity" label="Import" size="xs"></ma-edit-button>']);


    tmdbseries.editionView()
        .title('<h4>TMDB TV Shows <i class="fa fa-angle-right" aria-hidden="true"></i> Edit: {{ entry.values.id }}</h4>')
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
                .singleApiCall(function (category_id) {
                    return { 'category_id[]': category_id };
                }),


            nga.field('tv_series_packages','reference_many')
                .targetEntity(admin.getEntity('Packages'))
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
                .label('Producer'),

            nga.field('origin_country', 'string')
                .attributes({ placeholder: 'Origin Country' })
                .validation({ required: true })
                .label('Origin Country'),



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
                .validation({ required: true})
                .label('Starring'),

            nga.field('trailer_url', 'string')
                .defaultValue('')
                .attributes({ placeholder: 'Trailer url' })
                .label('Trailer url'),
            nga.field('homepage', 'string')
                .defaultValue('')
                .validation({ required: true })
                .attributes({placeholder: 'Movie website'})
                .label('Movie website'),


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



    return tmdbseries;
}
