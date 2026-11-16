"""Reserva y recupera referencias del demo entre peticiones independientes."""
import json
import os
import sqlite3
from pathlib import Path
from urllib.request import Request, urlopen


class Store:
    def __init__(self, namespace):
        self.namespace = 'magiclink:v1:' + namespace + ':'

    def command(self, operation, key, value=None, reserve=False):
        key = self.namespace + key
        endpoint = os.getenv('UPSTASH_REDIS_REST_URL')
        if endpoint:
            args = [operation, key]
            if operation == 'SET':
                args.append(json.dumps(value))
                if reserve:
                    args.append('NX')
            request = Request(endpoint, data=json.dumps(args).encode(), headers={
                'Authorization': 'Bearer ' + os.environ['UPSTASH_REDIS_REST_TOKEN'],
                'Content-Type': 'application/json'})
            with urlopen(request, timeout=8) as response:
                return json.load(response)['result']
        if os.getenv('VERCEL'):
            raise ValueError('Configura el almacenamiento Redis del demo en Vercel.')
        with sqlite3.connect(Path(__file__).resolve().parent.parent / '.demo.sqlite3') as con:
            con.execute('CREATE TABLE IF NOT EXISTS entries (id TEXT PRIMARY KEY, value TEXT NOT NULL)')
            if operation == 'GET':
                row = con.execute('SELECT value FROM entries WHERE id = ?', (key,)).fetchone()
                return row[0] if row else None
            if operation == 'DEL':
                con.execute('DELETE FROM entries WHERE id = ?', (key,))
                return
            sql = 'INSERT OR IGNORE' if reserve else 'INSERT OR REPLACE'
            return con.execute(sql + ' INTO entries VALUES (?, ?)', (key, json.dumps(value))).rowcount

    def reserve(self, key, value):
        return bool(self.command('SET', key, value, reserve=True))

    def __getitem__(self, key):
        result = self.command('GET', key)
        if result is None:
            raise KeyError(key)
        return json.loads(result)

    def __setitem__(self, key, value):
        self.command('SET', key, value)

    def __delitem__(self, key):
        self.command('DEL', key)

    def __contains__(self, key):
        return self.command('GET', key) is not None
