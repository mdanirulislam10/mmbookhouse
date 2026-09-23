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
    3: ["roles.sql", "managed-schema.sql", "schema.sql", "data.sql"],
    4: ["roles.sql", "managed-schema.sql", "schema.sql", "data.sql", "auth-migrations.sql"],
}

with zipfile.ZipFile(archive) as source:
    names = source.namelist()
    manifest = json.loads(source.read("manifest.json"))
    order = orders.get(manifest.get("formatVersion"))
    if order is None or manifest.get("restoreOrder") != order:
        raise SystemExit("Unsupported backup restore order")
    expected = base | ({"managed-schema.sql"} if manifest["formatVersion"] >= 2 else set())
    if manifest["formatVersion"] >= 4:
        expected.add("auth-migrations.sql")
    if manifest["formatVersion"] >= 3:
        storage_objects = manifest.get("storageObjects")
        if not isinstance(storage_objects, list):
            raise SystemExit("Missing Storage object manifest")
        archive_names = []
        for item in storage_objects:
            archive_name = item.get("archiveName") if isinstance(item, dict) else None
            if not isinstance(archive_name, str) or not archive_name.startswith("storage-objects/"):
                raise SystemExit("Invalid Storage object archive name")
            path = Path(archive_name)
            if path.is_absolute() or ".." in path.parts or len(path.parts) != 2:
                raise SystemExit("Unsafe Storage object archive name")
            archive_names.append(archive_name)
        if len(archive_names) != len(set(archive_names)):
            raise SystemExit("Duplicate Storage object archive name")
        expected |= set(archive_names)
    if len(names) != len(expected) or set(names) != expected:
        raise SystemExit("Unexpected backup archive contents")
    destination.mkdir(mode=0o700, parents=True, exist_ok=False)
    for name in names:
        (destination / name).parent.mkdir(mode=0o700, parents=True, exist_ok=True)
        with source.open(name) as source_file, (destination / name).open("xb") as target:
            shutil.copyfileobj(source_file, target)

print("Backup archive structure verified")
