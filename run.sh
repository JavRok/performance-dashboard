#!/bin/sh

# Set logrotate if available, needs sudo access
LOGROTATE=/etc/logrotate.d/perf_dash
DIR="$( cd "$( dirname "$0" )" && pwd )"
LOGFILE=$DIR/log/history.log

if [ ! -f $LOGROTATE ]; then
  echo "No logrotate found, creating one"
  echo "$LOGFILE {
  rotate 12
  weekly
  compress
  missingok
  notifempty
}" > $LOGROTATE
fi

echo "Performance dashboard running, log saved in log/history.log"

node start.js >> log/history.log

