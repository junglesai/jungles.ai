FROM node:23.3.0-alpine

WORKDIR /app

# Install python and build dependencies
RUN apk add --no-cache python3 make g++

COPY package*.json ./

# Install dependencies
RUN npm install

COPY . .

EXPOSE 5555

CMD ["npm", "run", "start:init"] 