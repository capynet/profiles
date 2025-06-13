#!/bin/bash

if [[ $VERCEL_ENV == "production"  ]] ; then
  #  npm run build
  # Temporary enabled development tasks on prod for testing purposes.
  npm run build:development
else
  npm run build:development
fi