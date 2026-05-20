# Usamos una imagen ligera de Node.js
FROM node:18-slim

# Creamos el directorio de trabajo
WORKDIR /app

# Copiamos los archivos de dependencias primero para aprovechar el cache de capas
COPY package*.json ./

# Instalamos las dependencias
RUN npm install --production

# Copiamos el resto del código de la aplicación
COPY . .

# Exponemos el puerto que usa tu servidor
EXPOSE 3000

# Comando para iniciar la aplicación
CMD ["node", "server.js"]
