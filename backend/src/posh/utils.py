from datetime import date
from pathlib import Path

from settings import DATA_DIRECTORY


def latest_link(subdir):
    'Atomically (re)point <DATA_DIRECTORY>/<subdir>/latest at today\'s dated folder.'
    link = Path(DATA_DIRECTORY, subdir, 'latest')
    tmp = link.with_name('latest.part')
    tmp.unlink(missing_ok=True)
    tmp.symlink_to(date.today().isoformat())
    tmp.replace(link)
