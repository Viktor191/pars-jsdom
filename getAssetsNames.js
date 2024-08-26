const { JSDOM } = require('jsdom');
const axios = require('axios');
const fs = require('fs');

async function fetchCardLinks() {
    const url = 'https://eldritchhorror.fandom.com/wiki/Assets';

    try {
        const { data } = await axios.get(url);
        const dom = new JSDOM(data);
        const document = dom.window.document;

        // Массив для хранения значений href
        const hrefValues = [];

        // Находим все теги <td> с тегом <a>, href которого начинается с /wiki и не находятся внутри <center>
        document.querySelectorAll('table.article-table tbody td:nth-child(2)').forEach(element => {
            const linkElement = element.querySelector('a');
            const parentCenter = element.querySelector('center');

            if (linkElement && !parentCenter && linkElement.getAttribute('href').startsWith('/wiki')) {
                hrefValues.push(`https://eldritchhorror.fandom.com${linkElement.getAttribute('href')}`);
            }
        });

        // Сохраняем результаты в JSON файл
        fs.writeFileSync('assetNames.json', JSON.stringify(hrefValues, null, 2));

        console.log('Ссылки успешно сохранены в файл assetNames.json');
    } catch (error) {
        console.error('Ошибка при загрузке страницы:', error);
    }
}

fetchCardLinks();