FROM node:23.3.0-alpine

WORKDIR /app

RUN npm install -g nodemon

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 5555

CMD ["npm", "run", "dev"] 