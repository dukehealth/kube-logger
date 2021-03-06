const assert = require('assert');

const logger = require('../')('web');

describe ('test the logger function',()=>{
  it ('should load the file normally',()=>{
    assert.notEqual(logger,null);
    logger.info('This is a test',{a:4,b:6},'another string');
    // logger.stream.write('Hello');
    logger.info('hola','todos');
    logger.info({a:'b'});
  });

  it ('should not fail with multiple modules',()=>{
    const l = require('../')('app');
    assert.notEqual(l,null);
    l.info('Test');
    logger.info('Test');
  });

  it ('should correctly allow splat',()=>{
    const l = require('../')('splat');
    l.info('test',1,'test',2);
    l.info('test %d test %d',1,2);
    l.info('test %O',{a:3});
    l.info('test %o',{a:5});
    l.info('test %j',{a:4});
    l.info('test %% %d',2);
    l.info('test %d %s',1,2,3);
    l.info('test %d %s %d',1,2,3);
  });

  it ('should return a valid morgan object',()=>{
    const morgan = require('../')('web',{loglevel:'http'}).morgan('combined');
    assert.notEqual(morgan,null);
    // console.log(morgan);
    morgan({headers:[]},{},()=>{});
    morgan({headers:[]},{},()=>{});
  });

  it ('should maks strings correcty',()=>{
    const morgan = require('../')('web',{
      loglevel:'http',
      masks:['MRN=([0-9|a-z|A-Z]*)']
    }).morgan('combined');
    assert.notEqual(morgan,null);
    let req = {};
    req.headers = [];
    req.originalUrl = '/X=asdf&MRN=123';
    morgan(req,{},()=>{});
    morgan({headers:[]},{},()=>{});
  });
  it ('should maks two strings correcty',()=>{
    const morgan = require('../')('web',{
      loglevel:'http',
      masks:['MRN=([0-9|a-z|A-Z]*)']
    }).morgan('combined');
    assert.notEqual(morgan,null);
    let req = {};
    req.headers = [];
    req.originalUrl = '/X=asdf&MRN=123&ExternalId=234324&MRN=2342';
    morgan(req,{},()=>{});
  });

  it ('should mask regular logs',()=>{
    const logger = require('../')('masked',{
      masks:['234(\\d*)']
    });
    logger.info('12345678abc');
  });

  it ('should respect multiple masks',()=>{
    const logger = require('../')('masked',{
      masks:[
        'MRN=([A-Z|\\d]*)',
        'ID=(\\d*)'
      ]
    });
    logger.info('/test/?MRN=DY2343&something=FD32342&2ndMRN=A6D7&ID=23432');
  });

  it ('should not crash with hex',()=>{
    let b = Buffer.from('Hello');
    const logger = require('../')('hex');
    logger.info(b,b.toString('hex'));
  });

  it ('should not crash with two parameters and the first is null',()=>{
    const logger = require('../')('null');
    logger.debug(null,null);
  });
});