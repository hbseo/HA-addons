#!/usr/bin/with-contenv bashio
set -e

CONFIG_PATH=/data/options.json

bashio::log.info "Config configured."

bashio::log.info "Starting wallpad controller service."
npm run start
