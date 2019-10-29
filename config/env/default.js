'use strict';

module.exports = {
  app: {
    title: 'MAGOWARE',
    description: 'Magoware Administartion Portal',
    keywords: 'IPTV, Middleware, Backend, Backoffice, ',
    googleAnalyticsTrackingID: process.env.GOOGLE_ANALYTICS_TRACKING_ID || '',
    reCaptchaSecret: process.env.RECAPTCHA_SECRET || '1234'
  },
  port: process.env.PORT || 80,
  templateEngine: 'swig',
  // Session Cookie settings
  sessionCookie: {
    // session expiration is set by default to 24 hours
    maxAge: 24 * (60 * 60 * 1000),
    // httpOnly flag makes sure the cookie is only accessed
    // through the HTTP protocol and not JS/browser
    httpOnly: true,
    // secure cookie should be turned to true to provide additional
    // layer of security so that the cookie is set only when working
    // in HTTPS mode.
    secure: Boolean(process.env.ssl) || true
  },
  // sessionSecret should be changed for security measures and concerns
  sessionSecret: '',
  // sessionKey is set to the generic sessionId key used by PHP applications
  // for obsecurity reasons
  sessionKey: 'sessionId',
  sessionCollection: 'sessions',
  logo: 'pubic/admin/images/mago.png',
  favicon: 'public/admin/favicon.ico'
};
