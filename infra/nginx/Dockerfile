FROM nginx:1.30-alpine

# Replace the default site with the gateway configuration.
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
