# kubernetes-logger

A derivative of winston and morgan to facilitate uniform logging for environments like k8s where all logs go to stdout.

## Features
- All the features of winston (levels, standard formatting, etc)
- Preset to all go to stdout
- Standard format, ready for machine consumption 
- Args expansion, just like console.log
- Supports strings and all native objects
- Adds a label for the specific type of logging so you can discriminate when analyzing your logs
- Incorporates morgan logging for http logs
- Regex based masking

## To install
```bash
npm install --save kubernetes-logger
```

## To use
If you used winston before, you can just add the module to the instantiation.  Winston was usually used by creating a custom logger function to customize the transports and output, so in your code you would usually just have something like this:

```javascript
const logger = require('./utils/logger');
logger.info('This is an info message');
logger.error('This is an error');
```

But now, you would instantiate with a module name, or label:
```javascript
const logger = require('kubernetes-logger')('app');
logger.info('This is an info message');
logger.error('This is an error');
```
Output:
```bash
2020-05-08T12:22:43.821Z [app] info: This is an info message
2020-05-08T12:22:43.822Z [app] error: This is an error
```
### Loglevel
`kubernetes-logger` supports all the log levels supported by winston. For more information checkout the very complete [winston documentation](https://www.npmjs.com/package/winston#using-logging-levels).

The default loglevel is `info`, but it can be overriden from code:
```javascript
const logger = require('kubernetes-logger')('web',{loglevel:'http'});
```
or from an environment variable:
```bash
export LOG_LEVEL=debug
```
!!! note
Changing the loglevel from code takes precedence, so if you change the LOG_LEVEL environment variable, it will change it for all kubernetes-logger instances, but you can override from code. 


## Advanced features
### Args expansion... just like console.log
```javascript
logger.info('com.apple.myapp','This is cool');
logger.info('Test',1,2,3);
logger.info('Total: %d pounds of %s',1000,'chicken');
```
```bash
2020-05-08T12:22:43.821Z [app] info: com.apple.myapp This is cool
2020-05-08T12:22:43.822Z [app] info: Test 1 2 3
2020-05-08T12:22:43.823Z [app] info: Total: 1000 pounds of chicken
```

### Supports all native types... and more
```javascript
logger.info('This is a test',{a:4,b:'6'},1,'another string');
// 2020-05-08T12:22:43.821Z [app] info: This is a test {"a":4,"b":"6"} 1 another string
```
### Label to discriminate source
```javascript
const logger = require('kubernetes-logger')('app');
const apiLogger = require('kubernetes-logger')('api');
logger.info('This is an info message');
apiLogger.info('This is an API message');
logger.error('This is an error');
// 2020-05-08T12:22:43.821Z [app] info: This is an info message
// 2020-05-08T12:22:43.822Z [api] info: This is an API message
// 2020-05-08T12:22:43.823Z [app] error: This is an error
```

### Morgan logging support
```javascript
const morganLogger = require('kubernetes-logger')('web').morgan('combined');
// app could be express or connect
app.use(morganLogger);
// 2020-05-08T11:49:47.480Z [web] http: ::1 - - [08/May/2020:11:49:47 +0000] "GET /images/dh_horz_white.png HTTP/1.1" 200 - "http://localhost:8080/?MRN=asd&ExternalId=SP19-030353" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.113 Safari/537.36"
```
If you don't use express or connect, you can still use the morgan logger by passing a request, response and fake next function:
```javascript
const morganLogger = require('kubernetes-logger')('web').morgan('tiny');
// and when you are processing the request
morganLogger(req,res,()=>true);
```
`kubernetes-logger` supports all the out-of-the-box logging formats of morgan, but highly recommends `combined`, because it includes the client agent which might be useful in processing your logs and filtering out live and ready probes from real requests. For more information on logging formats, please visit [morgan](https://www.npmjs.com/package/morgan).

### RegExp based masking
```javascript
const logger = require('kubernetes-logger')('masked',{
  masks:[
    'MRN=([A-Z|\\d]*)',
    'ID=(\\d*)'
  ]
});
logger.info('/test/?MRN=DY2343&something=FD32342&ID=23432')
```

```bash
2020-05-11T17:41:53.005Z [masked] info: loglevel(LOG_LEVEL): masked info
2020-05-11T17:41:53.006Z [masked] info: /test/?MRN=******&something=FD32342&ID=*****
```
