# Citation Star-Map for Network Neuroscience — Plan

## Overview
Build a fully static, single-page 3D citation star-map webapp for network neuroscience / brain connectomics, deployed on *.kimi.page.

## Stage 1 — Paper Collection (~200 REAL papers)
- **Skill**: `deep-research-swarm` (adapted for paper collection)
- **Agents**: Multiple parallel research agents searching different sources
  - Agent A: arXiv — search network neuroscience, brain connectomics, graph theory neuroscience
  - Agent B: Google Scholar — search connectomics, structural connectivity, functional connectivity, brain networks
  - Agent C: Semantic Scholar / PubMed — search network neuroscience, resting-state fMRI, DTI connectomics
- **Goal**: Collect ~200 real papers with title, authors, year, abstract, DOI/URL, citation count, references
- **Output**: Raw paper corpus JSON

## Stage 2 — Graph Construction & Static JSON Baking
- **Skill**: Custom Python processing
- **Steps**:
  1. Parse raw paper data (authors as string|string[], getFirstAuthor helper)
  2. Build citation edges (direct citation from reference lists)
  3. Build co-citation edges (two papers cited by same third paper)
  4. Fallback to keyword co-occurrence edges if sparse
  5. Louvain community detection for node coloring (jewel tones)
  6. Even ellipsoid spread layout with hard min node spacing
  7. Cap edges to top ~700 by degree to avoid "gold ball"
  8. Compute node degrees, centrality
  9. Bake to static JSON: nodes + links
- **Output**: `data/graph.json`, `data/papers.json`, ZIP corpus

## Stage 3 — 3D Web App Build
- **Skill**: `vibecoding-webapp-swarm`
- **Stack**: React 19 + TypeScript + Vite + react-force-graph-3D + Three.js + postprocessing (UnrealBloomPass)
- **Features**:
  - TRUE 3D force graph (react-force-graph-3D), NO 2D
  - Nodes as THREE.Sprite radial glows (jewel tones by Louvain community)
  - Gold citation edges, very faint (never a net covering stars)
  - UnrealBloomPass + starfield dust background
  - Even ellipsoid spread, hard min node spacing
  - Cap edges to top ~700 by degree
  - Camera dollies in to fill viewport + autoRotate
  - Native {passive:false} wheel preventDefault for zoom-only
  - Legend hover/click → dims other communities (refresh() + custom nodeThreeObject)
  - Click node → highlight neighbors + right-side detail card (abstract + "Open paper" link)
  - ErrorBoundary wrapping root
  - ALL hooks before early returns
  - "Download corpus" ZIP button
- **Output**: Static site in `dist/`

## Stage 4 — Deploy
- Deploy to *.kimi.page
