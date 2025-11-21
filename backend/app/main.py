from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from neo4j import GraphDatabase
import os
from dotenv import load_dotenv

load_dotenv()

NEO4J_URI = os.getenv("NEO4J_URI", "bolt://neo4j:7687")
NEO4J_USER = os.getenv("NEO4J_USER", "neo4j")
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD", "password")

driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))

app = FastAPI(title="Instagram Connection Graph API")

# Allow requests from the frontend dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:5174" , "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class AccountPair(BaseModel):
    a: str
    b: str


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/shortest_path")
def shortest_path(pair: AccountPair):
    query = (
        "MATCH (a:User {username:$a}), (b:User {username:$b}), "
        "p = shortestPath((a)-[*..6]-(b)) RETURN nodes(p) as nodes, relationships(p) as rels"
    )
    with driver.session() as session:ships": rels}


@app.post("/neighborhood")
def neighborhood(account: dict):
    username = account.get("username")
    depth = int(account.get("depth", 1))
    if depth < 1 or depth > 3:
        raise HTTPException(status_code=400, detail="depth must be 1-3")
    query = (
        "MATCH (a:User {username:$username})-[:FOLLOWS*1..$depth]-(n) "
        "RETURN collect(DISTINCT n) as nodes"
    )
    with driver.session() as session:
        res = session.run(query, username=username, depth=depth)
        record = res.single()
        nodes = [dict(n) for n in record["nodes"]] if record else []
        return {"nodes": nodes}


@app.post("/mutuals")
def mutuals(account: dict):
    username = account.get("username")
    query = (
        "MATCH (a:User {username:$username})-[:FOLLOWS]->(m)<-[:FOLLOWS]-(a) "
        "RETURN collect(m) as mutuals"
    )
    with driver.session() as session:
        res = session.run(query, username=username)
        record = res.single()
        mutuals = [dict(n) for n in record["mutuals"]] if record else []
        return {"mutuals": mutuals}
