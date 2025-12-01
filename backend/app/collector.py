import instaloader
import time
import os
from neo4j import GraphDatabase
from dotenv import load_dotenv
import backoff

load_dotenv()

NEO4J_URI = os.getenv("NEO4J_URI", "bolt://neo4j:7687")
NEO4J_USER = os.getenv("NEO4J_USER", "neo4j")
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD", "password")

driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))






def fetch_and_store(profile_name, max_followers=None):
    L = instaloader.Instaloader()
    profile = instaloader.Profile.from_username(L.context, profile_name)

    with driver.session() as session:
        session.write_transaction(ensure_user, profile.username, fullname=profile.full_name or "", id=profile.userid)

        count = 0
        for follower in profile.get_followers():
            username = follower.username
            session.write_transaction(ensure_user, username, id=follower.userid, fullname=follower.full_name or "")
            session.write_transaction(ensure_follow, username, profile.username)
            count += 1
            if max_followers and count >= max_followers:
                break
            time.sleep(1.2)

        count = 0
        for followee in profile.get_followees():
            username = followee.username
            session.write_transaction(ensure_user, username, id=followee.userid, fullname=followee.full_name or "")
            session.write_transaction(ensure_follow, profile.username, username)
            count += 1
            if max_followers and count >= max_followers:
                break
            time.sleep(1.2)


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Collect followers/following for a profile and ingest into Neo4j")
    parser.add_argument("profile", help="Instagram username to crawl")
    parser.add_argument("--max", type=int, default=200, help="Max followers/following to fetch (per list)")
    args = parser.parse_args()

    fetch_and_store(args.profile, max_followers=args.max)
