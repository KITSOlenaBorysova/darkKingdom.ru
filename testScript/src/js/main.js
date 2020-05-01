const filters = {
        "award": {
            'award-old': ['diamond'],
            'award-new': ['rainbow'],
            'award-all': ['diamond', 'rainbow'],
            'award-none': ['none']
}};

let authors = [],
    fanfics = [],
    currentFilters,
    currentPage = 1,
    ficsPerPage = 20,
    currentHash = {};


$(document).ready(function() {
    init();
    bind();
    readHashTags();
});

function init() {
    let sortedAuthors = catalog.authors.sort(function(a,b) {
        if (a.author < b.author) return -1;
        return 1;
    });

    authors = sortedAuthors.map(item => item.author);

    sortedAuthors.forEach(item => {
        let newItem = item.fanfics;
        newItem.forEach(elem => {
            elem.author = item.author;
            elem.coAuthors = item.coAuthors;
            elem.authorLink = item.link;
            fanfics.push(elem);
        });
    });

    renderPage();
}

function bind() {
    $('#size').change(updateFicsPerPage);
    $('.apply-filters-btn').click(filterFanficList);
    $('.reset-filters-btn').click(resetFanficList);
    $('.fanfiction-filters__toggle').click(function(){
        $('.fanfiction-filters').toggleClass('hide-filters');
    });
    $(document).on("click",".fanfiction-pagination > a", goToPage);
}

/* Render Functions */

function renderPage() {
    updateQty(authors.length, fanfics.length);
    renderFilters();
    //renderFanfics(fanfics.slice(0,ficsPerPage));
    renderPagination(fanfics.length);
}


function renderFilters() {
    let directives,
        i = 0;

    directives = {
        input: {
            id: function() {
                i++;
                return 'author'+i
            },
            name: function() {
                return 'author'+i
            },
            value: function() {
                return this.value
            }
        },
        author: {
            text: function() {
                return this.value
            },
            for: function() {
                return 'author'+i
            }
        }
    };

    $(".author-list").render(authors, directives);
}

function renderFanfics(filteredData) {
    let directives, 
        getHref, 
        getPartsText,
        addClassToParts, 
        addClassToTitle;
    const data = filteredData ? filteredData : fanfics;  
    
    getHref = function(){
        if (this.link == "") return("javascript: ")
        return this.link;
    };    

    getAuthorHref = function(){
        return this.authorLink;
    };    

    getPartsText = function() {
        return this.title;
    };    

    addClassToParts = function() {
        if (!this.multipart) return 'hide';
    }

    addClassToTitle = function() {
        let result = '';
        if (this.link == '') result = 'no-link';

        return result;
    }

    addClassToSection = function() {
        let result = 'fanfiction-item';
        if (this.award !== 'none') {
            result += ' award award--' + this.award; 
        }

        return result;
    }

    directives  = {
        isAward: {
            class: addClassToSection
        },
        author: {
            href: getAuthorHref
        },
        title: {
            href: getHref,
            class: addClassToTitle
        },
        showParts: {
            class: addClassToParts
        },
        parts: {
            class: addClassToParts,
            partsTitle: {
                text: getPartsText,
                href: getHref
            }
        },
    };

    $(".fanfiction-list").render(data, directives);
    setAuthorIcons();

}

function renderPagination(amountOfWorks) {
    const paginationDiv = $('.fanfiction-pagination');

    paginationDiv.html('');
    
    if (amountOfWorks !== 0 || ficsPerPage !== 0) {
        let amountOfPages = Math.ceil(amountOfWorks/ficsPerPage);

        for (let i = 1; i <= amountOfPages; i++) {
            let template = $('<a href="">' + i + '</a>');
            paginationDiv.append(template);
        }

        paginationDiv.find('a:first-child').addClass('current');
    }    
}

/* Filter and Pagination */

function filterFanficList() {
    let checkedItems = $('.fanfiction-filters input:checked'),
        result = [],
        isFiltersSet;
     
    setCurrentFilters(checkedItems);

    isFiltersSet = !!(currentFilters.award.length || currentFilters.author.length  || currentFilters.tags.length);

    if (isFiltersSet) {
        result = fanfics.filter(function(item){
            let isAward,
                isAuthor,
                isTags;
            
            isAward = (currentFilters.award.length === 0) || currentFilters.award.includes(item.award);
    
            isAuthor = (currentFilters.author.length === 0) || currentFilters.author.includes(item.author) || checkCoAuthors(item.coAuthors);

            isTags = (currentFilters.tags.length === 0) || currentFilters.tags.includes(item.tags);
    
            return isAuthor && isAward && isTags;    
        });
        updateSearchResultQty(result.length);
    } else {
        result = fanfics; 
        $('.fanfiction-search-result').hide();
    }

    currentFilters.result = result;

    renderFanfics(result.slice(0, ficsPerPage));
    renderPagination(result.length);
}

function resetFanficList() {
    $('#award-ignore').prop('checked', true);
    $('#tags-any').prop('checked', true);
    $('.author-list input').prop('checked', false);
    filterFanficList();
}


function setCurrentFilters(checkedItems) {
    currentFilters = {
        "author": [],
        "award": [],
        "tags": [],
        "result":[]
    };

    let authorsID = [];

    updateHashData('author');
    updateHashData('award');
    updateHashData('tags');
    updateHashData('page');

    for (let i = 0; i < checkedItems.length; i++) {
        let name = checkedItems[i].name,
            value = checkedItems[i].value;

        if (name === 'award' && value !== '') {
            currentFilters.award = filters.award[value];
            updateHashData('award', value);
        }    

        if (name === 'tags'  && value !== '') {
            currentFilters.tags.push(value);
            updateHashData('tags', value);
        }    

        if (name.indexOf('author') !== -1) {
            currentFilters.author.push(value);
            authorsID.push(name);
        }
    }
    if (currentFilters.author.length) {
        updateHashData('author', authorsID);
    }

}

