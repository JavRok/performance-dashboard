#!/bin/sh

echo "Performance dashboard running, log saved in log/history.log"

../node-v4.4.3-linux-x64/bin/./node Controller/index.js >> log/history.log
