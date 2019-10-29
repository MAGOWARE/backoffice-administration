import edit_button from '../edit_button.html';

export default function (nga, admin) {
	var devices = admin.getEntity('Devices')
	devices.listView()
		.title('<h4>Devices <i class="fa fa-angle-right" aria-hidden="true"></i> List</h4>')
		.batchActions([
            '<sendpush type="softwareupdate" selection="selection"></sendpush>',
			'<sendpush type="deletedata" selection="selection"></sendpush>',
			'<sendpush type="deletesharedpreferences" selection="selection"></sendpush>'
        ])
		.actions(['batch', 'export', 'filter'])
		.fields([
			nga.field('id')
				.label('ID'),
			nga.field('username')
				.label('Username'),	
			nga.field('device_ip', 'string')
				.map(function truncate(value) {
                 	if (!value) {
                            return '';
                      	}
                            return value.length > 14 ? value.substr(0, 14) + '...' : value;
						  })
				.template((entry) => `<a target="_blank" href="https://tools.keycdn.com/geo?host=${entry.values.device_ip}">{{entry.values.device_ip}}</a>`)
				.label('IP'),
			nga.field('device_mac_address', 'string')
				.label('Ethernet'),
			nga.field('device_wifimac_address', 'string')
				.label('WiFi'),
			nga.field('ntype')
				.map(function app(value) {
						if (value == 1) {
								return 'Wifi';
						} else if (value == 2) {
								return 'Ethernet';
						} else if (value == 3) {
								return '(GPRS)';
						}
				})
				.label('Ntype'),
			nga.field('appid')
				.map(function app(value) {
					if (value === 1) {
								return 'Box';
						} else if (value === 2) {
								return 'Android';
						} else if (value === 3) {
							return 'Ios';
						} else if (value === 4) {
							return 'Stv';
						} else if (value === 5) {
							return 'Samsung';
						}
				})
				.label('App'),
			nga.field('app_version')
				.label('App Version'),
			nga.field('screen_resolution')
				.label('Screen Resolution'),
			nga.field('hdmi')
				.label('HDMI'),
			nga.field('device_brand')
				.map(function truncate(value) {
                 	if (!value) {
                            return '';
                      	}
                            return value.length > 14 ? value.substr(0, 14) + '...' : value;
                      	})
				.label('Device Brand'),
			nga.field('device_active', 'boolean')
				.label('Device Active'),
			nga.field('api_version', 'string')
				.label('Api Version'),
		])
		.filters([
          nga.field('q')
              .label('')
              .template('<div class="input-group"><input type="text" ng-model="value" placeholder="Search" class="form-control"><span class="input-group-addon"><i class="glyphicon glyphicon-search"></i></span></div>')
              .pinned(true),
           nga.field('appid','choice')
               .choices([
                   { value: 1, label: 'Box' },
                   { value: 2, label: 'Android' },
                   { value: 3, label: 'Ios' },
                   { value: 4, label: 'Stv' },
                   { value: 5, label: 'Samsung' }
               ])
           	  .attributes({ placeholder: 'App Id' })
        	  .label('App ID'),
           nga.field('app_version')
           	  .attributes({ placeholder: 'App Version' })
        	  .label('App Version'),
           nga.field('api_version')
           	  .attributes({ placeholder: 'Api Version' })
        	  .label('Api Version'),
           nga.field('ntype','choice')
               .choices([
                   { value: 1, label: 'Wifi' },
                   { value: 2, label: 'Ethernet' },
                   { value: 3, label: 'GPRS' }
               ])
           	  .attributes({ placeholder: 'Ntype' })
        	  .label('Ntype'),
            nga.field('device_active', 'boolean')
                .filterChoices([
                    { value: true, label: 'Active' },
                    { value: false, label: 'Not Active' }
                ])
                .label('Device Active'),
            nga.field('hdmi')
                .attributes({ placeholder: 'HDMI' })
                .label('HDMI'),
            nga.field('username')
                .attributes({ placeholder: 'Username' })
                .label('Username'),
        ])
        .sortField('appid')
        .sortDir('ASC')
		.listActions(['edit'])
		.exportFields([
         devices.listView().fields(),
        ]);


	devices.creationView()
		.title('<h4>Devices <i class="fa fa-angle-right" aria-hidden="true"></i> Create: Device</h4>')         
		.fields([
			nga.field('username')
				.attributes({ placeholder: 'Username' })
				.validation({ required: true })
				.editable(false)
				.label('Username'),
			nga.field('googleappid', 'string')
				.editable(false)
				.attributes({ placeholder: 'Google App Id' })
				.label('Google App ID'),
			nga.field('device_active', 'boolean')
				.validation({ required: true })
				.label('Device Active'),
			nga.field('device_mac_address', 'string')
				.attributes({ placeholder: 'Device Mac Address' })
				.validation({ required: true })
				.editable(false)
				.label('Device Mac Address'),
			nga.field('device_wifimac_address', 'string')
				.attributes({ placeholder: 'Device Wifi Mac Address' })
				.validation({ required: true })
				.editable(false)
				.label('Device Wifi Mac Address'),
			nga.field('device_ip', 'string')
				.attributes({ placeholder: 'Device IP' })
				.validation({ required: true })
				.editable(false)
				.label('Device IP'),
			nga.field('device_id', 'string')
				.attributes({ placeholder: 'Device ID' })
				.validation({ required: true })
				.editable(false)
				.label('Device ID'),
			nga.field('ntype', 'string')
				.attributes({ placeholder: 'Ntype' })
				.validation({ required: true })
				.editable(false)
				.label('Ntype'),
			nga.field('appid', 'string')
				.attributes({ placeholder: 'App ID' })
				.validation({ required: true })
				.editable(false)
				.label('App ID'),
			nga.field('api_version', 'string')
				.attributes({ placeholder: 'Api Version' })
				.validation({ required: true })
				.editable(false)
				.label('Api Version'),
			nga.field('firmware', 'string')
				.editable(false)
				.label('Firmware'),
			nga.field('os')
				.editable(false)
				.label('Os'),
			nga.field('screen_resolution')
				.editable(false)
				.label('Screen Resolution'),
			nga.field('hdmi')
				.editable(false)
				.label('HDMI'),
			nga.field('device_brand')
				.editable(false)
				.label('Device Brand'),
			nga.field('app_version', 'string')
				.editable(false)
				.validation({ required: true })
				.label('App Version'),
			nga.field('createdAt', 'datetime')
				.editable(false)
				.label('First Login'),
			nga.field('updatedAt', 'datetime')
				.editable(false)
				.label('Last Login'),
            nga.field('template')
            	.label('')
            	.template(edit_button),
		])

    devices.editionView()
    	.title('<h4>Devices <i class="fa fa-angle-right" aria-hidden="true"></i> Edit: {{ entry.values.username }}</h4>')
    	.actions(['list'])
		.fields([
			devices.creationView().fields(),
        ]);


	return devices;
	
}