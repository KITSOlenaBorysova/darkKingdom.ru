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
const forbiddenTags = ['<script', '<body', '<html', '<link'];
const formatTags = ['<br', '<p'];
let isMarkUpReady = false;

$(document).ready(function() {
    bind();
});

function bind() {
    $('.btn-convert').click(convertTextToFic);
    $('.btn-reset').click(clearAllFields);
    $('.btn-copy').click(copyResultToClipboard);
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
    
    let paragraphs = data.text.split('\n\n'),
        newLine;

    paragraphs.forEach((line,index) => {
        newLine = line.replace(/\n/g, '\n<br>').replace(/-\s/g, '— ');
        paragraphs[index] = '<p>' + newLine + '</p>';
    });

    data.text = paragraphs.join('\n\n');
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