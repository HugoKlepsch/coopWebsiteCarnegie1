FROM node:8-slim

ADD ./ /server

WORKDIR /server

# Add Tini
ENV TINI_VERSION v0.16.1
ADD https://github.com/krallin/tini/releases/download/${TINI_VERSION}/tini /tini
RUN chmod +x /tini
ENTRYPOINT ["/tini", "--"]


ENV ASSETS_DIR=serverAssets/
ENV TEMPLATE_DIR=renderTemplates/
ENV PORT=8080

EXPOSE 8080

CMD ["node", "app.js"]
