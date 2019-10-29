import edit_button from '../edit_button.html';
import filter_package_btn from '../filter_package_btn.html';
import drag_drop from '../drag_drop_package/drag_and_drop_template.html';

export default function (nga, admin) {
    var livepackages = admin.getEntity('livepackages');

    livepackages.listView()
        .title('<h4>All Packages <i class="fa fa-angle-right" aria-hidden="true"></i> List</h4>')
        .permanentFilters({package_type_id: [1,2]})
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
            livepackages.listView().fields(),
        ]);

    livepackages.creationView()
        .title('<h4>Packages <i class="fa fa-angle-right" aria-hidden="true"></i> Create: Package</h4>')
        .fields([
            nga.field('package_name', 'string')
                .attributes({ placeholder: 'Name the package you are creating' })
                .validation({ required: true })
                .label('Package Name'),
            nga.field('package_type_id', 'reference')
                .targetEntity(admin.getEntity('packagetypes'))
                .targetField(nga.field('description'))
                .attributes({ placeholder: 'Choose the Package Type from dropdown list' })
                .validation({ required: true })
                .permanentFilters({ package_type_id: [1,2] })
                .label('Package Type'),
            nga.field('template')
                .label('')
                .template(edit_button),
        ]);


    livepackages.editionView()
        .title('<h4>Packages <i class="fa fa-angle-right" aria-hidden="true"></i> Edit: {{ entry.values.package_name }}</h4>')
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
            nga.field('','template')
                .label('')
                .template(drag_drop),


            // nga.field('packagechannels', 'referenced_list')
            //     .label('Channels')
            //     .targetEntity(admin.getEntity('packagechannels'))
            //     .targetReferenceField('package_id')
            //     .targetFields([
            //         nga.field('channel_id', 'reference')
            //             .targetEntity(admin.getEntity('Channels'))
            //             .targetField(nga.field('channel_number'))
            //             .label('Nr'),
            //         nga.field('channel_id', 'reference')
            //             .targetEntity(admin.getEntity('Channels'))
            //             .targetField(nga.field('icon_url', 'file')
            //                 .template('<img src="{{ entry.values.icon_url }}" height="35" width="35" />'))
            //             .label('Icon'),
            //         nga.field('channel_id', 'reference')
            //             .targetEntity(admin.getEntity('Channels'))
            //             .targetField(nga.field('title'))
            //             .label('Channels'),
            //         nga.field('channel_id', 'reference')
            //             .targetEntity(admin.getEntity('Channels'))
            //             .targetField(nga.field('genre.description'))
            //             .label('Genre'),
            //         nga.field('channel_id', 'reference')
            //             .targetEntity(admin.getEntity('Channels'))
            //             .targetField(nga.field('isavailable', 'boolean'))
            //             .label('available'),
            //     ])
            //     .listActions(['<ma-delete-button label="Remove" entry="entry" entity="entity" size="xs"></ma-delete-button>'])
            //
            //     .perPage(15),
            // nga.field('template')
            //     .label('')
            //     .template(filter_package_btn),
        ]);

    return livepackages;

}
