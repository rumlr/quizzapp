#!/usr/bin/env zsh

LOCAL="/usr/local/pkgs/quizzapp"

if git -C $LOCAL fetch origin && git -C $LOCAL diff --quiet HEAD origin/main; then
  echo "no changes in repository"
  exit 0

else
  git -C $LOCAL pull
  $LOCAL/docker-build.sh

  docker compose -f $LOCAL/docker-compose.yml down
  docker compose -f $LOCAL/docker-compose.yml up -d

fi