function checkCoAuthors(coAuthors) {
    let result = false;

    if (coAuthors && coAuthors.length > 0) {
        coAuthors.some(item => {
            if (currentFilters.author.includes(item)) result = true;
            return result;
        });
    }

    return result;
}

function updateFicsPerPage() {
    const source = currentFilters ? currentFilters.result : fanfics,
          amountOfWorks = source.length; 
  
    ficsPerPage = parseInt($(this)[0].value);
    renderPagination(amountOfWorks);

    if (ficsPerPage === 0) renderFanfics(source);
    else renderFanfics(source.slice(0,ficsPerPage));

    updateHashData('size', ficsPerPage);
}

function goToPage(event) {
    currentPage = parseInt($(this).text()),
    start = (currentPage - 1)*ficsPerPage,
    end = start + ficsPerPage,
    data = currentFilters ? currentFilters.result : fanfics;  

    event.preventDefault();
    $('.fanfiction-pagination > a').removeClass('current');
    $(this).addClass('current');
    renderFanfics(data.slice(start,end));
    $(window).scrollTop(0);

    updateHashData('page', currentPage);
}

/* Minor function */
function updateSearchResultQty(length) {
    const qtyDiv = $('.fanfiction-search-result');
    const wordEnding = getWordEnding(length);
    const newContent = (wordEnding ? 'Найдено' : 'Найден') + ' <strong>' + length + '</strong> фик' + wordEnding; 

    qtyDiv.html(newContent).css({'display' : 'inline-block'});
}

function updateQty(numA, numF) {
    const endingA = getWordEnding(numA),
          endingF = getWordEnding(numF);  

    $(".author-qty").text(numA + ' автор' + endingA);
    $(".fanfic-qty").text(numF + ' фик' + endingF);
}

function getWordEnding(num) {
    let num2str = String(num),
        twoLastDigits = parseInt(num2str.slice(num2str.length - 2, num2str.length));

    if (twoLastDigits > 10 && twoLastDigits < 21) return 'ов';
    
    switch(num2str[num2str.length - 1]) {
        case '1': 
            return '';
        case '2':
        case '3':
        case '4':            
            return 'а';
        default: return 'ов';   
    }
}

function setAuthorIcons() {
    const allAuthors = $(".fanfiction-item__author a");
    const iconPrefix = "i";
    const authorIconsQty = 15;   
    
    if (!allAuthors.length) return false;

    let previousAuthor = allAuthors[0].text;
    let authorIconsIndex = Math.floor(Math.random() * Math.floor(authorIconsQty)) + 1;

    allAuthors[0].className = iconPrefix + authorIconsIndex;

    for (let i = 1; i < allAuthors.length; i++) {
        if (allAuthors[i].text !== previousAuthor) {
            authorIconsIndex = (authorIconsIndex + 1 <= authorIconsQty) ? authorIconsIndex + 1 : 1;
            previousAuthor = allAuthors[i].text;
        }   

        allAuthors[i].className = iconPrefix + authorIconsIndex;        
    }

}

/* HASH functions */

function readHashTags() {
    const hashData = createObjectWithHashData();

    applyHashDataToFilter(hashData);
    filterFanficList();
    applyHashPageNumber(hashData);
}

function applyHashDataToFilter(hashData) {
    for (let key in hashData) {
        if (key === 'award' || key === 'tags') {
            let selector = '[name="' + key + '"][value="' + hashData[key] + '"]',
                input = $(selector);

            if (input.length) {
                input.prop('checked', true);
            }    
        }

        if (key === 'size') {
            let selector = 'option[value="' + hashData[key] + '"]',
                input = $(selector);

            if (input.length) {
                $('#size').val(hashData['size']);
                $('#size').trigger('change');
            } 
        }

        if (key === 'author') {
            let authorsList = $('.author-list input'),
                authorsHashData = hashData.author.split(',');

            authorsList.prop('checked', false);
            authorsHashData.forEach(item => {
                let selector = '#' + item,
                    input = $(selector);

                if (input.length) {
                    input.prop('checked', true);
                }    
            });
        }
    }
}

function createObjectWithHashData() {
    const allowedKeys = ['size','award','tags','author','page'];
    let result = {},
        hash = location.hash,
        hashFiltersList = [];

    hash = hash.replace('#','');
    hashFiltersList = hash.split('&');

    hashFiltersList.forEach(item => {
        let hashKeyAndValue = item.split('=');
        let isValid = !!(hashKeyAndValue.length == 2 && allowedKeys.includes(hashKeyAndValue[0]) && hashKeyAndValue[1].length);
        
        if (isValid) {
            result[hashKeyAndValue[0]] = hashKeyAndValue[1];
        }
    });

    return result;
}

function updateHashData(key, value) {
    let locationHash = [];

    if (value) currentHash[key] = value;
    else delete currentHash[key];

    for (let prop in currentHash) {
        let hashValue = currentHash[prop].isArray ? currentHash[prop].join(',') : currentHash[prop];

        if (hashValue) locationHash.push(prop + '=' + hashValue);
    }

    location.hash = locationHash.length ? '#' + locationHash.join('&') : '';
}

function applyHashPageNumber(hashData) {
    const pageNumber = hashData.page;

    if (pageNumber) {
        let pages = $('.fanfiction-pagination a').toArray();
        let isPageExist = pages.some(page => {
            if ($(page).text() == pageNumber) {
                $(page).trigger('click');
                return true;
            }
        });

        if (!isPageExist) updateHashData('page');
    } else updateHashData('page');
}