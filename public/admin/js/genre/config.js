import edit_button from '../edit_button.html';
import filter_genre_btn from '../filter_genre_btn.html';
import modalImage from '../../templates/modalTemplate.html';
import modalImageUpload from '../../templates/modalImageUpload.html';

export default function (nga, admin) {
	var genre = admin.getEntity('Genres');
	genre.listView()
		.title('<h4>Genres <i class="fa fa-angle-right" aria-hidden="true"></i> List</h4>')
		.batchActions([])
		.fields([
            nga.field('id', 'string')
                .isDetailLink(true)
                .label('ID'),
			nga.field('description', 'string')
				.label('Description'),
            nga.field('icon_url', 'file')
                .template(modalImage)
                .cssClasses('hidden-xs')
                .label('Icon'),
			nga.field('is_available', 'boolean')
					.label('Available'),
			nga.field('channels')
				.map(function total(value, entry) {
					var obj = [];
					for (var i = value.length - 1; i >= 0; i--) {
						obj[i] = value[i].total;
						return obj[i];
					}
				})
				.label('Number of Channels'),
		])
        .listActions(['edit', 'delete'])
        .exportFields([
         genre.listView().fields(),
        ]);

    genre.deletionView()
        .title('<h4>Genre <i class="fa fa-angle-right" aria-hidden="true"></i> Remove <span style ="color:red;"> {{ entry.values.description }} </span></h4>')
        .actions(['<ma-back-button entry="entry" entity="entity"></ma-back-button>'])


    genre.creationView()
        .title('<h4>Genres <i class="fa fa-angle-right" aria-hidden="true"></i> Create: Genre</h4>')
        .fields([
            nga.field('description', 'string')
                .attributes({ placeholder: 'Name of the channel genre/category' })
                .validation({ required: true })
                .label('Description'),
            nga.field('is_available','boolean')
                .attributes({ placeholder: 'Is Available' })
                .validation({ required: true })
                .label('Is Available'),
            nga.field('icon_url','file')
                .uploadInformation({ 'url': '/file-upload/single-file/genre/icon_url','apifilename': 'result'})
                .template(modalImageUpload)
                .validation({
                    validator: function(value) {
                        if (value == null) {
                            throw new Error('Please, choose icon');
                        }else {
                            var icon_url = document.getElementById('icon_url');
                            if (icon_url.value.length > 0) {
                                if(icon_url.files[0].size > 204800 ){
                                    throw new Error('Your Icon is too Big, not larger than 200 KB');
                                }
                            }
                        }
                    }
                })
                .label('Icon *'),
            nga.field('template')
                .label('')
                .template(edit_button),
        ]);

    genre.editionView() 
        .title('<h4>Genres <i class="fa fa-angle-right" aria-hidden="true"></i> Edit: {{ entry.values.description }}</h4>')     
        .actions(['list'])     
        .fields([
            genre.creationView().fields(),
           	 	nga.field('', 'referenced_list')
                    .label('Channel')
                    .targetEntity(admin.getEntity('Channels'))
                    .targetReferenceField('genre_id')
                    .targetFields([
		                nga.field('channel_number')
		                	.label('Nr'),
		                nga.field('icon_url', 'file')
		                	.template(modalImage)
		                	.label('Icon'),
		                nga.field('title', 'string')                
		                    .attributes({ placeholder: 'Title' })
		                    .validation({ required: true })
		                    .label('Title')
	                    ])
                .listActions(['edit']),
                nga.field('template')
                   .label('')
                   .template(filter_genre_btn),
        ]);

	return genre;
	
}
