FROM node:23.3.0

WORKDIR /app

COPY package*.json ./

RUN rm -rf node_modules

RUN npm install --legacy-peer-deps

COPY . .

RUN npm run build

EXPOSE 5173

CMD ["npm", "run", "dev"]
