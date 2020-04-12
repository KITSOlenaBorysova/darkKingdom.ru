/* required modules */
const fs = require('fs');
const iconvlite = require('iconv-lite');
const jsdom = require("jsdom");

/* global variables */
let catalog = {authors: []},
    fanficsQty = 0,
    linksFromOldFanficPage;

const targetPath = '/Users/guest/Documents/DarkKingdom.ru/DarkKingdom.ru/www/darkkingdom.in.ua/fanfics/',
      webPath = 'http://DarkKingdom.ru/fanfics/',
      oldFanficPage = '/Users/guest/Documents/DarkKingdom.ru/DarkKingdom.ru/www/darkkingdom.in.ua/fanfics.htm',
      filesToIgnore = ['shablonmain.htm', 'eralashmain.htm','ginger_soul&ershel&netmain.htm'],
      regexpCollection = {
        file: /(main\.htm)l*$/,
        author: {
          garbageText: /[\w\d_\-]+@/i,
          cyrrilics: /[А-ЯЁ]/i
        },
        fanfic: {
          link: {
            extension: /\.html*$/,
            fanart: /fanart/i
          }
        }
      };

/* Let's begin! */

init();

function init() {
  let fileContent;
  const fileList = getFileList();

  cleanAllLogs();
  getAllLinksFromOldFanficPage();

  fileList.forEach((fileName) => {
    console.log(fileName);
    fileContent = readFileSync_encoding(targetPath + fileName, 'win1251');
    parseHtmlFile(fileContent, fileName);
  });

  console.log('Авторов', catalog.authors.length);
  console.log('Фанфиков', fanficsQty);

  updateLog(JSON.stringify(catalog));
}

function initTestMode() {
  const fileName = 'ver&tai&lenamain.htm';

  cleanAllLogs();
  getAllLinksFromOldFanficPage();

  fileContent = readFileSync_encoding(targetPath + fileName, 'win1251');
  parseHtmlFile(fileContent, fileName);

  updateLog(JSON.stringify(catalog));
}

/* TEXT and HTML operations */

function parseHtmlFile(source, fileName) {
  const dom = new jsdom.JSDOM(source),
        tables = dom.window.document.querySelectorAll('table');

    let fanficTable, 
        fanficTBody,
        complexFanficItems = [],
        fanficItems = [],
        author,
        coAuthors,
        fanfics = []; 

  fanficTable = tables[1]; 

  if (!fanficTable) {
    updateErrorLog(fileName + ': нет таблицы с фанфиками');
    return;
  }

  //separate complex data from simple one
  fanficTBody = fanficTable.querySelectorAll('tbody');

  fanficTBody.forEach(item => {
    if (item.getAttribute('role') == 'js-wrapper') {
      complexFanficItems.push(item);
      item.remove();
    }  
  });

  //advancedModelsTreatment
  fanfics = getFanficDataForComplexCases(complexFanficItems, fileName);

  //baseModelTreatment
  fanficItems = fanficTable.querySelectorAll('tr');
  fanfics = fanfics.concat(getFanficDataForBaseCases(fanficItems, fileName));

  //all models
  if (fanfics.length === 0) updateErrorLog(fileName + ': автор без фанфиков');
  else {
    author = getAuthorNameFromOldFanficPage(fileName) || getAuthorName(table[0]);
    coAuthors = getCoAuthorsList(dom.window.document.querySelector('#coAuthors'));

    catalog.authors.push({
      'author': author, 
      'coAuthors': coAuthors,
      link: webPath + fileName, 
      'fanfics': fanfics
    });
    fanficsQty += fanfics.length;
  }
} 

function getFanficDataForComplexCases(complexFanficItems, fileName) {
  let fanfics = [],
      firstTR,
      firstTD,
      ths = [],
      tds = [],
      fanfic,
      title,
      tdWithSummaryIndex = 1,
      summary,
      award,
      id;

  complexFanficItems.forEach(item => {
    id = item.getAttribute('id');
    firstTR = item.querySelector('tr');
    tds = item.querySelectorAll('td');
    ths = item.querySelectorAll('th');

    switch (firstTR.querySelectorAll('td').length) {
      case 0:
        firstTD = ths[0];
        tdWithSummaryIndex = 1;
        break;
      case 1:
        if (ths.length > 0) {
          firstTD = ths[0];
          tdWithSummaryIndex = 1;
        }
        else {
          firstTD = tds[0];
          tdWithSummaryIndex = 2;
        }  
        break;
      default: 
        firstTD = tds[0];
        tdWithSummaryIndex = 1;
    }

    title = cleanTextValue(firstTD.textContent);
    summary = cleanTextValue(tds[tdWithSummaryIndex].textContent);
    award = getFanficAward(firstTD);

    fanfic = {
      'title': title,
      'summary': summary,
      'link': webPath + fileName + id,
      'multipart': false,
      'award': award
    };

    fanfics.push(fanfic);
  });

  return fanfics;
}

