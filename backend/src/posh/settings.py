import os

# Fixed: must match the volume mount in docker-compose (posh_data:/posh/data).
# Not env-driven on purpose -- changing it would decouple the code from the
# mount and silently break the backend<->frontend data link.
DATA_DIRECTORY = '/posh/data'

# How many dated download/sequence folders to keep (latest counts as one).
RETENTION = int(os.environ.get('POSH_RETENTION', '3'))
