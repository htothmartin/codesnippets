#!/bin/bash

sudo chown root:docker /var/run/docker.sock

exec "$@"