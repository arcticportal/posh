#!/usr/bin/python3
# Chained weekly pipeline: download -> sequence -> prune.
# A raise in any stage stops the chain, so 'latest' is never repointed and no
# folder is deleted on partial failure -- the system keeps serving the last
# good dataset.

import download
import sequence
from utils import prune


def main():
    download.main()
    sequence.main()
    prune('download')
    prune('sequence')


if __name__ == '__main__':
    main()
