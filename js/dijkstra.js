var graph = {};
fetch("data/graph.json")
	.then(function (response) {
		return response.json();
	})
	.then(function (data) {
		graph = data;
		// console.log(graph)
	})


let shortestDistanceNode = (distances, visited) => {
	let shortest = null;

	for (let node in distances) {
		let currentIsShortest = shortest === null || distances[node] < distances[shortest];
		if (currentIsShortest && !visited.includes(node)) {
			shortest = node;
		}
	}
	return shortest;
};

let findShortestPath = (graph, startNode, endNode) => {

	let distances = {};
	distances[endNode] = "Infinity";
	distances = Object.assign(distances, graph[startNode]);

	let parents = { endNode: null };

	for (let child in graph[startNode]) {
		parents[child] = startNode;
	}

	let visited = [];
	let node = shortestDistanceNode(distances, visited);

	while (node) {
		let distance = distances[node];
		let children = graph[node];

		for (let child in children) {
			if (String(child) === String(startNode)) {
				continue;
			}
			else {
				let newdistance = distance + children[child];

				if (!distances[child] || distances[child] > newdistance) {
					distances[child] = newdistance;
					parents[child] = node;
				}
			}
		}
		visited.push(node);
		node = shortestDistanceNode(distances, visited);
	}

	let shortestPath = [endNode];
	let parent = parents[endNode];
	while (parent) {
		shortestPath.push(parent);
		parent = parents[parent];
	}
	shortestPath.reverse();

	return {
		distance: distances[endNode],
		path: shortestPath,
	};
};
