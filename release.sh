#!/usr/bin/env bash
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" > /dev/null && pwd )"
PATH=${DIR}/bin:${PATH}

: ${SIGNALER_DB_ADMIN_URL?"Environment variable SIGNALER_DB_ADMIN_URL not set"}
no_cedentials_url=`echo ${SIGNALER_DB_ADMIN_URL} | sed 's/.\+@/http:\/\//'`

if [ -n "${BUILD_NUMBER}" ]; then
    export SIGNALER_VERSION=v${BUILD_NUMBER};
else
    export SIGNALER_VERSION=${USER};
fi

url=${SIGNALER_DB_ADMIN_URL}

function update_db(){
    local db=$1

    echo "Using couchdbapp"

    local db_status=`curl --head -o /dev/null -w '%{http_code}' ${url}`

    if [ "${db_status}" == '404'  ] ; then
        curl -X PUT ${url}
    fi

    bin/npm install
    bin/tsc -p ${db}
    bin/couchapp push ${db}/app.js ${url}
}

function upload_docs(){
    local docs=$1
    echo "Uploading docs"
    couchdb-push --help > /dev/null #Make sure couchdb-push in installed in a single thread
    find ${docs} -type f | xargs -n 1 -P 64 couchdb-push ${url}
}

function display_url(){
   echo "API: ${no_cedentials_url}/_design/${SIGNALER_VERSION}/_list/features/all?user_group=${GROUP}&user_id=${USER_ID}" 
   echo "GUI: ${no_cedentials_url}/_design/${SIGNALER_VERSION}/_list/toggle/all" 

}

update_db couchapp

#upload_docs docs

display_url
