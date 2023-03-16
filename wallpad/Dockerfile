ARG BUILD_FROM
FROM $BUILD_FROM

ENV LANG C.UTF-8

# Set WORKDIR
WORKDIR /share

# Copy data for add-on
COPY run.sh /
RUN chmod a+x /run.sh

# Install requirments for add-on
RUN apk add --no-cache npm
RUN npm install mqtt

CMD [ "/run.sh" ]
