# sys-simulation

> Learn distributed systems by *breaking* them.

**[▶ Play now → sys-simulation.vercel.app](https://sys-simulation.vercel.app/)**

---

Drag a Load Balancer. Connect a Redis cache. Watch your database survive a 10x traffic spike — or melt under pressure.

sys-simulation turns system design from passive reading into an active experiment. Build a real architecture, run a mathematical simulation, and see exactly why your decisions matter.

---

## How to play

1. Pick a challenge
2. Drag infrastructure components onto the canvas
3. Connect them into a request flow pipeline
4. Hit **Start** and watch traffic flow through your system
5. Read the terminal. Watch the load bars. Don't let your database catch fire.

---

## Run locally

```bash
git clone https://github.com/your-username/sys-simulation
cd sys-simulation
npm i && npm run dev
```

Open [localhost:3000](http://localhost:3000) — you're in.

---

## Add a new challenge

Create `src/problems/your-challenge.ts`, register it in `src/problems/index.ts`. Done. No engine changes needed.

See `README-DEV.md` for full details on adding problems, components, and scoring profiles.

---

## Built with

Next.js · TypeScript · React Flow · Tailwind CSS · Vercel

---

*Made for engineers who learn by building, not by reading.*