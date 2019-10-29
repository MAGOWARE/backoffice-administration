import edit_button from '../edit_button.html';
import modalImage from '../../templates/modalTemplate.html'
import modalImageUpload from '../../templates/modalImageUpload.html'
//import foto from '../foto.html';

export default function (nga, admin) {
    var VodEpisode = admin.getEntity('VodEpisode');
    VodEpisode.listView()
        .title('<h4>Episode <i class="fa fa-angle-right" aria-hidden="true"></i> List</h4>')
        .batchActions([
            '<vod type="update_film" selection="selection"></vod>'
        ])
        .actions(['batch', 'export', 'filter','create'])
        .fields([
            nga.field('title', 'string')
                .label('Title'),
            nga.field('expiration_time', 'datetime')
                .label('Expiration Time'),
            nga.field('duration', 'number')
                .cssClasses('hidden-xs')
                .label('Duration'),
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
                .label('Pin Protected'),
        ])
        .sortDir("DESC")
        .sortField("createdAt")
        .filters([
            nga.field('tv_show_title')
                .label('Tv show'),
            nga.field('season_number', 'number')
                .label('Season number'),
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
            VodEpisode.listView().fields(),
        ]);

    VodEpisode.deletionView()
        .title('<h4>Episode <i class="fa fa-angle-right" aria-hidden="true"></i> Remove <span style ="color:red;"> {{ entry.values.title }}')
        .actions(['<ma-back-button entry="entry" entity="entity"></ma-back-button>'])

    VodEpisode.creationView()
        .title('<h4>Episode <i class="fa fa-angle-right" aria-hidden="true"></i> Create: Episode</h4>')
        .onSubmitSuccess(['progression', 'notification', '$state', 'entry', 'entity', function(progression, notification, $state, entry, entity) {
            progression.done();
            $state.go($state.get('edit'), { entity: entity.name(), id: entry._identifierValue });
            return false;
        }])
        .fields([
            nga.field('title', 'string')
                .attributes({ placeholder: 'Episode Name' })
                .validation({ required: true })
                .label('Title'),
            nga.field('imdb_id', 'string')
                .attributes({ placeholder: 'Episode Imdb Id' })
                .defaultValue(0)
                .template(
                    '<ma-input-field field="field" value="entry.values.imdb_id"></ma-input-field>'+
                    '<small id="emailHelp" class="form-text text-muted">*This Id should either be left empty, or match exactly the Imdb Id</small>'
                )
                .label('Movie Imdb Id'),
            nga.field('tv_show_id', 'reference')
                .targetEntity(admin.getEntity('Series'))
                .targetField(nga.field('title'))
                .remoteComplete(true, {
                    refreshDelay: 300,
                    // populate choices from the response of GET /posts?q=XXX
                    searchQuery: function (search) {
                        return {q: search};
                    }
                })
                .attributes({ placeholder: 'Select the TV Shows name from the dropdown list ' })
                .validation({validator: function(value) {
                        if(value === null || value === ''){
                            throw new Error('Please Select TV Shows Name');
                        }
                    }
                })
                .label('TV Shows Name *'),
            nga.field('season_number', 'number')
                .attributes({ placeholder: 'Season Number' })
                .validation({ required: true })
                .label('Season Number'),
            nga.field('episode_number', 'number')
                .attributes({ placeholder: 'Episode Number' })
                .validation({ required: true })
                .label('Episode Number'),
            nga.field('director', 'string')
                .attributes({ placeholder: 'Episode Director' })
                .validation({ required: true })
                .label('Director'),
            nga.field('rate', 'number')
                .attributes({ placeholder: 'Episode rated. Must be greater than 0, smaller or equal to 10' })
                .validation({ required: true, validator: function(value){
                        if(value<=0) throw  new Error ('Rate must be greater than 0');
                        if(value>10) throw  new Error ('Rate cannot be greater than 10');
                    }})
                .label('Rate'),
            nga.field('clicks', 'number')
                .attributes({ placeholder: 'Episode clicks' })
                .validation({ required: true })
                .label('Clicks'),
            nga.field('duration')
                .validation({ required: true })
                .attributes({ placeholder: 'Duration of movie in minutes' })
                .label('Duration'),
            nga.field('description', 'text')
                .transform(function lineBreaks(value, entry) {
                    return value.split("\n").join("<br/>");
                })
                .attributes({ placeholder: 'Episode Subject' })
                .validation({ required: true, maxlength: 1000})
                .label('Description'),
            nga.field('cast', 'text')
                .transform(function lineBreak(value, entry) {
                    return value.split("\n").join("<br/>");
                })
                .attributes({ placeholder: 'Episode actors' })
                .validation({ required: true, maxlength: 1000})
                .label('Starring'),
            nga.field('trailer_url', 'string')
                .defaultValue('')
                .attributes({ placeholder: 'Trailer url' })
                .label('Trailer url'),
            nga.field('vod_preview_url', 'file')
                .uploadInformation({ 'url': '/file-upload/single-file/video_scrubbing_url/vod_preview_url','apifilename': 'result'})
                .template(`<div class="row">
                            <div class="col-xs-12 col-sm-1">
                                <div ng-controller="modalController">
                                    <img ng-src="{{ entry.values.vod_preview_url }}"
                                         width="45"
                                         height="45"
                                         ng-click="openModalImage(entry.values.vod_preview_url)">
                                </div>
                            </div>
                            <div class="col-xs-12 col-sm-8"><ma-file-field field="field" value="entry.values.vod_preview_url"></ma-file-field></div>
                        </div>
                      <div class="row"><small id="emailHelp" class="form-text text-muted">120x120 px, not larger than 200 KB</small></div>`)
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
                .template(`<div class="row">
                            <div class="col-xs-12 col-sm-1">
                                <div ng-controller="modalController">
                                    <img ng-src="{{ entry.values.image_url }}"
                                         width="45"
                                         height="45"
                                         ng-click="openModalImage(entry.values.image_url)">
                                </div>
                            </div>
                            <div class="col-xs-12 col-sm-8"><ma-file-field field="field" value="entry.values.image_url"></ma-file-field></div>
                        </div>
                      <div class="row"><small id="emailHelp" class="form-text text-muted">120x120 px, not larger than 200 KB</small></div>`)
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
            nga.field('adult_content', 'choice')
                .defaultValue(false)
                .choices([
                    { value: true, label: 'Yes' },
                    { value: false, label: 'No' }
                ])
                .attributes({ placeholder: 'Choose from dropdown list' })
                .validation({ required: true})
                .label('Has adult content'),
            nga.field('pin_protected','boolean')
                .attributes({ placeholder: 'Pin Protected' })
                .validation({ required: true })
                .label('Pin Protected'),
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

    VodEpisode.editionView()
        .title('<h4>Episode <i class="fa fa-angle-right" aria-hidden="true"></i> Edit: {{ entry.values.title }}</h4>')
        .actions(['list', 'create', '<ma-delete-button label="Remove" entry="entry" entity="entity"></ma-delete-button>'])
        .onSubmitSuccess(['progression', 'notification', '$state', 'entry', 'entity', function(progression, notification, $state, entry, entity) {
            progression.done();
            notification.log('Changes successfully saved', {addnCls: 'humane-flatty-success'});
            $state.go($state.get('list'), { entity: entity.name() });
            return false;
        }])
        .fields([
            //creation view fields
            nga.field('title', 'string')
                .attributes({ placeholder: 'Episode Name' })
                .validation({ required: true })
                .label('Title'),
            nga.field('imdb_id', 'string')
                .attributes({ placeholder: 'Episode Imdb Id' })
                .defaultValue(0)
                .template(
                    '<ma-input-field field="field" value="entry.values.imdb_id"></ma-input-field>'+
                    '<small id="emailHelp" class="form-text text-muted">*This Id should either be left empty, or match exactly the Imdb Id</small>'
                )
                .label('Movie Imdb Id'),
            nga.field('tv_season.tv_sery.tv_show_id', 'reference')
                .targetEntity(admin.getEntity('Series'))
                .targetField(nga.field('title'))
                .remoteComplete(true, {
                    refreshDelay: 300,
                    searchQuery: function(search) { return { q: search }; }
                })
                .attributes({ placeholder: 'Select the TV Shows name from the dropdown list ' })
                .validation({validator: function(value) {
                        if(value === null || value === ''){
                            throw new Error('Please Select TV Shows Name');
                        }
                    }
                })
                .label('TV Shows Name *'),
            nga.field('season_number', 'number')
                .attributes({ placeholder: 'Season Number' })
                .validation({ required: true })
                .label('Season Number'),
            nga.field('episode_number', 'number')
                .attributes({ placeholder: 'Episode Number' })
                .validation({ required: true })
                .label('Episode Number'),
            nga.field('director', 'string')
                .attributes({ placeholder: 'Episode Director' })
                .validation({ required: true })
                .label('Director'),
            nga.field('rate', 'number')
                .attributes({ placeholder: 'Episode rated. Must be greater than 0, smaller or equal to 10' })
                .validation({ required: true, validator: function(value){
                        if(value<=0) throw  new Error ('Rate must be greater than 0');
                        if(value>10) throw  new Error ('Rate cannot be greater than 10');
                    }})
                .label('Rate'),
            nga.field('clicks', 'number')
                .attributes({ placeholder: 'Episode clicks' })
                .validation({ required: true })
                .label('Clicks'),
            nga.field('duration')
                .validation({ required: true })
                .attributes({ placeholder: 'Duration of movie in minutes' })
                .label('Duration'),
            nga.field('description', 'text')
                .transform(function lineBreaks(value, entry) {
                    return value.split("\n").join("<br/>");
                })
                .attributes({ placeholder: 'Episode Subject' })
                .validation({ required: true, maxlength: 1000})
                .label('Description'),
            nga.field('cast', 'text')
                .transform(function lineBreak(value, entry) {
                    return value.split("\n").join("<br/>");
                })
                .attributes({ placeholder: 'Episode actors' })
                .validation({ required: true, maxlength: 1000})
                .label('Starring'),
            nga.field('trailer_url', 'string')
                .defaultValue('')
                .attributes({ placeholder: 'Trailer url' })
                .label('Trailer url'),
            nga.field('vod_preview_url', 'file')
                .uploadInformation({ 'url': '/file-upload/single-file/video_scrubbing_url/vod_preview_url','apifilename': 'result'})
                .template(`<div class="row">
                            <div class="col-xs-12 col-sm-1">
                                <div ng-controller="modalController">
                                    <img ng-src="{{ entry.values.vod_preview_url }}"
                                         width="45"
                                         height="45"
                                         ng-click="openModalImage(entry.values.vod_preview_url)">
                                </div>
                            </div>
                            <div class="col-xs-12 col-sm-8"><ma-file-field field="field" value="entry.values.vod_preview_url"></ma-file-field></div>
                        </div>
                      <div class="row"><small id="emailHelp" class="form-text text-muted">120x120 px, not larger than 200 KB</small></div>`)
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
                .template(`<div class="row">
                            <div class="col-xs-12 col-sm-1">
                                <div ng-controller="modalController">
                                    <img ng-src="{{ entry.values.image_url }}"
                                         width="45"
                                         height="45"
                                         ng-click="openModalImage(entry.values.image_url)">
                                </div>
                            </div>
                            <div class="col-xs-12 col-sm-8"><ma-file-field field="field" value="entry.values.image_url"></ma-file-field></div>
                        </div>
                      <div class="row"><small id="emailHelp" class="form-text text-muted">120x120 px, not larger than 200 KB</small></div>`)
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
            nga.field('adult_content', 'choice')
                .defaultValue(false)
                .choices([
                    { value: true, label: 'Yes' },
                    { value: false, label: 'No' }
                ])
                .attributes({ placeholder: 'Choose from dropdown list' })
                .validation({ required: true})
                .label('Has adult content'),
            nga.field('pin_protected','boolean')
                .attributes({ placeholder: 'Pin Protected' })
                .validation({ required: true })
                .label('Pin Protected'),
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
            //default subtitle field is exclusive to the edition view
            nga.field('default_subtitle_id', 'choice')
                .choices(function(entry) {
                    var no_sub_object = {value: 0, label: "No default subtitles", selected: true};
                    entry.values.tv_episode_subtitles.unshift(no_sub_object);
                    return entry.values.tv_episode_subtitles;
                })
                .label('Default subtitles'),
            nga.field('template')
                .label('')
                .template(edit_button),


            nga.field('tv_episode_subtitles', 'referenced_list')
                .label('Subtitles')
                .targetEntity(admin.getEntity('tv_episode_subtitles'))
                .targetReferenceField('tv_episode_id')
                .targetFields([
                    nga.field('title')
                        .label('Language'),
                ])
                .listActions(['edit', 'delete']),
            nga.field('ADD SUBTITLES', 'template')
                .label('')
                .template('<ma-create-button entity-name="tv_episode_subtitles" class="pull-right" label="ADD SUBTITLES" default-values="{ tv_episode_id: entry.values.id }"></ma-create-button>'),

            nga.field('tv_episode_url', 'referenced_list')
                .label('Stream url Sources')
                .targetEntity(admin.getEntity('tv_episode_stream'))
                .targetReferenceField('tv_episode_id')
                .targetFields([
                    nga.field('tv_episode_url').label('Episode URL'),
                ])
                .listActions(['edit', 'delete']),
            nga.field('ADD STREAM', 'template')
                .label('')
                .template('<ma-create-button entity-name="tv_episode_stream" class="pull-right" label="ADD STREAM" default-values="{ tv_episode_id: entry.values.id }"></ma-create-button>'),
        ])

    return VodEpisode;

}