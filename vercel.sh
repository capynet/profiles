#!/bin/bash

if [[ $VERCEL_ENV == "production"  ]] ; then
  npm run build
else
  npm run build:development
fi