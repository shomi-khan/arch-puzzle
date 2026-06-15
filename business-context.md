# Business Context: System Design Simulation Puzzle

## Overview

This project is an educational simulation game for learning distributed systems and system design through interactive puzzles.

Instead of reading architecture diagrams from books, users will build architectures by dragging infrastructure components onto a canvas, configuring them, and running a mathematical simulation to observe the system's behavior.

The goal is to teach real-world architectural tradeoffs such as horizontal/vertical scalability, latency, availability, caching, replication, sharding, load balancing, queueing, and infrastructure cost.

This project should feel like a hybrid of a puzzle game and a cloud architecture simulator.

---

# Core Philosophy

Every architectural decision has consequences.

* Adding server replicas increases availability but consumes more budget.
* Adding Redis reduces database load but increases cost.
* Changing cache TTL may reduce latency but introduce stale data.
* Scaling vertically (larger instances) is easy but hits a hard limit and becomes expensive.
* Scaling horizontally introduces network complexity and concurrency issues.
* Database Sharding solves write bottlenecks but complicates data routing.
* Database Replication solves read bottlenecks but introduces replication lag.

Users should learn that there is rarely a single perfect architecture. Instead, they should optimize tradeoffs under constraints.

---

# Gameplay Loop

1. User selects a challenge.
2. User receives an initial infrastructure budget.
3. User builds the architecture using drag-and-drop components by establishing a valid request flow pipeline.
4. User configures component parameters (including instance scaling types).
5. User runs the simulation.
6. The simulation engine evaluates the architecture mathematically using a 1-second time-step interval.
7. A detailed system report is generated including percentile latencies and data consistency metrics.
8. User earns **Reward Currency (Research Funds / XP)** and performance-based budget bonuses.
9. Earned Research Funds are spent in the Tech Tree to unlock advanced scaling components.

---

# Challenge Structure

Challenges are organized by difficulty.

Example:

* Beginner
* Easy
* Medium
* Hard
* Expert
* Nightmare

Each challenge contains:

* id
* title
* subtitle
* description
* duration
* traffic pattern
* initial budget
* success conditions
* optional constraints

Users cannot unlock later challenges until previous ones are completed.

---

# Simulation Engine & Request Flow Path (Routing Logic)
The engine processes data in **1-second discrete time-steps** to evaluate real-time queue lengths, cache-miss spikes, and database degradation under peak loads. 

The user’s visual design is parsed as a **Directed Acyclic Graph (DAG)**. Traffic originates from the `Internet/Client` node and flows along the directional edges. The engine validates routing rules (e.g., traffic cannot hit a Database Shard without passing through an API/Proxy or Shard Router).


---

# Real-Time Visual Animation Mechanics
The visual canvas dynamically streams system health and resource consumption updates every second:
* **Animated Edges:** Edges render moving directional pulses or particle dots along the request paths, visually mapping traffic velocity and load distribution.
* **Numeric Capacity Counters:** Nodes (API Servers, Databases) display real-time numeric text counters showing current active connections/workload vs. maximum absolute capacity.
* **Dynamic Color-Coded Progress Bars:** System load is tracked via color-shifting progress status overlays:
  * **Green (0% - 60% Load):** Optimal operating state.
  * **Orange (61% - 89% Load):** System under high pressure, nearing a bottleneck.
  * **Red (90% - 100%+ Load):** Severely overloaded state. When capacity issues ease or autoscaling registers new instances, status colors dynamically revert to green.
* **Database Connection Pool Tracking:** Databases render specialized countdown indicators reflecting active vs. depleted connection pools in real-time.

# Infrastructure Components

Every component has:

* icon
* level
* category
* purchase cost
* runtime cost (optional)
* capacity
* latency
* configurable parameters

Examples:

Load Balancer

* algorithm
* max connections

Redis

* memory
* TTL
* eviction policy

Database

* replica count
* connection limit
* storage
* capacity limit (Req/s)

Queue

* throughput
* workers

CDN

* cache ratio
* bandwidth

Worker

* concurrency

Auto Scaling Group

* min instances
* max instances
* scaling threshold

Future components should be easy to add without changing engine logic.

---

# Architecture Builder

Users build systems using drag-and-drop.

