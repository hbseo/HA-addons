#!/usr/bin/with-contenv bashio
set -e

CONFIG_PATH=/data/options.json

export CONFIG=$(bashio::config)
bashio::log.info "Config configured as ${CONFIG}"

bashio::log.info "Starting wallpad controller service."
npm run start
