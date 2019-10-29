import edit_button from '../edit_button.html';
//part of customization for mettre

export default function (nga, admin) {
    var CustomerAccount = admin.getEntity('CustomerAccount');

    CustomerAccount.listView()
        .title('<h4>Customer Account <i class="fa fa-angle-right" aria-hidden="true"></i> List</h4>')
        .batchActions([])
        .fields([
            nga.field('customer_datum.firstname')
                .map(function (value, entry) {
                    return entry['customer_datum.firstname'] + ' ' + entry['customer_datum.lastname'];
                })
                .isDetailLink(false)
                .label('Customer'),
            nga.field('username')
                .isDetailLink(false)
                .label('Username'),
            nga.field('channel_stream_source_id', 'reference')
                .targetEntity(admin.getEntity('ChannelStreamSources'))
                .targetField(nga.field('stream_source'))
                .isDetailLink(false)
                .cssClasses('hidden-xs')
                .label('Channel Stream Source'),
            nga.field('vod_stream_source', 'reference')
                .targetEntity(admin.getEntity('VodStreamSources'))
                .targetField(nga.field('description'))
                .isDetailLink(false)
                .cssClasses('hidden-xs')
                .label('VOD Stream Source'),
            nga.field('pin', 'string')
                .cssClasses('hidden-xs')
                .label('Pin'),
            nga.field('activity_timeout')
                .cssClasses('hidden-xs')
                .label('Activity Time Out'),
            nga.field('timezone', 'number')
                .cssClasses('hidden-xs')
                .label('Timezone'),
            nga.field('account_lock','boolean')
                .cssClasses('hidden-xs')
                .label('Account Locked'),
            nga.field('get_messages', 'boolean')
                .label('Get messages'),
            nga.field('show_adult', 'boolean')
                .label('Show adult'),
            nga.field('auto_timezone', 'boolean')
                .cssClasses('hidden-xs')
                .label('Auto Timezone'),
            nga.field('customer_datum.email', 'email')
                .cssClasses('hidden-xs')
                .label('Email'),
        ])
        .filters([
            nga.field('username', 'string')
                .label('Search for client account'),
            nga.field('customer_datum.email', 'email')
                .label('Search for client email'),
            nga.field('customer_datum.firstname')
                .map(function (value, entry) {
                        return entry['customer_datum.firstname'] + ' ' + entry['customer_datum.lastname'];
                })
                .label('Search for client name'),
            nga.field('q')
                .label('')
                .template('<div class="input-group"><input type="text" ng-model="value" placeholder="Search" class="form-control"><span class="input-group-addon"><i class="glyphicon glyphicon-search"></i></span></div>')
                .pinned(true)])
        .listActions(['edit'])


    CustomerAccount.creationView()
        .title('<h4>Customer Account <i class="fa fa-angle-right" aria-hidden="true"></i> Create Customer and Account</h4>')
        .onSubmitSuccess(['progression', 'notification', '$state', 'entry', 'entity', function(progression, notification, $state, entry, entity) {
            progression.done();
            $state.go($state.get('list'), { entity: entity.name() });
            return false;
        }])
        .fields([
            //Customer Data Fields
            nga.field('username', 'string')
                .attributes({ placeholder: 'Number,lowercase letter, and at least 2 or more characters'})
                .label('Username')
                .validation({ required: true, pattern: '^[a-z\\d]{2,}$' }),
            nga.field('password', 'password')
                .attributes({ placeholder: '4 or more characters' , title: '4 or more characters' })
                .label('Password')
                .validation({ required: true, pattern: '.{4,}' }),
            nga.field('group_id', 'reference')
                .targetEntity(admin.getEntity('CustomerGroups'))
                .targetField(nga.field('description'))
                .remoteComplete(true, {
                    refreshDelay: 300,
                    searchQuery: function(search) { return { q: search }; }
                })
                .attributes({ placeholder: ' Select from the dropdown list one of the groups you created' })
                .label('Group')
                .perPage(-1)
                .validation({ required: true}),
            nga.field('firstname', 'string')
                .attributes({ placeholder: 'Customer Firstname' })
                .validation({ required: true })
                .label('Firstname'),
            nga.field('lastname', 'string')
                .attributes({ placeholder: 'Customer Lastname' })
                .validation({ required: true })
                .label('Lastname'),
            nga.field('email', 'email')
                .attributes({ placeholder: 'Customer email' })
                .validation({ required: true })
                .label('Email'),
            nga.field('address', 'string')
                .attributes({ placeholder: 'Customer address (for example house number, street or other information)' })
                .validation({ required: true })
                .label('Address'),
            nga.field('city', 'string')
                .attributes({ placeholder: 'Part of customer address'})
                .validation({ required: true })
                .label('City'),
            nga.field('country', 'choice')
                .choices([
                    {   value:' Afghanistan' ,   label:' Afghanistan' }   ,
                    {   value:' Albania' ,   label:' Albania' }   ,
                    {   value:' Algeria' ,   label:' Algeria' }   ,
                    {   value:' Andorra' ,   label:' Andorra' }   ,
                    {   value:' Angola'  ,   label:' Angola'  }   ,
                    {   value:' Antigua and Barbuda' ,   label:' Antigua and Barbuda' }   ,
                    {   value:' Argentina'   ,   label:' Argentina'   }   ,
                    {   value:' Armenia' ,   label:' Armenia' }   ,
                    {   value:' Australia'   ,   label:' Australia'   }   ,
                    {   value:' Austria' ,   label:' Austria' }   ,
                    {   value:' Azerbaijan'  ,   label:' Azerbaijan'  }   ,
                    {   value:' Bahamas' ,   label:' Bahamas' }   ,
                    {   value:' Bahrain' ,   label:' Bahrain' }   ,
                    {   value:' Bangladesh'  ,   label:' Bangladesh'  }   ,
                    {   value:' Barbados'    ,   label:' Barbados'    }   ,
                    {   value:' Belarus' ,   label:' Belarus' }   ,
                    {   value:' Belgium' ,   label:' Belgium' }   ,
                    {   value:' Belize'  ,   label:' Belize'  }   ,
                    {   value:' Benin'   ,   label:' Benin'   }   ,
                    {   value:' Bhutan'  ,   label:' Bhutan'  }   ,
                    {   value:' Bolivia' ,   label:' Bolivia' }   ,
                    {   value:' Bosnia and Herzegovina'  ,   label:' Bosnia and Herzegovina'  }   ,
                    {   value:' Botswana'    ,   label:' Botswana'    }   ,
                    {   value:' Brazil'  ,   label:' Brazil'  }   ,
                    {   value:' Brunei Darussalam'   ,   label:' Brunei Darussalam'   }   ,
                    {   value:' Bulgaria'    ,   label:' Bulgaria'    }   ,
                    {   value:' Burkina Faso'    ,   label:' Burkina Faso'    }   ,
                    {   value:' Burundi' ,   label:' Burundi' }   ,
                    {   value:' Cabo Verde'  ,   label:' Cabo Verde'  }   ,
                    {   value:' Cambodia'    ,   label:' Cambodia'    }   ,
                    {   value:' Cameroon'    ,   label:' Cameroon'    }   ,
                    {   value:' Canada'  ,   label:' Canada'  }   ,
                    {   value:' Central African Republic'    ,   label:' Central African Republic'    }   ,
                    {   value:' Chad'    ,   label:' Chad'    }   ,
                    {   value:' Chile'   ,   label:' Chile'   }   ,
                    {   value:' China'   ,   label:' China'   }   ,
                    {   value:' Colombia'    ,   label:' Colombia'    }   ,
                    {   value:' Comoros' ,   label:' Comoros' }   ,
                    {   value:' Congo'   ,   label:' Congo '  }   ,
                    {   value:' Costa Rica'  ,   label:' Costa Rica'  }   ,
                    {   value:' Côte D Ivoire'   ,   label:' Côte D Ivoire'   }   ,
                    {   value:' Croatia' ,   label:' Croatia' }   ,
                    {   value:' Cuba'    ,   label:' Cuba'    }   ,
                    {   value:' Cyprus'  ,   label:' Cyprus'  }   ,
                    {   value:' Czech Republic'  ,   label:' Czech Republic'  }   ,
                    {   value:' (North Korea)' ,   label:'(North Korea)' }   ,
                    {   value:' Congo' ,   label:' Congo' }   ,
                    {   value:' Denmark' ,   label:' Denmark' }   ,
                    {   value:' Djibouti'    ,   label:' Djibouti'    }   ,
                    {   value:' Dominica'    ,   label:' Dominica'    }   ,
                    {   value:' Dominican Republic'  ,   label:' Dominican Republic'  }   ,
                    {   value:' Ecuador' ,   label:' Ecuador' }   ,
                    {   value:' Egypt'   ,   label:' Egypt'   }   ,
                    {   value:' El Salvador' ,   label:' El Salvador' }   ,
                    {   value:' Equatorial Guinea'   ,   label:' Equatorial Guinea'   }   ,
                    {   value:' Eritrea' ,   label:' Eritrea' }   ,
                    {   value: 'Estonia' ,   label:' Estonia' }   ,
                    {   value:' Ethiopia'    ,   label:' Ethiopia'    }   ,
                    {   value:' Fiji'    ,   label:' Fiji'    }   ,
                    {   value:' Finland' ,   label:' Finland' }   ,
                    {   value:' France'  ,   label:' France'  }   ,
                    {   value:' Gabon'   ,   label:' Gabon '  }   ,
                    {   value:' Gambia'  ,   label:' Gambia ' }   ,
                    {   value:' Georgia' ,   label:' Georgia' }   ,
                    {   value:' Germany' ,   label:' Germany '}   ,
                    {   value:' Ghana'   ,   label:' Ghana '  }   ,
                    {   value:' Greece'  ,   label:' Greece ' }   ,
                    {   value:' Grenada' ,   label:' Grenada' }   ,
                    {   value:' Guatemala'   ,   label:' Guatemala'   }   ,
                    {   value:' Guinea'  ,   label:' Guinea'  }   ,
                    {   value:' Guinea-Bissau'   ,   label:' Guinea-Bissau'   }   ,
                    {   value:' Guyana'  ,   label:' Guyana'  }   ,
                    {   value:' Haiti'   ,   label:' Haiti '  }   ,
                    {   value:' Honduras'    ,   label:' Honduras'    }   ,
                    {   value:' Hungary' ,   label:' Hungary' }   ,
                    {   value:' Iceland' ,   label:' Iceland '}   ,
                    {   value:' India'   ,   label:' India '  }   ,
                    {   value:' Indonesia'   ,   label:' Indonesia'   }   ,
                    {   value:' Iran'    ,   label:' Iran '   }   ,
                    {   value:' Iraq'    ,   label:' Iraq'    }   ,
                    {   value:' Ireland' ,   label:' Ireland '}   ,
                    {   value:' Israel'  ,   label:' Israel'  }   ,
                    {   value:' Italy'   ,   label:' Italy' }   ,
                    {   value:' Jamaica' ,   label:' Jamaica' }   ,
                    {   value:' Japan'   ,   label:' Japan '  }   ,
                    {   value:' Jordan'  ,   label:' Jordan'  }   ,
                    {   value:' Kazakhstan'  ,   label:' Kazakhstan ' }   ,
                    {   value:' Kenya'   ,   label:' Kenya '  }   ,
                    {   value:' Kiribati'    ,   label:' Kiribati'    }   ,
                    {   value:' Kuwait'  ,   label:' Kuwait'  }   ,
                    {   value:' Kyrgyzstan'  ,   label:' Kyrgyzstan'  }   ,
                    {   value:' Lao' ,   label:' Lao' }  ,
                    {   value:' Latvia'  ,   label:' Latvia'  }   ,
                    {   value:' Lebanon' ,   label:' Lebanon' }   ,
                    {   value:' Lesotho' ,   label:' Lesotho' }   ,
                    {   value:' Liberia' ,   label:' Liberia' }   ,
                    {   value:' Libya'   ,   label:' Libya '  }   ,
                    {   value:' Liechtenstein'   ,   label:' Liechtenstein'   }   ,
                    {   value:' Lithuania'   ,   label:' Lithuania '  }   ,
                    {   value:' Luxembourg'  ,   label:' Luxembourg'  }   ,
                    {   value:' Macedonia'   ,   label:' Macedonia '  }   ,
                    {   value:' Madagascar'  ,   label:' Madagascar'  }   ,
                    {   value:' Malawi'  ,   label:' Malawi ' }   ,
                    {   value:' Malaysia'    ,   label:' Malaysia'    }   ,
                    {   value:' Maldives'    ,   label:' Maldives '   }   ,
                    {   value:' Mali'   ,   label:' Mali'    }   ,
                    {   value:' Malta'   ,   label:' Malta'   }   ,
                    {   value:' Marshall Islands'    ,   label:' Marshall Islands '   }   ,
                    {   value:' Mauritania'  ,   label:' Mauritania'  }   ,
                    {   value:' Mauritius'   ,   label:' Mauritius'   }   ,
                    {   value:' Mexico'  ,   label:' Mexico'  }   ,
                    {   value:' Micronesia'    ,   label:' Micronesia'   }   ,
                    {   value:' Monaco'  ,   label:' Monaco'  }   ,
                    {   value:' Mongolia'    ,   label:' Mongolia'    }   ,
                    {   value:' Montenegro'  ,   label:' Montenegro'  }   ,
                    {   value:' Morocco' ,   label:' Morocco' }   ,
                    {   value:' Mozambique'  ,   label:' Mozambique'  }   ,
                    {   value:' Myanmar' ,   label:' Myanmar' }   ,
                    {   value:' Namibia' ,   label:' Namibia '}   ,
                    {   value:' Nauru'   ,   label:' Nauru '  }   ,
                    {   value:' Nepal'   ,   label:' Nepal '  }   ,
                    {   value:' Netherlands' ,   label:' Netherlands' }   ,
                    {   value:' New Zealand' ,   label:' New Zealand' }   ,
                    {   value:' Nicaragua'   ,   label:' Nicaragua '  }   ,
                    {   value:' Niger'   ,   label:' Niger  ' }   ,
                    {   value:' Nigeria' ,   label:' Nigeria '}   ,
                    {   value:' Norway'  ,   label:' Norway ' }   ,
                    {   value:' Oman'    ,   label:' Oman '   }   ,
                    {   value:' Pakistan'    ,   label:' Pakistan '   }   ,
                    {   value:' Palau'   ,   label:' Palau '  }   ,
                    {   value:' Panama'  ,   label:' Panama ' }   ,
                    {   value:' Papua New Guinea'    ,   label:' Papua New Guinea '   }   ,
                    {   value:' Paraguay'    ,   label:' Paraguay '   }   ,
                    {   value:' Peru'    ,   label:' Peru'    }   ,
                    {   value:' Philippines' ,   label:' Philippines '}   ,
                    {   value:' Poland'  ,   label:' Poland ' }   ,
                    {   value:' Portugal'    ,   label:' Portugal '   }   ,
                    {   value:' Qatar'   ,   label:' Qatar  ' }   ,
                    {   value:' Republic of Korea (South Korea)' ,   label:' Republic of Korea (South Korea) '}   ,
                    {   value:' Republic of Moldova' ,   label:' Republic of Moldova '}   ,
                    {   value:' Romania' ,   label:' Romania' }   ,
                    {   value:' Russian Federation'  ,   label:' Russian Federation ' }   ,
                    {   value:' Rwanda'  ,   label:' Rwanda ' }   ,
                    {   value:' Saint Kitts and Nevis'   ,   label:' Saint Kitts and Nevis'   }   ,
                    {   value:' Saint Lucia' ,   label:' Saint Lucia '}   ,
                    {   value:' Saint Vincent and the Grenadines'   ,   label:' Saint Vincent and the Grenadines '   }   ,
                    {   value:' Samoa'   ,   label:' Samoa '  }   ,
                    {   value:' San Marino'  ,   label:' San Marino'  }   ,
                    {   value:' Sao Tome and Principe'   ,   label:' Sao Tome and Principe  ' }   ,
                    {   value:' Saudi Arabia'    ,   label:' Saudi Arabia '   }   ,
                    {   value:' Senegal' ,   label:' Senegal' }   ,
                    {   value:' Serbia'  ,   label:' Serbia ' }   ,
                    {   value:' Seychelles'  ,   label:' Seychelles ' }   ,
                    {   value:' Sierra Leone'    ,   label:' Sierra Leone '   }   ,
                    {   value:' Singapore'   ,   label:' Singapore  ' }   ,
                    {   value:' Slovakia'    ,   label:' Slovakia  '  }   ,
                    {   value:' Slovenia'    ,   label:' Slovenia  '  }   ,
                    {   value:' Solomon Islands' ,   label:' Solomon Islands'  }  ,
                    {   value:' Somalia' ,   label:' Somalia ' }  ,
                    {   value:' South Africa'    ,   label:' South Africa '    }  ,
                    {   value:' South Sudan' ,   label:' South Sudan ' }  ,
                    {   value:' Spain'   ,   label:' Spain    '}  ,
                    {   value:' Sri Lanka'   ,   label:' Sri Lanka '   }  ,
                    {   value:' Sudan'   ,   label:' Sudan    '}  ,
                    {   value:' Suriname'    ,   label:' Suriname  '   }  ,
                    {   value:' Swaziland'   ,   label:' Swaziland  '  }  ,
                    {   value:' Sweden'  ,   label:' Sweden  ' }  ,
                    {   value:' Switzerland' ,   label:' Switzerland ' }  ,
                    {   value:' Syrian Arab Republic'    ,   label:' Syrian Arab Republic  '   }  ,
                    {   value:' Tajikistan'  ,   label:' Tajikistan'   }  ,
                    {   value:' Thailand'    ,   label:' Thailand '    }  ,
                    {   value:' Timor-Leste' ,   label:' Timor-Leste ' }  ,
                    {   value:' Togo'    ,   label:' Togo  '   }  ,
                    {   value:' Tonga'   ,   label:' Tonga '   }  ,
                    {   value:' Trinidad and Tobago' ,   label:' Trinidad and Tobago ' }  ,
                    {   value:' Tunisia' ,   label:' Tunisia ' }  ,
                    {   value:' Turkey'  ,   label:' Turkey  ' }  ,
                    {   value:' Turkmenistan'    ,   label:' Turkmenistan '    }  ,
                    {   value:' Tuvalu'  ,   label:' Tuvalu  ' }  ,
                    {   value:' Uganda'  ,   label:' Uganda  ' }  ,
                    {   value:' Ukraine' ,   label:' Ukraine  '}  ,
                    {   value:' United Arab Emirates'    ,   label:' United Arab Emirates  '   }  ,
                    {   value:' United Kingdom'    ,   label:' United Kingdom'   }  ,
                    {   value:' United Republic of Tanzania' ,   label:' United Republic of Tanzania ' }  ,
                    {   value:' United States of America'    ,   label:' United States of America   '  }  ,
                    {   value:' Uruguay' ,   label:' Uruguay ' }  ,
                    {   value:' Uzbekistan'  ,   label:' Uzbekistan '  }  ,
                    {   value:' Vanuatu' ,   label:' Vanuatu ' }  ,
                    {   value:' Venezuela'   ,   label:' Venezuela  '  }  ,
                    {   value:' Vietnam' ,   label:' Vietnam'  }  ,
                    {   value:' Yemen'   ,   label:' Yemen '   }  ,
                    {   value:' Zambia'  ,   label:' Zambia '  }  ,
                    {   value:' Zimbabwe'    ,   label:' Zimbabwe '    }  ,
                ])
                .attributes({ placeholder: 'Part of customer address. Please select from dropdown list.'})
                .validation({ required: true })
                .label('Country'),
            nga.field('telephone')
                .attributes({ placeholder: 'Customer phone number'})
                .validation({ required: true })
                .label('Telephone'),

            //Login Data Fields

            nga.field('mac_address', 'string')
                .attributes({maxlength: 12})
                .label('Sale mac address'),
            nga.field('channel_stream_source_id', 'reference')
                .targetEntity(admin.getEntity('ChannelStreamSources'))
                .targetField(nga.field('stream_source'))
                .attributes({ placeholder: 'Choose from dropdown list channel stream source for this customer' })
                .label('Channel Stream Source')
                .perPage(-1)
                .validation({ required: true}),
            nga.field('vod_stream_source', 'reference')
                .targetEntity(admin.getEntity('VodStreamSources'))
                .targetField(nga.field('description'))
                .attributes({ placeholder: 'Choose from dropdown list VOD Stream Source for this customer' })
                .label('VOD Stream Source')
                .perPage(-1)
                .validation({ required: true}),
            nga.field('pin', 'string')
                .attributes({ placeholder: 'Must contain 4 numbers' , title: 'Must contain 4 numbers' })
                .validation({ required: true , pattern:'(?=.*\\d)[0-9]{4}' })
                .label('Pin'),
            nga.field('activity_timeout', 'string')
                .attributes({ placeholder: 'Activity time out' })
                .validation({ required: true })
                .defaultValue(10800)
                .label('Activity Time Out (sec)'),
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
                .attributes({ placeholder: 'Select client timezone depending on country' })
                .validation({ required: true })
                .label('Timezone'),

            nga.field('get_messages', 'choice')
                .defaultValue(false)
                .choices([
                    { value: false, label: 'Disabled' },
                    { value: true, label: 'Enabled' }
                ])
                .attributes({ placeholder: 'Choose from dropdown list' })
                .validation({ required: true})
                .label('Get messages'),
            nga.field('get_ads', 'choice')
                .defaultValue(false)
                .choices([
                    { value: false, label: 'Disabled' },
                    { value: true, label: 'Enabled' }
                ])
                .attributes({ placeholder: 'Choose from dropdown list' })
                .validation({ required: true})
                .label('Receive ads'),
            nga.field('show_adult', 'choice')
                .defaultValue(false)
                .choices([
                    { value: false, label: 'Disabled' },
                    { value: true, label: 'Enabled' }
                ])
                .attributes({ placeholder: 'Choose from dropdown list' })
                .validation({ required: true})
                .label('Show adult content'),
            nga.field('auto_timezone','choice')
                .defaultValue(false)
                .choices([
                    { value: false, label: 'Disabled' },
                    { value: true, label: 'Enabled' }
                ])
                .attributes({ placeholder: 'Choose from dropdown list' })
                .validation({ required: true})
                .label('Auto Timezone'),
            nga.field('account_lock','choice')
                .defaultValue(false)
                .choices([
                    { value: false, label: 'Disabled' },
                    { value: true, label: 'Enabled' }
                ])
                .attributes({ placeholder: 'Choose from dropdown list' })
                .label('Account Locked')
                .validation({ required: true}),
            nga.field('beta_user','choice')
                .attributes({ placeholder: 'Choose from dropdown list' })
                .defaultValue(false)
                .choices([
                    { value: false, label: 'Disabled' },
                    { value: true, label: 'Enabled' }
                ])
                .label('Is tester')
                .validation({ required: true}),
            nga.field('template')
                .label('')
                .template(edit_button),
        ]);


    CustomerAccount.editionView()
        .title('<h4>Customer Account <i class="fa fa-angle-right" aria-hidden="true"></i>  Edit: {{ entry.values.username }}</h4>')
        .onSubmitSuccess(['progression', 'notification', '$state', 'entry', 'entity', function(progression, notification, $state, entry, entity) {
            progression.done();
            $state.go($state.get('list'), { entity: entity.name() });
            return false;
        }])
        .actions(['list'])
        .fields([
            //Customer Data Fields
           nga.field('username', 'string')
                .attributes({ placeholder: 'Number,lowercase letter, and at least 2 or more characters', readOnly: true})
                .label('Username')
                .validation({ required: true, pattern: '^[a-z\\d]{2,}$' }),
           nga.field('password', 'password')
                .attributes({ placeholder: '4 or more characters' , title: '4 or more characters' })
                .label('Password')
                .validation({ required: true, pattern: '.{4,}' }),
            nga.field('customer_datum.group_id', 'reference')
                .targetEntity(admin.getEntity('CustomerGroups'))
                .targetField(nga.field('description'))
                .attributes({ placeholder: ' Select from the dropdown list one of the groups you created' })
                .label('Group')
                .perPage(-1)
                .validation({ required: true}),
            nga.field('customer_datum.firstname', 'string')
                .attributes({ placeholder: 'Customer Firstname' })
                .validation({ required: true })
                .label('Firstname'),
            nga.field('customer_datum.lastname', 'string')
                .attributes({ placeholder: 'Customer Lastname' })
                .validation({ required: true })
                .label('Lastname'),
            nga.field('customer_datum.email', 'email')
                .attributes({ placeholder: 'Customer email' })
                .validation({ required: true })
                .label('Email'),
            nga.field('customer_datum.address', 'string')
                .attributes({ placeholder: 'Customer address (for example house number, street or other information)' })
                .validation({ required: true })
                .label('Address'),
            nga.field('customer_datum.city', 'string')
                .attributes({ placeholder: 'Part of customer address'})
                .validation({ required: true })
                .label('City'),
            nga.field('customer_datum.country', 'choice')
                .choices([
                    {   value:' Afghanistan' ,   label:' Afghanistan' }   ,
                    {   value:' Albania' ,   label:' Albania' }   ,
                    {   value:' Algeria' ,   label:' Algeria' }   ,
                    {   value:' Andorra' ,   label:' Andorra' }   ,
                    {   value:' Angola'  ,   label:' Angola'  }   ,
                    {   value:' Antigua and Barbuda' ,   label:' Antigua and Barbuda' }   ,
                    {   value:' Argentina'   ,   label:' Argentina'   }   ,
                    {   value:' Armenia' ,   label:' Armenia' }   ,
                    {   value:' Australia'   ,   label:' Australia'   }   ,
                    {   value:' Austria' ,   label:' Austria' }   ,
                    {   value:' Azerbaijan'  ,   label:' Azerbaijan'  }   ,
                    {   value:' Bahamas' ,   label:' Bahamas' }   ,
                    {   value:' Bahrain' ,   label:' Bahrain' }   ,
                    {   value:' Bangladesh'  ,   label:' Bangladesh'  }   ,
                    {   value:' Barbados'    ,   label:' Barbados'    }   ,
                    {   value:' Belarus' ,   label:' Belarus' }   ,
                    {   value:' Belgium' ,   label:' Belgium' }   ,
                    {   value:' Belize'  ,   label:' Belize'  }   ,
                    {   value:' Benin'   ,   label:' Benin'   }   ,
                    {   value:' Bhutan'  ,   label:' Bhutan'  }   ,
                    {   value:' Bolivia' ,   label:' Bolivia' }   ,
                    {   value:' Bosnia and Herzegovina'  ,   label:' Bosnia and Herzegovina'  }   ,
                    {   value:' Botswana'    ,   label:' Botswana'    }   ,
                    {   value:' Brazil'  ,   label:' Brazil'  }   ,
                    {   value:' Brunei Darussalam'   ,   label:' Brunei Darussalam'   }   ,
                    {   value:' Bulgaria'    ,   label:' Bulgaria'    }   ,
                    {   value:' Burkina Faso'    ,   label:' Burkina Faso'    }   ,
                    {   value:' Burundi' ,   label:' Burundi' }   ,
                    {   value:' Cabo Verde'  ,   label:' Cabo Verde'  }   ,
                    {   value:' Cambodia'    ,   label:' Cambodia'    }   ,
                    {   value:' Cameroon'    ,   label:' Cameroon'    }   ,
                    {   value:' Canada'  ,   label:' Canada'  }   ,
                    {   value:' Central African Republic'    ,   label:' Central African Republic'    }   ,
                    {   value:' Chad'    ,   label:' Chad'    }   ,
                    {   value:' Chile'   ,   label:' Chile'   }   ,
                    {   value:' China'   ,   label:' China'   }   ,
                    {   value:' Colombia'    ,   label:' Colombia'    }   ,
                    {   value:' Comoros' ,   label:' Comoros' }   ,
                    {   value:' Congo'   ,   label:' Congo '  }   ,
                    {   value:' Costa Rica'  ,   label:' Costa Rica'  }   ,
                    {   value:' Côte D Ivoire'   ,   label:' Côte D Ivoire'   }   ,
                    {   value:' Croatia' ,   label:' Croatia' }   ,
                    {   value:' Cuba'    ,   label:' Cuba'    }   ,
                    {   value:' Cyprus'  ,   label:' Cyprus'  }   ,
                    {   value:' Czech Republic'  ,   label:' Czech Republic'  }   ,
                    {   value:' (North Korea)' ,   label:'(North Korea)' }   ,
                    {   value:' Congo' ,   label:' Congo' }   ,
                    {   value:' Denmark' ,   label:' Denmark' }   ,
                    {   value:' Djibouti'    ,   label:' Djibouti'    }   ,
                    {   value:' Dominica'    ,   label:' Dominica'    }   ,
                    {   value:' Dominican Republic'  ,   label:' Dominican Republic'  }   ,
                    {   value:' Ecuador' ,   label:' Ecuador' }   ,
                    {   value:' Egypt'   ,   label:' Egypt'   }   ,
                    {   value:' El Salvador' ,   label:' El Salvador' }   ,
                    {   value:' Equatorial Guinea'   ,   label:' Equatorial Guinea'   }   ,
                    {   value:' Eritrea' ,   label:' Eritrea' }   ,
                    {   value: 'Estonia' ,   label:' Estonia' }   ,
                    {   value:' Ethiopia'    ,   label:' Ethiopia'    }   ,
                    {   value:' Fiji'    ,   label:' Fiji'    }   ,
                    {   value:' Finland' ,   label:' Finland' }   ,
                    {   value:' France'  ,   label:' France'  }   ,
                    {   value:' Gabon'   ,   label:' Gabon '  }   ,
                    {   value:' Gambia'  ,   label:' Gambia ' }   ,
                    {   value:' Georgia' ,   label:' Georgia' }   ,
                    {   value:' Germany' ,   label:' Germany '}   ,
                    {   value:' Ghana'   ,   label:' Ghana '  }   ,
                    {   value:' Greece'  ,   label:' Greece ' }   ,
                    {   value:' Grenada' ,   label:' Grenada' }   ,
                    {   value:' Guatemala'   ,   label:' Guatemala'   }   ,
                    {   value:' Guinea'  ,   label:' Guinea'  }   ,
                    {   value:' Guinea-Bissau'   ,   label:' Guinea-Bissau'   }   ,
                    {   value:' Guyana'  ,   label:' Guyana'  }   ,
                    {   value:' Haiti'   ,   label:' Haiti '  }   ,
                    {   value:' Honduras'    ,   label:' Honduras'    }   ,
                    {   value:' Hungary' ,   label:' Hungary' }   ,
                    {   value:' Iceland' ,   label:' Iceland '}   ,
                    {   value:' India'   ,   label:' India '  }   ,
                    {   value:' Indonesia'   ,   label:' Indonesia'   }   ,
                    {   value:' Iran'    ,   label:' Iran '   }   ,
                    {   value:' Iraq'    ,   label:' Iraq'    }   ,
                    {   value:' Ireland' ,   label:' Ireland '}   ,
                    {   value:' Israel'  ,   label:' Israel'  }   ,
                    {   value:' Italy'   ,   label:' Italy' }   ,
                    {   value:' Jamaica' ,   label:' Jamaica' }   ,
                    {   value:' Japan'   ,   label:' Japan '  }   ,
                    {   value:' Jordan'  ,   label:' Jordan'  }   ,
                    {   value:' Kazakhstan'  ,   label:' Kazakhstan ' }   ,
                    {   value:' Kenya'   ,   label:' Kenya '  }   ,
                    {   value:' Kiribati'    ,   label:' Kiribati'    }   ,
                    {   value:' Kuwait'  ,   label:' Kuwait'  }   ,
                    {   value:' Kyrgyzstan'  ,   label:' Kyrgyzstan'  }   ,
                    {   value:' Lao' ,   label:' Lao' }  ,
                    {   value:' Latvia'  ,   label:' Latvia'  }   ,
                    {   value:' Lebanon' ,   label:' Lebanon' }   ,
                    {   value:' Lesotho' ,   label:' Lesotho' }   ,
                    {   value:' Liberia' ,   label:' Liberia' }   ,
                    {   value:' Libya'   ,   label:' Libya '  }   ,
                    {   value:' Liechtenstein'   ,   label:' Liechtenstein'   }   ,
                    {   value:' Lithuania'   ,   label:' Lithuania '  }   ,
                    {   value:' Luxembourg'  ,   label:' Luxembourg'  }   ,
                    {   value:' Macedonia'   ,   label:' Macedonia '  }   ,
                    {   value:' Madagascar'  ,   label:' Madagascar'  }   ,
                    {   value:' Malawi'  ,   label:' Malawi ' }   ,
                    {   value:' Malaysia'    ,   label:' Malaysia'    }   ,
                    {   value:' Maldives'    ,   label:' Maldives '   }   ,
                    {   value:' Mali'   ,   label:' Mali'    }   ,
                    {   value:' Malta'   ,   label:' Malta'   }   ,
                    {   value:' Marshall Islands'    ,   label:' Marshall Islands '   }   ,
                    {   value:' Mauritania'  ,   label:' Mauritania'  }   ,
                    {   value:' Mauritius'   ,   label:' Mauritius'   }   ,
                    {   value:' Mexico'  ,   label:' Mexico'  }   ,
                    {   value:' Micronesia'    ,   label:' Micronesia'   }   ,
                    {   value:' Monaco'  ,   label:' Monaco'  }   ,
                    {   value:' Mongolia'    ,   label:' Mongolia'    }   ,
                    {   value:' Montenegro'  ,   label:' Montenegro'  }   ,
                    {   value:' Morocco' ,   label:' Morocco' }   ,
                    {   value:' Mozambique'  ,   label:' Mozambique'  }   ,
                    {   value:' Myanmar' ,   label:' Myanmar' }   ,
                    {   value:' Namibia' ,   label:' Namibia '}   ,
                    {   value:' Nauru'   ,   label:' Nauru '  }   ,
                    {   value:' Nepal'   ,   label:' Nepal '  }   ,
                    {   value:' Netherlands' ,   label:' Netherlands' }   ,
                    {   value:' New Zealand' ,   label:' New Zealand' }   ,
                    {   value:' Nicaragua'   ,   label:' Nicaragua '  }   ,
                    {   value:' Niger'   ,   label:' Niger  ' }   ,
                    {   value:' Nigeria' ,   label:' Nigeria '}   ,
                    {   value:' Norway'  ,   label:' Norway ' }   ,
                    {   value:' Oman'    ,   label:' Oman '   }   ,
                    {   value:' Pakistan'    ,   label:' Pakistan '   }   ,
                    {   value:' Palau'   ,   label:' Palau '  }   ,
                    {   value:' Panama'  ,   label:' Panama ' }   ,
                    {   value:' Papua New Guinea'    ,   label:' Papua New Guinea '   }   ,
                    {   value:' Paraguay'    ,   label:' Paraguay '   }   ,
                    {   value:' Peru'    ,   label:' Peru'    }   ,
                    {   value:' Philippines' ,   label:' Philippines '}   ,
                    {   value:' Poland'  ,   label:' Poland ' }   ,
                    {   value:' Portugal'    ,   label:' Portugal '   }   ,
                    {   value:' Qatar'   ,   label:' Qatar  ' }   ,
                    {   value:' Republic of Korea (South Korea)' ,   label:' Republic of Korea (South Korea) '}   ,
                    {   value:' Republic of Moldova' ,   label:' Republic of Moldova '}   ,
                    {   value:' Romania' ,   label:' Romania' }   ,
                    {   value:' Russian Federation'  ,   label:' Russian Federation ' }   ,
                    {   value:' Rwanda'  ,   label:' Rwanda ' }   ,
                    {   value:' Saint Kitts and Nevis'   ,   label:' Saint Kitts and Nevis'   }   ,
                    {   value:' Saint Lucia' ,   label:' Saint Lucia '}   ,
                    {   value:' Saint Vincent and the Grenadines'   ,   label:' Saint Vincent and the Grenadines '   }   ,
                    {   value:' Samoa'   ,   label:' Samoa '  }   ,
                    {   value:' San Marino'  ,   label:' San Marino'  }   ,
                    {   value:' Sao Tome and Principe'   ,   label:' Sao Tome and Principe  ' }   ,
                    {   value:' Saudi Arabia'    ,   label:' Saudi Arabia '   }   ,
                    {   value:' Senegal' ,   label:' Senegal' }   ,
                    {   value:' Serbia'  ,   label:' Serbia ' }   ,
                    {   value:' Seychelles'  ,   label:' Seychelles ' }   ,
                    {   value:' Sierra Leone'    ,   label:' Sierra Leone '   }   ,
                    {   value:' Singapore'   ,   label:' Singapore  ' }   ,
                    {   value:' Slovakia'    ,   label:' Slovakia  '  }   ,
                    {   value:' Slovenia'    ,   label:' Slovenia  '  }   ,
                    {   value:' Solomon Islands' ,   label:' Solomon Islands'  }  ,
                    {   value:' Somalia' ,   label:' Somalia ' }  ,
                    {   value:' South Africa'    ,   label:' South Africa '    }  ,
                    {   value:' South Sudan' ,   label:' South Sudan ' }  ,
                    {   value:' Spain'   ,   label:' Spain    '}  ,
                    {   value:' Sri Lanka'   ,   label:' Sri Lanka '   }  ,
                    {   value:' Sudan'   ,   label:' Sudan    '}  ,
                    {   value:' Suriname'    ,   label:' Suriname  '   }  ,
                    {   value:' Swaziland'   ,   label:' Swaziland  '  }  ,
                    {   value:' Sweden'  ,   label:' Sweden  ' }  ,
                    {   value:' Switzerland' ,   label:' Switzerland ' }  ,
                    {   value:' Syrian Arab Republic'    ,   label:' Syrian Arab Republic  '   }  ,
                    {   value:' Tajikistan'  ,   label:' Tajikistan'   }  ,
                    {   value:' Thailand'    ,   label:' Thailand '    }  ,
                    {   value:' Timor-Leste' ,   label:' Timor-Leste ' }  ,
                    {   value:' Togo'    ,   label:' Togo  '   }  ,
                    {   value:' Tonga'   ,   label:' Tonga '   }  ,
                    {   value:' Trinidad and Tobago' ,   label:' Trinidad and Tobago ' }  ,
                    {   value:' Tunisia' ,   label:' Tunisia ' }  ,
                    {   value:' Turkey'  ,   label:' Turkey  ' }  ,
                    {   value:' Turkmenistan'    ,   label:' Turkmenistan '    }  ,
                    {   value:' Tuvalu'  ,   label:' Tuvalu  ' }  ,
                    {   value:' Uganda'  ,   label:' Uganda  ' }  ,
                    {   value:' Ukraine' ,   label:' Ukraine  '}  ,
                    {   value:' United Arab Emirates'    ,   label:' United Arab Emirates  '   }  ,
                    {   value:' United Kingdom'    ,   label:' United Kingdom'   }  ,
                    {   value:' United Republic of Tanzania' ,   label:' United Republic of Tanzania ' }  ,
                    {   value:' United States of America'    ,   label:' United States of America   '  }  ,
                    {   value:' Uruguay' ,   label:' Uruguay ' }  ,
                    {   value:' Uzbekistan'  ,   label:' Uzbekistan '  }  ,
                    {   value:' Vanuatu' ,   label:' Vanuatu ' }  ,
                    {   value:' Venezuela'   ,   label:' Venezuela  '  }  ,
                    {   value:' Vietnam' ,   label:' Vietnam'  }  ,
                    {   value:' Yemen'   ,   label:' Yemen '   }  ,
                    {   value:' Zambia'  ,   label:' Zambia '  }  ,
                    {   value:' Zimbabwe'    ,   label:' Zimbabwe '    }  ,
                ])
                .attributes({ placeholder: 'Part of customer address. Please select from dropdown list.'})
                .validation({ required: true })
                .label('Country'),
            nga.field('customer_datum.telephone')
                .attributes({ placeholder: 'Customer phone number'})
                .validation({ required: true })
                .label('Telephone'),

            //Login Data Fields

            nga.field('mac_address', 'string')
                .attributes({maxlength: 12})
                .label('Sale mac address'),
            nga.field('channel_stream_source_id', 'reference')
                .targetEntity(admin.getEntity('ChannelStreamSources'))
                .targetField(nga.field('stream_source'))
                .attributes({ placeholder: 'Choose from dropdown list channel stream source for this customer' })
                .label('Channel Stream Source')
                .perPage(-1)
                .validation({ required: true}),
            nga.field('vod_stream_source', 'reference')
                .targetEntity(admin.getEntity('VodStreamSources'))
                .targetField(nga.field('description'))
                .attributes({ placeholder: 'Choose from dropdown list VOD Stream Source for this customer' })
                .label('VOD Stream Source')
                .perPage(-1)
                .validation({ required: true}),
            nga.field('pin', 'string')
                .attributes({ placeholder: 'Must contain 4 numbers' , title: 'Must contain 4 numbers' })
                .validation({ required: true , pattern:'(?=.*\\d)[0-9]{4}' })
                .label('Pin'),
            nga.field('activity_timeout', 'string')
                .attributes({ placeholder: 'Activity time out' })
                .validation({ required: true })
                .defaultValue(10800)
                .label('Activity Time Out (sec)'),
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
                .attributes({ placeholder: 'Select client timezone depending on country' })
                .validation({ required: true })
                .label('Timezone'),

            nga.field('get_messages', 'choice')
                .defaultValue(false)
                .choices([
                    { value: false, label: 'Disabled' },
                    { value: true, label: 'Enabled' }
                ])
                .attributes({ placeholder: 'Choose from dropdown list' })
                .validation({ required: true})
                .label('Get messages'),
            nga.field('get_ads', 'choice')
                .defaultValue(false)
                .choices([
                    { value: false, label: 'Disabled' },
                    { value: true, label: 'Enabled' }
                ])
                .attributes({ placeholder: 'Choose from dropdown list' })
                .validation({ required: true})
                .label('Receive ads'),
            nga.field('show_adult', 'choice')
                .defaultValue(false)
                .choices([
                    { value: false, label: 'Disabled' },
                    { value: true, label: 'Enabled' }
                ])
                .attributes({ placeholder: 'Choose from dropdown list' })
                .validation({ required: true})
                .label('Show adult content'),
            nga.field('auto_timezone','choice')
                .defaultValue(false)
                .choices([
                    { value: false, label: 'Disabled' },
                    { value: true, label: 'Enabled' }
                ])
                .attributes({ placeholder: 'Choose from dropdown list' })
                .validation({ required: true})
                .label('Auto Timezone'),
            nga.field('account_lock','choice')
                .defaultValue(false)
                .choices([
                    { value: false, label: 'Disabled' },
                    { value: true, label: 'Enabled' }
                ])
                .attributes({ placeholder: 'Choose from dropdown list' })
                .label('Account Locked')
                .validation({ required: true}),
            nga.field('beta_user','choice')
                .attributes({ placeholder: 'Choose from dropdown list' })
                .defaultValue(false)
                .choices([
                    { value: false, label: 'Disabled' },
                    { value: true, label: 'Enabled' }
                ])
                .label('Is tester')
                .validation({ required: true}),
            nga.field('template')
                .label('')
                .template(edit_button),


            nga.field('Subscriptions', 'referenced_list')
                .label('Subscription')
                .targetEntity(admin.getEntity('Subscriptions'))
                .targetReferenceField('login_id')
                .targetFields([
                    nga.field('package_id', 'reference')
                        .targetEntity(admin.getEntity('Packages'))
                        .targetField(nga.field('package_name'))
                        .isDetailLink(false)
                        .label('Package'),
                    nga.field('package_id', 'reference')
                        .targetEntity(admin.getEntity('Packages'))
                        .targetField(nga.field('package_type_id')
                            .map(function truncate(value) {
                                if (value === 1) {
                                    return 'Live big screen';
                                } else if (value === 2) {
                                    return 'Live small screen';
                                }  else if (value === 3) {
                                    return 'Vod big screen';
                                } else if (value === 4) {
                                    return 'Vod small screen';
                                }
                            }))
                        .isDetailLink(false)
                        .label('Package Type'),
                    nga.field('start_date', 'date')
                        .cssClasses('hidden-xs')
                        .template(function (entry) {
                            var moment = new Date().toISOString().slice(0,10);
                            var ng_vlera_start = new Date(entry.values.start_date).toISOString().slice(0,10);
                            var ng_vlera_end = new Date(entry.values.end_date).toISOString().slice(0,10);
                            if ((moment >= ng_vlera_start) && (moment <= ng_vlera_end)) {
                                return ng_vlera_start.fontcolor("green");
                            } else {
                                return ng_vlera_start.fontcolor("red").bold();
                            }
                        })
                        .label('Start date'),
                    nga.field('end_date', 'date')
                        .cssClasses('hidden-xs')
                        .template(function (entry) {
                            var moment = new Date().toISOString().slice(0,10);
                            var ng_vlera_start = new Date(entry.values.start_date).toISOString().slice(0,10);
                            var ng_vlera_end = new Date(entry.values.end_date).toISOString().slice(0,10);
                            if ((moment >= ng_vlera_start) && (moment <= ng_vlera_end)) {
                                return ng_vlera_end.fontcolor("green");
                            } else {
                                return ng_vlera_end.fontcolor("red").bold();
                            }
                        })
                        .label('End date'),
                ]),

            nga.field('')
                .label('')
                .template('<ma-create-button entity-name="Subscriptions" class="pull-right" label="ADD SUBSCRIPTION" default-values="{ login_id: entry.values.id }"></ma-create-button>'),


            nga.field('Devices', 'referenced_list')
                .label('Devices')
                .targetEntity(admin.getEntity('Devices'))
                .targetReferenceField('login_data_id')
                .targetFields([
                    nga.field('login_data_id', 'reference')
                        .targetEntity(admin.getEntity('LoginData'))
                        .targetField(nga.field('username'))
                        .isDetailLink(false)
                        .label('Account'),
                    nga.field('device_ip')
                        .cssClasses('hidden-xs')
                        .label('Device IP'),
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
                        .cssClasses('hidden-xs')
                        .label('App ID'),
                    nga.field('app_version')
                        .cssClasses('hidden-xs')
                        .label('App Version'),
                    nga.field('ntype')
                        .cssClasses('hidden-xs')
                        .label('Ntype'),
                    nga.field('updatedAt','date')
                        .cssClasses('hidden-xs')
                        .label('Last Updated'),
                    nga.field('device_brand')
                        .cssClasses('hidden-xs')
                        .label('Device Brand'),
                    nga.field('device_active','boolean')
                        .label('Device Active'),
                ])
                .sortField('appid')
                .sortDir('ASC')
                .listActions(['edit']),


            nga.field('Salesreports', 'referenced_list')
                .label('Sale Reports')
                .targetEntity(nga.entity('Salesreports'))
                .targetReferenceField('login_data_id')
                .targetFields([
                    nga.field('user_id', 'reference')
                        .targetEntity(admin.getEntity('Users'))
                        .targetField(nga.field('username'))
                        .isDetailLink(false)
                        .cssClasses('hidden-xs')
                        .label('User'),
                    nga.field('on_behalf_id','reference')
                        .targetEntity(admin.getEntity('Users'))
                        .targetField(nga.field('username'))
                        .isDetailLink(false)
                        .cssClasses('hidden-xs')
                        .label('On Behalf of'),
                    nga.field('saledate', 'date')
                        .cssClasses('hidden-xs')
                        .label('Sale Date'),
                    nga.field('combo_id', 'reference')
                        .targetEntity(admin.getEntity('Combos'))
                        .targetField(nga.field('name'))
                        .isDetailLink(false)
                        .label('Product')
                ])
                .listActions(['<ma-edit-button entry="entry" entity="entity" label="Cancel Subscription" size="xs"></ma-edit-button>']),
            nga.field('custom_action')
                .label('')
                .template('<show-invoice post="entry" class="pull-right"></show-invoice>'),



        ]);




    return CustomerAccount;

}