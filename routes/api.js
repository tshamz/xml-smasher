const fetch    = require('node-fetch');
const xml      = require('xml2js');
const builder  = require('xmlbuilder');
const express  = require('express');
const router   = express.Router();

const parseXML = xmlResponse => {
  return new Promise((resolve, reject) => {
    xml.parseString(xmlResponse, (err, result) => {
      err ? reject(err) : resolve(result);
    });
  })
};

router.get('/', (req, res) => {
  const rebeccaXMLItems = fetch('https://my.datafeedwatch.com/static/files/12603/0b6097b778992aaff5dc6558c15834d48e1c63fb.xml')
    .then(response => response.text())
    .then(parseXML)
    .then(parsedXML => parsedXML.rss.channel[0].item);

  const uriXMLItems = fetch('https://my.datafeedwatch.com/static/files/12756/f67fd96daa5b06167f70a66f086dd6b796cc7f1b.xml')
    .then(response => response.text())
    .then(parseXML)
    .then(parsedXML => parsedXML.rss.channel[0].item);

  Promise.all([rebeccaXMLItems, uriXMLItems]).then(xmlData => {
    const response = builder.create({
      'rss': {
        '@xmlns:g': 'http://base.google.com/ns/1.0',
        '@version': '2.0',
        'channel': [{
          'title': 'Rebecca Minkoff + Uri Minkoff',
          'link': '',
          'description': '',
          item: [...xmlData[0], ...xmlData[1]]
        }]
      }
    }, {});
    res.type('text/xml').status(200).send(response.end({pretty: true}));
  });
});

module.exports = router;
