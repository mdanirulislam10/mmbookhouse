"""Extract only the four expected members of an MM Book House backup."""

import json
import shutil
import sys
import zipfile
from pathlib import Path


archive = Path(sys.argv[1])
destination = Path(sys.argv[2])
expected = {"manifest.json", "roles.sql", "schema.sql", "data.sql"}

with zipfile.ZipFile(archive) as source:
    names = source.namelist()
    if len(names) != len(expected) or set(names) != expected:
        raise SystemExit("Unexpected backup archive contents")
    manifest = json.loads(source.read("manifest.json"))
    if manifest.get("restoreOrder") != ["roles.sql", "schema.sql", "data.sql"]:
        raise SystemExit("Unsupported backup restore order")
    destination.mkdir(mode=0o700, parents=True, exist_ok=False)
    for name in names:
        with source.open(name) as source_file, (destination / name).open("xb") as target:
            shutil.copyfileobj(source_file, target)

print("Backup archive structure verified")
