// Global Variables
let currentZoom = 1
const minZoom = 0.5
const maxZoom = 2
let hideTimeout
let root = null
const animationSpeed = 3
const buildDelay = 500
const traversalDelay = 800
let isAnimating = false

// TreeNode Class
class TreeNode {
  constructor(value) {
    this.value = value
    this.left = null
    this.right = null
    this.x = 0
    this.y = 0
    this.svgGroup = null
  }
}

// Zoom Functions
function zoomIn() {
  if (currentZoom < maxZoom) {
    currentZoom += 0.2
    applyZoom()
  }
}

function zoomOut() {
  if (currentZoom > minZoom) {
    currentZoom -= 0.2
    applyZoom()
  }
}

function resetZoom() {
  currentZoom = 1
  applyZoom()
}

function applyZoom() {
  const container = document.querySelector("#treeDisplay")
  container.style.transform = `scale(${currentZoom})`

  const zoomLevel = document.querySelector("#zoomLevel")
  zoomLevel.textContent = Math.round(currentZoom * 100) + "%"
  const zoomInfo = document.querySelector(".zoom-info")

  // Show zoom text
  zoomInfo.classList.remove("hidden")

  // Clear previous timer
  clearTimeout(hideTimeout)

  // Hide after 1 second
  hideTimeout = setTimeout(() => {
    zoomInfo.classList.add("hidden")
  }, 1000)
}

// BST Operations
function insertNode(node, value) {
  if (node === null) {
    return new TreeNode(value)
  }

  if (value < node.value) {
    node.left = insertNode(node.left, value)
  } else if (value > node.value) {
    node.right = insertNode(node.right, value)
  }

  return node
}

function addNodes() {
  const input = document.getElementById("nodeInput")
  const values = input.value
    .split(",")
    .map((v) => Number.parseInt(v.trim()))
    .filter((v) => !isNaN(v))

  if (values.length === 0) {
    alert("Please enter valid numbers separated by commas")
    return
  }

  clearTree()
  buildTreeAnimated(values)
  input.value = ""
}

async function buildTreeAnimated(values) {
  isAnimating = true
  showBuildingStatus(true)

  for (let i = 0; i < values.length; i++) {
    updateBuildingProgress(i + 1, values.length)
    root = insertNode(root, values[i])
    await drawTreeAnimated()
    await sleep(buildDelay)
  }

  showBuildingStatus(false)
  isAnimating = false
  updateStats()
}

function calculatePositions(node, x, y, horizontalSpacing, level = 0) {
  if (node === null) return

  node.x = x
  node.y = y

  const nextSpacing = horizontalSpacing * 0.6
  const verticalSpacing = 70

  if (node.left) {
    calculatePositions(node.left, x - horizontalSpacing, y + verticalSpacing, nextSpacing, level + 1)
  }

  if (node.right) {
    calculatePositions(node.right, x + horizontalSpacing, y + verticalSpacing, nextSpacing, level + 1)
  }
}

async function drawTreeAnimated() {
  const svg = document.getElementById("treeSVG")
  const container = document.getElementById("treeDisplay")

  // Hide empty message
  document.getElementById("emptyMessage").style.display = "none"

  // Calculate tree dimensions
  const treeHeight = getHeight(root)
  const treeWidth = Math.pow(2, treeHeight - 1)

  // Set dynamic SVG size
  const minWidth = 800
  const minHeight = 600
  const dynamicWidth = Math.max(minWidth, treeWidth * 100)
  const dynamicHeight = Math.max(minHeight, treeHeight * 80 + 100)

  svg.setAttribute("width", dynamicWidth)
  svg.setAttribute("height", dynamicHeight)
  svg.setAttribute("viewBox", `0 0 ${dynamicWidth} ${dynamicHeight}`)

  // Calculate positions
  const startX = dynamicWidth / 2
  const startY = 50
  const initialSpacing = Math.min(dynamicWidth / 4, 200)

  calculatePositions(root, startX, startY, initialSpacing)

  // Clear and redraw
  svg.innerHTML = ""
  drawLines(svg, root)
  await drawNodes(svg, root)
}

function drawLines(svg, node) {
  if (node === null) return

  if (node.left) {
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line")
    line.setAttribute("x1", node.x)
    line.setAttribute("y1", node.y)
    line.setAttribute("x2", node.left.x)
    line.setAttribute("y2", node.left.y)
    line.setAttribute("stroke", "#6366f1")
    line.setAttribute("stroke-width", "2")
    line.setAttribute("class", "tree-line")
    svg.appendChild(line)
    drawLines(svg, node.left)
  }

  if (node.right) {
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line")
    line.setAttribute("x1", node.x)
    line.setAttribute("y1", node.y)
    line.setAttribute("x2", node.right.x)
    line.setAttribute("y2", node.right.y)
    line.setAttribute("stroke", "#6366f1")
    line.setAttribute("stroke-width", "2")
    line.setAttribute("class", "tree-line")
    svg.appendChild(line)
    drawLines(svg, node.right)
  }
}

