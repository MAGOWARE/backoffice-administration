import edit_button from '../edit_button.html';
import filter_genre_btn from '../filter_genre_btn.html';

export default function (nga, admin) {
    var tmdbvods = admin.getEntity('tmdbvods');

    var language_list = [
        {value: {"iso_639_1":"en","name":"English"}, label: 'English'},
        {value: {"iso_639_1":"sp","name":"Spanish"}, label: 'Spanish'},
        {value: {"iso_639_1":"gr","name":"German"}, label: 'German'},
        {value: {"iso_639_1":"fr","name":"French"}, label: 'French'},
        {value: {"iso_639_1":"pt","name":"Portuguese"}, label: 'Portuguese'}
    ];

    tmdbvods.listView()
        .title('<h4>TMDB Vods <i class="fa fa-angle-right" aria-hidden="true"></i> List</h4>')
        .actions([])
        .batchActions([])
        .fields([
            nga.field('id')
                .label('ID'),
            nga.field('title')
                .label('Title'),
            nga.field('backdrop_path')
                .template('<img src="https://image.tmdb.org/t/p/w500{{ entry.values.poster_path }}" height="150" width="100" /></div>')
                .label('Icon'),
            nga.field('vote_count')
                .label('Vote Count'),
            nga.field('release_date')
                .label('Release Date')
        ])
        .filters([
            nga.field('q')
                .label('')
                .template('<div class="input-group"><input type="text" ng-model="value" placeholder="Search" class="form-control"><span class="input-group-addon"><i class="glyphicon glyphicon-search"></i></span></div>')
                .pinned(true)
        ])
        .listActions(['<ma-edit-button entry="entry" entity="entity" label="Import" size="xs"></ma-edit-button>']);


    tmdbvods.editionView()
        .title('<h4>TMDB Vods <i class="fa fa-angle-right" aria-hidden="true"></i> Edit: {{ entry.values.id }}</h4>')
        .fields([

            nga.field('title', 'string')
                .attributes({ placeholder: 'Movie Name' })
                .validation({ required: true })
                .label('Title'),

            nga.field('original_title', 'string')
                .label('Original title'),


            nga.field('imdb_id', 'string')
                .attributes({ placeholder: 'Movie Imdb Id' })
                .defaultValue(0)
                .template(
                    '<ma-input-field field="field" value="entry.values.imdb_id"></ma-input-field>'+
                    '<small id="emailHelp" class="form-text text-muted">*This Id should either be left empty, or match exactly the Imdb Id</small>'
                )
                .label('Movie Imdb Id'),


            nga.field('vod_vod_categories','reference_many')
                .targetEntity(admin.getEntity('VodCategories'))
                .targetField(nga.field('name'))
                .label('Genres')
                .attributes({ placeholder: 'Select genre' })
                .singleApiCall(function (category_id) {
                    return { 'category_id[]': category_id };
                }),
            nga.field('package_vods','reference_many')
                .targetEntity(admin.getEntity('Packages'))
                .permanentFilters({ package_type_id: [3,4] })
                .targetField(nga.field('package_name'))
                .label('Packages')
                .attributes({ placeholder: 'Select packages' })
                .singleApiCall(function (package_id) {
                    return { 'package_id[]': package_id };
                }),

            nga.field('director', 'string')
                .attributes({ placeholder: 'Movie Director' })
                .validation({ required: true })
                .label('Director'),

            nga.field('rate', 'number')
                .attributes({ placeholder: 'Movie rated. Must be greater than 0, smaller or equal to 10' })
                .validation({ required: true, validator: function(value){
                        if(value<=0) throw  new Error ('Rate must be greater than 0');
                        if(value>10) throw  new Error ('Rate cannot be greater than 10');
                    }})
                .label('Rate'),

            nga.field('vote_average', 'float')
                .validation({required: true}).defaultValue(5.0)
                .label('Vote Average'),


            nga.field('vote_count', 'number')
                .validation({required: true}).defaultValue(0)
                .label('Vote Count'),


            nga.field('popularity', 'float')
                .validation({required: true}).defaultValue(0)
                .label('Popularity'),

            nga.field('clicks', 'number')
                .attributes({ placeholder: 'Movie clicks' })
                .validation({ required: true })
                .label('Clicks'),

            nga.field('duration')
                .validation({ required: true })
                .attributes({ placeholder: 'Duration of movie in minutes' })
                .label('Duration'),


            nga.field('tagline', 'string')
                .defaultValue('')
                .attributes({placeholder: 'Short description'})
                .label('Short description'),


            nga.field('description','text')
                .transform(function lineBreaks(value, entry) {
                    return value.split("\n").join("<br/>");
                })
                .attributes({ placeholder: 'Movie Subject' })
                .validation({ required: true, maxlength: 1000})
                .label('Description'),



            nga.field('starring', 'text')
                .transform(function lineBreak(value, entry) {
                    return value.split("\n").join("<br/>");
                })
                .attributes({ placeholder: 'Movie actors' })
                .validation({ required: true })
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


            nga.field('vod_preview_url', 'file')
                .uploadInformation({ 'url': '/file-upload/single-file/video_scrubbing_url/vod_preview_url','apifilename': 'result'})
                .template('<div class="row">'+
                    '<div class="col-xs-12 col-sm-1"><img src="{{ entry.values.vod_preview_url }}" height="40" width="40" /></div>'+
                    '<div class="col-xs-12 col-sm-8"><ma-file-field field="field" value="entry.values.vod_preview_url"></ma-file-field></div>'+
                    '</div>'+
                    '<div class="row"><small id="emailHelp" class="form-text text-muted">Not larger than 1MB</small></div>')
                .defaultValue('')
                .validation({
                    validator: function(value) {
                        var vod_preview_url = document.getElementById('vod_preview_url');
                        if (vod_preview_url.value.length > 0) {
                            if(vod_preview_url.files[0].size > 1048576 ){
                                throw new Error('Your File of Video scrubbing url is too Big, not larger than 1MB');
                            }
                        }

                    }
                })
                .label('Video scrubbing url'),



            nga.field('icon_url','file')
                .uploadInformation({ 'url': '/file-upload/single-file/vod/icon_url','apifilename': 'result'})
                .template('<div class="row">'+
                    '<div class="col-xs-12 col-sm-1"><img src="{{ entry.values.icon_url }}" height="40" width="40" /></div>'+
                    '<div class="col-xs-12 col-sm-8"><ma-file-field field="field" value="entry.values.icon_url"></ma-file-field></div>'+
                    '</div>'+
                    '<div class="row"><small id="emailHelp" class="form-text text-muted">Not larger than 1MB</small></div>')
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
                // .defaultValue(false)
                .choices([
                    { value: true, label: 'Yes' },
                    { value: false, label: 'No' }
                ])
                // .map(function (value, entry) {
                //     return false;
                // })
                .attributes({ placeholder: 'Choose from dropdown list' })
                .validation({ required: true})
                .label('Has adult content'),


            nga.field('isavailable','boolean')
                .attributes({ placeholder: 'Is Available' })
                .validation({ required: true })
                .label('Is Available'),



            nga.field('expiration_time','datetime')
                .validation({ required: true })
                .defaultValue('3018-01-01 00:00:00')
                .map(function (value, entry) {
                    return '3018-01-01 00:00:00';
                })
                .label('Expiration date'),


            nga.field('price', 'float')
                .template('<ma-input-field field="field" value="entry.values.price"></ma-input-field>'+
                    '<small id="emailHelp" class="form-text text-muted">*Set price to 0 for movies that are not for sale</small>')
                .validation({required: true})
                .label('Price'),



            nga.field('mandatory_ads', 'choice')
                .defaultValue(false)
                .choices([{value: true, label: 'Enabled'}, {value: false, label: 'Disabled'}])
                .map(function (value, entry) {
                    return false;
                })
                .attributes({placeholder: 'Choose from dropdown list'})
                .validation({required: true})
                .label('Mandatory ads'),


            nga.field('revenue', 'number')
                .validation({required: true})
                .label('Revenues'),


            nga.field('budget', 'number')
                .validation({required: true})
                .label('Budget'),


            nga.field('original_language', 'string')
                .validation({required: true}).defaultValue('en')
                .label('Original language'),



            nga.field('spoken_languages', 'choices')
                .choices(language_list)
                .label('Spoken languages'),


            nga.field('release_date', 'date')
                .validation({required: true}).defaultValue('1896-12-28')
                .label('Release date'),


            nga.field('status', 'string')
                .validation({required: true})
                .label('Status'),


            nga.field('template')
                .label('')
                .template(edit_button),


        ]);



    return tmdbvods;
}
