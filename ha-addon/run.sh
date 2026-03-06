#!/bin/sh
set -e

# If running as HA add-on with ingress, set the base path
if [ -n "$SUPERVISOR_TOKEN" ]; then
    echo "Running as Home Assistant add-on with ingress"
    export INGRESS_PATH=$(curl -s -H "Authorization: Bearer $SUPERVISOR_TOKEN" http://supervisor/addons/self/info | python3 -c "import sys,json; print(json.load(sys.stdin).get('data',{}).get('ingress_url',''))" 2>/dev/null || echo "")
fi

exec node server.js
