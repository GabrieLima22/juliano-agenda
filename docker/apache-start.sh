#!/bin/sh
set -eu

# Force a single Apache MPM at runtime as well, since some deploy
# environments may reuse layer state or restore enabled module symlinks.
rm -f /etc/apache2/mods-enabled/mpm_event.load \
  /etc/apache2/mods-enabled/mpm_event.conf \
  /etc/apache2/mods-enabled/mpm_worker.load \
  /etc/apache2/mods-enabled/mpm_worker.conf

a2dismod mpm_event mpm_worker >/dev/null 2>&1 || true
a2enmod mpm_prefork rewrite >/dev/null 2>&1 || true
a2enconf servername >/dev/null 2>&1 || true

exec apache2-foreground
