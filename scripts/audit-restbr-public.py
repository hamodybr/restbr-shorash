import json
import pathlib
import re
import urllib.parse
import urllib.request

root = pathlib.Path(__file__).resolve().parents[1]
config = (root / "js/runtime-config.js").read_text(encoding="utf-8")
def value(name):
    match = re.search(name + r"\s*:\s*'([^']+)'", config)
    if not match:
        raise RuntimeError("Missing runtime config field " + name)
    return match.group(1)
base = value("supabaseUrl").rstrip("/")
api_key = value("supabasePublishableKey")
headers = {"apikey": api_key, "Authorization": "Bearer " + api_key, "Accept": "application/json", "User-Agent": "RestBr-public-menu-audit/1.0"}

def fetch_table(table):
    result = []
    for page in range(100):
        params = urllib.parse.urlencode({"select":"*", "order":"id.asc", "limit":"500", "offset":str(page*500)})
        req = urllib.request.Request(base + "/rest/v1/" + table + "?" + params, headers=headers)
        try:
            with urllib.request.urlopen(req, timeout=30) as response:
                rows = json.loads(response.read())
        except Exception as exc:
            raise RuntimeError("Read-only access to " + table + " failed: " + str(exc)) from exc
        if not isinstance(rows, list):
            raise RuntimeError("Unexpected row shape: " + table)
        result.extend(rows)
        if len(rows) < 500:
            return result
    raise RuntimeError("Too many rows in " + table)

tables = ["categories", "products", "product_options", "discounts"]
data = {table: fetch_table(table) for table in tables}
for name, rows in data.items():
    print(name, "public records", len(rows), "fields", sorted(rows[0].keys()) if rows else [])
if not data["products"]:
    raise RuntimeError("Live RESTBR public products empty: refusing incomplete report")
out = root / "imports" / "restbr-public-current.json"
out.parent.mkdir(exist_ok=True, parents=True)
out.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
print("Saved read-only public RESTBR catalog", out.stat().st_size, "bytes")

# Re-read public catalog after November 10 Juice category reconciliation.

# Recheck after final independence migration of all 16 Kurdunus category image URLs.
