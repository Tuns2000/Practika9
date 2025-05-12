const graphql = require('graphql');
const { GraphQLObjectType, GraphQLSchema, GraphQLString, GraphQLInt, GraphQLList } = graphql;
const fs = require('fs');
const path = require('path');

// Функция для загрузки товаров из JSON-файла
const loadProducts = () => {
  try {
    const productsFilePath = path.join(__dirname, '../data/products.json');
    const productsData = fs.readFileSync(productsFilePath, 'utf8');
    return JSON.parse(productsData);
  } catch (err) {
    console.error('Ошибка загрузки товаров в GraphQL:', err);
    return [
      { id: 1, name: 'Товар 1', price: 100, description: 'Описание товара 1', categories: ['Электроника'] },
      { id: 2, name: 'Товар 2', price: 200, description: 'Описание товара 2', categories: ['Одежда'] },
    ];
  }
};

// Тип для товара
const ProductType = new GraphQLObjectType({
  name: 'Product',
  fields: () => ({
    id: { type: GraphQLInt },
    name: { type: GraphQLString },
    price: { type: GraphQLInt },
    description: { type: GraphQLString },
    categories: { type: new GraphQLList(GraphQLString) }
  })
});

// Корневой запрос
const RootQuery = new GraphQLObjectType({
  name: 'RootQueryType',
  fields: {
    // Получить все товары
    products: {
      type: new GraphQLList(ProductType),
      resolve(parent, args) {
        return loadProducts();
      }
    },
    
    // Получить товар по ID
    product: {
      type: ProductType,
      args: { id: { type: GraphQLInt } },
      resolve(parent, args) {
        const products = loadProducts();
        return products.find(product => product.id === args.id);
      }
    },
    
    // Получить только имена и цены товаров
    productNamesAndPrices: {
      type: new GraphQLList(new GraphQLObjectType({
        name: 'ProductNamePrice',
        fields: {
          id: { type: GraphQLInt },
          name: { type: GraphQLString },
          price: { type: GraphQLInt }
        }
      })),
      resolve(parent, args) {
        const products = loadProducts();
        return products.map(product => ({
          id: product.id,
          name: product.name,
          price: product.price
        }));
      }
    },
    
    // Получить только имена и описания товаров
    productNamesAndDescriptions: {
      type: new GraphQLList(new GraphQLObjectType({
        name: 'ProductNameDescription',
        fields: {
          id: { type: GraphQLInt },
          name: { type: GraphQLString },
          description: { type: GraphQLString }
        }
      })),
      resolve(parent, args) {
        const products = loadProducts();
        return products.map(product => ({
          id: product.id,
          name: product.name,
          description: product.description
        }));
      }
    },
    
    // Получить товары по категории
    productsByCategory: {
      type: new GraphQLList(ProductType),
      args: { category: { type: GraphQLString } },
      resolve(parent, args) {
        const products = loadProducts();
        return products.filter(product => 
          product.categories && product.categories.includes(args.category)
        );
      }
    }
  }
});

// Мутации для добавления и удаления товара
const Mutation = new GraphQLObjectType({
  name: 'Mutation',
  fields: {
    addProduct: {
      type: ProductType,
      args: {
        name: { type: GraphQLString },
        price: { type: GraphQLInt },
        description: { type: GraphQLString },
        categories: { type: new GraphQLList(GraphQLString) }
      },
      resolve(parent, args) {
        const products = loadProducts();
        const product = {
          id: products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1,
          name: args.name,
          price: args.price,
          description: args.description,
          categories: args.categories || []
        };
        
        products.push(product);
        
        // Сохраняем изменения в файл
        const productsFilePath = path.join(__dirname, '../data/products.json');
        fs.writeFileSync(productsFilePath, JSON.stringify(products, null, 2), 'utf8');
        
        return product;
      }
    },
    deleteProduct: {
      type: ProductType,
      args: {
        id: { type: GraphQLInt }
      },
      resolve(parent, args) {
        const products = loadProducts();
        const index = products.findIndex(product => product.id === args.id);
        
        if (index === -1) {
          throw new Error('Product not found');
        }
        
        const deletedProduct = products.splice(index, 1)[0];
        
        // Сохраняем изменения в файл
        const productsFilePath = path.join(__dirname, '../data/products.json');
        fs.writeFileSync(productsFilePath, JSON.stringify(products, null, 2), 'utf8');
        
        return deletedProduct;
      }
    }
  }
});

// Экспорт схемы
module.exports = new GraphQLSchema({
  query: RootQuery,
  mutation: Mutation
});
