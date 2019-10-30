import edit_button from '../edit_button.html';
import filter_package_btn from '../filter_package_btn.html';

export default function (nga, admin) {
	var vpackages = admin.getEntity('vodPackages');

    vpackages.listView()
    	.actions(['list', '<ma-create-button entity-name="vodPackages" class="pull-right"></ma-create-button>'])
        .title('<h4>Packages <i class="fa fa-angle-right" aria-hidden="true"></i> List</h4>')
        .permanentFilters({package_type_id: [3,4]})
        .batchActions([])
        .fields([
            nga.field('package_name')
                .isDetailLink(false)
                .label('Package Name'),
            nga.field('package_type_id', 'reference')
                .targetEntity(admin.getEntity('packagetypes'))
                .targetField(nga.field('description'))
                .isDetailLink(false)
                .cssClasses('hidden-xs')
                .label('Package Type'),
        ])
        .listActions(['edit'])


        .exportFields([
            vpackages.listView().fields(),
        ]);
   
	vpackages.creationView()
        .title('<h4>Packages <i class="fa fa-angle-right" aria-hidden="true"></i> Create: Package</h4>')
        .onSubmitSuccess(['progression', 'notification', '$state', 'entry', 'entity', function(progression, notification, $state, entry, entity) {
            progression.done();
            $state.go($state.get('edit'), { entity: entity.name(), id: entry._identifierValue });
            return false;
        }])
        .fields([
            nga.field('package_name', 'string')
                .attributes({ placeholder: 'Package Name' })
                .validation({ required: true })
                .label('Package Name'),
            nga.field('package_type_id', 'reference')
                .targetEntity(admin.getEntity('packagetypes'))
                .targetField(nga.field('description'))
                .permanentFilters({ package_type_id: [3,4] })
                .attributes({ placeholder: 'Select Package Type' })
                .validation({ required: true })
                .label('Package Type'),
            nga.field('template')
                .label('')
                .template(edit_button),
        ])



	vpackages.editionView()
        .title('<h4>Vod Packages <i class="fa fa-angle-right" aria-hidden="true"></i> Edit: {{ entry.values.package_name }}</h4>')   
        .actions(['list'])
        .fields([
            nga.field('package_name', 'string')
                .attributes({ placeholder: 'Package Name' })
                .validation({ required: true })
                .label('Package Name'),
            nga.field('package_type.description', 'string')
                .attributes({readOnly: true})
                .label('Package Type'),
            nga.field('template')
                .label('')
                .template(edit_button),
            
            nga.field('Vod films', 'referenced_list')
                    .label('Vods')
                    .targetEntity(admin.getEntity('Vods'))
                    .targetReferenceField('package_id')
                    .targetFields([
                        nga.field('icon_url', 'file')
                            .template('<img src="{{ entry.values.icon_url }}" height="35" width="35" />')
                            .cssClasses('hidden-xs')
                            .label('Icon'),
                        nga.field('title', 'string')
                            .label('Title'),

                        nga.field('category_id', 'reference')
                            .targetEntity(admin.getEntity('VodCategories'))
                            .targetField(nga.field('name'))
                            .label('Genre'),
                        nga.field('rate', 'number')
                            .attributes({ placeholder: 'Rate' })
                            .validation({ required: true })
                            .label('Rate'),
                        nga.field('duration')
                            .validation({ required: true })
                            .attributes({ placeholder: 'Duration' })
                            .label('Duration'),

                        nga.field('isavailable', 'boolean')
                            .label('Available'),
                    ])
                    //.listActions(['<ma-delete-button label="Remove" entry="entry" entity="entity" size="xs"></ma-delete-button>'])
                    .perPage(15),
                nga.field('template')
                   .label('')
                   .template('<div class="row">'+
                                '<div class="btn-group inline pull-right"> '+
                                  '<div class="btn btn-small"><ma-filtered-list-button entity-name="Vods" class="pull-right" label="SEE ALL VODS" filter="{ vod_id: entry.values.id }"></ma-filtered-list-button></div> '+
                                  //'<div class="btn btn-small"><ma-create-button entity-name="vodPackages" class="pull-right" label="ADD VOD" default-values="{ package_id: entry.values.id }"></ma-create-button></div> '+
                                '</div>'+
                            '</div>'),
        ]);
   
    return vpackages;

}
