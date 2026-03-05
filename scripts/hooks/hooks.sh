#!/usr/bin/env bash
# Project terminal hook for Git Bash
# Intercepts every command and asks for AI/user confirmation before executing
#
# Usage: source ./scripts/hooks/hooks.sh
# Or add to .bashrc: [ -f ./scripts/hooks/hooks.sh ] && source ./scripts/hooks/hooks.sh

_pre_command_hook() {
    local cmd
    cmd="$(history 1 | sed 's/^[[:space:]]*[0-9]*[[:space:]]*//')"

    # Skip empty commands and the hook itself
    [[ -z "$cmd" ]] && return
    [[ "$cmd" == "_pre_command_hook" ]] && return
    [[ "$COMP_LINE" ]] && return

    echo ""
    echo -e "\033[36m┌─ Command to execute ────────────────────────────\033[0m"
    echo -e "\033[33m│  $cmd\033[0m"
    echo -e "\033[36m└─────────────────────────────────────────────────\033[0m"

    # [AI hook point] — here you can call an AI API to analyze the command
    # Example: curl -s -X POST http://localhost:PORT/check -d "{\"cmd\":\"$cmd\"}"

    read -r -p "Execute? [Y/n]: " confirm

    if [[ "$confirm" != "y" && "$confirm" != "Y" && "$confirm" != "" ]]; then
        echo -e "\033[31mCommand cancelled.\033[0m"
        # Kill the foreground process group to prevent execution
        kill -SIGINT $$
    fi
}

# Register the hook using PROMPT_COMMAND + trap DEBUG combination
_hook_guard=0

_trap_debug_handler() {
    if [[ $_hook_guard -eq 0 ]]; then
        _hook_guard=1
        _pre_command_hook
        _hook_guard=0
    fi
}

trap '_trap_debug_handler' DEBUG
export PROMPT_COMMAND="_hook_guard=0${PROMPT_COMMAND:+; $PROMPT_COMMAND}"

echo -e "\033[32m✅ Pre-command hook enabled (Git Bash)\033[0m"
