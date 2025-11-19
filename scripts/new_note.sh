#!/usr/bin/env bash

# This script creates a new note in Neovim and saves it in the current directory with a timestamped filename.

filename="$(date +%Y%m%d_%H%M%S).md"

nvim "$filename" -c "startinsert" -c "set filetype=markdown"
