FROM nginx:alpine

COPY nginx.conf /etc/nginx/nginx.conf
WORKDIR /usr/share/nginx/html

# use dist from previous stage
COPY ./build/ /usr/share/nginx/html/

EXPOSE 8080