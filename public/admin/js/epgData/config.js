import edit_button from '../edit_button.html';
import modalImageUpload from "../../templates/modalImageUpload.html";
import modalImage from "../../templates/modalTemplate.html";

export default function (nga, admin) {
	var epgdata = admin.getEntity('EpgData');
	epgdata.listView()
        .title('<h4>Epg Data <i class="fa fa-angle-right" aria-hidden="true"></i> List</h4>')
        .actions(['batch','filter', 'export', 'create'])
        .batchActions([
            '<bulk-upload type="bulkUpload" selection="selection" ></bulk-upload>',
        ])


        .fields([
            nga.field('channel_number')
                    .cssClasses('hidden-xs')
                    .label('Nr'),
            nga.field('icon_url', 'file')
                .template(`<div ng-controller="modalController">
                     <img ng-src="{{ entry.values.icon_url }}"
                     width="45"
                     height="45"
                     ng-click="openModalImage(entry.values.icon_url, 'thumbnail')">
                     </div>`)
                .label('Image'),
            nga.field('title', 'string')
                    .label('Title'),
    /*        nga.field('episode_title', 'string')
                    .label('Episode title'),*/
            nga.field('short_name', 'string')
                    .cssClasses('hidden-xs')
                    .label('Short Name'),
          /*  nga.field('event_category', 'string')
                .label('Category'),*/
    /*        nga.field('event_rating', 'number')
                .attributes({ min:1, max:10 })
                .label('Rating'),*/
     /*       nga.field('event_language', 'string')
                .label('Language'),*/
            nga.field('short_description')
                    .label('Short Description'),
            nga.field('long_description', 'text')
                    .map(function truncate(value) {
                        if (!value) {
                            return 'No Description';
                        }
                        return value.length > 40 ? value.substr(0, 40) + '...' : value;
                    })
                    .cssClasses('hidden-xs')
                    .label('Long Description'),
            nga.field('program_start', 'datetime')
                    .cssClasses('hidden-xs')
                    .label('Program Start'),
            nga.field('program_end', 'datetime')
                    .cssClasses('hidden-xs')
                    .label('Program End'),
            nga.field('duration_seconds', 'number')
                    .cssClasses('hidden-xs')
                    .label('Duration'),
            nga.field('timezone', 'number')
                    .map(function truncate(value) {
                        if (!value) {
                            return "No Timezone";
                        }
                    })
                    .cssClasses('hidden-xs')
                    .label('Timezone'),
        ])
        .filters([
            nga.field('q')
                .label('')
                .template('<div class="input-group"><input type="text" ng-model="value" placeholder="Search" class="form-control"><span class="input-group-addon"><i class="glyphicon glyphicon-search"></i></span></div>')
                .pinned(true),
            nga.field('title')
                .attributes({ placeholder: 'Full Title' })
                .label('Title'),
            nga.field('carousel_type', 'choice')
                .attributes({ placeholder: 'Carousel Type' })
                .choices([{ value:'feed_tv_trending',label:'Trending'}, {value:'feed_tv_schedulable',label:'Scheduleable' }])
                .label('Carousel Type'),
            nga.field('channel_number','number')
                .attributes({ placeholder: 'Channel Number' })
                .label('Channel Number'),
            nga.field('program_start','datetime')
                .transform(function (value) {
                    var value1 = value.toString();
                    return value1;
                })
                .attributes({ placeholder: 'Program Start' })
                .label('Program Start'),
            nga.field('program_end','datetime')
                .transform(function (value) {
                    var value2 = value.toString();
                    return value2;
                })
                .attributes({ placeholder: 'Program End' })
                .label('Program End'),
        ])
		.listActions(['edit'])
        .exportFields([
         epgdata.listView().fields(),
        ]);


epgdata.creationView()
        .onSubmitSuccess(['progression', 'notification', '$state', 'entry', 'entity', function(progression, notification, $state, entry, entity) {
            progression.done();
            $state.go($state.get('list'), { entity: entity.name() });
            return false;
        }])
        .title('<h4>Epg Data <i class="fa fa-angle-right" aria-hidden="true"></i> Create: Epg Data</h4>')
        .fields([
            nga.field('channel_number', 'string')
				.attributes({ placeholder: 'Channel Number' })
				.validation({ required: true })
				.label('Channel Number'),
		   	nga.field('timezone', 'choice')
			    .choices([
			     { value: -12, label: '(UTC-12:00) International Date Line West' },
			     { value: -11, label: '(UTC-11:00) Samoa' },
			     { value: -10, label: '(UTC-10:00) Hawaii' },
			     { value: -9, label: '(UTC-9:00) Alaska' },
			     { value: -8, label: '(UTC-8:00) Pacific Time (US & Canada)' },
			     { value: -7, label: '(UTC-7:00) Arizona, La Paz, Mazatlan' },
			     { value: -6, label: '(UTC-6:00) Central America, Monterrey, Mexico City ' },
			     { value: -5, label: '(UTC-5:00) Bogota, Lima, Quito, Indiana' },
			     { value: -4, label: '(UTC-4:00) Atlantic Time (Canada), Manaus ' },
			     { value: -3, label: '(UTC-3:00) Brasilia, Buenos Aires, Cayenne' },
			     { value: -2, label: '(UTC-2:00) Mid-Atlantic' },
			     { value: -1, label: '(UTC-1:00) Azores, Cape Verde Is.' },
			     { value:  0, label: '(UTC 0:00) Dublin, Lisbon, London, Reykjavik' },
			     { value: +1, label: '(UTC+1:00) Amsterdam, Berlin, Rome, Paris, Prague, Skopje ' },
			     { value: +2, label: '(UTC+2:00) Athens, Istanbul, Cairo, Helsinki, Kyiv, Vilnius ' },
			     { value: +3, label: '(UTC+3:00) Baghdad, Kuwait, Moscow, St. Petersburg, Nairobi' },
			     { value: +4, label: '(UTC+4:00) Abu Dhabi, Baku, Muscat' },
			     { value: +5, label: '(UTC+5:00) Ekaterinburg, Karachi, Tashkent' },
			     { value: +6, label: '(UTC+6:00) Astana, Dhaka, Novosibirsk' },
			     { value: +7, label: '(UTC+7:00) Bangkok, Hanoi, Jakarta' },
			     { value: +8, label: '(UTC+8:00) Beijing, Hong Kong, Kuala Lumpur, Perth, Taipei' },
			     { value: +9, label: '(UTC+9:00) Sapporo, Tokyo, Seoul' },
			     { value: +10, label: '(UTC+10:00) Brisbane, Melbourne, Sydney' },
			     { value: +11, label: '(UTC+11:00) Magadan, Solomon Is.' },
			     { value: +12, label: '(UTC+12:00) Auckland, Fiji' },

                    ])
                    .attributes({ placeholder: 'Select Timezone' })
                    .validation({ required: false })
                    .label('Timezone'),
            nga.field('title', 'string')
                    .attributes({ placeholder: 'Title' })
                    .validation({ required: true })
                    .label('Title'),
      /*      nga.field('episode_title', 'string')
                    .map(function truncate(value) {
                        if (!value) {return "-";}
                        else return value;
                    })
                    .label('Episode title'),*/
            nga.field('short_name', 'string')
                    .attributes({ placeholder: 'Short Name' })
                    .validation({ required: true })
                    .label('Short Name'),
            nga.field('short_description', 'string')
                    .attributes({ placeholder: 'Short Description' })
                    .validation({ required: true })
                    .label('Short Description'),
            nga.field('long_description', 'text')
                    .attributes({ placeholder: 'Long Description' })
                    .validation({ required: true })
                    .label('Long Description'),
                nga.field('icon_url', 'file')
                    .uploadInformation({'url': '/file-upload/single-file/programContent/image_url', 'apifilename': 'result'})
                    .template('<div class="row">' +
                        '<div class="col-xs-12 col-sm-1"><img src="{{ entry.values.icon_url }}" height="40" width="40" /></div>' +
                        '<div class="col-xs-12 col-sm-8"><ma-file-field field="field" value="entry.values.icon_url"></ma-file-field></div>' +
                        '</div>' +
                        '<div class="row"><small id="emailHelp" class="form-text text-muted">not larger than 250 KB</small></div>')
                    .validation({
                        validator: function (value) {
                            if (value == null) {
                                throw new Error('Please, choose icon');
                            } else {
                                var icon_url = document.getElementById('icon_url');
                                if (icon_url.value.length > 0) {
                                    if (icon_url.files[0].size > 250000) {
                                        throw new Error('Your Icon is too Big, not larger than 250 KB');
                                    }
                                }
                            }
                        }
                    })
                    .label('Image *'),
/*            nga.field('event_category', 'string')
                    .map(function truncate(value) {
                        if (!value) {return "-";}
                        else return value;
                    })
                    .label('Category'),*/
/*            nga.field('event_rating', 'number')
                    .attributes({ min:1, max:10 })
                    .label('Rating (1-10)'),
            nga.field('event_language', 'string')
                    .map(function truncate(value) {
                        if (!value) {return "-";}
                        else return value;
                    })
                    .label('Language'),*/
            nga.field('program_start', 'datetime')
                    .attributes({ placeholder: 'Program Start' })
                    .validation({ required: true })
                    .label('Program Start'),
            nga.field('program_end', 'datetime')
                    .attributes({ placeholder: 'Program End' })
                    .validation({ required: true })
                    .label('Program End'),
            nga.field('duration_seconds', 'number')
                    .attributes({ placeholder: 'Duration' })
                    .validation({ required: true })
                    .label('Duration'),
            nga.field('template')
            	.label('')
            	.template(edit_button),
        ]);

    epgdata.editionView()
    	.title('<h4>Epg Data <i class="fa fa-angle-right" aria-hidden="true"></i> Edit: {{ entry.values.title }}</h4>')
    	.actions(['list'])
        .fields([
            epgdata.creationView().fields(),
        ]);


	return epgdata;

}
