# gunicorn.conf.py

bind = "0.0.0.0:10000"

# Use only 1 worker on free tier to save memory
workers = 1

# Use threads to handle concurrent requests without extra memory
threads = 2

# Increase timeout to 5 minutes (300 seconds)
timeout = 300

# Graceful shutdown time
graceful_timeout = 30

# Restart worker after handling 100 requests to prevent memory leaks
max_requests = 100
max_requests_jitter = 20

# Disable preload to reduce memory usage
preload_app = False

# Use sync worker (simplest, low memory)
worker_class = "sync"

# Log level
loglevel = "info"

# Enable access logging
accesslog = "-"
errorlog = "-"