async function drawNodes(svg, node) {
  if (node === null) return

  // Create group for node
  const group = document.createElementNS("http://www.w3.org/2000/svg", "g")
  group.setAttribute("class", "tree-node")

  // Create circle
  const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle")
  circle.setAttribute("cx", node.x)
  circle.setAttribute("cy", node.y)
  circle.setAttribute("r", "25")
  circle.setAttribute("fill", "#3b82f6")
  circle.setAttribute("stroke", "#1d4ed8")
  circle.setAttribute("stroke-width", "2")

  // Create text
  const text = document.createElementNS("http://www.w3.org/2000/svg", "text")
  text.setAttribute("x", node.x)
  text.setAttribute("y", node.y + 5)
  text.setAttribute("text-anchor", "middle")
  text.setAttribute("fill", "white")
  text.setAttribute("font-weight", "bold")
  text.setAttribute("font-size", "14")
  text.textContent = node.value

  group.appendChild(circle)
  group.appendChild(text)
  svg.appendChild(group)

  node.svgGroup = group

  // Animate appearance
  group.style.opacity = "0"
  group.style.transform = "scale(0)"
  group.style.transformOrigin = `${node.x}px ${node.y}px`

  await sleep(100)

  group.style.transition = "all 0.5s ease"
  group.style.opacity = "1"
  group.style.transform = "scale(1)"

  // Draw child nodes
  await drawNodes(svg, node.left)
  await drawNodes(svg, node.right)
}

// Traversal Functions
async function performTraversal(type) {
  if (root === null) {
    alert("Please build a tree first!")
    return
  }

  if (isAnimating) {
    alert("Please wait for current animation to finish")
    return
  }

  resetNodeColors()
  const result = []

  switch (type) {
    case "inorder":
      await inorderTraversal(root, result)
      document.getElementById("inorderResult").textContent = result.join(" → ")
      break
    case "preorder":
      await preorderTraversal(root, result)
      document.getElementById("preorderResult").textContent = result.join(" → ")
      break
    case "postorder":
      await postorderTraversal(root, result)
      document.getElementById("postorderResult").textContent = result.join(" → ")
      break
  }
}

async function inorderTraversal(node, result) {
  if (node === null) return

  await inorderTraversal(node.left, result)

  highlightNode(node)
  result.push(node.value)
  await sleep(traversalDelay)

  await inorderTraversal(node.right, result)
}

async function preorderTraversal(node, result) {
  if (node === null) return

  highlightNode(node)
  result.push(node.value)
  await sleep(traversalDelay)

  await preorderTraversal(node.left, result)
  await preorderTraversal(node.right, result)
}

async function postorderTraversal(node, result) {
  if (node === null) return

  await postorderTraversal(node.left, result)
  await postorderTraversal(node.right, result)

  highlightNode(node)
  result.push(node.value)
  await sleep(traversalDelay)
}

function highlightNode(node) {
  if (node.svgGroup) {
    const circle = node.svgGroup.querySelector("circle")
    circle.classList.add("highlight")
    node.svgGroup.classList.add("pulse-animation")

    setTimeout(() => {
      circle.classList.remove("highlight")
      circle.classList.add("visited")
      node.svgGroup.classList.remove("pulse-animation")
    }, 600)
  }
}

function resetNodeColors() {
  const svg = document.getElementById("treeSVG")
  const circles = svg.querySelectorAll("circle")
  circles.forEach((circle) => {
    circle.classList.remove("highlight", "visited")
    circle.setAttribute("fill", "#3b82f6")
    circle.setAttribute("stroke", "#1d4ed8")
  })
}

// Dynamic Example Generation - Uses input field numbers
function generateDynamicExample() {
  const exampleType = document.getElementById("exampleType").value
  if (!exampleType || isAnimating) return

  // Get numbers from the input field
  const input = document.getElementById("nodeInput")
  let inputNumbers = input.value
    .split(",")
    .map((v) => Number.parseInt(v.trim()))
    .filter((v) => !isNaN(v))

  if (inputNumbers.length === 0) {
    alert("Please enter numbers in the input field first!")
    return
  }

  // Remove duplicates
  inputNumbers = [...new Set(inputNumbers)]

  let numbers = []

  switch (exampleType) {
    case "binary":
      numbers = createBinarySearchTree(inputNumbers)
      break
    case "avl":
      numbers = createAVLTree(inputNumbers)
      break
    case "complete":
      numbers = createCompleteTree(inputNumbers)
      break
    case "balanced":
      numbers = createBalancedTree(inputNumbers)
      break
  }

  if (numbers.length > 0) {
    clearTree()
    buildTreeAnimated(numbers)
    // Clear the input field after using it
    input.value = ""
  }
}

