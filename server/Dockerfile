FROM node:18-alpine

WORKDIR /app

RUN npm install -g ts-node typescript nodemon

COPY package*.json ./

RUN npm install --include=dev

COPY . .

EXPOSE 5555

CMD ["npm", "run", "start:init"]