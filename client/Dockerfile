FROM node:23.3.0

WORKDIR /app

COPY package*.json ./

RUN rm -rf node_modules
RUN rm -rf dist

RUN npm install

COPY . .

RUN npm run build

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host"] 