function createBinarySearchTree(inputNumbers) {
  // Simple BST - insert numbers as they are (random order for variety)
  const shuffled = [...inputNumbers]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

function createAVLTree(inputNumbers) {
  // AVL Tree - insert in order that maintains balance (middle-first approach)
  const sorted = [...inputNumbers].sort((a, b) => a - b)
  const result = []

  function insertMiddleFirst(arr, start = 0, end = arr.length - 1) {
    if (start > end) return

    const mid = Math.floor((start + end) / 2)
    result.push(arr[mid])

    insertMiddleFirst(arr, start, mid - 1)
    insertMiddleFirst(arr, mid + 1, end)
  }

  insertMiddleFirst(sorted)
  return result
}

function createCompleteTree(inputNumbers) {
  // Complete Binary Tree - arrange numbers to fill levels completely from left to right
  const sorted = [...inputNumbers].sort((a, b) => a - b)

  // For a complete tree, we want to insert level by level
  // Start with root, then level 1 (2 nodes), level 2 (4 nodes), etc.
  const result = []
  const levels = []

  // Calculate how many complete levels we can have
  const totalNodes = sorted.length
  const currentLevel = 0
  let nodesInLevel = 1

  // Group nodes by levels
  let index = 0
  while (index < totalNodes) {
    const levelNodes = []
    const nodesToTake = Math.min(nodesInLevel, totalNodes - index)

    for (let i = 0; i < nodesToTake; i++) {
      levelNodes.push(sorted[index + i])
    }

    levels.push(levelNodes)
    index += nodesToTake
    nodesInLevel *= 2
  }

  // Insert level by level, but in BST order
  // Start with middle of first level, then build outward
  for (const level of levels) {
    result.push(...level)
  }

  return result
}

function createBalancedTree(inputNumbers) {
  // Balanced Binary Tree - ensure minimum height
  const sorted = [...inputNumbers].sort((a, b) => a - b)
  const result = []

  function buildBalanced(arr, start = 0, end = arr.length - 1) {
    if (start > end) return

    const mid = Math.floor((start + end) / 2)
    result.push(arr[mid])

    // Recursively build left and right subtrees
    buildBalanced(arr, start, mid - 1)
    buildBalanced(arr, mid + 1, end)
  }

  buildBalanced(sorted)
  return result
}

// Event Listeners for Dynamic UI
document.addEventListener("DOMContentLoaded", () => {
  const exampleType = document.getElementById("exampleType")
  const generateBtn = document.getElementById("generateExample")

  exampleType.addEventListener("change", function () {
    const selectedType = this.value

    if (selectedType) {
      generateBtn.disabled = false
    } else {
      generateBtn.disabled = true
    }
  })
})

// Statistics
function updateStats() {
  const nodeCount = countNodes(root)
  const height = getHeight(root)
  const leafCount = countLeaves(root)
  const balance = getBalanceFactor(root)

  document.getElementById("nodeCount").textContent = nodeCount
  document.getElementById("treeHeight").textContent = height
  document.getElementById("leafCount").textContent = leafCount
  document.getElementById("balanceFactor").textContent = balance

  if (nodeCount > 0) {
    const values = getAllValues(root)
    document.getElementById("lastAdded").textContent = values[values.length - 1]
  } else {
    document.getElementById("lastAdded").textContent = "-"
  }
}

function countNodes(node) {
  if (node === null) return 0
  return 1 + countNodes(node.left) + countNodes(node.right)
}

function getHeight(node) {
  if (node === null) return 0
  return 1 + Math.max(getHeight(node.left), getHeight(node.right))
}

function countLeaves(node) {
  if (node === null) return 0
  if (node.left === null && node.right === null) return 1
  return countLeaves(node.left) + countLeaves(node.right)
}

function getBalanceFactor(node) {
  if (node === null) return 0
  return getHeight(node.left) - getHeight(node.right)
}

function getAllValues(node) {
  if (node === null) return []
  return [...getAllValues(node.left), node.value, ...getAllValues(node.right)]
}

// Utility Functions
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function showBuildingStatus(show) {
  const status = document.getElementById("buildingStatus")
  if (show) {
    status.classList.remove("hidden")
  } else {
    status.classList.add("hidden")
  }
}

function updateBuildingProgress(current, total) {
  document.getElementById("buildingProgress").textContent = `${current}/${total}`
}

function clearTree() {
  root = null
  const svg = document.getElementById("treeSVG")
  svg.innerHTML = ""
  svg.setAttribute("width", "100%")
  svg.setAttribute("height", "100%")
  document.getElementById("emptyMessage").style.display = "flex"

  // Clear traversal results
  document.getElementById("inorderResult").textContent = "Click In-Order button"
  document.getElementById("preorderResult").textContent = "Click Pre-Order button"
  document.getElementById("postorderResult").textContent = "Click Post-Order button"

  updateStats()
}

function isPrime(n) {
  if (n < 2) return false
  for (let i = 2; i <= Math.sqrt(n); i++) {
    if (n % i === 0) return false
  }
  return true
}
