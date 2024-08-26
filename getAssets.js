const { JSDOM } = require('jsdom');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const cardsList = require('./assetNames.json');

async function fetchCardData(cardUrl) {
    try {
        const { data } = await axios.get(cardUrl);
        const dom = new JSDOM(data);
        const document = dom.window.document;

        // Парсим данные из таблицы с классом "article-table"
        const cardData = {};
        document.querySelectorAll('table.article-table tr').forEach(element => {
            const thElement = element.querySelector('th');
            const tdElement = element.querySelector('td');

            const key = thElement.querySelector('img')?.getAttribute('title') || thElement.textContent.trim();
            let value = '';

            // Проверка на наличие ссылки внутри tdElement
            const linkElement = tdElement.querySelector('a');
            // Если ссылка есть, проверяем наличие изображения внутри нее, иначе ищем изображение напрямую в tdElement
            const imgElement = linkElement ? linkElement.querySelector('img') : tdElement.querySelector('img');

            if (imgElement) {
                // Если изображение найдено, берем значение атрибута alt
                value = imgElement.getAttribute('alt');
            } else if (linkElement) {
                // Если изображения нет, но есть ссылка, берем текстовое содержимое ссылки
                value = linkElement.textContent.trim();
            } else {
                // Если нет ни ссылки, ни изображения, берем текстовое содержимое tdElement
                value = tdElement.textContent.trim();
            }

            // Пропускаем элементы с `display: none;`
            tdElement.querySelectorAll('[style*="display: none;"]').forEach(hiddenElement => {
                value = value.replace(hiddenElement.textContent.trim(), '');
            });

            // Проверка на наличие ключа и значения перед добавлением в cardData
            if (key && value) {
                cardData[key] = value.trim();
            }
        });

        // Парсим данные из раздела "Card Effect"
        const cardEffectHeader = document.querySelector('h2 span#Card_Effect')?.parentElement;
        if (cardEffectHeader) {
            let cardEffectContent = '';
            let sibling = cardEffectHeader.nextElementSibling;
            while (sibling && sibling.tagName === 'P') {
                cardEffectContent += sibling.textContent.trim() + ' ';
                sibling = sibling.nextElementSibling;
            }
            cardData['Card Effect'] = cardEffectContent.trim();
        }

        return cardData;
    } catch (error) {
        console.error(`Ошибка при парсинге данных с URL ${cardUrl}:`, error);
        return null;
    }
}

async function saveCardData(cardsUrls) {
    const cardsData = [];
    for (const url of cardsUrls) {
        const cardData = await fetchCardData(url);
        if (cardData) {
            cardsData.push(cardData);
        }
    }

    // Сохраняем данные в JSON-файл
    const filePath = path.join(__dirname, 'assets.json');
    fs.writeFileSync(filePath, JSON.stringify(cardsData, null, 2));
    console.log(`Данные карточек успешно сохранены в ${filePath}`);
}

saveCardData(cardsList);
