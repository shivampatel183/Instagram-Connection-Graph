# Instagram Connection Graph (mini LinkedIn-style)

This project collects Instagram follower/following relationships, stores them in Neo4j, and exposes a FastAPI backend plus a small React component to explore the graph.

Quick start (PowerShell):

```
cd "c:\Users\Shivam\Desktop\Study\Instagram Connection Graph\insta-graph"
docker-compose up --build
```

Then point your browser to `http://localhost:8000/docs` for API docs.

Worker:

- The worker uses `instaloader` to fetch followers and followees. Run manually:

```
python .\worker\collector.py some_username --max 200
```

Notes:

- Respect Instagram's terms of service and rate limits. Use authenticated crawling if you need private data and have permission.
- This is a minimal prototype; improve error handling, backoff, and authentication for production.
