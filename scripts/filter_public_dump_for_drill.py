"""Extract public-schema COPY data from a Supabase CLI plain SQL dump.

This is for an isolated app-data restore drill, not a complete Supabase restore.
Managed auth/storage schemas need a target with matching service migrations.
"""

import re
import sys
from pathlib import Path


def main() -> None:
    if len(sys.argv) != 3:
        raise SystemExit("usage: filter_public_dump_for_drill.py INPUT OUTPUT")

    input_path, output_path = map(Path, sys.argv[1:])
    copy_header = re.compile(r'^COPY (?:(?:public)|(?:"public"))\.', re.IGNORECASE)
    copying = False
    copy_count = 0
    with input_path.open("r", encoding="utf-8") as source, output_path.open("x", encoding="utf-8") as target:
        target.write("SET session_replication_role = replica;\n")
        target.write("DO $$ BEGIN IF current_setting('session_replication_role') <> 'replica' THEN RAISE EXCEPTION 'replica mode not enabled'; END IF; END $$;\n")
        for line in source:
            if copying:
                target.write(line)
                if line.rstrip("\r\n") == r"\.":
                    copying = False
                continue
            if copy_header.match(line):
                target.write(line)
                copying = True
                copy_count += 1
            elif line.startswith(("SELECT pg_catalog.setval('public.", "SELECT pg_catalog.setval('\"public\".")):
                target.write(line)
    if copying:
        raise SystemExit("incomplete COPY block in database dump")
    if copy_count == 0:
        raise SystemExit("no public-schema COPY blocks in database dump")
    print(f"Prepared {copy_count} public-schema data blocks for isolated restore")


if __name__ == "__main__":
    main()
