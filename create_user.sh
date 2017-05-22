#!/usr/bin/env bash
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" > /dev/null && pwd )"
PATH=${DIR}/bin:${PATH}

: ${SIGNALER_DB_ADMIN_URL?"Environment variable SIGNALER_DB_ADMIN_URL not set"}
couchdb_url=`echo ${SIGNALER_DB_ADMIN_URL} | sed 's/signaler-db[\/]*//'`

: ${USER?"Environment variable USER not set"}
: ${PASSWORD?"Environment variable PASSWORD not set"}

user_url="${couchdb_url}_users/org.couchdb.user:${USER}"
etag=`curl -sS -I ${user_url} | grep "ETag:" | cut -d ' ' -f 2 | cut -d '"' -f 2`
json="{\"name\": \"${USER}\", \"password\": \"${PASSWORD}\", \"roles\": [\"signaler\"], \"type\": \"user\"}"

curl -v -X PUT "${user_url}" \
     -H "If-Match: ${etag}" \
     -H "Accept: application/json" \
     -H "Content-Type: application/json" \
     -d "${json}"