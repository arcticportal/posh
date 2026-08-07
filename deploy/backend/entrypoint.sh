#!/bin/sh
# Container entrypoint: render the crontab from $POSH_CRON, validate it, then
# hand off to supercronic (cron for containers). Runs as PID 1.
set -eu

: "${POSH_CRON:?POSH_CRON is required, e.g. POSH_CRON='0 3 * * 1' (Mon 03:00 UTC)}"

CRONTAB=/tmp/crontab
printf '%s python3 /posh/app/run_pipeline.py\n' "$POSH_CRON" > "$CRONTAB"

if ! supercronic -test "$CRONTAB" > /tmp/sc_test 2>&1; then
    echo "ERROR: invalid POSH_CRON='$POSH_CRON'" >&2
    cat /tmp/sc_test >&2
    exit 1
fi

echo "POSH pipeline scheduled: '$POSH_CRON' TZ=${TZ:-UTC} retention=${POSH_RETENTION:-3}"
exec supercronic "$CRONTAB"
