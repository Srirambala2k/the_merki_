"""Run extract_layer over every entry in tools/layers.json -> <out_dir>/<page>/.

usage: python -I tools/build_layers.py <ref_dir> <ref4k_dir> <out_dir> [page ...]
Layer entries are [scene_file_stem, layer_id, options?]. A page may borrow
another page's clean background (Page 3 uses Page 0's empty scene) or have none.
"""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from extract_layer import extract, find  # noqa: E402

ref, ref4k, out = sys.argv[1:4]
only = set(sys.argv[4:])
manifest = json.load(open(os.path.join(os.path.dirname(__file__), "layers.json")))

for pid, cfg in manifest.items():
    if only and pid not in only:
        continue
    clean = find(ref, *cfg["base"]) if cfg["base"] else None
    page = "Page " + pid[1:]
    for stem, lid, *opt in cfg["layers"]:
        try:
            extract(clean, find(ref, page, stem + ".png"), find(ref4k, page, stem + ".png"),
                    os.path.join(out, pid), lid, opt[0] if opt else None)
        except Exception as e:  # keep going; report at the end
            print("FAILED", pid, lid, e)
