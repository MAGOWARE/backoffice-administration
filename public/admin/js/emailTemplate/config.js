import edit_button from '../edit_button.html';

export default function (nga, admin) {
    var emailTemplate = admin.getEntity('EmailTemplate');

    emailTemplate.listView()
        .title('<h4>Email Template <i class="fa fa-angle-right" aria-hidden="true"></i> List</h4>')
        .listActions(['edit','delete'])
        .batchActions([])
        .fields([
            nga.field('id')
                .label('ID'),
            nga.field('template_id', 'choice')
                .choices([
                    { value: 'code-pin-email', label: 'Email Template for Forgot Pin' },
                    { value: 'new-account', label: 'Email Template for New Account' },
                    { value: 'new-email', label: 'Email Template for New Email' },
                    { value: 'reset-password-email', label: 'Email Template for Reset Password' },
                    { value: 'weather-widget', label: 'Weather Widget' },
                    { value: 'invoice-info', label: 'Invoice Information' },
                    { value: 'user-invite-email', label: 'User Invite Email' }
                    // { value: 'reset-password-confirm-email', label: '' },
                    // { value: 'reset-password-email', label: '' },
                    // { value: 'reset-password-enter-password', label: '' },
                    // { value: 'salesreport-invoice', label: '' },
                ])
                .label('Template ID'),
            nga.field('title', 'string')
                .label('Title'),
            nga.field('language', 'string')
                .label('Language'),
            nga.field('content', 'text')
                .label('Content')
        ]);

    emailTemplate.creationView()
        .title('<h4>Email Template <i class="fa fa-angle-right" aria-hidden="true"></i> Create: Template</h4>')
        .fields([
            nga.field('template_id', 'choice')
                .attributes({ placeholder: 'Choose from dropdown list' })
                .choices([
                    { value: 'code-pin-email', label: 'Email Template for Forgot Pin' },
                    { value: 'new-account', label: 'Email Template for New Account' },
                    { value: 'new-email', label: 'Email Template for New Email' },
                    { value: 'reset-password-email', label: 'Email Template for Reset Password' },
                    { value: 'weather-widget', label: 'Weather Widget' },
                    { value: 'invoice-info', label: 'Invoice Information' },
                    { value: 'user-invite-email', label: 'User Invite Email' }
                    // { value: 'reset-password-confirm-email', label: '' },
                    // { value: 'reset-password-email', label: '' },
                    // { value: 'reset-password-enter-password', label: '' },
                    // { value: 'salesreport-invoice', label: '' },
                ])
                .validation({required: true})
                .label('Template ID'),
            nga.field('title', 'string')
                .attributes({ placeholder: 'Title' })
                .validation({ required: true })
                .label('Title'),
            nga.field('language', 'choice')
                .attributes({ placeholder: 'Choose from dropdown list' })
                .choices([
                    { value: 'eng', label: 'English' },
                    { value: 'fre', label: 'French' },
                    { value: 'spa', label: 'Spanish' },
                    { value: 'sqi', label: 'Albanian' },
                    { value: 'pt', label: 'Portuguese' }
                ])
                .validation({ required: true })
                .label('Language'),
            nga.field('content', 'text')
                .attributes({ placeholder: 'Content' })
                .validation({ required: true })
                .label('Content'),
            nga.field('template')
                .label('')
                .template(edit_button)
        ]);


    emailTemplate.editionView()
        .actions(['list'])
        .title('<h4>Email Template <i class="fa fa-angle-right" aria-hidden="true"></i> Edit: {{ entry.values.id }}</h4>')
        .fields([
            nga.field('template_id', 'choice')
                .attributes({ placeholder: 'Choose from dropdown list' })
                .choices([
                    { value: 'code-pin-email', label: 'Email Template for Forgot Pin' },
                    { value: 'new-account', label: 'Email Template for New Account' },
                    { value: 'new-email', label: 'Email Template for New Email' },
                    { value: 'reset-password-email', label: 'Email Template for Reset Password' },
                    { value: 'weather-widget', label: 'Weather Widget' },
                    { value: 'invoice-info', label: 'Invoice Information' },
                    { value: 'user-invite-email', label: 'User Invite Email' }
                    // { value: 'reset-password-confirm-email', label: '' },
                    // { value: 'reset-password-email', label: '' },
                    // { value: 'reset-password-enter-password', label: '' },
                    // { value: 'salesreport-invoice', label: '' },
                ])
                .validation({required: true})
                .label('Template ID'),
            nga.field('title', 'string')
                .attributes({ placeholder: 'Title' })
                .validation({ required: true })
                .label('Title'),
            nga.field('language', 'choice')
                .attributes({ placeholder: 'Choose from dropdown list' })
                .choices([
                    { value: 'eng', label: 'English' },
                    { value: 'fre', label: 'French' },
                    { value: 'spa', label: 'Spanish' },
                    { value: 'sqi', label: 'Albanian' },
                    { value: 'pt', label: 'Portuguese' }
                ])
                .validation({ required: true })
                .label('Language'),
            nga.field('content', 'text')
                .attributes({ placeholder: 'Content' })
                .validation({ required: true })
                .label('Content'),
            nga.field('template')
                .label('')
                .template(edit_button)
        ]);

    emailTemplate.deletionView()
        .title('<h4>Email Template <i class="fa fa-angle-right" aria-hidden="true"></i> Remove <span style ="color:red;"> {{ entry.values.id }}')
        .actions(['<ma-back-button entry="entry" entity="entity"></ma-back-button>'])

    return emailTemplate;

}