import { NODES, EDGES } from './src/data.js';

function computeTreeLayout(selectedNode, nodes, edges, sphereRadius = 240) {
  if (!selectedNode) return null;
  const selectedId = selectedNode.id;
  const drivers = [...new Set(edges.filter(e => e.target === selectedId).map(e => e.source))];
  const impacts = [...new Set(edges.filter(e => e.source === selectedId).map(e => e.target))].filter(id => !drivers.includes(id));

  const driversBySphere = {};
  drivers.forEach(id => {
    const node = nodes.find(n => n.id === id);
    if (node) {
      const sphere = node.sphere || 'other';
      if (!driversBySphere[sphere]) driversBySphere[sphere] = [];
      driversBySphere[sphere].push(node);
    }
  });

  const impactsBySphere = {};
  impacts.forEach(id => {
    const node = nodes.find(n => n.id === id);
    if (node) {
      const sphere = node.sphere || 'other';
      if (!impactsBySphere[sphere]) impactsBySphere[sphere] = [];
      impactsBySphere[sphere].push(node);
    }
  });

  const positions = {};
  const driverGroups = [];
  const impactGroups = [];

  const sortedDriverSpheres = Object.keys(driversBySphere).sort();
  let currentDriverY = 0;
  const baseDriverX = -sphereRadius * 0.75;
  sortedDriverSpheres.forEach((sphere, gIdx) => {
    const groupNodes = driversBySphere[sphere];
    const startY = currentDriverY;
    const groupX = baseDriverX - gIdx * 480;
    
    groupNodes.forEach((node, nIdx) => {
      positions[node.id] = { yRaw: currentDriverY, x: groupX };
      if (nIdx < groupNodes.length - 1) {
        currentDriverY += 110;
      }
    });
    const endY = currentDriverY;
    driverGroups.push({ sphere, minYRaw: startY, maxYRaw: endY, x: groupX });
    if (gIdx < sortedDriverSpheres.length - 1) {
      currentDriverY += 220;
    }
  });

  const sortedImpactSpheres = Object.keys(impactsBySphere).sort();
  let currentImpactY = 0;
  const baseImpactX = sphereRadius * 0.75;
  sortedImpactSpheres.forEach((sphere, gIdx) => {
    const groupNodes = impactsBySphere[sphere];
    const startY = currentImpactY;
    const groupX = baseImpactX + gIdx * 480;
    
    groupNodes.forEach((node, nIdx) => {
      positions[node.id] = { yRaw: currentImpactY, x: groupX };
      if (nIdx < groupNodes.length - 1) {
        currentImpactY += 110;
      }
    });
    const endY = currentImpactY;
    impactGroups.push({ sphere, minYRaw: startY, maxYRaw: endY, x: groupX });
    if (gIdx < sortedImpactSpheres.length - 1) {
      currentImpactY += 220;
    }
  });

  const driverCenterY = currentDriverY / 2;
  driverGroups.forEach(g => {
    g.minY = g.minYRaw - driverCenterY;
    g.maxY = g.maxYRaw - driverCenterY;
    if (g.minY === g.maxY) {
      g.minY -= 30;
      g.maxY += 30;
    }
  });
  drivers.forEach(id => {
    if (positions[id]) {
      positions[id].y = positions[id].yRaw - driverCenterY;
      positions[id].z = 1.0;
      positions[id].opacityMultiplier = 1.0;
    }
  });

  const impactCenterY = currentImpactY / 2;
  impactGroups.forEach(g => {
    g.minY = g.minYRaw - impactCenterY;
    g.maxY = g.maxYRaw - impactCenterY;
    if (g.minY === g.maxY) {
      g.minY -= 30;
      g.maxY += 30;
    }
  });
  impacts.forEach(id => {
    if (positions[id]) {
      positions[id].y = positions[id].yRaw - impactCenterY;
      positions[id].z = 1.0;
      positions[id].opacityMultiplier = 1.0;
    }
  });

  positions[selectedId] = {
    x: 0,
    y: 0,
    z: 1.0,
    opacityMultiplier: 1.0
  };

  return {
    positions,
    drivers,
    impacts
  };
}

console.log('=== STARTING RANDOMIZED TREE LAYOUT TEST (25 NODES) ===');
const sample = [];
const available = [...NODES];
for (let i = 0; i < 25; i++) {
  const idx = Math.floor(Math.random() * available.length);
  sample.push(available.splice(idx, 1)[0]);
}

let passedCount = 0;
sample.forEach((node, i) => {
  const result = computeTreeLayout(node, NODES, EDGES);
  const driverCount = result.drivers.length;
  const impactCount = result.impacts.length;
  const totalPositionsCount = Object.keys(result.positions).length;
  const expectedPositions = driverCount + impactCount + 1; // neighbors + root node
  
  let validCoords = true;
  Object.entries(result.positions).forEach(([id, pos]) => {
    if (isNaN(pos.x) || isNaN(pos.y) || isNaN(pos.z)) {
      validCoords = false;
    }
  });

  const passed = totalPositionsCount === expectedPositions && validCoords;
  if (passed) passedCount++;

  console.log(`[Node ${String(i+1).padStart(2, '0')}] Name: "${node.name}" (${node.id})`);
  console.log(`         Drivers: ${driverCount} | Impacts: ${impactCount}`);
  console.log(`         Positions computed: ${totalPositionsCount}/${expectedPositions} expected | Valid Coords: ${validCoords ? 'YES' : 'NO'}`);
  console.log(`         Status: ${passed ? '✅ PASSED' : '❌ FAILED'}`);
});

console.log(`\nResult: ${passedCount}/25 nodes passed successfully.`);
