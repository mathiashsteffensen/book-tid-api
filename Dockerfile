FROM node:14
WORKDIR /app
COPY . .
RUN yarn install
RUN yarn build
ENV PORT=3000
EXPOSE 3000
CMD yarn start