"""Extract only expected members of a supported MM Book House backup."""

import json
import shutil
import sys
import zipfile
from pathlib import Path


archive = Path(sys.argv[1])
destination = Path(sys.argv[2])
base = {"manifest.json", "roles.sql", "schema.sql", "data.sql"}
orders = {
    1: ["roles.sql", "schema.sql", "data.sql"],
    2: ["roles.sql", "managed-schema.sql", "schema.sql", "data.sql"],
}

with zipfile.ZipFile(archive) as source:
    names = source.namelist()
    manifest = json.loads(source.read("manifest.json"))
    order = orders.get(manifest.get("formatVersion"))
    if order is None or manifest.get("restoreOrder") != order:
        raise SystemExit("Unsupported backup restore order")
    expected = base | ({"managed-schema.sql"} if manifest["formatVersion"] == 2 else set())
    if len(names) != len(expected) or set(names) != expected:
        raise SystemExit("Unexpected backup archive contents")
    destination.mkdir(mode=0o700, parents=True, exist_ok=False)
    for name in names:
        with source.open(name) as source_file, (destination / name).open("xb") as target:
            shutil.copyfileobj(source_file, target)

print("Backup archive structure verified")
