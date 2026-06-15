# Business Context: System Design Simulation Puzzle

## Overview

This project is an educational simulation game for learning distributed systems and system design through interactive puzzles.

Instead of reading architecture diagrams from books, users will build architectures by dragging infrastructure components onto a canvas, configuring them, and running a mathematical simulation to observe the system's behavior.

The goal is to teach real-world architectural tradeoffs such as scalability, latency, availability, caching, replication, load balancing, queueing, and infrastructure cost.

This project should feel like a hybrid of a puzzle game and a cloud architecture simulator.

---

# Core Philosophy

Every architectural decision has consequences.

Adding Redis reduces database load but increases infrastructure cost.

Adding replicas increases availability but consumes more budget.

Changing cache TTL may reduce latency but introduce stale data.

Users should learn that there is rarely a single perfect architecture. Instead, they should optimize tradeoffs under constraints.

---

# Gameplay Loop

1. User selects a challenge.
2. User receives an initial infrastructure budget.
3. User builds the architecture using drag-and-drop components.
4. User configures component parameters.
5. User runs the simulation.
6. The simulation engine evaluates the architecture mathematically.
7. A detailed system report is generated.
8. User earns reward currency based on architecture quality.
9. Reward currency is carried into future levels.

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

# Simulation Engine

The simulation is mathematical, not visual animation.

When the user presses "Start", the engine simulates the workload for a predefined duration.

Example:

* 500 requests/sec
* duration: 45 seconds

The engine calculates:

* request flow
* queue length
* cache hits
* cache misses
* database load
* replica utilization
* autoscaling events
* dropped requests
* latency
* infrastructure cost
* availability
* bottlenecks

Simulation determines whether the architecture succeeds or fails.

---

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

# Cost System

Every challenge starts with an Initial Budget.

Users spend budget by purchasing infrastructure components.

Better architecture should preserve more budget.

Reward currency carries into future levels.

Reward pool for a level:

Current Initial Budget + Total Rewards Earned From Previous Levels

The more efficiently a user solves challenges, the larger infrastructure they can afford in future scenarios.

This acts as a business growth mechanic.

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

Logs should display architect-level infrastructure events.

Example:

Request Received

Cache Hit

Cache Miss

Database Overloaded

Replica Activated

Autoscaling Triggered

Simulation Completed

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
