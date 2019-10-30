'use strict'

const config = {
    max_body_size: '100kb',
    cors: [
        //if empty all origins are ok
    ],
    rate_limit: {
        enabled: true,
        max_request_min: 100,
        protected_routes: [
            '/apiv2',
            '/apiv3',
            '/api/auth'
        ],
        ip_whitelist: [
            "127.0.0.1"
        ]
    }
}

module.exports = config
