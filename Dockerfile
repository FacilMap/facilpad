FROM node:15.12-alpine
MAINTAINER Candid Dauth <cdauth@cdauth.eu>

CMD yarn run server
EXPOSE 8080

RUN apk add --no-cache yarn
# g++ git make python2

RUN adduser -D -h /opt/facilmap -s /bin/sh facilmap

WORKDIR /opt/facilmap/server

COPY ./ ../

RUN chown -R facilmap:facilmap /opt/facilmap

USER facilmap

#RUN mkdir ~/.local && npm config set prefix ~/.local && \
#	npm install -S mysql pg sqlite3 tedious && \
#    cd .. && npm run deps && npm run build

RUN cd .. && yarn install

RUN cd .. && yarn run build

USER root
RUN chown -R root:root /opt/facilmap && chown -R facilmap:facilmap /opt/facilmap/server/cache

USER facilmap
