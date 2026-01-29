#!/bin/sh
set -e

# Replace only BACKEND_URL in the nginx config template
envsubst '${BACKEND_URL}' < /etc/nginx/nginx.conf.template > /etc/nginx/conf.d/default.conf

# Start nginx
exec nginx -g 'daemon off;'
