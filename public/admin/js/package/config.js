import edit_button from '../edit_button.html';
import filter_package_btn from '../filter_package_btn.html';

export default function (nga, admin) {
	var packages = admin.getEntity('Packages');

    packages.listView()
        .title('<h4>Packages <i class="fa fa-angle-right" aria-hidden="true"></i> List</h4>')
        .batchActions([])
        .fields([
            nga.field('package_name')
                .isDetailLink(false)
                .label('Package Name'),
            nga.field('package_type_id', 'reference')
                .targetEntity(admin.getEntity('packagetypes'))
                .targetField(nga.field('description'))
                .cssClasses('hidden-xs')
                .isDetailLink(false)
                .label('Package Type'),
        ])
        .listActions(['edit'])


        .exportFields([
            packages.listView().fields(),
        ]);
   
	packages.creationView()
        .title('<h4>Packages <i class="fa fa-angle-right" aria-hidden="true"></i> Create: Package</h4>')
        .fields([
            nga.field('package_name', 'string')
                .attributes({ placeholder: 'Package Name' })
                .validation({ required: true })
                .label('Package Name'),
            nga.field('package_type_id', 'reference')
                .targetEntity(admin.getEntity('packagetypes'))
                .targetField(nga.field('description'))
                .attributes({ placeholder: 'Select Package Type' , readOnly: true})
                .validation({ required: true })
                .label('Package Type'),
            nga.field('template')
                .label('')
                .template(edit_button),
        ]);



	packages.editionView()
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

        ]);

    return packages;

}
