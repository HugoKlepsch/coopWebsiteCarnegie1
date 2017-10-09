# Website post ideas

* Job description
* Main roles
    - What you did most and became most familiar with
    - Talks about technologies I use (tech talks)
* Work term goals
* Reflection?

# Techs to talk

* vim
* tech website runs on
* awk / sed
* systemd services and timers
* nodejs
* typescript
* cmake
* Docker
* Kubernetes
* Let's encrypt
* Gerrit
* Jenkins
* Cassandra

# Website archtitecture

* Deployed with Docker
* Served with Nodejs using:
    - Express
        - If url ends in `.blogml`, look for file in serverAssets, render and serve it
        - Otherwise, just serve the file.
* Content built with <> markdown -> html converter. Possibilities:
    - Content written in basic html or markdown with converter middleware
