const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const { graphqlHTTP } = require('express-graphql');
const schema = require('../graphql/schema');
const app = express();

// Порт для магазина
const SHOP_PORT = 3000;

// Загрузка товаров из JSON
let products = [];
const productsFilePath = path.join(__dirname, '../data/products.json');

// Функция для загрузки товаров
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

// Обновление схемы GraphQL с актуальными данными
const updateGraphQLSchema = () => {
  // Здесь мы обновляем данные для GraphQL схемы
  // По умолчанию схема будет использовать импортированные товары
  console.log("GraphQL схема обновлена с актуальными данными");
};

// Разрешаем CORS
app.use(cors());
app.use(bodyParser.json());

// Подключаем GraphQL
app.use('/graphql', graphqlHTTP({
  schema,
  graphiql: true, // Интерактивный интерфейс для тестирования GraphQL
}));

// Статические файлы
app.use(express.static(path.join(__dirname, '../../frontend')));

// API для получения товаров через REST
app.get('/api/products', (req, res) => {
  // Перечитываем файл при каждом запросе для синхронизации с админкой
  products = loadProducts();
  res.json(products);
});

// API для получения товаров по категории
app.get('/api/products/category/:category', (req, res) => {
  products = loadProducts();
  const category = req.params.category;
  const filteredProducts = products.filter(product => 
    product.categories && product.categories.includes(category)
  );
  res.json(filteredProducts);
});

// API для получения товара по ID
app.get('/api/products/:id', (req, res) => {
  products = loadProducts();
  const id = parseInt(req.params.id);
  const product = products.find(p => p.id === id);
  if (product) {
    res.json(product);
  } else {
    res.status(404).json({ error: 'Товар не найден' });
  }
});

// Главная страница магазина
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/index.html'));
});

// Создаем HTTP сервер для WebSocket
const server = http.createServer(app);

// WebSocket сервер
const wss = new WebSocket.Server({ server });

// Глобальный массив всех активных подключений
const clients = [];

wss.on('connection', (ws) => {
  console.log('Новое подключение к WebSocket');
  clients.push(ws);
  
  // Приветственное сообщение
  ws.send(JSON.stringify({ 
    sender: 'server', 
    text: 'Добро пожаловать в чат поддержки!',
    timestamp: new Date().toISOString()
  }));

  ws.on('message', (messageData) => {
    try {
      console.log('Получено сообщение:', messageData.toString());
      const message = JSON.parse(messageData);
      
      // Добавляем временную метку, если её нет
      if (!message.timestamp) {
        message.timestamp = new Date().toISOString();
      }
      
      // Отправляем сообщение всем клиентам
      clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(message));
        }
      });
    } catch (error) {
      console.error('Ошибка обработки сообщения:', error);
    }
  });

  ws.on('close', () => {
    console.log('Клиент отключился');
    const index = clients.indexOf(ws);
    if (index !== -1) {
      clients.splice(index, 1);
    }
  });
});

// Запуск сервера магазина
app.listen(SHOP_PORT, () => {
  console.log(`Shop server is running on http://localhost:${SHOP_PORT}`);
  console.log(`GraphQL доступен на http://localhost:${SHOP_PORT}/graphql`);
});

// Запуск WebSocket сервера
server.listen(8081, () => {
  console.log('WebSocket server running on ws://localhost:8081');
});