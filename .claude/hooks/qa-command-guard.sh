#!/usr/bin/env bash
# qa-command-guard.sh
#
# PreToolUse hook that denies obviously destructive or out-of-scope Bash
# commands when a QA agent is operating. This is the second line of defense
# after the agent prompts themselves — prompts can drift, hooks don't.
#
# The hook reads a JSON tool call payload on stdin. It writes a JSON
# decision object on stdout:
#   { "decision": "allow" }          → let the command run
#   { "decision": "deny", "reason":… } → block it, surface the reason
#
# Only Bash tool calls are inspected. Everything else is allowed.

set -euo pipefail

payload="$(cat)"

tool_name=$(printf '%s' "$payload" | sed -n 's/.*"tool_name"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p')
if [ "$tool_name" != "Bash" ]; then
  printf '{"decision":"allow"}'
  exit 0
fi

command=$(printf '%s' "$payload" | sed -n 's/.*"command"[[:space:]]*:[[:space:]]*"\(.*\)".*/\1/p')

deny() {
  local reason="$1"
  printf '{"decision":"deny","reason":"%s"}' "$reason"
  exit 0
}

# Hard blocks — destructive ops, privilege escalation, outbound network
case "$command" in
  *"sudo "*)                   deny "sudo is not allowed under QA guard" ;;
  *"rm -rf /"*)                deny "rm -rf / is blocked" ;;
  *"rm -rf ~"*)                deny "rm -rf on home is blocked" ;;
  *"rm -rf .."*)               deny "rm -rf .. is blocked" ;;
  *"rm -rf *"*)                deny "rm -rf * is blocked" ;;
  *"git push"*)                deny "git push is not allowed from QA agents" ;;
  *"git reset --hard"*)        deny "git reset --hard is not allowed" ;;
  *"git checkout -- "*)        deny "git checkout -- is not allowed (discards work)" ;;
  *"git commit"*)              deny "git commit is not allowed from QA agents" ;;
  *"git add"*)                 deny "git add is not allowed from QA agents" ;;
  *"chmod 777"*)               deny "chmod 777 is blocked" ;;
  *"curl "*|*"wget "*)         deny "outbound network (curl/wget) is blocked" ;;
  *"--no-verify"*)             deny "--no-verify bypasses hooks and is blocked" ;;
esac

# Allow any rm -rf only if scoped to qa/reports/.tmp
case "$command" in
  *"rm -rf qa/reports/.tmp"*|*"rm -rf qa/generated-tests/.tmp-fuzz"*) ;;
  *"rm -rf "*) deny "rm -rf outside qa/reports/.tmp or qa/generated-tests/.tmp-fuzz is blocked" ;;
esac

printf '{"decision":"allow"}'
