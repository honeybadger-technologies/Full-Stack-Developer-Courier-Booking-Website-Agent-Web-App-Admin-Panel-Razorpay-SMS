#!/usr/bin/env python3
"""Anthropic Messages proxy between Claude Code and Ollama.

Some local models ignore the tool names they are given and call the names they were trained
on (flint calls `bash` and `read` instead of `Bash` and `Read`). This proxy maps each tool call
the model makes onto a tool the request actually offered, and renames arguments the same way
(`path` -> `file_path`). Every rewrite is logged, so a write-up can say how much help it gave.
"""
import http.client
import json
import os
import signal
import sys
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlsplit

UPSTREAM = urlsplit(os.environ.get("UPSTREAM", "http://127.0.0.1:11434"))
PORT = int(os.environ.get("PORT", "11435"))
LOG_PATH = os.environ.get("REWRITE_LOG", "tool-name-proxy.log")

# Only names seen from real models, after case and _/- are ignored.
NAME_ALIASES = {"readfile": "read", "writefile": "write", "editfile": "edit", "shell": "bash"}
ARG_ALIASES = {"path": "file_path", "file": "file_path", "cmd": "command"}
HOP_HEADERS = {"host", "content-length", "transfer-encoding", "connection", "accept-encoding", "keep-alive"}

_log_lock = threading.Lock()
_counts = {"requests": 0, "tool_calls": 0, "name": 0, "arg": 0}


def norm(s):
    return s.lower().replace("_", "").replace("-", "")


def log_rewrite(kind, before, after, tool=None):
    _counts[kind] += 1
    entry = {"t": time.strftime("%Y-%m-%dT%H:%M:%S"), "kind": kind, "from": before, "to": after}
    if tool:
        entry["tool"] = tool
    with _log_lock, open(LOG_PATH, "a") as f:
        f.write(json.dumps(entry) + "\n")


class ToolMap:
    """The tools one request offered, and how to map a model's call onto them."""

    def __init__(self, tools):
        self.schemas = {t["name"]: (t.get("input_schema") or {}).get("properties", {}) for t in tools or [] if "name" in t}
        self.by_norm = {norm(n): n for n in self.schemas}

    def name(self, called):
        if called in self.schemas:
            return called
        key = norm(called)
        target = self.by_norm.get(key) or self.by_norm.get(NAME_ALIASES.get(key, ""))
        if target:
            log_rewrite("name", called, target)
            return target
        return called

    def args(self, tool, args):
        props = self.schemas.get(tool)
        if not props or not isinstance(args, dict):
            return args
        out = {}
        for key, value in args.items():
            target = key
            if key not in props:
                target = next((p for p in props if norm(p) == norm(key)), None) or ARG_ALIASES.get(norm(key), key)
                if target not in props or target in args or target in out:
                    target = key
            if target != key:
                log_rewrite("arg", key, target, tool)
            out[target] = value
        return out


def sse(event, data):
    return f"event: {event}\ndata: {json.dumps(data)}\n\n".encode()


class Handler(BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    def log_message(self, fmt, *args):
        pass

    def do_GET(self):
        self.forward()

    def do_POST(self):
        self.forward()

    def do_HEAD(self):
        self.forward()

    def forward(self):
        body = self.rfile.read(int(self.headers.get("content-length") or 0))
        tools = ToolMap([])
        if self.command == "POST" and urlsplit(self.path).path.endswith("/v1/messages"):
            try:
                tools = ToolMap(json.loads(body).get("tools"))
                _counts["requests"] += 1
            except (ValueError, AttributeError):
                pass
        headers = {k: v for k, v in self.headers.items() if k.lower() not in HOP_HEADERS}
        conn = http.client.HTTPConnection(UPSTREAM.hostname, UPSTREAM.port or 80, timeout=None)
        try:
            conn.request(self.command, self.path, body=body or None, headers=headers)
            resp = conn.getresponse()
            self.send_response(resp.status)
            for k, v in resp.getheaders():
                if k.lower() not in HOP_HEADERS:
                    self.send_header(k, v)
            self.send_header("Connection", "close")
            self.end_headers()
            self.close_connection = True
            ctype = resp.getheader("content-type", "")
            if "text/event-stream" in ctype:
                self.relay_stream(resp, tools)
            elif "application/json" in ctype and tools.schemas:
                self.wfile.write(self.rewrite_json(resp.read(), tools))
            else:
                self.wfile.write(resp.read())
        except (BrokenPipeError, ConnectionResetError):
            pass
        finally:
            conn.close()

    @staticmethod
    def rewrite_json(raw, tools):
        try:
            msg = json.loads(raw)
        except ValueError:
            return raw
        for block in msg.get("content") or []:
            if block.get("type") == "tool_use":
                _counts["tool_calls"] += 1
                block["name"] = tools.name(block["name"])
                block["input"] = tools.args(block["name"], block.get("input"))
        return json.dumps(msg).encode()

    def relay_stream(self, resp, tools):
        # Tool input arrives as partial JSON; hold it until the block stops, then send it whole.
        pending = {}
        event, data_lines, raw = None, [], b""
        while True:
            line = resp.readline()
            if not line:
                break
            raw += line
            text = line.decode("utf-8", "replace").rstrip("\r\n")
            if text.startswith("event:"):
                event = text[6:].strip()
            elif text.startswith("data:"):
                data_lines.append(text[5:].strip())
            elif text == "":
                self.wfile.write(self.handle_event(event, "\n".join(data_lines), raw, tools, pending))
                self.wfile.flush()
                event, data_lines, raw = None, [], b""
        if raw:
            self.wfile.write(raw)

    @staticmethod
    def handle_event(event, data, raw, tools, pending):
        try:
            payload = json.loads(data) if data else None
        except ValueError:
            return raw
        if not isinstance(payload, dict):
            return raw
        kind, idx = payload.get("type"), payload.get("index")
        if kind == "content_block_start" and payload["content_block"].get("type") == "tool_use":
            block = payload["content_block"]
            _counts["tool_calls"] += 1
            block["name"] = tools.name(block["name"])
            start_input = block.get("input") or {}
            pending[idx] = {"name": block["name"], "buf": "", "start": start_input}
            block["input"] = {}
            return sse(event, payload)
        if kind == "content_block_delta" and idx in pending and payload["delta"].get("type") == "input_json_delta":
            pending[idx]["buf"] += payload["delta"].get("partial_json", "")
            return b""
        if kind == "content_block_stop" and idx in pending:
            p = pending.pop(idx)
            try:
                args = json.loads(p["buf"]) if p["buf"].strip() else p["start"]
            except ValueError:
                args = None
            if args is None:
                delta_json = p["buf"]
            else:
                delta_json = json.dumps(tools.args(p["name"], args))
            delta = {"type": "content_block_delta", "index": idx, "delta": {"type": "input_json_delta", "partial_json": delta_json}}
            return sse("content_block_delta", delta) + raw
        return raw


def _stop(*_):
    raise KeyboardInterrupt


def main():
    signal.signal(signal.SIGTERM, _stop)
    server = ThreadingHTTPServer(("127.0.0.1", PORT), Handler)
    print(f"tool-name-proxy: 127.0.0.1:{PORT} -> {UPSTREAM.geturl()}, log {LOG_PATH}", file=sys.stderr)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        print(f"tool-name-proxy: {json.dumps(_counts)}", file=sys.stderr)


if __name__ == "__main__":
    main()
