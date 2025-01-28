FROM node:23.3.0-alpine

WORKDIR /app

# Install development dependencies including ts-node
RUN npm install -g ts-node typescript nodemon

COPY package*.json ./

# Install all dependencies (including devDependencies)
RUN npm install --include=dev

COPY . .

EXPOSE 5555

# Update the CMD to use ts-node directly
CMD ["npm", "run", "start:init"] 