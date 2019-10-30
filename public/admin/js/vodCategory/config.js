import edit_button from '../edit_button.html';
import modalImage from '../../templates/modalTemplate.html'
import modalImageUpload from '../../templates/modalImageUpload.html'


export default function (nga, admin) {
	var vodcategory = admin.getEntity('VodCategories');
	vodcategory.listView()
		.title('<h4>Vod Categories <i class="fa fa-angle-right" aria-hidden="true"></i> List</h4>')
		.batchActions([])
		.fields([
			nga.field('icon_url', 'file')
				.template(modalImage)
				.cssClasses('hidden-xs')
				.label('Icon'),
			nga.field('small_icon_url', 'file')
					.template(`<div ng-controller="modalController">
                                    <img ng-src="{{ entry.values.small_icon_url }}"
                                         width="45"
                                         height="45"
                                         ng-click="openModalImage(entry.values.small_icon_url)">
                                    </div>`)
					.cssClasses('hidden-xs')
					.label('Small icon'),
			nga.field('name', 'string')
				.label('Name'),
			nga.field('description', 'text')
				.cssClasses('hidden-xs')
				.label('Description'),
			nga.field('sorting', 'string')
				.cssClasses('hidden-xs')
				.label('Sorting'),
			nga.field('isavailable', 'boolean')
				.label('Available'),
			nga.field('password', 'boolean')
				.label('Password'),
		])
		.listActions(['edit', '<ma-delete-button label="Remove" entry="entry" entity="entity" size="xs"></ma-delete-button>'])
        .exportFields([
         vodcategory.listView().fields(),
        ]);


     vodcategory.deletionView()
		.title('<h4>Vod Category <i class="fa fa-angle-right" aria-hidden="true"></i> Remove <span style ="color:red;"> {{ entry.values.name }} </span></h4>')
		.actions(['<ma-back-button entry="entry" entity="entity"></ma-back-button>'])


    vodcategory.creationView()
        .title('<h4>Vod Categories <i class="fa fa-angle-right" aria-hidden="true"></i> Create: Vod Category</h4>')
        .fields([
            nga.field('name', 'string')
                .attributes({ placeholder: 'Category name' })
                .validation({ required: true })
                .label('Name'),
            nga.field('description', 'text')
                .attributes({ placeholder: 'Specify information you need for the category' })
                .validation({ required: true })
                .label('Description'),
            nga.field('sorting', 'number')
                .attributes({ placeholder: 'Sorting' })
                .validation({ required: true })
                .label('Sorting'),
            nga.field('icon_url','file')
                .uploadInformation({ 'url': '/file-upload/single-file/vodcategory/icon_url','apifilename': 'result'})
                .template(modalImageUpload)
                .validation({
                    validator: function(value) {
                        if (value == null) {
                            throw new Error('Please, choose icon');
                        }else {
                            var icon_url = document.getElementById('icon_url');
                            if (icon_url.value.length > 0) {
                                if(icon_url.files[0].size > 614400 ){
                                    throw new Error('Your Icon is too Big, not larger than 600 KB');
                                }
                            }
                        }
                    }
                })
                .label('Icon *'),
            nga.field('small_icon_url','file')
                .uploadInformation({ 'url': '/file-upload/single-file/vodcategory/small_icon_url','apifilename': 'result'})
                .template(`<div class="row">
                    <div class="col-xs-12 col-sm-1">
						<div ng-controller="modalController">
							<img ng-src="{{ entry.values.small_icon_url }}"
								 width="45"
								 height="45"
								 ng-click="openModalImage(entry.values.small_icon_url)">
						</div>
					</div>
                    <div class="col-xs-12 col-sm-8"><ma-file-field field="field" value="entry.values.small_icon_url"></ma-file-field></div>
                    </div>
                    <div class="row"><small id="emailHelp" class="form-text text-muted">120x120 px, not larger than 200 KB</small></div>`)
                .validation({
                    validator: function(value) {
                        if (value == null) {
                            throw new Error('Please, choose your small icon');
                        }else {
                            var small_icon_url = document.getElementById('small_icon_url');
                            if (small_icon_url.value.length > 0) {
                                if(small_icon_url.files[0].size > 153600 ){
                                    throw new Error('Your Small Icon is too Big, not larger than 150 KB');
                                }
                            }
                        }
                    }
                })
                .label('Small icon *'),
            nga.field('password', 'boolean')
                .attributes({ placeholder: 'Password' })
                .validation({ required: true })
                .label('Password'),
            nga.field('isavailable', 'boolean')
                .attributes({ placeholder: 'Is Available' })
                .validation({ required: true })
                .label('Is Available'),
            nga.field('template')
                .label('')
                .template(edit_button),
        ]);

    vodcategory.editionView() 
    	.title('<h4>Vod Categories <i class="fa fa-angle-right" aria-hidden="true"></i> Edit: {{ entry.values.name }}</h4>')  
    	.actions(['list'])       
        .fields([
            vodcategory.creationView().fields(),
        ]);


	return vodcategory;
	
}
