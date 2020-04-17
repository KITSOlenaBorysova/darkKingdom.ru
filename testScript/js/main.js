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
    ficsPerPage = 20;


$(document).ready(function() {
    init();
    bind();
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
    $('.fanfiction-per-page__select').change(updateFicsPerPage);
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
    renderFanfics(fanfics.slice(0,ficsPerPage));
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
        result = [];
     
    setCurrentFilters(checkedItems);

    if (currentFilters.award.length || currentFilters.author.length) {
        result = fanfics.filter(function(item){
            let isAward,
                isAuthor;
            
            isAward = (currentFilters.award.length === 0) || currentFilters.award.includes(item.award);
    
            isAuthor = (currentFilters.author.length === 0) || currentFilters.author.includes(item.author) || checkCoAuthors(item.coAuthors);
    
            return isAuthor && isAward;    
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
    $('.author-list input').prop('checked', false);
    $('.apply-filters-btn').trigger('click');
}


function setCurrentFilters(checkedItems) {
    currentFilters = {
        "author": [],
        "award": [],
        "result":[]
    };

    for (let i = 0; i < checkedItems.length; i++) {
        let name = checkedItems[i].name,
            value = checkedItems[i].value;

        if (name === 'award' && value !== '') {
            currentFilters.award = filters.award[value];
        }    
        if (name.indexOf('author') !== -1) currentFilters.author.push(value);
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
}

function goToPage(event) {
    const pageNumber = parseInt($(this).text()),
    start = (pageNumber - 1)*ficsPerPage,
    end = start + 20,
    data = currentFilters ? currentFilters.result : fanfics;  

    event.preventDefault();
    $('.fanfiction-pagination > a').removeClass('current');
    $(this).addClass('current');
    renderFanfics(data.slice(start,end));
    $(window).scrollTop(0);
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
    num2str = String(num); 

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
    const authorIconsQty = 2;        
    let previousAuthor = allAuthors[0].text;
    let authorIconsIndex = 1;

    allAuthors[0].className = iconPrefix + authorIconsIndex;

    for (let i = 1; i < allAuthors.length; i++) {
        if (allAuthors[i].text !== previousAuthor) {
            authorIconsIndex = (authorIconsIndex + 1 <= authorIconsQty) ? authorIconsIndex + 1 : 1;
            previousAuthor = allAuthors[i].text;
        }   

        allAuthors[i].className = iconPrefix + authorIconsIndex;        
    }

}
