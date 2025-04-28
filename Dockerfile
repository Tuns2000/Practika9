FROM node:20-alpine

# Создаем пользователя node для запуска приложения
USER node
WORKDIR /app

# Копируем package.json и package-lock.json с правильными разрешениями
COPY --chown=node:node app/package*.json ./

# Устанавливаем зависимости
RUN npm install

# Копируем код приложения с правильными разрешениями
COPY --chown=node:node app/ .

# Открываем порты для магазина, WebSocket и админки
EXPOSE 3000 8081 8082

# Запускаем приложение
CMD ["npm", "start"]