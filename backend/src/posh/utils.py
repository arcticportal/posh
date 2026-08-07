import re
import shutil
from datetime import date
from pathlib import Path

from settings import DATA_DIRECTORY, RETENTION


def latest_link(subdir):
    'Atomically (re)point <DATA_DIRECTORY>/<subdir>/latest at today\'s dated folder.'
    link = Path(DATA_DIRECTORY, subdir, 'latest')
    tmp = link.with_name('latest.part')
    tmp.unlink(missing_ok=True)
    tmp.symlink_to(date.today().isoformat())
    tmp.replace(link)


# ponytail: dated folders are YYYY-MM-DD; anything else (e.g. 'latest') is skipped.
DATE_DIR = re.compile(r'^\d{4}-\d{2}-\d{2}$')


def prune(subdir, keep=RETENTION):
    '''Delete dated folders under DATA_DIRECTORY/<subdir> beyond the N most
    recent. Never touches 'latest' or the folder it currently points at.'''
    base = Path(DATA_DIRECTORY, subdir)
    if not base.is_dir(): return
    link = base / 'latest'
    target = link.resolve().name if link.is_symlink() else None
    dated = sorted(
        (p for p in base.iterdir()
         if p.is_dir() and not p.is_symlink() and DATE_DIR.match(p.name)),
        key=lambda p: p.name, reverse=True)
    for p in dated[keep:]:
        if p.name == target: continue
        shutil.rmtree(p, ignore_errors=True)
    print(f'pruned {subdir}')