function getFanficDataForBaseCases(fanficItems, fileName) {
  let tds,
      ths,
      isNewMarkUp,
      fanficLeftColumn,
      fanficRightColumn,
      fanfic,
      fanfics = [];
  
  fanficItems.forEach(item => {
    ths = item.querySelectorAll('th');
    tds = item.querySelectorAll('td');
    isNewMarkUp = !!(ths.length > 0);
    fanficLeftColumn = isNewMarkUp ? ths[0] : tds[0];
    fanfic = filterFanficLinks(fanficLeftColumn);

    if (fanfic && !fanfic.empty) {
      if (tds.length > 1) {
        fanficRightColumn = tds[1];
        fanfic.summary = cleanTextValue(fanficRightColumn.textContent);
      } 

      if (isNewMarkUp) {
        fanficRightColumn = tds[0];
        fanfic.summary = cleanTextValue(fanficRightColumn.textContent);
      } 


      if (fanfic.multipart || fanfic.title.indexOf('*1*') !== -1) {
        fanfic.title = getMultipartTitle(fanficLeftColumn);
      }

      fanfic.award = getFanficAward(fanficLeftColumn);

      fanfics.push(fanfic);

      if (fanfic.title.indexOf('*1*') !== -1) 
        updateErrorLog(fileName + ': неправильный заголовок ' + fanfic.title);

    } 
  });

  return fanfics;
}

function getAuthorName(table) {
  let name = table.querySelector('tr').querySelectorAll('td')[1].textContent,
      garbage,
      end = name.indexOf('Понравилось?');

  if (end == -1) {
    garbage = name.match(regexpCollection.author.garbageText);
    if (garbage) end = name.indexOf(garbage[0]); 
    else end = name.length;
  } 

  name = name.slice(0,end).replace('Фанфики', '').trim();

  return cleanTextValue(name);
}

function getAuthorNameFromOldFanficPage(fileName) {
  let authorName;      
  
  linksFromOldFanficPage.some(link => {
    if (link.href.indexOf('/' + fileName) !== -1) {
      authorName = link.text;
      return true;
    }
  });      

  if (!authorName) updateErrorLog(fileName);
  return cleanTextValue(authorName);        
}

function getCoAuthorsList(dataInput) {
  let result = [];

  if (dataInput) {
    result = dataInput.value.split(', ');
  }

  return result;
}


function filterFanficLinks(item) {
  const links =  item.querySelectorAll('a'),
        correctLinks = [],
        re = regexpCollection.fanfic.link;
  let isLinkValid,
      mode;    
  
  links.forEach(item => {
    isLinkValid = re.extension.test(item.href) && !re.fanart.test(item.href);
    if (isLinkValid) correctLinks.push(item);
  });

  switch (correctLinks.length) {
    case 1: 
      mode = 'single';
      break;
    case 0:
      if (links.length == 0) mode = 'empty';
      else mode = 'ignore';
      break;
    default:
      mode = 'multi';    
  }

  return getFanficTitle(mode, correctLinks);
 }

function getFanficTitle(mode, items) {
  let parts = [],
      title = '',
      link = '';

  if (mode === 'single') {
    return {
      'title': cleanTextValue(items[0].text),
      'link': webPath + items[0].href,
      'multipart': false };
  }

  if (mode === 'multi') {
    items.forEach(item => {
      parts.push({'link': webPath + item.href, 'title': item.text});
    });

    return {
      'title': '???',
      'link': '',
      'multipart': true,
      'parts': parts 
    };
  }

  if (mode === 'empty') {
    return {empty: true}
  }
  
  return false;
}

function getMultipartTitle(leftColumn) {
  let title = leftColumn.textContent,
      searchStr = ['*0*', '*1*', 'Серия 0', '1."Пушистик"', 'Пролог'],
      end;
  
  searchStr.some(str => {
    end = title.indexOf(str);
    return end > -1;
  });

  if (end === -1) end = title.length;

  title = cleanTextValue(title.slice(0,end));

  return title;
}

function getFanficAward(leftColumn) {
  let img = leftColumn.querySelectorAll('img'),
      result = 'none';

  img.forEach(item => {
    if (item.src.indexOf('diamond.gif') !== -1) result = 'diamond';
    if (item.src.indexOf('rainbow.gif') !== -1) result = 'rainbow';
  });

  return result;
}

function cleanTextValue(value) {
  return value.trim().replace(/\s/g, ' ').replace(/  /g, ' ').replace(/^\d+\.\s*/, '');
}

/* FILE operations */

function getAllLinksFromOldFanficPage() {
  const data = readFileSync_encoding(oldFanficPage, 'win1251'),
        dom = new jsdom.JSDOM(data);

  linksFromOldFanficPage = Array.from(dom.window.document.querySelectorAll('a')).filter(function(link) {
    return regexpCollection.file.test(link.href);
  });
}

function getFileList() {
  const fileList = [];

  fs.readdirSync(targetPath).forEach((file) => {
    if (regexpCollection.file.test(file) && !filesToIgnore.includes(file)) {
      fileList.push(file);
    } else {
      //if (/(\.htm)l*$/.test(file)) console.log(file);
    }
  });

  return fileList;
}

function readFileSync_encoding(filename, encoding) {
    var content = fs.readFileSync(filename);
    return iconvlite.decode(content, encoding);
}

function updateLog(value) {
  //const time = new Date();
  //const content = time + '\n\r' + value;

  fs.appendFile('log.txt', value + '\n\r', (err) => {
  if (err) {
    console.error('Не удалось записать файл. ' + err)
    return
  }
  })
}

function updateErrorLog(value) {
  const content = '\n\r' + value;

  fs.appendFile('error.log', content, (err) => {
  if (err) {
    console.error('Не удалось записать файл. ' + err)
    return
  }
  })
}

function cleanAllLogs() {
  fs.writeFile('error.log', '', (err) => {
  if (err) {
    console.error('Не удалось записать файл. ' + err)
    return
  }
  });

  fs.writeFile('log.txt', '', (err) => {
    if (err) {
      console.error('Не удалось записать файл. ' + err)
      return
    }
  });
  
}