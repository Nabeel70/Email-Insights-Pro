const { onRequest } = require('firebase-functions/v2/https');
  const server = import('firebase-frameworks');
  exports.ssremailinsightsprolcd3 = onRequest({"region":"us-central1","secrets":["CRON_SECRET","EPMAILPRO_PUBLIC_KEY","DAILY_REPORT_RECIPIENT_EMAIL","SMTP_HOST","SMTP_PORT","SMTP_USER","SMTP_PASSWORD","FROM_EMAIL"]}, (req, res) => server.then(it => it.handle(req, res)));
  