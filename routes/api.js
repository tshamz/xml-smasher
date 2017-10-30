const fetch    = require('node-fetch');
const xml      = require('xml2js');
const builder  = require('xmlbuilder');
const express  = require('express');
const Entities = require('html-entities').AllHtmlEntities;
const router   = express.Router();

const entities = new Entities();

const googleProductCategories = require('./google_product_categories.json');

const parseXML = xmlResponse => {
  return new Promise((resolve, reject) => {
    xml.parseString(xmlResponse, (err, result) => {
      err ? reject(err) : resolve(result);
    });
  })
};

router.get('/', (req, res) => {
  const rebeccaXMLItems = fetch('https://feeds.datafeedwatch.com/13429/114aa6e9de43365ffb5363b1fae5d93e91bdc9a4.xml')
    .then(response => response.text())
    .then(parseXML)
    .then(parsedXML => parsedXML.rss.channel[0].item);

  const uriXMLItems = fetch('https://my.datafeedwatch.com/static/files/12756/f67fd96daa5b06167f70a66f086dd6b796cc7f1b.xml')
    .then(response => response.text())
    .then(parseXML)
    .then(parsedXML => parsedXML.rss.channel[0].item);

  Promise.all([rebeccaXMLItems, uriXMLItems]).then(xmlData => {
    const mergedXmlData = [...xmlData[0], ...xmlData[1]].map(item => {
      const sku = item['g:id'];
      const variantId = item['g:mpn'];
      const googleProductCategoryId = item['g:google_product_category'];
      item['g:google_product_category'] = entities.encode(googleProductCategories[googleProductCategoryId]);
      item['g:id'] = variantId;
      item['g:mpn'] = sku;
      item['g:coo'] = 'US';
      return item;
    });
    const response = builder.create({
      'rss': {
        '@xmlns:g': 'http://base.google.com/ns/1.0',
        '@version': '2.0',
        'channel': [{
          'title': 'Rebecca Minkoff + Uri Minkoff',
          'link': '',
          'description': '',
          item: mergedXmlData
        }]
      }
    }, {});
    res.type('.xml').status(200).send(response.end({pretty: true}));
  });
});

module.exports = router;
