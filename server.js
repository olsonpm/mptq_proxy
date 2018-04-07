//---------//
// Imports //
//---------//

const fs = require('fs'),
  http = require('http'),
  https = require('https'),
  Koa = require('koa'),
  koaHelmet = require('koa-helmet'),
  koaProxies = require('koa-proxies'),
  koaSslify = require('koa-sslify'),
  koaStatic = require('koa-static'),
  path = require('path')

//
//------//
// Init //
//------//

validateEnvironmentVars()

const staticDir = path.join(__dirname, 'static'),
  oneYearInSeconds = 60 * 60 * 24 * 365,
  sslOptions = {
    key: fs.readFileSync(process.env.MPTQ_PRIVKEY, 'utf8'),
    cert: fs.readFileSync(process.env.MPTQ_FULLCHAIN, 'utf8'),
  }

//
//------//
// Main //
//------//

const app = new Koa()
  .use(
    koaHelmet.hsts({
      maxAge: oneYearInSeconds,
      includeSubDomains: false,
    })
  )
  .use(
    koaSslify({
      specCompliantDisallow: true,
    })
  )
  .use(koaStatic(staticDir, { hidden: true }))
  .use(
    koaProxies('/', {
      target: process.env.MAILPILE_URL,
    })
  )

http.createServer(app.callback()).listen(80)
https.createServer(sslOptions, app.callback()).listen(443)

// eslint-disable-next-line no-console
console.log(`listening on port 80 and 443`)

//
//------------------//
// Helper Functions //
//------------------//

function validateEnvironmentVars() {
  const missingEnvVars = []
  if (!process.env.MAILPILE_URL) missingEnvVars.push('MAILPILE_URL')
  if (!process.env.MPTQ_PRIVKEY) missingEnvVars.push('MPTQ_PRIVKEY')
  if (!process.env.MPTQ_FULLCHAIN) missingEnvVars.push('MPTQ_FULLCHAIN')

  if (missingEnvVars.length) {
    throw new Error(
      'The following environment variables are missing\n' +
        missingEnvVars.join(', ')
    )
  }
}
