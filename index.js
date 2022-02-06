const winston = require('winston');
const morgan = require('morgan');
const util = require('util');
const loglevel = process.env.LOG_LEVEL || 'info';
const rex = /%[oOsdj]/gm;

const multiArgs = {
  transform(info) {
    const { message } = info;
    const args = info[Symbol.for('splat')];
    let processedMessage = null;
    let strArgs = '';
    if (args&&args.length>0&&message&&message.match){
      let match =message.match(rex);
      if (match&&args.length===match.length){
        processedMessage = util.format(message,...args);
      }
    }
    if (!processedMessage){
      processedMessage = stringifyMessage(message);
      strArgs = args?args.map(stringifyMessage).join(' '):'';
    }
    info.message = `${processedMessage} ${strArgs}`;
    return info;
  }
};

const kubeFormat = {
  transform(info) {
    const { timestamp, label, message } = info;
    const level = info[Symbol.for('level')];
    info[Symbol.for('message')] = `${timestamp} [${label}] ${level}: ${message}`;
    return info;
  }
};

const masking = (masks)=>{
  return {
    transform(info){
      const {message} = info;
      let maskedMessage = message;
      masks.forEach(mask=>{
        // interesting solution, but requires internal knowledge
        // or ellaborated arguments
        // console.log(p.replace(/(d)(og)/g,"$1"+"$2".replace(/.*/,word=>'*'.repeat(word.length))));
        let m;
        while ((m = mask.exec(maskedMessage)) !== null) {
          // This is necessary to avoid infinite loops with zero-width matches
          if (m.index === mask.lastIndex) {
            mask.lastIndex++;
          }
          maskedMessage = maskedMessage.replace(m[1],'*'.repeat(m[1].length));
        }
      });
      info.message = maskedMessage;
      return info;
    }
  };
};

// const debugFormat = {
//   transform(info) {
//     console.log(info);
//     return info;
//   }
// };

function stringifyMessage(a){
  let rc = String(a);
  if (typeof a==='object'){
    try {
      rc = JSON.stringify(a);
    } catch (err){
      rc = util.inspect(a);
    }
  }
  return rc;
}


module.exports= function(label,options){
  options = options||{};
  options.loglevel = options.loglevel||loglevel;
  options.masks = (options.masks ||[]).map(mask=>new RegExp(mask,'g'));
  let logger = winston.createLogger({
    level: options.loglevel,
    format: winston.format.combine(
      // winston.format.colorize(),
      winston.format.timestamp(),
      winston.format.label({label:label}),
      // debugFormat,
      multiArgs,
      masking(options.masks),
      kubeFormat
    ),
    transports: [
      new winston.transports.Console()
    ]
  });

  const morganStream = {
    write: (text) => {
      logger.http(text.replace(/\n/g,' '));
    }
  };

  logger.morgan = (style)=>morgan(style,{stream:morganStream});

  logger.info(`loglevel(LOG_LEVEL): ${label} ${loglevel}`);

  logger.addMask = mask =>{
    let masks = [
      ...options.masks,
      new RegExp(mask,'g')
    ];
    options.masks = masks;
    logger.format = winston.format.combine(
      winston.format.timestamp(),
      winston.format.label({label:label}),
      multiArgs,
      masking(masks),
      kubeFormat
    );
  };
  return logger;
};
