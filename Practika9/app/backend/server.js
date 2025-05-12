const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const adminApp = express();

// Порт для интернет-магазина
const SHOP_PORT = 3000;

// Порт для панели администратора
const ADMIN_PORT = 8080;

app.use(bodyParser.json());

// Товары
let products = [
    { id: 1, name: 'Товар 1', price: 100, description: 'Описание товара 1', categories: ['Категория 1'] },
    { id: 2, name: 'Товар 2', price: 200, description: 'Описание товара 2', categories: ['Категория 2'] },
    { id: 3, name: 'Товар 3', price: 150, description: 'Описание товара 3', categories: ['Категория 1'] },
    { id: 4, name: 'Товар 4', price: 250, description: 'Описание товара 4', categories: ['Категория 2'] },
    { id: 5, name: 'Товар 5', price: 300, description: 'Описание товара 5', categories: ['Категория 1', 'Категория 2'] }
];

// Панель администратора
adminApp.post('/admin/products', (req, res) => {
    const { name, price, description, categories } = req.body;
    const newProduct = { id: products.length + 1, name, price, description, categories };
    products.push(newProduct);
    res.status(201).json(newProduct);
});

// Удалить товар
adminApp.delete('/admin/products/:id', (req, res) => {
    const productId = parseInt(req.params.id);
    products = products.filter(p => p.id !== productId);
    res.status(204).send();
});

// Админ панель - добавить обработку для корневого маршрута
adminApp.get('/', (req, res) => {
    res.send('Админ панель');
});

// Сервер магазина (порт 3000) - добавьте обработчик для корня
app.get('/', (req, res) => {
    res.send('Магазин работает!');
});


// Сервер магазина (порт 3000) - маршрут для получения товаров
app.get('/shop/products', (req, res) => {
    res.json(products); // Отдаем список товаров
});


// Сервер для администратора
adminApp.listen(ADMIN_PORT, () => {
    console.log(`Admin server is running on http://localhost:${ADMIN_PORT}`);
});

// Магазин
app.get('/shop/products', (req, res) => {
    res.json(products);
});

// Получить товар по ID
app.get('/shop/products/:id', (req, res) => {
    const product = products.find(p => p.id === parseInt(req.params.id));
    if (product) {
        res.json(product);
    } else {
        res.status(404).json({ message: 'Product not found' });
    }
});

// Сервер для магазина
app.listen(SHOP_PORT, () => {
    console.log(`Shop server is running on http://localhost:${SHOP_PORT}`);
});
const response = await fetch('http://localhost:3000/graphql', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({
        query: `
        {
            products {
                id
                name
                price
                description
            }
        }
        `,
    }),
});
