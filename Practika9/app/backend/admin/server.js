const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const app = express();

// Изменяем порт для админки на 8082
const ADMIN_PORT = 8082;

// Загрузка товаров из JSON
let products = [];
const productsFilePath = path.join(__dirname, '../data/products.json');

// Функция для загрузки товаров из файла
const loadProducts = () => {
  try {
    const productsData = fs.readFileSync(productsFilePath, 'utf8');
    return JSON.parse(productsData);
  } catch (err) {
    console.error('Ошибка загрузки товаров:', err);
    return [
      { id: 1, name: 'Товар 1', price: 100, description: 'Описание товара 1', categories: ['Электроника'] },
      { id: 2, name: 'Товар 2', price: 200, description: 'Описание товара 2', categories: ['Одежда'] },
    ];
  }
};

// Первоначальная загрузка товаров
products = loadProducts();

// Создаем директорию, если она не существует
const dir = path.dirname(productsFilePath);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

// Если файла нет, создаем его
if (!fs.existsSync(productsFilePath)) {
  fs.writeFileSync(productsFilePath, JSON.stringify(products, null, 2), 'utf8');
}

// Функция сохранения товаров в JSON
const saveProducts = () => {
  fs.writeFileSync(productsFilePath, JSON.stringify(products, null, 2), 'utf8');
  console.log('Товары сохранены в файл');
};

// Настройка CORS для разрешения запросов с других портов
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Разбор JSON в теле запросов
app.use(bodyParser.json());

// Статические файлы
app.use(express.static(path.join(__dirname, '../../frontend')));

// Получить все товары
app.get('/api/admin/products', (req, res) => {
  // Перезагружаем товары из файла при каждом запросе
  products = loadProducts();
  res.json(products);
});

// Добавить товар
app.post('/api/admin/products', (req, res) => {
  const { name, price, description, categories } = req.body;
  
  if (!name || !price) {
    return res.status(400).json({ error: 'Необходимо указать название и цену товара' });
  }
  
  // Перезагружаем товары для получения актуального состояния
  products = loadProducts();
  
  const newProduct = {
    id: products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1,
    name,
    price: parseInt(price),
    description: description || '',
    categories: categories || []
  };
  
  products.push(newProduct);
  saveProducts();
  res.status(201).json(newProduct);
});

// Добавить несколько товаров сразу
app.post('/api/admin/products/batch', (req, res) => {
  const newProducts = req.body;
  
  if (!Array.isArray(newProducts) || newProducts.length === 0) {
    return res.status(400).json({ error: 'Необходимо передать массив товаров' });
  }
  
  // Перезагружаем товары для получения актуального состояния
  products = loadProducts();
  
  const nextId = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;
  
  const addedProducts = newProducts.map((product, index) => {
    return {
      id: nextId + index,
      name: product.name,
      price: parseInt(product.price),
      description: product.description || '',
      categories: product.categories || []
    };
  });
  
  products = [...products, ...addedProducts];
  saveProducts();
  res.status(201).json(addedProducts);
});

// Редактировать товар
app.put('/api/admin/products/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const { name, price, description, categories } = req.body;
  
  // Перезагружаем товары для получения актуального состояния
  products = loadProducts();
  
  const index = products.findIndex(p => p.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Товар не найден' });
  }
  
  products[index] = {
    ...products[index],
    name: name || products[index].name,
    price: price ? parseInt(price) : products[index].price,
    description: description !== undefined ? description : products[index].description,
    categories: categories || products[index].categories
  };
  
  saveProducts();
  console.log('Товар обновлен:', products[index]);
  res.json(products[index]);
});

// Удалить товар
app.delete('/api/admin/products/:id', (req, res) => {
  const id = parseInt(req.params.id);
  
  // Перезагружаем товары для получения актуального состояния
  products = loadProducts();
  
  const index = products.findIndex(p => p.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Товар не найден' });
  }
  
  const deletedProduct = products.splice(index, 1)[0];
  saveProducts();
  res.json(deletedProduct);
});

// Главная страница админки
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/admin.html'));
});

// Запуск сервера админки
app.listen(ADMIN_PORT, () => {
  console.log(`Admin server is running on http://localhost:${ADMIN_PORT}`);
});