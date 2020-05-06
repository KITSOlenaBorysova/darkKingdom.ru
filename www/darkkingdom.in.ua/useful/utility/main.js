const templateVar = {
    author: /%AUTHOR%/g,
    title: /%TITLE%/g,
    authorPage: '%AUTHORPAGE%',
    text: '%TEXT%'
};
let data = {
    author: '',
    title: '',
    authorPage: '',
    text: ''
}
const validation = {
    author: {
        rules: ['not-empty'],
        message: ['Имя автора не может быть пустым']
    },
    title: {
        rules: ['not-empty'],
        message: ['Название не может быть пустым']
    },
    authorPage: {
        rules: ['not-empty', 'filename'],
        message: ['Страница автора не может быть пустой', 'Страница автора должна заканчиваться на main.html или main.htm и содержать только допустимые символы']
    },
    text: {        
        rules: ['not-empty', 'allowed-tags', 'is-already-formatted'],
        message: ['Тело фика не может быть пустым', 'Тэги body, script, link запрещены', 'Уже присутствуют тэги форматирования']
    }
};
//TODO закрытие
const forbiddenTags = ['<script', '<body', '<html', '<link', '/body>'];
const formatTags = ['<br', '<p'];
let isMarkUpReady = false;

$(document).ready(function() {
    bind();
});

function bind() {
    $('.btn-convert').click(convertTextToFic);
    $('.btn-reset').click(clearAllFields);
    $('.btn-copy').click(copyResultToClipboard);
    $('.btn-download').click(downloadResult);
}

function clearAllFields() {
    removePreviousResult();
    $('input[type="text"]').val('');
    $('textarea').val('');
    $('input[type="checkbox"]').prop('checked', false);
}

function convertTextToFic() {
    removePreviousResult();
    getDataFromForm();
    if (validateData()) {
        convertFicBodyToHtml();
        insertDataIntoTemplate();
    } else {
        //call error;
    }
}

function getDataFromForm() {
    isMarkUpReady = $('#isMarkUpReady').prop('checked');
    for (let key in data) {
        data[key] = $('#' + key).val();
    }
}

function convertFicBodyToHtml() {
    if (isMarkUpReady) return;
    
    let paragraphs = prepareText(data.text).split('\n');

    paragraphs.forEach((line,index) => {
        if (line) paragraphs[index] = '<p>' + line + '</p>';
    });

    data.text = paragraphs.join('\n');
}

function validateData() {
    let result = true;

    for (let key in data) {
        validation[key].rules.forEach((rule,index) => {
            switch (rule) {
                case 'not-empty': 
                    if (!data[key].length) {
                        result = false;
                        showError(key, index);
                    }
                    break;
                case 'filename':
                    if (!/(main\.htm)l*$/.test(data[key])) {
                        result = false;
                        showError(key, index);
                    }   
                    break; 
                case 'allowed-tags':
                    if (!validateWithArray(data[key],forbiddenTags)) {
                        result = false;
                        showError(key, index);
                    }    
                    break;
                case 'is-already-formatted':
                    if (!isMarkUpReady && !validateWithArray(data[key],formatTags)) {
                        result = false;
                        showError(key, index);
                    }    
                    break;

            }
        });
    }

    return result;
}

function prepareText(text) {
    //let result = text.replace(/\s*\n\s*\n\s*/g, '\n\n').replace(/\n{2,}/g, '<br><br>\n').replace(/-\s/g, '— ').replace(/\n\s*-/g, '\n— ');
    //const regexp = [];

    let result = text;

    //remove whitespaces around \n
    result = result.replace(/ *\n */g, '\n');
    
    //find multiple \n and replace for 2 br
    result = result.replace(/\n{2,}/g, '<br><br>\n');
    
    //long dash
    result = result.replace(/ *- /g, ' — ').replace(/\n-/g, '\n— ');

    return result;
}

function validateWithArray(field, testCases) {
    return !testCases.some(item => {
        return field.indexOf(item) !== -1
    });
}

function insertDataIntoTemplate() {
    let result = template;

    for (let key in templateVar) {
        result = result.replace(templateVar[key], data[key]);
    }

    $('.result-container').show();
    $('#result').val(result);
}

function copyResultToClipboard() {
    $("#result").select();
    document.execCommand('copy');
    $('.copy-success').css('display', 'inline-block');
}

function showError(key, errorMessageNum) {
    let row = $('#' + key).parent();
    row.addClass('error');
    row.find('.error-message').text(validation[key].message[errorMessageNum])
}

function removePreviousResult() {
    let row = $('.error');

    row.removeClass('error');
    row.find('.error-message').text('');
    $('.result-container').hide();
    $('.copy-success').hide();

}

function downloadResult() {
    let element = document.createElement('a'),
        filename = 'newFic.html',
        text = $('#result').val();

    element.setAttribute('href', 'data:text/html;charset=UTF-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);
  
    element.style.display = 'none';
    document.body.appendChild(element);
  
    element.click();
  
    document.body.removeChild(element);
}
  