Components can be connected into request flow pipelines.

Example:

Internet

↓

Load Balancer

↓

API

↓

Redis

↓

Database

Users can modify configuration before running the simulation.

---

# Progression & Cost System
* **Global Research Fund (XP):** High-performing architectures earn global XP/Research Funds. Users spend this currency in the global **Tech Tree** to unlock advanced components like `Kafka Queue`, `Shard Router`, `CDN`, and `Database Replication clusters`.

---

# Scoring System

Multiple solutions may be valid.

Instead of simple pass/fail, the engine evaluates architecture quality.

Metrics include:

* Infrastructure Cost
* Average Latency
* Availability
* Error Rate
* Cache Hit Ratio
* Database Utilization
* Scalability
* Resource Efficiency

Each metric has configurable global weights.

Example:

Cost = 0.20

Latency = 0.35

Availability = 0.25

Cache Efficiency = 0.20

Weights should be configurable without changing engine code.

Different challenge types may use different weight profiles.

---

# Example Tradeoff

Flash Sale scenario:

Without Redis:

* low cost
* high database pressure
* high latency
* failures

With Redis:

* higher infrastructure cost
* lower latency
* lower database load
* improved scalability

Reward calculation should recognize these tradeoffs instead of rewarding only low cost.

---

# Result Report

After every simulation, the user receives a detailed report.

Example metrics:

* Peak RPS
* Average Latency
* P95 Latency
* Cache Hit Ratio
* Database Hits
* Database Load
* Replica Usage
* Queue Length
* Dropped Requests
* Availability
* Infrastructure Cost
* Final Score
* Reward Currency

The report should also provide optimization hints.

Example:

* Cache strategy is effective.
* Redis memory allocation is oversized.
* Database replicas are underutilized.
* Cost can be reduced by removing unnecessary infrastructure.

---

# UI Requirements

The interface should be modern, minimal, and clean.

Pages:

* Challenge List
* Challenge Details
* Drag-and-Drop Builder
* Component Configuration Panel
* Simulation Controls
* Runtime Logs
* Final Report

Controls:

* Start
* Pause
* Resume
* Reset

The time-steps are locked to an on-screen scrolling terminal outputting granular system events, state shifts, and infrastructure notifications with contextual formatting:
http://googleusercontent.com/immersive_entry_chip/0

Example:

[00:00] ⚙️ [SYSTEM] Initialization completed. Setup inventory loaded.
[00:00] ⚙️ [SYSTEM] Reloaded Stage: "The Viral Tweet". Ready to play.
[00:01] 🚀 [SYSTEM] Simulation thread initialized. Traffic flowing...
[00:05] ℹ️ [INFO] Cache hit ratio stabilized at 82%. Database load decreasing.
[00:12] ⚠️ [WARN] Database Connection Pool utilization reached 90%. Queue piling up!
[00:15] ❌ [CRITICAL] Web Server #2 experienced thermal shutdown from overload!
[00:16] ❌ [CRITICAL] Web Server #2 experienced thermal shutdown from overload!
[00:20] 📈 [AUTOSCALING] Triggered scaling event: Spawning Web Server #3.
[00:21] ✅ [SUCCESS] Web Server #3 healthy. Rebalancing traffic.
[00:45] 🏁 [SYSTEM] Simulation completed. Generating final report...

---

# Modularity

The project must be highly modular.

Problems, constraints, components, scoring rules, and traffic patterns should all be data-driven.

Adding a new challenge should require only adding new configuration files, without modifying engine logic.

Future expansion is a primary design goal.

---

# Future Roadmap

Potential future features:

* Progress tracking
* Achievements
* Global leaderboard
* Daily challenges
* Multiplayer architecture battles
* Team-based design challenges
* AI-generated scenarios
* Scenario editor
* Community-created puzzles
* Export architecture diagrams
* Interview preparation mode
* Cloud provider themes (AWS, GCP, Azure)

The architecture should be designed to support these features without major refactoring.

---

# Target Audience

* Backend Engineers
* Software Engineers
* Computer Science Students
* DevOps Engineers
* System Design Interview Candidates
* Distributed Systems Learners
* Architecture Enthusiasts

The project should make learning system design interactive, experimental, and enjoyable instead of passive reading.
